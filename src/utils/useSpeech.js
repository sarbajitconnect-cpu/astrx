import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition(onResult) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const baseTextRef = useRef('');
  const finalTranscriptRef = useRef('');
  const isListeningRef = useRef(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Sync ref with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return;

    let recognition = null;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + transcript.trim();
          } else {
            interim += transcript;
          }
        }

        const totalSpoken = (finalTranscriptRef.current + (interim ? ' ' + interim.trim() : '')).trim();
        if (totalSpoken && onResultRef.current) {
          const prefix = baseTextRef.current ? `${baseTextRef.current.trim()} ` : '';
          onResultRef.current(prefix + totalSpoken);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.onend = () => {
        // If user is still supposed to be listening, attempt graceful restart
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition initialization error:', e);
    }

    return () => {
      if (recognition) {
        try {
          recognition.abort();
          recognition.stop();
        } catch {}
      }
    };
  }, []);

  const toggleListening = useCallback((currentInput = '') => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Safari.');
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch {}
    } else {
      baseTextRef.current = typeof currentInput === 'string' ? currentInput : '';
      finalTranscriptRef.current = '';
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  }, []);

  return { isListening, toggleListening };
}
