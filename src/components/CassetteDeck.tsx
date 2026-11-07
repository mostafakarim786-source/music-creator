import React, { useState, useEffect } from 'react';
import { audioEngine } from '../audio/engine';
import { Disc, Download, Play, Square, Circle, Volume2, Sparkles } from 'lucide-react';

interface CassetteDeckProps {
  isPlaying: boolean;
}

export const CassetteDeck: React.FC<CassetteDeckProps> = ({ isPlaying }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [tapeType, setTapeType] = useState<'TYPE_I' | 'TYPE_II' | 'TYPE_IV'>('TYPE_II');
  const [dolbyNR, setDolbyNR] = useState<boolean>(true);
  const [tapeCounter, setTapeCounter] = useState<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying || isRecording) {
      interval = setInterval(() => {
        setTapeCounter((c) => (c + 1) % 9999);
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isRecording]);

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

  const handleResetCounter = () => {
    setTapeCounter(0);
  };

  const formatCounter = (num: number) => {
    return num.toString().padStart(4, '0');
  };

  return (
    <div className="bg-[#12141a] rounded-xl border border-neutral-800 p-4 md:p-6 shadow-2xl relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 led-glow-green inline-block" />
            <h2 className="text-lg md:text-xl font-orbitron font-black text-neutral-200 tracking-wider">
              ANALOG CASSETTE DECK <span className="text-emerald-400">STUDIO MASTER</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              DIRECT 2-TRACK LIVE RECORDING
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Capture your live vintage synthesizer & drum machine performance directly to an authentic cassette tape reel.
          </p>
        </div>

        {/* Counter & Dolby */}
        <div className="flex items-center gap-3">
          <div className="bg-black px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 font-mono">TAPE INDEX</span>
            <span className="font-vfd text-emerald-400 text-lg font-bold tracking-widest">
              {formatCounter(tapeCounter)}
            </span>
            <button
              onClick={handleResetCounter}
              className="text-[9px] px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded font-mono"
            >
              RESET
            </button>
          </div>

          <button
            onClick={() => setDolbyNR(!dolbyNR)}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition border ${
              dolbyNR
                ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800'
            }`}
          >
            DOLBY B-NR: {dolbyNR ? 'ENGAGED' : 'BYPASS'}
          </button>
        </div>
      </div>

      {/* Retro Cassette Graphic with Animated Reels */}
      <div className="bg-gradient-to-b from-[#2a2b33] via-[#1c1d24] to-[#121318] p-6 rounded-2xl border-4 border-[#3a3b45] max-w-2xl mx-auto shadow-2xl relative">
        {/* Cassette Label Header */}
        <div className="bg-[#c29b38] p-3 rounded-lg border-2 border-[#8c6f24] shadow-inner mb-4 flex items-center justify-between text-neutral-900">
          <div>
            <div className="font-black font-orbitron text-sm md:text-base tracking-wider uppercase">
              SYNTH-CHURI 1984 MASTER TAPE
            </div>
            <div className="text-[10px] font-mono tracking-tight font-semibold">
              HIGH BIAS 70µs EQ • 1980s ANALOG RECORDING
            </div>
          </div>
          <div className="bg-black/90 text-amber-400 px-3 py-1 rounded border border-amber-500/40 font-mono text-xs font-bold">
            SIDE A
          </div>
        </div>

        {/* Cassette Window with Twin Reels */}
        <div className="bg-[#0b0c10] p-4 rounded-xl border-2 border-neutral-700 flex items-center justify-between shadow-inner relative overflow-hidden">
          {/* Scanline overlay */}
          <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />

          {/* Left Reel */}
          <div className="flex flex-col items-center">
            <div
              className={`w-24 h-24 rounded-full border-4 border-amber-600/80 bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center relative shadow-lg ${
                isPlaying || isRecording ? 'animate-spin-tape' : ''
              }`}
            >
              {/* Spoke Teeth */}
              <div className="w-8 h-8 rounded-full bg-black border-2 border-amber-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="absolute w-20 h-1 bg-amber-500/40" />
              <div className="absolute w-1 h-20 bg-amber-500/40" />
            </div>
            <span className="text-[9px] text-neutral-400 font-mono mt-1">SUPPLY REEL</span>
          </div>

          {/* Center Tape Window & Window Measurement Lines */}
          <div className="flex-1 flex flex-col items-center px-4">
            <div className="w-full h-8 bg-neutral-950/80 rounded border border-neutral-800 flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-amber-700 via-amber-900 to-amber-700 opacity-60" />
            </div>
            <div className="flex justify-between w-full text-[8px] font-mono text-neutral-500 mt-1">
              <span>| 100</span>
              <span>| 50</span>
              <span>| 0</span>
            </div>
          </div>

          {/* Right Reel */}
          <div className="flex flex-col items-center">
            <div
              className={`w-24 h-24 rounded-full border-4 border-amber-600/80 bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center relative shadow-lg ${
                isPlaying || isRecording ? 'animate-spin-tape' : ''
              }`}
            >
              {/* Spoke Teeth */}
              <div className="w-8 h-8 rounded-full bg-black border-2 border-amber-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="absolute w-20 h-1 bg-amber-500/40" />
              <div className="absolute w-1 h-20 bg-amber-500/40" />
            </div>
            <span className="text-[9px] text-neutral-400 font-mono mt-1">TAKEUP REEL</span>
          </div>
        </div>

        {/* Cassette Tape Bias Selector */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-bold font-mono text-[11px]">FORMULATION:</span>
            {(['TYPE_I', 'TYPE_II', 'TYPE_IV'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTapeType(t)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition border ${
                  tapeType === t
                    ? 'bg-amber-500 text-black border-amber-300 font-extrabold'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {t === 'TYPE_I' ? 'NORMAL (Fe)' : t === 'TYPE_II' ? 'CHROME (CrO2)' : 'METAL (Type IV)'}
              </button>
            ))}
          </div>

          {/* Recording Trigger */}
          <button
            onClick={handleToggleRecord}
            className={`px-5 py-2 rounded-lg font-bold font-orbitron text-xs transition flex items-center gap-2 border shadow-lg ${
              isRecording
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-neutral-800 hover:bg-neutral-700 text-red-400 border-red-900/60'
            }`}
          >
            <Circle className={`w-3.5 h-3.5 ${isRecording ? 'fill-white' : 'fill-red-500 text-red-500'}`} />
            <span>{isRecording ? 'STOP RECORDING' : 'RECORD MASTER TAPE'}</span>
          </button>
        </div>

        {/* Download Link if recorded */}
        {recordedUrl && (
          <div className="mt-4 bg-emerald-950/60 p-3 rounded-lg border border-emerald-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-200">
                Performance recorded to 1980s Analog Tape!
              </span>
            </div>
            <a
              href={recordedUrl}
              download="SynthChuri1984_TapeRecording.webm"
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Audio File</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
