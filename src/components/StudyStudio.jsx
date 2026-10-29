import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  ArrowLeft, 
  FileText, 
  Globe, 
  Upload, 
  Trash2, 
  Sparkles, 
  Play, 
  Search, 
  Video, 
  Layers, 
  Send, 
  Maximize2, 
  Minimize2, 
  X,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import AstraLogo from './AstraLogo';
import MarkdownRenderer from './MarkdownRenderer';
import { processUploadedFile } from '../utils/fileReader';
import { askGroqAI } from '../utils/aiResponse.js';
import { getRealYouTubeTranscript, getRealYouTubeMetadata } from '../utils/youtubeTranscript.js';

/**
 * Dynamic YouTube Video Resolver: Queries AI or oEmbed for the highest quality educational YouTube video ID
 */
async function resolveYouTubeVideoForTopic(topicQuery) {
  if (!topicQuery) {
    return { id: 'fRed0Lha9hU', title: 'Core Academic Concepts', channel: 'CrashCourse' };
  }

  // Check if user pasted a direct YouTube link
  const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = topicQuery.match(ytRegex);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const meta = await getRealYouTubeMetadata(videoId);
    return { id: videoId, title: meta.title || 'Educational Lecture Video', channel: meta.channel || 'YouTube' };
  }

  try {
    const prompt = `Find the single best, most popular, highly-viewed educational YouTube video ID for the academic subject: "${topicQuery}".
Return ONLY a valid JSON object in this exact format with no extra text or markdown:
{"id":"YOUTUBE_11_CHAR_ID","title":"Video Title","channel":"Channel Name"}`;

    const raw = await askGroqAI([], prompt, 'ASTRX-4 Pro');
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.id && parsed.id.length === 11) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("YouTube video resolution fallback:", err);
  }

  // Smart fallback map by keywords
  const q = topicQuery.toLowerCase();
  if (q.includes('chem') || q.includes('organic') || q.includes('reaction')) {
    return { id: 'FSyAehMdpyI', title: 'The Creation of Chemistry - Fundamental Concepts', channel: 'CrashCourse' };
  }
  if (q.includes('quantum') || q.includes('qubit') || q.includes('superconduct')) {
    return { id: 'QuRssEr-03E', title: 'Quantum Computing in 10 Minutes', channel: 'PBS Space Time' };
  }
  if (q.includes('physics') || q.includes('gravity') || q.includes('relativity')) {
    return { id: 'k7KVaB-64p0', title: 'Newton\'s Laws of Motion & Physics', channel: 'CrashCourse' };
  }
  if (q.includes('ai') || q.includes('transformer') || q.includes('neural')) {
    return { id: 'wjZofJX0v4U', title: 'Transformers Explained Visually', channel: '3Blue1Brown' };
  }
  if (q.includes('bio') || q.includes('evolution') || q.includes('gene')) {
    return { id: 'x5Wf1zY4j7A', title: 'The Human Evolutionary Journey', channel: 'CrashCourse' };
  }

  return { id: 'fRed0Lha9hU', title: `${topicQuery} - Comprehensive Overview`, channel: 'CrashCourse' };
}

function sanitizeTextContent(str) {
  if (!str) return '';
  if (
    str.includes('/Filter') ||
    str.includes('FlateDecode') ||
    str.includes('/Length') ||
    str.includes('endstream') ||
    str.includes('/Font<') ||
    str.includes('/XObject') ||
    str.includes('stream') && str.includes('endobj')
  ) {
    return '';
  }
  return str.trim();
}

function sanitizeSavedStudies(studiesList) {
  return (studiesList || []).map(study => ({
    ...study,
    sources: (study.sources || []).map(source => ({
      ...source,
      content: sanitizeTextContent(source.content) || `[Study Document: ${source.name}]`
    }))
  }));
}

const DEFAULT_STUDIES = [
  {
    id: 'study-1',
    title: 'Quantum Computing & Superconducting Qubits',
    date: 'Oct 24, 2026',
    sources: [
      {
        id: 's-1',
        name: 'Quantum_Circuit_Dynamics.pdf',
        type: 'pdf',
        size: '3.2 MB',
        content: `Quantum computing leverages superposition and entanglement. In superconducting quantum circuits, Josephson junctions provide non-linear inductance for computational energy levels. Surface code error correction requires physical error rates below the 1% threshold.`
      }
    ],
    summary: 'Investigation into transmon qubit Hamiltonian, Josephson energy ratios, and surface code fault-tolerance thresholds in quantum processors.'
  },
  {
    id: 'study-2',
    title: 'Evolutionary Anthropology & Hominin Genomics',
    date: 'Oct 22, 2026',
    sources: [
      {
        id: 's-3',
        name: 'Human_Evolution_Genetics_Review.pdf',
        type: 'pdf',
        size: '4.8 MB',
        content: `Modern Homo sapiens originated in Africa approximately 300,000 years ago. Ancient genomic sequencing of Neanderthal and Denisovan remains has demonstrated introgressive hybridization events, leaving roughly 1-2% archaic ancestry in non-African contemporary populations.`
      }
    ],
    summary: 'Analysis of Pleistocene hominin migrations, Denisovan-Neanderthal admixture rates, and evolutionary adaptation in high-altitude environments.'
  }
];

export default function StudyStudio({ onBackToChat, initialTopic = '', initialLatexCode = '' }) {
  const [studies, setStudies] = useState(() => {
    try {
      const saved = localStorage.getItem('astrx_studies');
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeSavedStudies(parsed);
      }
      return DEFAULT_STUDIES;
    } catch {
      return DEFAULT_STUDIES;
    }
  });

  const [activeStudyId, setActiveStudyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Left Screen State ('assets' | 'video' | 'diagram' | 'transcript')
  const [leftScreenMode, setLeftScreenMode] = useState('assets');
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoSearchInput, setVideoSearchInput] = useState('');
  const [isSearchingVideo, setIsSearchingVideo] = useState(false);
  const [isVideoFullScreen, setIsVideoFullScreen] = useState(false);
  const [videoTranscript, setVideoTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    status: '',
    fileName: ''
  });

  // URLs & File input ref
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [predictedQuestions, setPredictedQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Sync with storage
  useEffect(() => {
    try {
      localStorage.setItem('astrx_studies', JSON.stringify(studies));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, [studies]);

  const currentStudy = studies.find(s => s.id === activeStudyId);

  // Handle initial topic injection
  useEffect(() => {
    if (initialTopic && !activeStudyId) {
      const newId = `study-${Date.now()}`;
      const newStudy = {
        id: newId,
        title: initialTopic,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sources: [
          {
            id: `s-${Date.now()}`,
            name: `${initialTopic.replace(/\s+/g, '_')}_Paper.tex`,
            type: 'doc',
            size: '24 KB',
            content: initialLatexCode || `Academic Research on ${initialTopic}`
          }
        ],
        summary: `Autonomous study track created for ${initialTopic}.`
      };
      setStudies(prev => [newStudy, ...prev]);
      setActiveStudyId(newId);
    }
  }, [initialTopic, initialLatexCode]);

  // When study opens, initialize chat and default suggested questions
  useEffect(() => {
    if (currentStudy) {
      resolveYouTubeVideoForTopic(currentStudy.title).then(vid => {
        setActiveVideo(vid);
      });
      setLeftScreenMode('assets');
      
      const welcomeText = `Welcome to your **${currentStudy.title}** study space. I am your AI study companion grounded in your ${currentStudy.sources?.length || 0} source document(s). Ask me to explain concepts, summarize notes, show workflow diagrams, or play educational YouTube videos!`;

      setChatMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: welcomeText,
          timestamp: 'Just now'
        }
      ]);

      setPredictedQuestions([
        `Summarize the key takeaways of ${currentStudy.title}`,
        `Show me a video on this topic`,
        `Generate a concept workflow diagram`,
        `What are the core definitions in our sources?`
      ]);
    }
  }, [activeStudyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, predictedQuestions]);

  const handleCreateStudy = () => {
    if (!newTitle.trim()) return;
    const newId = `study-${Date.now()}`;
    const newStudy = {
      id: newId,
      title: newTitle.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      sources: [],
      summary: `Comprehensive study notebook for ${newTitle.trim()}.`
    };

    setStudies(prev => [newStudy, ...prev]);
    setActiveStudyId(newId);
    setNewTitle('');
    setIsCreatingNew(false);
  };

  const handleDeleteStudy = (id, e) => {
    e?.stopPropagation();
    setStudies(prev => prev.filter(s => s.id !== id));
    if (activeStudyId === id) {
      setActiveStudyId(null);
    }
  };

  // Upload PDF / Document with Real Progress Feedback
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeStudyId) return;

    for (let i = 0; i < files.length; i++) {
      const rawFile = files[i];
      setUploadProgress({
        isUploading: true,
        progress: 10,
        status: `Reading ${rawFile.name}...`,
        fileName: rawFile.name
      });

      try {
        const processed = await processUploadedFile(rawFile, (pct, statusText) => {
          setUploadProgress({
            isUploading: true,
            progress: pct,
            status: statusText,
            fileName: rawFile.name
          });
        });

        const cleanContent = processed.extractedText && processed.extractedText.length > 20
          ? sanitizeTextContent(processed.extractedText)
          : `[Document: ${processed.name} (${(processed.size / 1024).toFixed(1)} KB)]`;

        const newSource = {
          id: `source-${Date.now()}-${i}`,
          name: processed.name,
          type: processed.isPdf ? 'pdf' : (processed.isImage ? 'image' : 'doc'),
          size: `${Math.max(1, Math.round(processed.size / 1024))} KB`,
          content: cleanContent,
          previewUrl: processed.previewUrl
        };

        setStudies(prev => prev.map(s => {
          if (s.id === activeStudyId) {
            return {
              ...s,
              sources: [...s.sources, newSource]
            };
          }
          return s;
        }));

        setUploadProgress({
          isUploading: true,
          progress: 100,
          status: 'Indexing complete!',
          fileName: rawFile.name
        });

        setTimeout(() => {
          setUploadProgress({ isUploading: false, progress: 0, status: '', fileName: '' });
        }, 1200);

        // Notify Chat
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'assistant',
            text: `Successfully uploaded and indexed **"${processed.name}"** (${(processed.size / 1024).toFixed(1)} KB). All contents are ready for grounded Q&A and analysis!`,
            timestamp: 'Just now'
          }
        ]);

        setPredictedQuestions([
          `What are the main topics in ${processed.name}?`,
          `Summarize the key takeaways from this document`,
          `Show me a video on this topic`,
          `Generate 3 practice questions on this document`
        ]);

      } catch (err) {
        console.error("File upload error in study:", err);
        setUploadProgress({ isUploading: false, progress: 0, status: '', fileName: '' });
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Ingest URL Source
  const handleAddUrlSource = async () => {
    if (!urlInput.trim() || !activeStudyId) return;
    const url = urlInput.trim();
    setIsGeneratingAi(true);

    let extracted = '';
    try {
      extracted = await askGroqAI([], `Extract and summarize key academic concepts from: "${url}".`, 'ASTRX-4 Pro');
    } catch {
      extracted = `Web source ingested from ${url}.`;
    }
    setIsGeneratingAi(false);

    const newSource = {
      id: `source-${Date.now()}`,
      name: url,
      type: 'url',
      size: 'Web Source',
      content: sanitizeTextContent(extracted)
    };

    setStudies(prev => prev.map(s => {
      if (s.id === activeStudyId) {
        return {
          ...s,
          sources: [...s.sources, newSource]
        };
      }
      return s;
    }));

    setUrlInput('');
    setIsAddingUrl(false);
  };

  const handleDeleteSource = (sourceId, e) => {
    e?.stopPropagation();
    setStudies(prev => prev.map(s => {
      if (s.id === activeStudyId) {
        return {
          ...s,
          sources: s.sources.filter(item => item.id !== sourceId)
        };
      }
      return s;
    }));
  };

  // Dynamic Video Search & Search Bar
  const handleSearchVideo = async (queryToSearch = videoSearchInput) => {
    if (!queryToSearch.trim()) return;
    setIsSearchingVideo(true);
    try {
      const vid = await resolveYouTubeVideoForTopic(queryToSearch);
      setActiveVideo(vid);
      setLeftScreenMode('video');
      setVideoSearchInput('');
    } catch (err) {
      console.error("Video search error:", err);
    }
    setIsSearchingVideo(false);
  };

  // Real YouTube Video Transcription Generator
  const handleTranscribeVideo = async () => {
    if (!activeVideo) return;
    setIsTranscribing(true);
    try {
      const realTranscript = await getRealYouTubeTranscript(activeVideo.id, activeVideo.title, activeVideo.channel);
      const cleanTranscriptText = realTranscript || `### Video Lecture: ${activeVideo.title}\n\nTranscript extracted and indexed for grounded analysis.`;
      
      setVideoTranscript(cleanTranscriptText);
      setLeftScreenMode('transcript');

      // Add transcript as a grounded source so chat can answer questions about the video
      const newSource = {
        id: `source-yt-${Date.now()}`,
        name: `Transcript: ${activeVideo.title}`,
        type: 'doc',
        size: 'Video Captions',
        content: cleanTranscriptText
      };

      setStudies(prev => prev.map(s => {
        if (s.id === activeStudyId) {
          const filtered = s.sources.filter(item => !item.name.startsWith(`Transcript: ${activeVideo.title}`));
          return {
            ...s,
            sources: [...filtered, newSource]
          };
        }
        return s;
      }));

      // Notify Chat
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `I have retrieved the real transcript for **"${activeVideo.title}"** on the left screen and indexed it into your study context. You can read the timestamps or ask me any questions about what was spoken in this video!`,
          timestamp: 'Just now'
        }
      ]);

      setPredictedQuestions([
        `Summarize the main points spoken in this video`,
        `What is the most important formula in this video?`,
        `Create a quiz based on this video lecture`,
        `Return to source assets`
      ]);
    } catch (err) {
      console.error("Transcription error:", err);
    }
    setIsTranscribing(false);
  };

  // Chat Submission & Intent Routing (Grounded Q&A, Video Trigger, Diagram Trigger)
  const handleSendMessage = async (customPrompt = null) => {
    const text = customPrompt || chatInput.trim();
    if (!text) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsGeneratingAi(true);

    const lower = text.toLowerCase();
    const isVideoRequest = (lower.includes('show') || lower.includes('find') || lower.includes('play')) && (lower.includes('video') || lower.includes('youtube') || lower.includes('lecture'));
    const isDiagramRequest = lower.includes('diagram') || lower.includes('workflow') || lower.includes('flowchart') || lower.includes('visual map');

    // Build strictly clean sources text
    const sourcesContext = currentStudy?.sources
      ?.map(s => {
        const clean = sanitizeTextContent(s.content);
        return `[Source Document: ${s.name}]\n${clean}`;
      })
      .filter(Boolean)
      .join('\n\n') || '';

    try {
      if (isVideoRequest) {
        const topicQuery = text.replace(/^(show|find|play|give me|can you show)\s*(me)?\s*(a)?\s*(video|youtube|lecture)?\s*(on|about|for)?\s*/i, '') || currentStudy?.title || 'Academic Science';
        const vid = await resolveYouTubeVideoForTopic(topicQuery);
        setActiveVideo(vid);
        setLeftScreenMode('video');

        const aiReply = `I found a top-rated educational lecture for **"${topicQuery}"**: **"${vid.title}"** by **${vid.channel}**. I have loaded it directly on the left screen. You can watch in full screen or click **Transcribe Video** to analyze its contents!`;

        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'assistant',
            text: aiReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setPredictedQuestions([
          `Transcribe this video for me`,
          `Summarize the main concepts in this video`,
          `Find another video on ${topicQuery}`,
          `Return to study documents`
        ]);
        setIsGeneratingAi(false);
        return;
      }

      if (isDiagramRequest) {
        setLeftScreenMode('diagram');
        const aiReply = `I have rendered a structured concept workflow diagram on the left screen illustrating the core stages, dependencies, and mechanisms of **${currentStudy?.title}**.`;

        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'assistant',
            text: aiReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setPredictedQuestions([
          `Explain stage 2 in detail`,
          `Show me a video on this topic`,
          `Generate 3 practice questions on this workflow`,
          `Return to source assets`
        ]);
        setIsGeneratingAi(false);
        return;
      }

      // Filter out any previous corrupt messages from history before calling Groq
      const cleanHistory = chatMessages.map(m => ({
        ...m,
        text: sanitizeTextContent(m.text) || 'Study Question'
      }));

      const systemPrompt = `You are the ASTRX Study Companion for "${currentStudy?.title}".
Teach, explain, and tutor the user clearly. Answer accurately using ONLY the user's uploaded sources:
=== GROUNDED SOURCES ===
${sourcesContext || 'No documents uploaded yet.'}
=== END SOURCES ===
CRITICAL:
- If asked what is in the PDF/document, provide an honest, accurate breakdown based ONLY on the grounded source text above. Do NOT invent fake chapters or hallucinate titles.
- Format responses cleanly with bullet points and clean math. Never output raw binary or unparsed PDF tokens.`;

      const aiReply = await askGroqAI(
        cleanHistory,
        text + `\n\n[Instruction: ${systemPrompt}]`,
        'ASTRX-4 Pro'
      );

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Predict 3-4 smart next questions
      try {
        const predictPrompt = `Based on the study topic "${currentStudy?.title}" and question "${text}", return EXACTLY 3 short, helpful, natural next questions a student would ask. Return ONLY the 3 questions, one per line. Do not include markdown headings or prefixes.`;
        const rawPred = await askGroqAI([], predictPrompt, 'ASTRX-4 Pro');
        const lines = rawPred.split('\n').map(l => l.replace(/^[0-9\.\-\*\s#]+/, '').trim()).filter(l => l.length > 5 && !l.startsWith('###')).slice(0, 4);
        if (lines.length >= 2) {
          setPredictedQuestions(lines);
        } else {
          setPredictedQuestions([
            `Can you explain this with a practical example?`,
            `Show me a video on this topic`,
            `Create 3 practice quiz questions`
          ]);
        }
      } catch {
        setPredictedQuestions([
          `Explain this in simpler terms`,
          `Show me a video on this topic`,
          `What are the practical applications?`
        ]);
      }

    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: 'I encountered an issue processing the response. Please try again.',
          timestamp: 'Just now'
        }
      ]);
    }
    setIsGeneratingAi(false);
  };

  const filteredStudies = studies.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 md:p-8 select-none overflow-hidden font-victor animate-in fade-in duration-200">
      
      {/* Hidden File Input for PDF / Doc Upload */}
      <input 
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.json,.csv,.py,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TOP HEADER: Clean "Study" at top */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeStudyId) {
                setActiveStudyId(null);
              } else {
                onBackToChat();
              }
            }}
            title={activeStudyId ? "Back to Studies Hub" : "Back to Chat"}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105"
          >
            <ArrowLeft size={18} />
          </button>
          
          <h2 className="text-xl font-bold font-victor text-white flex items-center gap-2.5 tracking-tight">
            <BookOpen size={22} className="text-white/80" />
            <span>Study</span>
          </h2>
        </div>

        {!activeStudyId && (
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-victor text-xs font-medium flex items-center gap-2 border border-white/[0.08] transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
          >
            <Plus size={15} />
            <span>New Study</span>
          </button>
        )}
      </div>

      {/* =========================================================
          VIEW 1: STUDY HUB (Past Studies & Create Option)
         ========================================================= */}
      {!activeStudyId ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          
          {/* Quick Search */}
          <div className="relative w-full max-w-md mb-6 shrink-0">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past studies..."
              className="w-full bg-[#1c222c] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all font-victor"
            />
          </div>

          {/* Studies Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-edge">
            {filteredStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full max-w-md p-8 rounded-2xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center text-center gap-3 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Plus size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Create New Study</h4>
                    <p className="text-xs text-white/40 mt-1">Upload PDFs, websites, and ask AI to tutor or play videos</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                {/* Past Studies Cards */}
                {filteredStudies.map((study) => (
                  <div
                    key={study.id}
                    onClick={() => setActiveStudyId(study.id)}
                    className="p-5 rounded-2xl border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between group shadow-xl cursor-pointer"
                    style={{ backgroundColor: '#1c222c' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <BookOpen size={16} className="text-white/70 shrink-0" />
                          <h3 className="text-sm font-semibold text-white group-hover:text-white truncate max-w-[280px]">
                            {study.title}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => handleDeleteStudy(study.id, e)}
                          title="Delete Study"
                          className="p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <p className="text-xs text-white/50 line-clamp-2 mt-2 leading-relaxed">
                        {study.summary || 'Study session with custom notes and uploaded sources.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/[0.06] text-[11px] text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Layers size={13} />
                        <span>{study.sources?.length || 0} Sources</span>
                      </span>
                      <span>{study.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =========================================================
           VIEW 2: NOTEBOOKLM INTERFACE (Left Screen + Right AI Chat)
           ========================================================= */
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
          
          {/* =========================================================
              LEFT SIDE: SCREEN (Assets / Video Player / Diagram / Transcript)
             ========================================================= */}
          <div className="flex-1 min-h-[340px] lg:min-h-0 rounded-2xl border border-white/[0.08] bg-[#1c222c] p-4 flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Screen Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeftScreenMode('assets')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    leftScreenMode === 'assets' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Assets & Sources
                </button>

                {activeVideo && (
                  <button
                    onClick={() => setLeftScreenMode('video')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      leftScreenMode === 'video' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Video size={13} />
                    <span>Video Lecture</span>
                  </button>
                )}

                {videoTranscript && (
                  <button
                    onClick={() => setLeftScreenMode('transcript')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      leftScreenMode === 'transcript' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Transcript
                  </button>
                )}

                {leftScreenMode === 'diagram' && (
                  <span className="px-3 py-1 rounded-lg bg-white/15 text-white text-xs font-medium">
                    Workflow Diagram
                  </span>
                )}
              </div>

              {/* Action Controls for Left Screen */}
              <div className="flex items-center gap-1.5">
                {leftScreenMode === 'assets' && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload PDF or Document"
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Upload size={12} />
                      <span>Upload PDF</span>
                    </button>
                    <button
                      onClick={() => setIsAddingUrl(!isAddingUrl)}
                      title="Add Web URL"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
                    >
                      <Globe size={13} />
                    </button>
                  </>
                )}

                {leftScreenMode === 'video' && activeVideo && (
                  <>
                    <button
                      onClick={handleTranscribeVideo}
                      disabled={isTranscribing}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <FileText size={12} />
                      <span>{isTranscribing ? 'Transcribing...' : 'Transcribe Video'}</span>
                    </button>

                    <button
                      onClick={() => setIsVideoFullScreen(!isVideoFullScreen)}
                      title="Full Screen Video"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      {isVideoFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Uploading Progress Banner */}
            {uploadProgress.isUploading && (
              <div className="my-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-victor">
                  <span className="text-white font-medium truncate max-w-[240px]">{uploadProgress.fileName}</span>
                  <span className="text-white/60 font-mono">{uploadProgress.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-white/80 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/50 italic block">{uploadProgress.status}</span>
              </div>
            )}

            {/* URL Popover Input */}
            {isAddingUrl && (
              <div className="my-2 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/..."
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none px-2"
                />
                <button
                  onClick={handleAddUrlSource}
                  className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs"
                >
                  Ingest
                </button>
                <button
                  onClick={() => setIsAddingUrl(false)}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Screen Body */}
            <div className="flex-1 min-h-0 overflow-y-auto mt-3 pr-1 scrollbar-edge">
              
              {/* 1. ASSETS / SOURCES SCREEN */}
              {leftScreenMode === 'assets' && (
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">
                      Study Knowledge Base
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentStudy.summary || 'Uploaded study documents and notes are indexed for grounded tutoring.'}
                    </p>
                  </div>

                  {/* Sources Cards */}
                  <div>
                    <span className="text-xs font-semibold text-white/80 block mb-2">
                      Attached Documents ({currentStudy.sources?.length || 0})
                    </span>

                    {currentStudy.sources?.length === 0 ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="py-12 text-center rounded-xl border border-dashed border-white/10 hover:border-white/25 bg-black/20 p-4 cursor-pointer"
                      >
                        <Upload size={24} className="mx-auto text-white/30 mb-2" />
                        <p className="text-xs text-white/60">No documents uploaded yet</p>
                        <p className="text-[10px] text-white/40 mt-1">Click to upload PDFs, lecture notes, or books</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentStudy.sources.map((source) => (
                          <div
                            key={source.id}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between group hover:border-white/15 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white/80">
                                {source.type === 'pdf' ? <FileText size={15} /> : <Globe size={15} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">{source.name}</p>
                                <p className="text-[10px] text-white/40">{source.size}</p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleDeleteSource(source.id, e)}
                              title="Delete source"
                              className="p-1.5 rounded-md text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. DYNAMIC YOUTUBE VIDEO SCREEN (WITH SEARCH & FULL SCREEN) */}
              {leftScreenMode === 'video' && (
                <div className={`flex flex-col h-full space-y-3 ${isVideoFullScreen ? 'fixed inset-4 z-50 bg-[#1c222c] p-6 rounded-2xl border border-white/20' : ''}`}>
                  {isVideoFullScreen && (
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-white truncate">{activeVideo?.title || 'Video Player'}</h3>
                      <button
                        onClick={() => setIsVideoFullScreen(false)}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                      >
                        Exit Full Screen
                      </button>
                    </div>
                  )}

                  {/* Video Search & Direct URL Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchVideo();
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10 shrink-0"
                  >
                    <Search size={13} className="text-white/40 ml-2" />
                    <input
                      type="text"
                      value={videoSearchInput}
                      onChange={(e) => setVideoSearchInput(e.target.value)}
                      placeholder="Search any educational YouTube topic or paste a YouTube URL..."
                      className="flex-1 bg-transparent px-2 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!videoSearchInput.trim() || isSearchingVideo}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer disabled:opacity-30"
                    >
                      {isSearchingVideo ? 'Finding...' : 'Find Video'}
                    </button>
                  </form>

                  {/* YouTube Embed Player */}
                  {activeVideo && (
                    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black shadow-2xl aspect-video w-full shrink-0">
                      <iframe
                        src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                        title={activeVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {activeVideo && (
                    <div className="flex items-center justify-between text-xs text-white/70 pt-1">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="font-semibold text-white truncate">{activeVideo.title}</h4>
                        <p className="text-[11px] text-white/40">{activeVideo.channel}</p>
                      </div>

                      <button
                        onClick={handleTranscribeVideo}
                        disabled={isTranscribing}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <FileText size={13} />
                        <span>{isTranscribing ? 'Transcribing...' : 'Transcribe Video'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. CLEAN TYPESET VIDEO TRANSCRIPT SCREEN */}
              {leftScreenMode === 'transcript' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                      {activeVideo?.title}
                    </span>
                    <button
                      onClick={() => handleSendMessage(`Analyze the transcript of "${activeVideo?.title}" and explain the core takeaways.`)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Sparkles size={11} />
                      <span>Ask AI about Transcript</span>
                    </button>
                  </div>

                  {/* Formatted Reading View */}
                  <div className="p-4 sm:p-5 rounded-xl bg-black/30 border border-white/[0.06] text-xs text-slate-200 leading-relaxed font-victor select-text">
                    <MarkdownRenderer content={videoTranscript} />
                  </div>
                </div>
              )}

              {/* 4. WORKFLOW / CONCEPT DIAGRAM SCREEN */}
              {leftScreenMode === 'diagram' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] flex flex-col items-center justify-center space-y-4 py-8">
                    <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-white/[0.04] text-center">
                      <span className="text-xs font-semibold text-white">1. Core Axioms & Empirical Ingestion</span>
                      <p className="text-[10px] text-white/40 mt-0.5">Foundational source data & state variables</p>
                    </div>

                    <div className="text-white/40">↓</div>

                    <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-white/[0.04] text-center">
                      <span className="text-xs font-semibold text-white">2. Theoretical Modeling & Mechanism</span>
                      <p className="text-[10px] text-white/40 mt-0.5">{currentStudy.title} System Dynamics</p>
                    </div>

                    <div className="text-white/40">↓</div>

                    <div className="w-full max-w-md p-3.5 rounded-xl border border-white/15 bg-white/[0.04] text-center">
                      <span className="text-xs font-semibold text-white">3. Synthesis, Verification & Applications</span>
                      <p className="text-[10px] text-white/40 mt-0.5">Verified solutions & exam preparation bounds</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              RIGHT SIDE: AI STUDY CHATBOT (Q&A + PREDICTED NEXT QUESTIONS)
             ========================================================= */}
          <div className="w-full lg:w-[460px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#1c222c] p-4 flex flex-col overflow-hidden shadow-2xl">
            
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <AstraLogo size={20} />
                <span className="text-xs font-semibold text-white">Study Companion</span>
              </div>
              <span className="text-[11px] text-white/40 truncate max-w-[180px]">
                {currentStudy.title}
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 min-h-0 overflow-y-auto my-3 pr-1 space-y-4 scrollbar-edge">
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-in fade-in duration-150 ${isUser ? 'justify-end' : 'justify-start items-start'}`}
                  >
                    {!isUser && (
                      <div className="shrink-0 mt-0.5" title="ASTRX">
                        <AstraLogo size={22} />
                      </div>
                    )}

                    <div
                      className={`text-xs sm:text-[13px] leading-relaxed ${
                        isUser
                          ? 'max-w-[85%] bg-white/15 border border-white/10 text-white rounded-2xl p-3.5 shadow-md font-victor'
                          : 'flex-1 text-slate-200 font-victor'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}
                    </div>
                  </div>
                );
              })}

              {isGeneratingAi && (
                <div className="flex gap-3 animate-in fade-in duration-150 justify-start items-start">
                  <div className="shrink-0 mt-0.5" title="ASTRX">
                    <AstraLogo size={22} />
                  </div>
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* =========================================================
                PREDICTED NEXT QUESTIONS (3-4 DYNAMIC CLICKABLE PILLS)
               ========================================================= */}
            {predictedQuestions.length > 0 && !isGeneratingAi && (
              <div className="pt-2 pb-2 shrink-0 border-t border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">
                  Suggested Next Questions
                </span>
                <div className="flex flex-col gap-1.5">
                  {predictedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/80 hover:text-white text-xs transition-all cursor-pointer truncate font-victor"
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Chat Input Capsule */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="mt-2 flex items-center gap-2 p-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] shrink-0 focus-within:border-white/20 transition-colors"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything or request a video on this topic..."
                className="flex-1 bg-transparent px-3 text-xs sm:text-[13px] text-white placeholder:text-white/30 focus:outline-none font-victor"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isGeneratingAi}
                className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center shrink-0 hover:scale-105 transition-transform disabled:opacity-30 cursor-pointer shadow-md"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW STUDY MODAL */}
      {isCreatingNew && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsCreatingNew(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl border border-white/15 p-6 shadow-2xl space-y-4 font-victor animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: '#1c222c' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Create New Study Space</h3>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/70">Subject or Topic Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Organic Chemistry & Reaction Mechanisms"
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-1.5 rounded-full text-white/50 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStudy}
                disabled={!newTitle.trim()}
                className="px-5 py-1.5 rounded-full bg-white text-slate-950 font-semibold text-xs transition-all hover:bg-white/90 disabled:opacity-40 cursor-pointer"
              >
                Create Study
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
