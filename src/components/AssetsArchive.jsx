import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  FileText, 
  Image as ImageIcon, 
  Code2, 
  Sparkles, 
  FlaskConical, 
  Trash2, 
  UploadCloud, 
  ArrowLeft,
  Search,
  ExternalLink,
  Download,
  X,
  Check
} from 'lucide-react';
import { processUploadedFile } from '../utils/fileReader';

const DEFAULT_ASSETS = [
  { 
    id: 'asset-1', 
    name: 'Deep_Ocean_Ecology_Report.pdf', 
    type: 'doc', 
    size: '2.4 MB', 
    dateTime: 'Oct 22, 2026 • 02:45 PM', 
    tag: 'Knowledge Base',
    category: 'research'
  },
  { 
    id: 'asset-2', 
    name: 'Astrophysics_EventHorizon_Graph.png', 
    type: 'image', 
    size: '4.1 MB', 
    dateTime: 'Oct 20, 2026 • 11:30 AM', 
    tag: 'Diagram',
    category: 'images'
  },
  { 
    id: 'asset-3', 
    name: 'Quantum_Circuit_Simulator.py', 
    type: 'code', 
    size: '18 KB', 
    dateTime: 'Oct 16, 2026 • 09:15 AM', 
    tag: 'Script',
    category: 'code'
  },
  { 
    id: 'asset-4', 
    name: 'Memory_Pawnshop_Script_Draft.md', 
    type: 'doc', 
    size: '45 KB', 
    dateTime: 'Oct 10, 2026 • 04:20 PM', 
    tag: 'Screenplay',
    category: 'documents'
  },
  { 
    id: 'asset-5', 
    name: 'Cosmic_Web_Neural_Synthesis.png', 
    type: 'generated', 
    size: '3.8 MB', 
    dateTime: 'Oct 24, 2026 • 01:10 PM', 
    tag: 'Generated',
    category: 'generated'
  },
  { 
    id: 'asset-6', 
    name: 'Synthetic_Intelligence_Convergence_Paper.pdf', 
    type: 'research', 
    size: '5.2 MB', 
    dateTime: 'Oct 23, 2026 • 06:05 PM', 
    tag: 'Research',
    category: 'research'
  }
];

export default function AssetsArchive({ onBackToChat }) {
  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('astrx_assets');
      return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
    } catch {
      return DEFAULT_ASSETS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [previewAsset, setPreviewAsset] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('astrx_assets', JSON.stringify(assets));
    } catch (e) {
      console.error("Failed to save assets to storage:", e);
    }
  }, [assets]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const rawFile = files[i];
      try {
        const processed = await processUploadedFile(rawFile);
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        let assetType = 'doc';
        let assetCategory = 'documents';
        let assetTag = 'Document';

        if (processed.isImage) {
          assetType = 'image';
          assetCategory = 'images';
          assetTag = 'Image';
        } else if (processed.name.endsWith('.py') || processed.name.endsWith('.js') || processed.name.endsWith('.ts') || processed.name.endsWith('.html')) {
          assetType = 'code';
          assetCategory = 'code';
          assetTag = 'Script';
        } else if (processed.name.toLowerCase().includes('research') || processed.name.toLowerCase().includes('report') || processed.name.toLowerCase().includes('paper')) {
          assetType = 'research';
          assetCategory = 'research';
          assetTag = 'Research';
        }

        const sizeStr = processed.size > 1024 * 1024 
          ? `${(processed.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(processed.size / 1024))} KB`;

        const newAsset = {
          id: `asset-${Date.now()}-${i}`,
          name: processed.name,
          type: assetType,
          size: sizeStr,
          dateTime: `${formattedDate} • ${formattedTime}`,
          tag: assetTag,
          category: assetCategory,
          previewUrl: processed.previewUrl || processed.base64Data,
          content: processed.extractedText || ''
        };

        setAssets(prev => [newAsset, ...prev]);
      } catch (err) {
        console.error("Error processing asset file:", err);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAsset = (id, e) => {
    e?.stopPropagation();
    setAssets(prev => prev.filter(a => a.id !== id));
    if (previewAsset?.id === id) {
      setPreviewAsset(null);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.tag.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'documents') return asset.category === 'documents' || asset.type === 'doc';
    if (activeFilter === 'images') return asset.category === 'images' || asset.type === 'image';
    if (activeFilter === 'generated') return asset.category === 'generated' || asset.type === 'generated';
    if (activeFilter === 'research') return asset.category === 'research' || asset.type === 'research';
    if (activeFilter === 'code') return asset.category === 'code' || asset.type === 'code';
    return true;
  });

  const getAssetIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={18} />;
      case 'generated':
        return <Sparkles size={18} className="text-amber-300" />;
      case 'code':
        return <Code2 size={18} className="text-cyan-300" />;
      case 'research':
        return <FlaskConical size={18} className="text-indigo-300" />;
      default:
        return <FileText size={18} className="text-white/70" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 md:p-8 select-none overflow-hidden font-victor animate-in fade-in duration-200">
      
      {/* Hidden Native File Input */}
      <input 
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header Bar: (Back) Assets Archive & Upload Asset */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            title="Back"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105"
          >
            <ArrowLeft size={18} />
          </button>
          
          <h2 className="text-xl font-bold font-victor text-white flex items-center gap-2.5 tracking-tight">
            <Box size={22} className="text-white/80" />
            <span>Assets Archive</span>
          </h2>
        </div>

        {/* Upload Asset Pill Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-victor text-xs font-medium flex items-center gap-2 border border-white/[0.08] transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
        >
          <UploadCloud size={15} />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 shrink-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'all', label: 'All' },
            { key: 'documents', label: 'Documents' },
            { key: 'images', label: 'Images' },
            { key: 'generated', label: 'Generated' },
            { key: 'research', label: 'Research' },
            { key: 'code', label: 'Scripts' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1 rounded-full text-xs font-victor transition-all cursor-pointer shrink-0 ${
                activeFilter === tab.key
                  ? 'bg-white/20 text-white font-medium shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archive..."
            className="w-full bg-[#1c222c] border border-white/[0.08] rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all font-victor"
          />
        </div>
      </div>

      {/* Assets Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-edge">
        {filteredAssets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-white/[0.04] bg-[#1c222c]/40">
            <Box size={36} className="text-white/20 mb-2" />
            <p className="text-xs text-white/40 font-victor">No assets found in archive</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-victor transition-colors cursor-pointer"
            >
              Upload your first asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => {
                  if (asset.previewUrl) {
                    setPreviewAsset(asset);
                  }
                }}
                className={`p-4 rounded-2xl border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between group shadow-xl ${
                  asset.previewUrl ? 'cursor-pointer' : 'cursor-default'
                }`}
                style={{
                  backgroundColor: '#1c222c',
                }}
              >
                {/* Left Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center shrink-0 text-white/70 group-hover:text-white transition-colors overflow-hidden">
                    {asset.previewUrl ? (
                      <img 
                        src={asset.previewUrl} 
                        alt={asset.name} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      getAssetIcon(asset.type)
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-medium font-victor text-white group-hover:text-white truncate">
                      {asset.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-white/40 font-victor mt-1">
                      <span>{asset.size}</span>
                      <span>•</span>
                      <span>{asset.dateTime}</span>
                    </div>
                  </div>
                </div>

                {/* Right Badge & Remove Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-victor px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                    {asset.tag}
                  </span>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemoveAsset(asset.id, e)}
                    title="Remove asset"
                    className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Preview Thumbnail Modal (Only shown for items with a thumbnail) */}
      {previewAsset && previewAsset.previewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewAsset(null)}
        >
          <div 
            className="w-full max-w-lg rounded-2xl border border-white/15 p-5 shadow-2xl space-y-3 font-victor animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: '#1c222c' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center shrink-0">
                  {getAssetIcon(previewAsset.type)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[340px]">{previewAsset.name}</h3>
                  <p className="text-[11px] text-white/40 mt-0.5">{previewAsset.size} • {previewAsset.dateTime}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X size={16} />
              </button>
            </div>

            {/* Thumbnail Image View */}
            <div className="max-h-80 overflow-hidden rounded-xl border border-white/10 bg-black/50 flex items-center justify-center p-2">
              <img 
                src={previewAsset.previewUrl} 
                alt={previewAsset.name} 
                className="max-h-72 w-auto object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={(e) => handleRemoveAsset(previewAsset.id, e)}
                className="px-3 py-1.5 rounded-full text-rose-400 hover:bg-rose-500/10 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>

              <button
                onClick={() => setPreviewAsset(null)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
