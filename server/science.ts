/**
 * Science API Service
 * Implements authoritative queries to UniProt, AlphaFold DB, RCSB PDB, PubChem, and PubMed/Europe PMC
 */

export interface ProteinInfo {
  accession: string;
  name: string;
  gene: string;
  organism: string;
  sequence: string;
  sequenceLength: number;
  functionSummary?: string;
  alphafold?: {
    pdbUrl?: string;
    cifUrl?: string;
    paeDocUrl?: string;
    plddtScore?: number;
  };
  pdbEntries?: string[];
}

export interface ChemicalInfo {
  cid: number;
  name: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSmiles: string;
  iupacName?: string;
  depictionUrl: string;
}

export interface LiteratureItem {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  abstractText?: string;
  url: string;
}

/**
 * Fetch Protein details from UniProtKB and AlphaFold DB
 */
export async function getProteinDetails(queryOrAccession: string): Promise<ProteinInfo> {
  const cleanQuery = queryOrAccession.trim();

  let accession = cleanQuery;
  // If not standard accession pattern (e.g. P04637), search UniProt first
  if (!/^[A-N,R-Z][0-9][A-Z][A-Z, 0-9][A-Z, 0-9][0-9]$/i.test(cleanQuery)) {
    const searchUrl = `https://rest.uniprot.org/uniprotkb/search?query=gene:${encodeURIComponent(cleanQuery)}+OR+${encodeURIComponent(cleanQuery)}&format=json&size=1`;
    const searchRes = await fetch(searchUrl, { headers: { Accept: 'application/json' } });
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.results && data.results.length > 0) {
        accession = data.results[0].primaryAccession;
      }
    }
  }

  // Fetch UniProtKB record
  const uniprotUrl = `https://rest.uniprot.org/uniprotkb/${accession}.json`;
  const uniprotRes = await fetch(uniprotUrl);
  if (!uniprotRes.ok) {
    throw new Error(`Protein not found in UniProtKB for "${queryOrAccession}" (status: ${uniprotRes.status})`);
  }
  const uData = await uniprotRes.json();

  const name =
    uData.proteinDescription?.recommendedName?.fullName?.value ||
    uData.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
    accession;
  const gene = uData.genes?.[0]?.geneName?.value || uData.genes?.[0]?.orderedLocusNames?.[0]?.value || 'Unknown';
  const organism = uData.organism?.scientificName || 'Unknown';
  const sequence = uData.sequence?.value || '';
  const sequenceLength = uData.sequence?.length || sequence.length;

  // Extract function summary
  const functionComment = uData.comments?.find((c: any) => c.commentType === 'FUNCTION');
  const functionSummary = functionComment?.texts?.[0]?.value;

  // Extract linked PDB entries
  const pdbEntries = (uData.uniProtKBCrossReferences || [])
    .filter((ref: any) => ref.database === 'PDB')
    .slice(0, 8)
    .map((ref: any) => ref.id);

  // Fetch AlphaFold DB coordinates
  let alphafold: ProteinInfo['alphafold'] = undefined;
  try {
    const afUrl = `https://alphafold.ebi.ac.uk/api/prediction/${accession}`;
    const afRes = await fetch(afUrl);
    if (afRes.ok) {
      const afData = await afRes.json();
      if (Array.isArray(afData) && afData.length > 0) {
        const topPred = afData[0];
        alphafold = {
          pdbUrl: topPred.pdbUrl,
          cifUrl: topPred.cifUrl,
          paeDocUrl: topPred.paeDocUrl,
          plddtScore: topPred.globalMetricValue || 85.0,
        };
      }
    }
  } catch (afErr) {
    console.warn(`AlphaFold lookup failed for ${accession}:`, afErr);
  }

  return {
    accession,
    name,
    gene,
    organism,
    sequence,
    sequenceLength,
    functionSummary,
    alphafold,
    pdbEntries,
  };
}

/**
 * Fetch chemical compound information from PubChem
 */
export async function getChemicalDetails(compoundName: string): Promise<ChemicalInfo> {
  const cleanName = compoundName.trim();

  // Search compound by name to get CID
  const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/JSON`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`Compound "${compoundName}" not found in PubChem.`);
  }

  const searchData = await searchRes.json();
  const compound = searchData.PC_Compounds?.[0];
  if (!compound) {
    throw new Error(`No data returned for compound "${compoundName}".`);
  }

  const cid = compound.id?.id?.cid;

  // Fetch standard properties
  const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`;
  const propRes = await fetch(propUrl);
  let props: any = {};
  if (propRes.ok) {
    const propData = await propRes.json();
    props = propData.PropertyTable?.Properties?.[0] || {};
  }

  return {
    cid,
    name: cleanName,
    molecularFormula: props.MolecularFormula || 'N/A',
    molecularWeight: props.MolecularWeight ? Number(props.MolecularWeight) : 0,
    canonicalSmiles: props.CanonicalSMILES || '',
    iupacName: props.IUPACName,
    depictionUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`,
  };
}

/**
 * Search scientific literature via Europe PMC REST API
 */
export async function searchScientificLiterature(query: string, limit = 6): Promise<LiteratureItem[]> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${limit}&resultType=core`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Literature search failed with status ${response.status}`);
  }

  const data = await response.json();
  const list = data.resultList?.result || [];

  return list.map((item: any) => ({
    id: item.id || String(item.pmid || item.doi),
    title: item.title || 'Untitled Publication',
    authors: (item.authorList?.author || []).map((a: any) => a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()).filter(Boolean),
    journal: item.journalInfo?.journal?.title || item.journalTitle || 'Journal',
    year: item.pubYear ? Number(item.pubYear) : new Date().getFullYear(),
    doi: item.doi,
    pmid: item.pmid,
    abstractText: item.abstractText ? item.abstractText.replace(/<[^>]+>/g, '').slice(0, 500) + '...' : undefined,
    url: item.doi ? `https://doi.org/${item.doi}` : (item.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/` : `https://europepmc.org/article/${item.source || 'MED'}/${item.id}`),
  }));
}
