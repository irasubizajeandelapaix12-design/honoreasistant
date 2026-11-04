import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, Globe, Sparkles } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVoiceQuery: (transcript: string) => Promise<string>;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onSendVoiceQuery,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [language, setLanguage] = useState('en-US');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) recognitionRef.current.stop();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onend = async () => {
        setIsListening(false);
        if (transcript.trim()) {
          const userQuery = transcript.trim();
          setTranscript('');
          setIsAiSpeaking(true);

          try {
            const answer = await onSendVoiceQuery(userQuery);
            setAiReply(answer);

            // Read aloud with SpeechSynthesis
            if ('speechSynthesis' in window) {
              const cleanSpeech = answer.replace(/```[\s\S]*?```/g, 'Code omitted.').replace(/[#*_`]/g, '');
              const utterance = new SpeechSynthesisUtterance(cleanSpeech);
              utterance.lang = language;
              utterance.rate = 1.0;
              utterance.onend = () => {
                setIsAiSpeaking(false);
                // Restart listening after speaking
                try {
                  recognition.start();
                } catch (e) {}
              };
              utterance.onerror = () => setIsAiSpeaking(false);
              window.speechSynthesis.speak(utterance);
            }
          } catch (err) {
            console.error('Error handling voice query:', err);
            setIsAiSpeaking(false);
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.error('Recognition error:', e);
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (err) {}
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isOpen, language]);

  // Audio Canvas Waveform Animation
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const activeState = isListening || isAiSpeaking;
      const amplitude = activeState ? (isAiSpeaking ? 40 : 25) : 8;
      const frequency = activeState ? 0.04 : 0.02;

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isAiSpeaking ? '#818cf8' : isListening ? '#38bdf8' : '#475569';

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency + phase) * amplitude * Math.sin((x / width) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second harmonic wave
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isAiSpeaking ? '#c084fc' : isListening ? '#67e8f9' : '#334155';

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.cos(x * (frequency * 1.5) - phase) * (amplitude * 0.7) * Math.sin((x / width) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += activeState ? 0.08 : 0.03;
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, isListening, isAiSpeaking]);

  if (!isOpen) return null;

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950/95 text-white p-6 backdrop-blur-md">
      {/* Top Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/aether_ai_avatar_1793733456853.jpg"
            alt="Aether"
            className="w-8 h-8 rounded-lg ring-1 ring-slate-800"
          />
          <div>
            <span className="text-sm font-bold tracking-tight">Honore Assistant Voice Companion</span>
            <span className="block text-[11px] text-slate-400">Low-Latency Audio Channel</span>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-hidden"
            >
              <option value="en-US">English (US)</option>
              <option value="rw-RW">Kinyarwanda</option>
              <option value="fr-FR">Français (French)</option>
              <option value="sw-KE">Kiswahili</option>
              <option value="es-ES">Español (Spanish)</option>
              <option value="de-DE">Deutsch</option>
              <option value="ja-JP">日本語 (Japanese)</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Waveform & Transcript Area */}
      <div className="flex flex-col items-center justify-center max-w-2xl w-full text-center space-y-6">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          className="w-full max-w-lg h-36"
        />

        <div className="space-y-3 min-h-[100px]">
          {isAiSpeaking ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>Honore Assistant Speaking</span>
              </div>
              <p className="text-base text-slate-200 max-w-xl font-medium leading-relaxed">
                {aiReply || 'Thinking...'}
              </p>
            </div>
          ) : isListening ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-sky-400 font-semibold uppercase tracking-wider">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Listening... Speak Now</span>
              </div>
              <p className="text-base text-slate-200 max-w-xl italic">
                {transcript || 'Say your question or command...'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Tap the microphone to speak with Honore Assistant
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={toggleMic}
          className={`p-5 rounded-full shadow-lg transition-all transform hover:scale-105 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse ring-4 ring-red-500/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/20'
          }`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <span className="text-xs text-slate-500 font-mono">
          {isListening ? 'Click to finish speaking' : 'Click to talk'}
        </span>
      </div>
    </div>
  );
};
