import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map as GoogleMapComponent,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  Sparkles,
  Layers,
  Info,
  ExternalLink,
  LocateFixed,
  Route as RouteIcon,
  Globe2,
} from 'lucide-react';

interface LocationPoint {
  id: string;
  title: string;
  category: 'ai_hub' | 'datacenter' | 'tech_campus' | 'regional';
  address: string;
  lat: number;
  lng: number;
  description: string;
  metrics: Record<string, string>;
}

const CURATED_LOCATIONS: LocationPoint[] = [
  {
    id: 'kigali-norrsken',
    title: 'Norrsken House Kigali & Silicon Kigali',
    category: 'regional',
    address: 'KN 78 St, Kigali, Rwanda',
    lat: -1.9441,
    lng: 30.0619,
    description: "East Africa's largest tech hub and innovation ecosystem powering next-gen startups.",
    metrics: { startups: '300+', focus: 'Fintech, AI & AgriTech', ecosystem: 'Kigali Innovation City' },
  },
  {
    id: 'google-mountain-view',
    title: 'Google Bay View Campus',
    category: 'tech_campus',
    address: '2000 N Shoreline Blvd, Mountain View, CA 94043',
    lat: 37.422,
    lng: -122.0841,
    description: "Global AI research headquarters designing Gemini and frontier machine learning models.",
    metrics: { researchers: '10,000+', focus: 'Generative AI & Quantum', energy: '100% Renewable Dragonscale Solar' },
  },
  {
    id: 'deepmind-london',
    title: 'Google DeepMind UK',
    category: 'ai_hub',
    address: '6 Pancras Square, Kings Cross, London N1C 4AG, UK',
    lat: 51.5348,
    lng: -0.1245,
    description: 'Pioneering scientific AI, AlphaFold protein folding, and foundational reinforcement learning.',
    metrics: { breakthrough: 'AlphaFold 3', focus: 'Structural Biology & AGI', facility: 'Kings Cross AI Cluster' },
  },
  {
    id: 'datacenter-council-bluffs',
    title: 'Google Cloud Hyper-Scale Data Center',
    category: 'datacenter',
    address: 'Council Bluffs, Iowa, USA',
    lat: 41.2285,
    lng: -95.8608,
    description: 'One of the world’s largest compute clusters powering TPU v5p AI supercomputing pods.',
    metrics: { compute: 'ExaFLOPs TPU Superpod', water: 'Zero-Carbon Cooling', network: 'Jupiter Petabit Fabric' },
  },
  {
    id: 'cmu-africa',
    title: 'Carnegie Mellon University Africa',
    category: 'regional',
    address: 'Kigali Innovation City, Kigali, Rwanda',
    lat: -1.9366,
    lng: 30.1302,
    description: 'World-renowned center of excellence in engineering, artificial intelligence, and cyber-security.',
    metrics: { programs: 'M.S. in IT & AI', students: '35+ African Nations', network: 'African Center of Excellence' },
  },
  {
    id: 'datacenter-hamina',
    title: 'Google Sustainable Sea-Cooled Data Center',
    category: 'datacenter',
    address: 'Hamina, Finland',
    lat: 60.528,
    lng: 27.195,
    description: 'Pioneering sustainable computing facility cooled entirely by Baltic seawater.',
    metrics: { cooling: '100% Raw Seawater', carbon: '24/7 Carbon-Free Energy', type: 'Converted Paper Mill' },
  },
];

interface MapsStudioProps {
  onAskAi: (prompt: string) => void;
}

export const MapsStudio: React.FC<MapsStudioProps> = ({ onAskAi }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(CURATED_LOCATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customPins, setCustomPins] = useState<LocationPoint[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -1.9441, lng: 30.0619 });
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    // Check quota events
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);

    // Fetch API key from server or Vite env
    const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (envKey) {
      setApiKey(envKey);
    } else {
      fetch('/api/config/maps')
        .then(r => r.json())
        .then(data => {
          if (data.apiKey) setApiKey(data.apiKey);
        })
        .catch(() => {});
    }

    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(14);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSelectLocation = (loc: LocationPoint) => {
    setSelectedLocation(loc);
    setMapCenter({ lat: loc.lat, lng: loc.lng });
    setMapZoom(15);
  };

  const filteredLocations = [...CURATED_LOCATIONS, ...customPins].filter(loc => {
    const matchesCategory = activeCategory === 'all' || loc.category === activeCategory;
    const matchesSearch =
      loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Quota Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-amber-950 dark:hover:text-amber-100"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Control Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Google Maps Location Intelligence
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold">
                SDK v1
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore global tech hubs, infrastructure, and geospatial analytics with Honore Assistant
            </p>
          </div>
        </div>

        {/* Quick search & Locate Me */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search hubs or addresses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'My Location'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Sidebar: Curated Hubs & Category Filters */}
        <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0">
          {/* Category Tabs */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'All Hubs' },
              { id: 'regional', label: 'Rwanda / Africa' },
              { id: 'ai_hub', label: 'AI Labs' },
              { id: 'datacenter', label: 'Data Centers' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* List of locations */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredLocations.map(loc => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-sm'
                      : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {loc.title}
                    </h3>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                        loc.category === 'regional'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : loc.category === 'ai_hub'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {loc.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {loc.address}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {loc.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Selected Location Action Card */}
          {selectedLocation && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Location Metrics
                </span>
                <button
                  onClick={() =>
                    onAskAi(
                      `Explain the technological significance, architecture, and engineering infrastructure of ${selectedLocation.title} located at ${selectedLocation.address}.`
                    )
                  }
                  className="text-[11px] flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Analyze with AI
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {Object.entries(selectedLocation.metrics).map(([key, val]) => (
                  <div key={key} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{key}</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{val}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  Google Maps
                </a>
                <button
                  onClick={() =>
                    onAskAi(
                      `Give me a detailed travel guide, key transport options, and neighboring points of interest around ${selectedLocation.title} (${selectedLocation.address}).`
                    )
                  }
                  className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition shadow-sm"
                >
                  <Navigation className="w-3 h-3" />
                  Directions & Guide
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Main Map Container */}
        <div className="flex-1 h-full min-h-[400px] w-full relative">
          <APIProvider apiKey={apiKey}>
            <GoogleMapComponent
              id="honore-main-map"
              className="w-full h-full"
              center={mapCenter}
              zoom={mapZoom}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              {/* Render Curated Location Advanced Markers */}
              {filteredLocations.map(loc => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <AdvancedMarker
                    key={loc.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    title={loc.title}
                    onClick={() => setSelectedLocation(loc)}
                  >
                    <Pin
                      background={
                        isSelected
                          ? '#4f46e5'
                          : loc.category === 'regional'
                          ? '#10b981'
                          : loc.category === 'ai_hub'
                          ? '#9333ea'
                          : '#0284c7'
                      }
                      glyphColor="#ffffff"
                      borderColor="#ffffff"
                      scale={isSelected ? 1.25 : 1.0}
                    />
                  </AdvancedMarker>
                );
              })}

              {/* User Current Location Marker */}
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Your Current Location">
                  <Pin background="#ea580c" glyphColor="#ffffff" borderColor="#ffffff" scale={1.2} />
                </AdvancedMarker>
              )}

              {/* InfoWindow for selected item */}
              {selectedLocation && (
                <InfoWindow
                  position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                  onCloseClick={() => setSelectedLocation(null)}
                >
                  <div className="p-2 max-w-xs text-slate-900">
                    <h4 className="font-bold text-xs text-indigo-900 mb-1">{selectedLocation.title}</h4>
                    <p className="text-[11px] text-slate-600 mb-2">{selectedLocation.address}</p>
                    <p className="text-xs text-slate-700 leading-snug">{selectedLocation.description}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMapComponent>
          </APIProvider>
        </div>
      </div>
    </div>
  );
};
