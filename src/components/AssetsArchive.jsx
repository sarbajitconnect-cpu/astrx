import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  UploadCloud, 
  ArrowLeft, 
  Search, 
  Send, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  FileQuestion,
  Eye,
  X
} from 'lucide-react';
import { askGroqAI } from '../utils/aiResponse';

export default function AssetsArchive({ onBackToChat }) {
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ isUploading: false, progress: 0, status: '', fileName: '' });
  const [selectedDocId, setSelectedDocId] = useState(null); // null means query across all documents
  const [previewDoc, setPreviewDoc] = useState(null);

  // Document Q&A Chat State
  const [docQuery, setDocQuery] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Fetch real persistent documents from backend
  const fetchDocuments = async () => {
    try {
      let authHeader = {};
      try {
        const user = JSON.parse(localStorage.getItem('astrx_user') || '{}');
        if (user && user.token) authHeader['Authorization'] = `Bearer ${user.token}`;
      } catch {}

      const res = await fetch('/api/backend/api/documents', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAnswering]);

  // Upload handler with progress simulation
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus({ isUploading: true, progress: 20, status: 'Reading file data...', fileName: file.name });

      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploadStatus({ isUploading: true, progress: 50, status: 'Semantic chunking & BGE embedding...', fileName: file.name });

        let authHeader = {};
        try {
          const user = JSON.parse(localStorage.getItem('astrx_user') || '{}');
          if (user && user.token) authHeader['Authorization'] = `Bearer ${user.token}`;
        } catch {}

        const res = await fetch('/api/backend/api/upload', {
          method: 'POST',
          headers: authHeader,
          body: formData
        });

        if (res.ok) {
          setUploadStatus({ isUploading: true, progress: 100, status: 'Indexed into Qdrant!', fileName: file.name });
          await fetchDocuments();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(`Upload failed: ${err.detail || 'Unsupported file or error.'}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setTimeout(() => {
          setUploadStatus({ isUploading: false, progress: 0, status: '', fileName: '' });
        }, 1000);
      }
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document from your Assets library?')) return;

    try {
      let authHeader = {};
      try {
        const user = JSON.parse(localStorage.getItem('astrx_user') || '{}');
        if (user && user.token) authHeader['Authorization'] = `Bearer ${user.token}`;
      } catch {}

      const res = await fetch(`/api/backend/api/documents/${docId}`, {
        method: 'DELETE',
        headers: authHeader
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        if (selectedDocId === docId) setSelectedDocId(null);
      }
    } catch (err) {
      console.error('Delete document failed:', err);
    }
  };

  const handleAskDocuments = async () => {
    if (!docQuery.trim() || isAnswering) return;

    const userMessage = { sender: 'user', text: docQuery };
    setChatHistory(prev => [...prev, userMessage]);
    const currentQ = docQuery;
    setDocQuery('');
    setIsAnswering(true);

    try {
      let authHeader = {};
      try {
        const user = JSON.parse(localStorage.getItem('astrx_user') || '{}');
        if (user && user.token) authHeader['Authorization'] = `Bearer ${user.token}`;
      } catch {}

      const res = await fetch('/api/backend/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          message: currentQ,
          mode: 'assets',
          selected_doc_id: selectedDocId || undefined,
          history: chatHistory.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: data.answer,
            sources: data.sources || [],
            model: data.model_used
          }
        ]);
      } else {
        const err = await res.json().catch(() => ({}));
        setChatHistory(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: err.detail || 'Could not retrieve answer from documents. Please try again.'
          }
        ]);
      }
    } catch (err) {
      console.error('RAG query error:', err);
      setChatHistory(prev => [
        ...prev,
        { sender: 'assistant', text: 'Network connection issue with document RAG service.' }
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const getDocIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    if (t.includes('doc')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (t.includes('xls') || t.includes('csv')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
    if (t.includes('json') || t.includes('xml') || t.includes('py')) return <FileCode className="w-5 h-5 text-amber-400" />;
    return <FileQuestion className="w-5 h-5 text-slate-400" />;
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d1a] text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToChat}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Chat</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center space-x-2">
            <Box className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold tracking-wide text-white">ASSETS INTELLIGENCE</span>
            <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-mono">
              Multimodal RAG Mode
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleUploadFiles(e.target.files)}
            multiple
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.md,.pptx,.xlsx,.csv,.json,.xml,.html,.png,.jpg,.jpeg,.webp"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadStatus.isUploading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Upload Progress Alert Banner */}
      {uploadStatus.isUploading && (
        <div className="px-6 py-2.5 bg-cyan-950/90 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="text-xs font-mono text-cyan-200">
              Indexing {uploadStatus.fileName}: {uploadStatus.status}
            </span>
          </div>
          <span className="text-xs font-mono text-cyan-400">{uploadStatus.progress}%</span>
        </div>
      )}

      {/* Main Split Layout: Documents Explorer (Left) & Grounded Q&A Chat (Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Documents Library */}
        <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-900/40 p-4 overflow-hidden">
          {/* Search bar & filter info */}
          <div className="flex items-center justify-between mb-3">
            <div className="relative flex-1 mr-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search uploaded documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
              {filteredDocs.length} {filteredDocs.length === 1 ? 'Doc' : 'Docs'}
            </span>
          </div>

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleUploadFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="mb-3 p-4 border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-xl text-center cursor-pointer transition-all"
          >
            <UploadCloud className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
            <p className="text-xs font-medium text-slate-200">
              Drag & drop PDF, DOCX, PPTX, XLSX, CSV, JSON, or Images
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Automated OCR & Semantic BGE Embeddings
            </p>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoadingDocs ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                Loading indexed documents...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No documents uploaded yet. Upload materials to enable document grounded Q&A.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 rounded-lg bg-black/40">
                        {getDocIcon(doc.file_type || doc.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                          {doc.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>{doc.chunks_count || 0} chunks</span>
                          <span>•</span>
                          <span>{doc.status === 'ready' ? 'Indexed' : 'Processing'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete document and clear vector index"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Document-Grounded Q&A Chat Interface */}
        <div className="w-full lg:w-1/2 flex flex-col bg-slate-950/80">
          {/* Header of Chat */}
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white">Ask Uploaded Documents</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
              {selectedDocId
                ? `Filter: ${documents.find(d => d.id === selectedDocId)?.name || 'Selected Doc'}`
                : 'Searching Across All Documents'}
            </span>
          </div>

          {/* Chat Messages */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 text-xs leading-relaxed">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-6 py-12">
                <Box className="w-10 h-10 text-cyan-500/30 mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">Document Grounded Intelligence</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Ask any question about your uploaded materials. Answers will be strictly derived from your documents with verifiable citations.
                </p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none shadow-md shadow-cyan-600/20'
                        : 'bg-slate-900 border border-white/10 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Grounded Citations Provenance Pill */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 space-y-1 max-w-[85%]">
                      <span className="text-[10px] font-mono font-medium text-cyan-400 uppercase tracking-wider">
                        Verifiable Sources:
                      </span>
                      {msg.sources.map((s, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-900/60 border border-cyan-500/20 text-[11px] text-slate-300">
                          <span className="font-semibold text-cyan-300">{s.label}: </span>
                          <span className="text-slate-400">{s.snippet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {isAnswering && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Retrieving chunks & synthesizing grounded response...</span>
              </div>
            )}
          </div>

          {/* Ask Astra Input */}
          <div className="p-3 border-t border-white/10 bg-slate-950">
            <div className="flex items-center space-x-2 bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 focus-within:border-cyan-400 transition-all">
              <input
                type="text"
                placeholder={
                  selectedDocId
                    ? `Ask about ${documents.find(d => d.id === selectedDocId)?.name}...`
                    : 'Ask anything about your uploaded documents...'
                }
                value={docQuery}
                onChange={(e) => setDocQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskDocuments();
                  }
                }}
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
              />
              <button
                onClick={handleAskDocuments}
                disabled={isAnswering || !docQuery.trim()}
                className="p-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
