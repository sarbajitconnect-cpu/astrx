import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles, ArrowUp } from 'lucide-react';

export default function VoiceModal({
  isOpen,
  onClose,
  onSubmitPrompt,
  selectedModel
}) {
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [sampleIndex, setSampleIndex] = useState(0);

  const samplePrompts = [
    "What are the physical limits of space travel?",
    "Explain the concept of quantum superpositions in simple terms.",
    "Draft an outline for a fast-paced science fiction thriller.",
    "Summarize the latest breakthroughs in neural state space models."
  ];

  useEffect(() => {
    let interval;
    if (isOpen && isListening) {
      setTranscript('');
      const targetText = samplePrompts[sampleIndex % samplePrompts.length];
      let currentLength = 0;
      
      interval = setInterval(() => {
        if (currentLength <= targetText.length) {
          setTranscript(targetText.slice(0, currentLength));
          currentLength += 1;
        } else {
          clearInterval(interval);
        }
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isOpen, isListening, sampleIndex]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (transcript.trim()) {
      onSubmitPrompt(transcript);
      onClose();
    }
  };

  const handleCycleSample = () => {
    setSampleIndex(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-[32px] p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col items-center text-center animate-in zoom-in-95 duration-200 select-none"
        style={{
          background: 'rgba(18, 22, 30, 0.60)',
          backdropFilter: 'blur(36px) saturate(160%)',
          WebkitBackdropFilter: 'blur(36px) saturate(160%)',
          border: 'none',
          boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Model Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-victor text-amber-200/90 mb-5">
          <Sparkles size={12} className="text-amber-400 animate-pulse" />
          <span>{selectedModel.name} Voice Engine</span>
        </div>

        {/* Center Animated Waveform / Orbital Sphere */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-amber-300/30 flex items-center justify-center relative">
            {/* Pulsing rings */}
            <div className={`absolute inset-0 rounded-full border border-amber-400/40 ${isListening ? 'animate-ping duration-1000 opacity-40' : ''}`} />
            <div className={`absolute -inset-3 rounded-full border border-white/10 ${isListening ? 'animate-pulse' : ''}`} />
            
            {/* Core Mic Button */}
            <button
              onClick={() => setIsListening(!isListening)}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                isListening 
                  ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-slate-950 shadow-amber-500/30 scale-105' 
                  : 'bg-white/10 text-white/50 hover:text-white hover:bg-white/20'
              }`}
            >
              {isListening ? <Mic size={30} /> : <MicOff size={30} />}
            </button>
          </div>
        </div>

        {/* Dynamic Equalizer Wave Bars */}
        <div className="flex items-center justify-center gap-1.5 h-10 my-3">
          {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50, 85, 30].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isListening ? 'bg-amber-300/80 animate-pulse' : 'bg-white/20'
              }`}
              style={{
                height: isListening ? `${height}%` : '20%',
                animationDelay: `${i * 0.08}s`
              }}
            />
          ))}
        </div>

        {/* Live Transcript Display */}
        <div className="w-full min-h-[72px] bg-white/[0.04] border border-white/[0.06] rounded-[20px] p-4 my-3 text-left">
          <p className="text-xs sm:text-sm font-victor text-white/90 leading-relaxed">
            {transcript ? (
              <span>"{transcript}"<span className="inline-block w-1.5 h-4 bg-amber-400 ml-1 animate-pulse" /></span>
            ) : (
              <span className="text-white/40 italic">Listening for voice query...</span>
            )}
          </p>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between w-full mt-2 gap-3">
          <button
            onClick={handleCycleSample}
            className="text-xs font-victor text-white/40 hover:text-amber-200 underline underline-offset-4 cursor-pointer transition-colors"
          >
            Try another example
          </button>

          <button
            onClick={handleSend}
            disabled={!transcript.trim()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] font-victor text-xs font-semibold transition-all cursor-pointer ${
              transcript.trim()
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/20 hover:scale-[1.02]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <span>Ask ASTRX</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
