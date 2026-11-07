import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/engine';
import { Play, Square, Disc, Volume2, Sparkles, Sliders, Radio, Music, Cpu, Mic } from 'lucide-react';

interface ConsoleHeaderProps {
  activeTab: 'drums' | 'synth' | 'producer' | 'lyria' | 'tape';
  setActiveTab: (tab: 'drums' | 'synth' | 'producer' | 'lyria' | 'tape') => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  activeTab,
  setActiveTab,
  isPlaying,
  onTogglePlay,
}) => {
  const [bpm, setBpm] = useState(audioEngine.getTempo());
  const [swing, setSwing] = useState(audioEngine.getSwing());
  const [tapeWarmth, setTapeWarmth] = useState(0.7);
  const [gatedReverb, setGatedReverb] = useState(0.6);
  const [chorusMode, setChorusMode] = useState(2); // Roland Chorus II default
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Real-time retro LED VU meter
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = audioEngine.analyser ? audioEngine.analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const renderVU = () => {
      animFrameRef.current = requestAnimationFrame(renderVU);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (audioEngine.analyser && isPlaying) {
        audioEngine.analyser.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      // Calculate approximate RMS level for Left and Right channels
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        sum += dataArray[i];
      }
      const avg = sum / 32;
      const levelPercent = Math.min(1.0, avg / 180);

      // Draw twin analog LED VU bars (Left & Right)
      const bars = 18;
      const barWidth = (canvas.width - 24) / 2;
      const barHeight = 4;
      const spacing = 2;

      for (let ch = 0; ch < 2; ch++) {
        const startX = ch === 0 ? 8 : barWidth + 16;
        for (let b = 0; b < bars; b++) {
          const y = canvas.height - (b + 1) * (barHeight + spacing) - 4;
          const barThreshold = (b + 1) / bars;
          const isActive = levelPercent >= barThreshold * 0.95;

          // Color: Green -> Yellow/Amber -> Red for 80s clipping
          let color = '#1e293b'; // off
          if (isActive) {
            if (b < 11) color = '#22c55e'; // green
            else if (b < 15) color = '#f59e0b'; // amber
            else color = '#ef4444'; // red peak
          }

          ctx.fillStyle = color;
          ctx.fillRect(startX, y, barWidth, barHeight);
        }
      }
    };

    renderVU();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const handleBpmChange = (newBpm: number) => {
    const val = Math.max(60, Math.min(180, newBpm));
    setBpm(val);
    audioEngine.setTempo(val);
  };

  const handleSwingChange = (newSwing: number) => {
    setSwing(newSwing);
    audioEngine.setSwing(newSwing);
  };

  const handleTapeChange = (val: number) => {
    setTapeWarmth(val);
    audioEngine.setTapeWarmth(val);
  };

  const handleReverbChange = (val: number) => {
    setGatedReverb(val);
    audioEngine.setGatedReverb(val);
  };

  const handleChorusChange = (mode: number) => {
    setChorusMode(mode);
    audioEngine.updateChorusMode(mode);
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      audioEngine.unlockAudio();
      const ok = audioEngine.startRecording();
      if (ok) {
        setIsRecording(true);
        setRecordedUrl(null);
      }
    } else {
      try {
        const url = await audioEngine.stopRecording();
        setIsRecording(false);
        setRecordedUrl(url);
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };

  return (
    <header className="bg-gradient-to-b from-[#181a20] via-[#12141a] to-[#0c0d12] border-b border-amber-900/40 p-4 shadow-2xl relative">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Top Header Row: Branding + Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-950/50 border border-orange-400/40">
              <Disc className={`w-6 h-6 text-neutral-900 ${isPlaying ? 'animate-spin-tape' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black font-orbitron tracking-wider text-amber-400 crt-glow">
                  SYNTH-CHURI <span className="text-orange-500 font-extrabold">1984</span>
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                  Analog Studio DAW
                </span>
              </div>
              <p className="text-xs text-neutral-400 tracking-wide">
                Vintage LinnDrum & TR-808 • Roland Jupiter-8 / Juno • Phil Collins Gated Reverb • High-Thinking & Lyria AI
              </p>
            </div>
          </div>

          {/* Quick Stats & Tape Recording Status */}
          <div className="flex items-center gap-3">
            {recordedUrl && (
              <a
                href={recordedUrl}
                download="SynthChuri1984_TapeMaster.webm"
                className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/60"
              >
                <span>💾 Download Tape</span>
              </a>
            )}

            <button
              onClick={handleToggleRecord}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 border ${
                isRecording
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
              <span>{isRecording ? 'RECORDING TAPE...' : 'REC TO CASSETTE'}</span>
            </button>

            {/* Analog Clock / Status display */}
            <div className="bg-black/80 px-3 py-1.5 rounded border border-neutral-800 text-center font-vfd text-amber-500 text-base tracking-widest">
              <span>{isPlaying ? 'ROLLING TAPE' : 'STANDBY 1984'}</span>
            </div>
          </div>
        </div>

        {/* Console Controls: Transport, Tempo, Swing, Master FX Rack */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#15171e] p-3 rounded-xl border border-neutral-800 shadow-inner">
          {/* Main Transport (Play / Stop) */}
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className={`flex-1 py-3 px-4 rounded-lg font-bold font-orbitron text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 led-glow-amber'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-600/30'
              }`}
            >
              {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isPlaying ? 'PAUSE MASTER' : 'START TAPE'}</span>
            </button>

            {/* Twin VU Meter */}
            <div className="bg-black p-1.5 rounded-lg border border-neutral-800 shadow-inner flex flex-col items-center">
              <span className="text-[9px] text-neutral-500 font-bold font-vfd">VU L/R</span>
              <canvas ref={canvasRef} width={50} height={42} className="rounded" />
            </div>
          </div>

          {/* Tempo & 80s Swing / Shuffle */}
          <div className="md:col-span-4 flex items-center gap-4 bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800/80">
            {/* BPM */}
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-neutral-400 uppercase tracking-wider text-[11px]">TEMPO (BPM)</span>
                <span className="font-vfd text-amber-400 text-lg leading-none font-bold">{bpm}</span>
              </div>
              <input
                type="range"
                min="70"
                max="160"
                value={bpm}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-0.5">
                <span>70</span>
                <span>118 Disco</span>
                <span>160</span>
              </div>
            </div>

            {/* Swing */}
            <div className="flex-1 border-l border-neutral-800 pl-3">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-neutral-400 uppercase tracking-wider text-[11px]">80s SWING</span>
                <span className="font-vfd text-orange-400 text-lg leading-none font-bold">
                  {swing === 50 ? 'STR' : `${swing}%`}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="70"
                value={swing}
                onChange={(e) => handleSwingChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-0.5">
                <span>50%</span>
                <span>54% Groove</span>
                <span>66%</span>
              </div>
            </div>
          </div>

          {/* Analog Warmth & Period FX Rack */}
          <div className="md:col-span-5 grid grid-cols-3 gap-3 bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800/80">
            {/* Tape Saturation */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 mb-1">
                <span>TAPE WARMTH</span>
                <span className="font-mono text-amber-400">{Math.round(tapeWarmth * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={tapeWarmth}
                onChange={(e) => handleTapeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-neutral-500 block text-center mt-0.5">Ampex/Studer</span>
            </div>

            {/* Gated Reverb */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 mb-1">
                <span>GATED REVERB</span>
                <span className="font-mono text-orange-400">{Math.round(gatedReverb * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={gatedReverb}
                onChange={(e) => handleReverbChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-neutral-500 block text-center mt-0.5">SSL Listen Mic</span>
            </div>

            {/* Roland BBD Chorus */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 mb-1">
                <span>BBD CHORUS</span>
                <span className="font-mono text-cyan-400">{chorusMode === 0 ? 'OFF' : chorusMode === 1 ? 'I' : chorusMode === 2 ? 'II' : 'I+II'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleChorusChange(m)}
                    className={`text-[9px] font-bold py-1 rounded transition border ${
                      chorusMode === m
                        ? 'bg-cyan-500 text-black border-cyan-300 font-extrabold led-glow-cyan'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                    }`}
                  >
                    {m === 0 ? 'OFF' : m === 1 ? 'I' : m === 2 ? 'II' : 'I+II'}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-neutral-500 block text-center mt-0.5">Roland Juno</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs between DAW modules */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveTab('drums')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold font-orbitron transition flex items-center gap-2 border ${
              activeTab === 'drums'
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-950/40'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>1. DRUM SEQUENCER (LINN-808)</span>
          </button>

          <button
            onClick={() => setActiveTab('synth')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold font-orbitron transition flex items-center gap-2 border ${
              activeTab === 'synth'
                ? 'bg-orange-500 text-neutral-950 border-orange-400 shadow-md shadow-orange-950/40'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>2. JUPITER-8 SYNTH & KEYS</span>
          </button>

          <button
            onClick={() => setActiveTab('producer')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold font-orbitron transition flex items-center gap-2 border relative ${
              activeTab === 'producer'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/40'
                : 'bg-neutral-900 hover:bg-neutral-800 text-purple-300 border-purple-900/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>3. PRODUCER THINKING (GEMINI 4 ARGON)</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-purple-900/80 text-purple-200 rounded border border-purple-500/40 font-mono">
              HIGH THINKING
            </span>
          </button>

          <button
            onClick={() => setActiveTab('lyria')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold font-orbitron transition flex items-center gap-2 border ${
              activeTab === 'lyria'
                ? 'bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-950/40'
                : 'bg-neutral-900 hover:bg-neutral-800 text-pink-300 border-pink-900/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>4. LYRIA AI MUSIC GENERATOR</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-pink-900/80 text-pink-200 rounded border border-pink-500/40 font-mono">
              LYRIA-3
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tape')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold font-orbitron transition flex items-center gap-2 border ${
              activeTab === 'tape'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40'
                : 'bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border-emerald-900/50'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>5. CASSETTE DECK</span>
          </button>
        </div>
      </div>
    </header>
  );
};
