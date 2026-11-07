import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Disc, Play, Pause, Download, Music2, RefreshCw, AlertCircle, HelpCircle, FileText } from 'lucide-react';

interface LyriaMusicGeneratorProps {
  initialPrompt?: string;
}

const LYRIA_80S_PRESETS = [
  {
    title: 'Mon Churi 1984 (Bengali / Bollywood 80s Disco)',
    genre: 'South Asian 80s Disco',
    prompt: '1984 upbeat South Asian Bollywood disco anthem inspired by Bappi Lahiri and R.D. Burman, iconic LinnDrum four-on-the-floor beat, syncopated slap bass, sparkly DX7 electric piano, analog Jupiter-8 brass stabs, warm tape saturation, nostalgic infectious dance rhythm with Syndrum sweeps.',
  },
  {
    title: 'Miami Vice Neon Boulevard',
    genre: '1984 Synthwave Soundtrack',
    prompt: '1984 Miami nocturnal synthwave theme, Jan Hammer style, pounding gated reverb LinnDrum snare, arpeggiated Roland Juno-106 bassline, neon saxophone synth solo, warm analog chorus, moody cinematic nostalgia with Lexicon 224 reverb.',
  },
  {
    title: 'Blue Monday Electro Pop',
    genre: '1983 New Wave / Synth-Pop',
    prompt: '1983 iconic New Wave electro dance track inspired by Blue Monday, rapid Oberheim DMX machine-gun kick drum, robotic 16th-note synthesizer bassline, ethereal vocoder pad, icy digital reverb, hypnotic synthpop groove.',
  },
  {
    title: 'Quincy 1982 Pop-Funk Groove',
    genre: '80s Electro-Funk / Thriller',
    prompt: '1982 quintessential Quincy Jones pop funk production, bouncy LinnDrum backbeat with acoustic snare layered with clap, funky Minimoog walking bassline, lush Rhodes and DX7 chords, dry tight vintage mixing with subtle EMT plate.',
  },
  {
    title: 'Sweet Dreams Dark Synth',
    genre: '1983 European Synth-Pop',
    prompt: '1983 dark synth-pop anthem in the style of Eurythmics and Depeche Mode, relentless two-oscillator analog synth sequence, punchy gated snare on 2 and 4, eerie string machine pads, dramatic 1980s European synthwave production.',
  },
];

export const LyriaMusicGenerator: React.FC<LyriaMusicGeneratorProps> = ({ initialPrompt = '' }) => {
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [prompt, setPrompt] = useState(initialPrompt || LYRIA_80S_PRESETS[0].prompt);
  const [style, setStyle] = useState('80s Synthwave');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPaidKeyError, setIsPaidKeyError] = useState(false);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setIsPaidKeyError(false);
    setAudioUrl(null);
    setLyrics('');

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate audio track');
      }

      setAudioUrl(data.audioDataUrl);
      setLyrics(data.lyrics || '');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with Lyria music generation model');
      if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('API key') || err.message?.includes('billing')) {
        setIsPaidKeyError(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#12141a] rounded-xl border border-neutral-800 p-4 md:p-6 shadow-2xl relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500 led-glow-pink inline-block" />
            <h2 className="text-lg md:text-xl font-orbitron font-black text-neutral-200 tracking-wider">
              LYRIA AI MUSIC GENERATOR <span className="text-pink-400">LYRIA-3</span>
            </h2>
            <span className="text-[10px] font-mono text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded border border-pink-500/40">
              VINTAGE 80s AUDIO SYNTHESIS
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Generate authentic high-fidelity 1980s music tracks and clips using Google DeepMind Lyria models.
          </p>
        </div>

        {/* Model Selector Toggle */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => setModel('lyria-3-clip-preview')}
            className={`px-3 py-1.5 rounded text-xs font-bold font-orbitron transition ${
              model === 'lyria-3-clip-preview'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            CLIP (30s PREVIEW)
          </button>
          <button
            onClick={() => setModel('lyria-3-pro-preview')}
            className={`px-3 py-1.5 rounded text-xs font-bold font-orbitron transition ${
              model === 'lyria-3-pro-preview'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            PRO (FULL TRACK)
          </button>
        </div>
      </div>

      {/* Preset Style Selectors */}
      <div className="mb-4">
        <span className="text-xs font-bold text-neutral-400 block mb-2 uppercase tracking-wide">
          SELECT PERIOD 1980s MUSIC PROMPT TEMPLATE:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
          {LYRIA_80S_PRESETS.map((p) => (
            <button
              key={p.title}
              onClick={() => {
                setPrompt(p.prompt);
                setStyle(p.genre);
              }}
              className="text-left p-2.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-pink-500/50 transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-neutral-200 block truncate">{p.title}</span>
                <span className="text-[10px] text-pink-400 font-mono mt-0.5 block">{p.genre}</span>
              </div>
              <span className="text-[9px] text-neutral-500 line-clamp-2 mt-2">{p.prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Textarea & Generation Controls */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the 1980s music track you want to generate with vintage synthesizers and drum machines..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs md:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-pink-500 transition resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-bold">VINTAGE STYLE TAG:</span>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-pink-300 font-mono focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold font-orbitron text-xs md:text-sm transition flex items-center gap-2 shadow-lg shadow-pink-950/60"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>GENERATING VINTAGE 80s AUDIO...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>GENERATE WITH {model === 'lyria-3-clip-preview' ? 'LYRIA CLIP' : 'LYRIA PRO'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message & Billing Guidance */}
      {errorMsg && (
        <div className="p-4 mb-6 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
          <div className="font-bold flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>Lyria Generation Notice</span>
          </div>
          <p>{errorMsg}</p>
          {isPaidKeyError && (
            <p className="mt-2 text-red-300">
              Note: Lyria music models (<code>lyria-3-clip-preview</code> / <code>lyria-3-pro-preview</code>) require a paid tier Gemini API key in AI Studio. Check Settings &gt; Secrets.
            </p>
          )}
        </div>
      )}

      {/* Generated Audio Player Card */}
      {audioUrl && (
        <div className="bg-gradient-to-r from-neutral-900 via-[#18151f] to-neutral-900 rounded-xl border border-pink-900/60 p-5 shadow-inner space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-600/20 border border-pink-500/40 flex items-center justify-center">
                <Disc className={`w-6 h-6 text-pink-400 ${isPlaying ? 'animate-spin-tape' : ''}`} />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-200 font-orbitron block">
                  1980s MASTER TAPE GENERATED
                </span>
                <span className="text-[10px] text-pink-400 font-mono">
                  MODEL: {model} • 44.1kHz STEREO MP3
                </span>
              </div>
            </div>

            <a
              href={audioUrl}
              download="Lyria_1980s_Master_Track.mp3"
              className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center gap-1.5 border border-neutral-700 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP3</span>
            </a>
          </div>

          {/* Hidden native audio tag */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Custom Retro Audio Player Interface */}
          <div className="flex items-center gap-4 bg-black/60 p-3 rounded-lg border border-neutral-800">
            <button
              onClick={togglePlayAudio}
              className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-400 text-neutral-950 flex items-center justify-center font-bold transition shadow-lg shadow-pink-950/60"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Seekbar and Timer */}
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs font-mono text-neutral-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Lyrics / Liner Notes */}
          {lyrics && (
            <div className="bg-black/40 p-4 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 font-orbitron mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>GENERATED 80s LYRICS & LINER NOTES</span>
              </div>
              <p className="text-xs text-neutral-300 whitespace-pre-line leading-relaxed font-mono">
                {lyrics}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
