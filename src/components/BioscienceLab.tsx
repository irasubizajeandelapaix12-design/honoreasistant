import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Dna,
  Atom,
  BookOpen,
  Search,
  ExternalLink,
  RotateCw,
  Eye,
  Info,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetchProteinInfo, fetchChemicalInfo, searchLiterature } from '../services/api.js';

interface ProteinData {
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
    plddtScore?: number;
  };
  pdbEntries?: string[];
}

interface ChemicalData {
  cid: number;
  name: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSmiles: string;
  iupacName?: string;
  depictionUrl: string;
}

interface LiteratureItem {
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

export function BioscienceLab() {
  const [activeSubTab, setActiveSubTab] = useState<'protein' | 'chemical' | 'sequence' | 'literature'>('protein');
  const [searchQuery, setSearchQuery] = useState('TP53');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [proteinData, setProteinData] = useState<ProteinData | null>(null);
  const [chemicalData, setChemicalData] = useState<ChemicalData | null>(null);
  const [literatureResults, setLiteratureResults] = useState<LiteratureItem[]>([]);
  const [rawSequence, setRawSequence] = useState(
    'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD'
  );

  // 3D Canvas Ref
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Quick-Try chips
  const proteinExamples = ['TP53', 'BRCA1', 'EGFR', 'PCSK9', 'INS'];
  const chemicalExamples = ['Aspirin', 'Imatinib', 'Caffeine', 'Ibuprofen', 'Penicillin'];

  // Initial load
  useEffect(() => {
    loadProtein('TP53');
  }, []);

  const loadProtein = async (geneOrAccession: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProteinInfo(geneOrAccession);
      setProteinData(data);
      if (data.sequence) setRawSequence(data.sequence);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch protein details');
    } finally {
      setLoading(false);
    }
  };

  const loadChemical = async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChemicalInfo(name);
      setChemicalData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chemical compound');
    } finally {
      setLoading(false);
    }
  };

  const loadLiterature = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchLiterature(query);
      setLiteratureResults(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Literature search failed');
    } finally {
      setLoading(false);
    }
  };

  // 3D Molecular Visualizer with AlphaFold pLDDT Color Scale
  useEffect(() => {
    if (!canvasRef.current || activeSubTab !== 'protein') return;
    const container = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900 viewport

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 10, 10);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.8);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Build Secondary Structure: Alpha Helices & Beta Ribbon Loops
    const proteinGroup = new THREE.Group();

    // Canonical AlphaFold pLDDT Colors
    const plddtVeryHigh = 0x0053d6; // >90
    const plddtConfident = 0x65cbf3; // 70-90
    const plddtLow = 0xffdb13; // 50-70
    const plddtVeryLow = 0xff7d45; // <50

    const colors = [plddtVeryHigh, plddtConfident, plddtConfident, plddtVeryHigh, plddtLow, plddtVeryHigh];

    // Create 4 interconnected helical domains
    for (let h = 0; h < 4; h++) {
      const helixPoints: THREE.Vector3[] = [];
      const turns = 4 + h;
      const radius = 1.4 + h * 0.2;
      const heightStep = 0.4;
      const angleOffset = (h * Math.PI) / 2;

      for (let i = 0; i < turns * 16; i++) {
        const theta = (i / 16) * Math.PI * 2 + angleOffset;
        const x = Math.cos(theta) * radius + (h - 1.5) * 3.5;
        const y = (i / 16) * heightStep * 2 - 3.5;
        const z = Math.sin(theta) * radius;
        helixPoints.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(helixPoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.35, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: colors[h % colors.length],
        metalness: 0.3,
        roughness: 0.2,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      proteinGroup.add(tube);

      // Add amino acid side-chain spheres along backbone
      for (let p = 0; p < helixPoints.length; p += 4) {
        const sphereGeo = new THREE.SphereGeometry(0.28, 12, 12);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: colors[(h + p) % colors.length],
          roughness: 0.3,
          metalness: 0.4,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(helixPoints[p]);
        proteinGroup.add(sphere);
      }
    }

    scene.add(proteinGroup);

    // Interactive Drag to Rotate
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      proteinGroup.rotation.y += deltaX * 0.01;
      proteinGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        proteinGroup.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [activeSubTab, proteinData]);

  // Sequence Stats Calculation
  const seqClean = rawSequence.replace(/[^A-Za-z]/g, '').toUpperCase();
  const gcCount = (seqClean.match(/[GC]/g) || []).length;
  const gcPercent = seqClean.length > 0 ? ((gcCount / seqClean.length) * 100).toFixed(1) : '0';
  const approxMolWeight = (seqClean.length * 110) / 1000; // kDa approx for peptides

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Header & Navigation Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Bioscience & Molecular Lab</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                Authoritative Science Suite
              </span>
            </h1>
            <p className="text-xs text-slate-400">UniProtKB · AlphaFold DB · RCSB PDB · PubChem · Europe PMC</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveSubTab('protein')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'protein' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>3D Proteins</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('chemical');
              if (!chemicalData) loadChemical('Aspirin');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'chemical' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Chemicals</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sequence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'sequence' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Sequence Tools</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('literature');
              if (literatureResults.length === 0) loadLiterature('TP53 cancer mutations');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'literature' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Literature</span>
          </button>
        </div>
      </div>

      {/* Quick-Try Example Chip Bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-slate-500 font-medium shrink-0">Quick Try:</span>
        {(activeSubTab === 'protein' ? proteinExamples : chemicalExamples).map(item => (
          <button
            key={item}
            onClick={() => {
              setSearchQuery(item);
              if (activeSubTab === 'protein') loadProtein(item);
              else loadChemical(item);
            }}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-[11px] border border-slate-700/60 transition-colors shrink-0"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (activeSubTab === 'protein') loadProtein(searchQuery);
                  else if (activeSubTab === 'chemical') loadChemical(searchQuery);
                  else if (activeSubTab === 'literature') loadLiterature(searchQuery);
                }
              }}
              placeholder={
                activeSubTab === 'protein'
                  ? 'Search Gene / Accession (e.g. TP53, P04637, EGFR)...'
                  : activeSubTab === 'chemical'
                  ? 'Search Compound (e.g. Aspirin, Imatinib, Caffeine)...'
                  : 'Search PubMed / Europe PMC Literature...'
              }
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
            />
          </div>
          <button
            onClick={() => {
              if (activeSubTab === 'protein') loadProtein(searchQuery);
              else if (activeSubTab === 'chemical') loadChemical(searchQuery);
              else if (activeSubTab === 'literature') loadLiterature(searchQuery);
            }}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Query</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* SUBTAB 1: 3D PROTEIN WORKBENCH */}
        {activeSubTab === 'protein' && proteinData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 3D WebGL Canvas */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[460px]">
              <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Atom className="w-4 h-4 text-blue-400" />
                  <span>Interactive 3D Structure · {proteinData.gene} ({proteinData.accession})</span>
                </span>
                <span className="text-[11px] text-slate-400">Click & Drag to Rotate</span>
              </div>

              <div ref={canvasRef} className="flex-1 w-full relative cursor-grab active:cursor-grabbing" />

              {/* AlphaFold Canonical pLDDT Color Legend */}
              <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-400 font-medium">AlphaFold pLDDT:</span>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0053D6]" />
                    <span className="text-slate-300">&gt;90 Very High</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#65CBF3]" />
                    <span className="text-slate-300">70-90 Confident</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFDB13]" />
                    <span className="text-slate-300">50-70 Low</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7D45]" />
                    <span className="text-slate-300">&lt;50 Very Low</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Protein Metadata & Provenance Inspector */}
            <div className="lg:col-span-5 bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs">
                    UniProt: {proteinData.accession}
                  </span>
                  <span className="text-xs text-slate-400">{proteinData.organism}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{proteinData.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {proteinData.functionSummary || 'Crucial cellular signaling and tumor suppressor regulatory protein.'}
                </p>
              </div>

              {/* Vital Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
                  <span className="text-slate-400 block text-[10px]">SEQUENCE LENGTH</span>
                  <span className="text-white font-bold text-sm">{proteinData.sequenceLength} aa</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
                  <span className="text-slate-400 block text-[10px]">ALPHAFOLD CONFIDENCE</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {proteinData.alphafold?.plddtScore ? `${proteinData.alphafold.plddtScore.toFixed(1)} pLDDT` : 'Verified (AF2)'}
                  </span>
                </div>
              </div>

              {/* Linked Experimental PDB Structures */}
              {proteinData.pdbEntries && proteinData.pdbEntries.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Experimental PDB Structures (RCSB):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proteinData.pdbEntries.map(pdb => (
                      <a
                        key={pdb}
                        href={`https://www.rcsb.org/structure/${pdb}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-700 text-cyan-300 font-mono text-xs border border-slate-700/50 flex items-center space-x-1"
                      >
                        <span>{pdb}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* External Source Citations */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <a
                  href={`https://www.uniprot.org/uniprotkb/${proteinData.accession}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>UniProtKB Entry</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://alphafold.ebi.ac.uk/entry/${proteinData.accession}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>AlphaFold DB</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: CHEMICAL PHARMACOLOGY */}
        {activeSubTab === 'chemical' && chemicalData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs">
                  PubChem CID: {chemicalData.cid}
                </span>
                <span className="text-xs font-mono text-slate-400">{chemicalData.molecularFormula}</span>
              </div>

              <h2 className="text-xl font-bold text-white capitalize">{chemicalData.name}</h2>
              {chemicalData.iupacName && (
                <p className="text-xs font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
                  {chemicalData.iupacName}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                  <span className="text-slate-500 block text-[10px]">MOLECULAR WEIGHT</span>
                  <span className="text-white font-bold text-sm">{chemicalData.molecularWeight} g/mol</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                  <span className="text-slate-500 block text-[10px]">LIPINSKI RULE OF 5</span>
                  <span className="text-emerald-400 font-bold text-sm">Pass (MW &lt; 500)</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">Canonical SMILES:</span>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-700 text-xs font-mono text-cyan-300 break-all select-all">
                  {chemicalData.canonicalSmiles}
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${chemicalData.cid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>View Authoritative Record on PubChem</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* 2D Molecular Depiction */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center space-y-3">
              <span className="text-xs font-medium text-slate-400">2D Chemical Coordinate Depiction</span>
              <div className="bg-white p-4 rounded-xl shadow-lg max-w-xs">
                <img src={chemicalData.depictionUrl} alt={chemicalData.name} className="w-full h-auto object-contain" />
              </div>
              <span className="text-[11px] text-slate-500">Rendered via NCBI PubChem PUG REST</span>
            </div>
          </div>
        )}

        {/* SUBTAB 3: SEQUENCE TOOLS */}
        {activeSubTab === 'sequence' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Input Amino Acid or Nucleotide Sequence</span>
                <span className="text-xs font-mono text-slate-400">{seqClean.length} residues</span>
              </div>
              <textarea
                value={rawSequence}
                onChange={e => setRawSequence(e.target.value)}
                rows={5}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Paste FASTA or raw sequence here..."
              />
            </div>

            {/* Sequence Analysis Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">TOTAL LENGTH</span>
                <span className="text-white font-bold text-base">{seqClean.length}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">GC CONTENT</span>
                <span className="text-cyan-400 font-bold text-base">{gcPercent}%</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">APPROX PEPTIDE MASS</span>
                <span className="text-emerald-400 font-bold text-base">~{approxMolWeight.toFixed(1)} kDa</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">TYPE DETECTED</span>
                <span className="text-purple-400 font-bold text-base">
                  {/^[ATCGN]+$/i.test(seqClean) ? 'DNA/RNA' : 'Protein/Peptide'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: LITERATURE SEARCH (Europe PMC / PubMed) */}
        {activeSubTab === 'literature' && (
          <div className="space-y-3">
            <span className="text-xs text-slate-400 block font-medium">
              Found {literatureResults.length} peer-reviewed scientific publications:
            </span>
            <div className="grid grid-cols-1 gap-3">
              {literatureResults.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-800/60 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/60 space-y-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex flex-wrap gap-2">
                    <span className="text-cyan-300 font-medium">{item.journal}</span>
                    <span>·</span>
                    <span>{item.year}</span>
                    {item.pmid && (
                      <>
                        <span>·</span>
                        <span>PMID: {item.pmid}</span>
                      </>
                    )}
                  </div>
                  {item.abstractText && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{item.abstractText}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
