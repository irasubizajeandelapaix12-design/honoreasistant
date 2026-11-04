import React, { useState, useRef } from 'react';
import {
  Music,
  Image as ImageIcon,
  Video,
  Mic,
  MicOff,
  Play,
  Pause,
  Download,
  RotateCw,
  Sparkles,
  Upload,
  FileAudio,
  Copy,
  Check,
  Film,
  Send,
} from 'lucide-react';
import { generateMusic, generateImage, generateVideo, transcribeAudio } from '../services/api.js';

export function MediaStudio({ onSendToChat }: { onSendToChat?: (text: string) => void }) {
  const [activeTab, setActiveTab] = useState<'music' | 'image' | 'video' | 'transcribe'>('music');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Music State
  const [musicPrompt, setMusicPrompt] = useState('Epic cinematic orchestral soundtrack with soaring strings and brass');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);

  // Image State
  const [imagePrompt, setImagePrompt] = useState('Futuristic holographic AI core glowing inside a glass chamber, 8k, cinematic lighting');
  const [imageRatio, setImageRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [baseImageBase64, setBaseImageBase64] = useState<string | null>(null);

  // Video State
  const [videoPrompt, setVideoPrompt] = useState('A sleek spacecraft accelerates into hyperspace, streaking vibrant neon star trails across the void');
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoDuration, setVideoDuration] = useState<'5s' | '10s'>('5s');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoStartingFrame, setVideoStartingFrame] = useState<string | null>(null);

  // Audio Transcribe State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Generate Music (Lyria)
  const handleGenerateMusic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateMusic({
        prompt: musicPrompt,
        model: musicModel,
      });

      // Convert base64 to Blob URL
      const byteCharacters = atob(res.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: res.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);

      setGeneratedAudioUrl(url);
      setGeneratedLyrics(res.lyrics || null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate music');
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Image (Nano Banana 2.1)
  const handleGenerateImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateImage({
        prompt: imagePrompt,
        model: 'gemini-nano-banana-2.1',
        aspectRatio: imageRatio,
        baseImageBase64: baseImageBase64 || undefined,
      });
      setGeneratedImageUrl(res.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate Video (Omni Flash)
  const handleGenerateVideo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateVideo({
        prompt: videoPrompt,
        aspectRatio: videoRatio,
        duration: videoDuration,
        startingFrameBase64: videoStartingFrame || undefined,
      });
      setGeneratedVideoUrl(res.videoUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setLoading(false);
    }
  };

  // 4. Microphone Audio Recording & Transcribe (Gemini 3.5 Transcribe)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError('Microphone access denied: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribeRecorded = async () => {
    if (!recordedAudioBlob) return;
    setLoading(true);
    setError(null);
    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(recordedAudioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await transcribeAudio({
          audioBase64: base64Data,
          mimeType: recordedAudioBlob.type || 'audio/webm',
        });
        setTranscribedText(res.text);
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message || 'Transcription failed');
      setLoading(false);
    }
  };

  const handleFileUploadAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      setLoading(true);
      setError(null);
      try {
        const res = await transcribeAudio({
          audioBase64: base64Data,
          mimeType: file.type || 'audio/mp3',
        });
        setTranscribedText(res.text);
      } catch (err: any) {
        setError(err.message || 'Transcription failed');
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Studio Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Multimodal Media Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                AI Generation Suite
              </span>
            </h1>
            <p className="text-xs text-slate-400">Lyria Music · Nano Banana Image · Omni Flash Video · Transcribe</p>
          </div>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('music')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'music' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music (Lyria)</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'image' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image (Nano Banana)</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'video' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video (Omni Flash)</span>
          </button>
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'transcribe' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>Transcribe (3.5)</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* 1. MUSIC TAB (Lyria) */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">Music Generation Prompt</span>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setMusicModel('lyria-3-clip-preview')}
                    className={`px-2.5 py-1 rounded-md font-mono ${
                      musicModel === 'lyria-3-clip-preview'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    Lyria Clip (&le;30s)
                  </button>
                  <button
                    onClick={() => setMusicModel('lyria-3-pro-preview')}
                    className={`px-2.5 py-1 rounded-md font-mono ${
                      musicModel === 'lyria-3-pro-preview'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    Lyria Pro (Full Track)
                  </button>
                </div>
              </div>

              <textarea
                value={musicPrompt}
                onChange={e => setMusicPrompt(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                placeholder="Describe genre, tempo, instruments, mood, vocal style..."
              />

              {/* Quick Genre Chips */}
              <div className="flex flex-wrap gap-2 text-xs">
                {['Cinematic Orchestral', 'Cyberpunk Dystopia', 'Ambient Lofi Chill', 'Electronic Synthwave', 'Energetic Rock'].map(g => (
                  <button
                    key={g}
                    onClick={() => setMusicPrompt(prev => `${prev}, ${g.toLowerCase()}`)}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-purple-300 font-mono text-[11px] border border-slate-700/60"
                  >
                    + {g}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateMusic}
                disabled={loading || !musicPrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                <span>{loading ? 'Synthesizing with Lyria...' : 'Generate Music Track'}</span>
              </button>
            </div>

            {/* Generated Audio Player */}
            {generatedAudioUrl && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-400 flex items-center space-x-2">
                    <Music className="w-4 h-4" />
                    <span>Generated Audio Track (Lyria)</span>
                  </span>
                  <a
                    href={generatedAudioUrl}
                    download="generated-lyria-track.wav"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-200 flex items-center space-x-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download WAV</span>
                  </a>
                </div>
                <audio controls src={generatedAudioUrl} className="w-full rounded-lg" autoPlay />
                {generatedLyrics && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Generated Lyrics:</span>
                    <p className="whitespace-pre-line leading-relaxed">{generatedLyrics}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. IMAGE TAB (Nano Banana 2.1) */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">Image Generation & Editing</span>
                <span className="text-xs font-mono text-purple-300">Model: gemini-nano-banana-2.1 (1K)</span>
              </div>

              <textarea
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                placeholder="Describe visual scene, style, lighting, composition..."
              />

              {/* Aspect Ratio Selector */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-400">Aspect Ratio:</span>
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setImageRatio(ratio)}
                    className={`px-2.5 py-1 rounded-md ${
                      imageRatio === ratio
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {/* Optional Base Image Upload for Editing */}
              <div className="flex items-center space-x-3 text-xs">
                <label className="cursor-pointer px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{baseImageBase64 ? 'Change Source Image' : 'Upload Image to Edit (Optional)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        setBaseImageBase64(base64);
                      };
                    }}
                  />
                </label>
                {baseImageBase64 && (
                  <button
                    onClick={() => setBaseImageBase64(null)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear source
                  </button>
                )}
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={loading || !imagePrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                <span>{loading ? 'Synthesizing Image...' : 'Generate with Nano Banana'}</span>
              </button>
            </div>

            {/* Generated Image Preview */}
            {generatedImageUrl && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 text-center">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-400 flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>High-Resolution Generation</span>
                  </span>
                  <a
                    href={generatedImageUrl}
                    download="generated-image.png"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-200 flex items-center space-x-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </a>
                </div>
                <div className="max-w-xl mx-auto rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                  <img src={generatedImageUrl} alt="Generated AI" className="w-full h-auto object-contain" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. VIDEO TAB (Omni Flash) */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">Text-to-Video & Image Animation</span>
                <span className="text-xs font-mono text-purple-300">Model: gemini-omni-1.1-flash (Interactions API)</span>
              </div>

              <textarea
                value={videoPrompt}
                onChange={e => setVideoPrompt(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                placeholder="Describe cinematic scene motion, camera movement, speed, environment..."
              />

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Aspect Ratio:</span>
                  {(['16:9', '9:16'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setVideoRatio(r)}
                      className={`px-2.5 py-1 rounded-md ${
                        videoRatio === r
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Duration:</span>
                  {(['5s', '10s'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setVideoDuration(d)}
                      className={`px-2.5 py-1 rounded-md ${
                        videoDuration === d
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Starting Frame Upload */}
              <div className="flex items-center space-x-3 text-xs">
                <label className="cursor-pointer px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>{videoStartingFrame ? 'Starting Frame Loaded' : 'Upload Image to Animate (Optional)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        setVideoStartingFrame(base64);
                      };
                    }}
                  />
                </label>
                {videoStartingFrame && (
                  <button
                    onClick={() => setVideoStartingFrame(null)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear frame
                  </button>
                )}
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={loading || !videoPrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                <span>{loading ? 'Generating Video with Omni Flash...' : 'Render Video'}</span>
              </button>
            </div>

            {/* Generated Video Player */}
            {generatedVideoUrl && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-400 flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span>Rendered Video (gemini-omni-1.1-flash)</span>
                  </span>
                  <a
                    href={generatedVideoUrl}
                    download="generated-video.mp4"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-200 flex items-center space-x-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                </div>
                <div className="max-w-2xl mx-auto rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                  <video controls loop autoPlay src={generatedVideoUrl} className="w-full h-auto" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. AUDIO TRANSCRIBE TAB (Gemini 3.5 Transcribe) */}
        {activeTab === 'transcribe' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Audio Transcription Suite</h2>
                  <p className="text-xs text-slate-400">Model: gemini-3.5-transcribe · Live Microphone & Audio Files</p>
                </div>
              </div>

              {/* Microphone & File Upload Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Live Mic Card */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-xl ${
                      isRecording
                        ? 'bg-rose-500 animate-pulse text-white shadow-rose-500/30'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </button>
                  <span className="text-xs font-medium text-slate-300">
                    {isRecording ? 'Recording Live Audio (Click to Stop)' : 'Record Microphone Audio'}
                  </span>
                  {recordedAudioBlob && (
                    <button
                      onClick={handleTranscribeRecorded}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                    >
                      {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>Transcribe Recorded Audio</span>
                    </button>
                  )}
                </div>

                {/* Upload Pre-recorded Audio */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center">
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition-colors">
                      <FileAudio className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Upload Audio File</span>
                    <span className="text-[11px] text-slate-500">MP3, WAV, WebM, M4A up to 25MB</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={handleFileUploadAudio} />
                  </label>
                </div>
              </div>
            </div>

            {/* Transcription Result Output */}
            {transcribedText && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400">VERBATIM TRANSCRIPTION:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(transcribedText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Text'}</span>
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => onSendToChat(transcribedText)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-mono text-white flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-all">
                  {transcribedText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
