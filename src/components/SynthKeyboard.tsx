import React, { useState, useEffect } from 'react';
import { audioEngine, SynthParams, NOTE_FREQUENCIES } from '../audio/engine';
import { Music, Sliders, Waves, Activity, Zap } from 'lucide-react';

interface SynthKeyboardProps {
  currentStep: number;
}

// 2-Octave playable keyboard map
const KEYBOARD_KEYS = [
  { note: 'C3', key: 'a', isBlack: false },
  { note: 'C#3', key: 'w', isBlack: true },
  { note: 'D3', key: 's', isBlack: false },
  { note: 'D#3', key: 'e', isBlack: true },
  { note: 'E3', key: 'd', isBlack: false },
  { note: 'F3', key: 'f', isBlack: false },
  { note: 'F#3', key: 't', isBlack: true },
  { note: 'G3', key: 'g', isBlack: false },
  { note: 'G#3', key: 'y', isBlack: true },
  { note: 'A3', key: 'h', isBlack: false },
  { note: 'A#3', key: 'u', isBlack: true },
  { note: 'B3', key: 'j', isBlack: false },
  { note: 'C4', key: 'k', isBlack: false },
  { note: 'C#4', key: 'o', isBlack: true },
  { note: 'D4', key: 'l', isBlack: false },
  { note: 'D#4', key: 'p', isBlack: true },
  { note: 'E4', key: ';', isBlack: false },
  { note: 'F4', key: "'", isBlack: false },
];

export const SynthKeyboard: React.FC<SynthKeyboardProps> = ({ currentStep }) => {
  const [params, setParams] = useState<SynthParams>(audioEngine.getSynthParams());
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [heldChord, setHeldChord] = useState<string[]>(audioEngine.getHeldNotes());
  const [arpEnabled, setArpEnabled] = useState(true);
  const [arpMode, setArpMode] = useState<'UP' | 'DOWN' | 'UP_DOWN' | 'RANDOM'>('UP_DOWN');
  const [arpOctaves, setArpOctaves] = useState(2);
  const [octaveShift, setOctaveShift] = useState(0);

  // Keyboard events for playing notes with computer keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keyObj = KEYBOARD_KEYS.find((k) => k.key.toLowerCase() === e.key.toLowerCase());
      if (keyObj) {
        let note = keyObj.note;
        if (octaveShift !== 0) {
          const match = note.match(/^([A-G]#?)([0-9])$/);
          if (match) {
            note = `${match[1]}${parseInt(match[2]) + octaveShift}`;
          }
        }
        triggerNoteOn(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyObj = KEYBOARD_KEYS.find((k) => k.key.toLowerCase() === e.key.toLowerCase());
      if (keyObj) {
        let note = keyObj.note;
        if (octaveShift !== 0) {
          const match = note.match(/^([A-G]#?)([0-9])$/);
          if (match) {
            note = `${match[1]}${parseInt(match[2]) + octaveShift}`;
          }
        }
        triggerNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octaveShift]);

  const triggerNoteOn = (note: string) => {
    audioEngine.noteOn(note);
    setActiveNotes((prev) => new Set(prev).add(note));
  };

  const triggerNoteOff = (note: string) => {
    audioEngine.noteOff(note);
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  };

  const handleParamChange = (key: keyof SynthParams, value: any) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    audioEngine.setSynthParams({ [key]: value });
  };

  const handleArpChange = (enabled: boolean, mode: any, oct: number) => {
    setArpEnabled(enabled);
    setArpMode(mode);
    setArpOctaves(oct);
    audioEngine.setArpConfig(enabled, mode, oct);
  };

  const handleSelectChord = (chordNotes: string[]) => {
    setHeldChord(chordNotes);
    audioEngine.setHeldNotes(chordNotes);
  };

  // Famous 1980s Chord Progressions
  const PRESET_CHORDS = [
    { name: 'Mon Churi (D minor 80s Disco)', notes: ['D3', 'F3', 'A3', 'C4'] },
    { name: 'Miami Vice (A minor Neon)', notes: ['A2', 'C3', 'E3', 'G3'] },
    { name: 'Blue Monday (F minor Dark)', notes: ['F2', 'Ab2', 'C3', 'Eb3'] },
    { name: 'Thriller Funk (F# minor)', notes: ['F#2', 'A2', 'C#3', 'E3'] },
    { name: 'Sweet Dreams (C minor Eurythmics)', notes: ['C3', 'Eb3', 'G3', 'Ab3'] },
    { name: 'Blade Runner (Bb Maj9 Vangelis)', notes: ['Bb2', 'D3', 'F3', 'A3'] },
  ];

  return (
    <div className="bg-[#12141a] rounded-xl border border-neutral-800 p-4 md:p-6 shadow-2xl relative overflow-hidden">
      {/* Jupiter-8 Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 led-glow-amber inline-block" />
            <h2 className="text-lg md:text-xl font-orbitron font-black text-neutral-200 tracking-wider">
              ANALOG SYNTHESIZER <span className="text-orange-400">JP-8 / JUNO</span>
            </h2>
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              DUAL VCO • 24dB RESONANT LADDER • STEREO CHORUS
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Recreating the iconic analog warmth, unison detune, and 80s arpeggiated ostinatos.
          </p>
        </div>

        {/* Octave Shift Controls */}
        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
          <span className="text-xs text-neutral-400 font-bold">OCTAVE:</span>
          <button
            onClick={() => setOctaveShift((prev) => Math.max(-2, prev - 1))}
            className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs"
          >
            -1
          </button>
          <span className="font-vfd text-amber-400 text-base font-bold w-6 text-center">
            {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}
          </span>
          <button
            onClick={() => setOctaveShift((prev) => Math.min(2, prev + 1))}
            className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs"
          >
            +1
          </button>
        </div>
      </div>

      {/* Synth Controls Rack: VCO, Filter, Envelope, Arpeggiator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Module 1: Dual VCO (Oscillators) */}
        <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-400 font-orbitron flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5" />
                VCO OSCILLATOR
              </span>
              <span className="text-[9px] font-mono text-neutral-500">ANALOG ENGINE</span>
            </div>

            {/* Waveform Selector */}
            <div className="mb-3">
              <span className="text-[10px] text-neutral-400 block mb-1">WAVEFORM</span>
              <div className="grid grid-cols-3 gap-1">
                {(['sawtooth', 'square', 'triangle'] as OscillatorType[]).map((wave) => (
                  <button
                    key={wave}
                    onClick={() => handleParamChange('oscWave', wave)}
                    className={`text-[10px] font-bold py-1 rounded transition border ${
                      params.oscWave === wave
                        ? 'bg-orange-500 text-black border-orange-300 led-glow-amber'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                    }`}
                  >
                    {wave.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub Oscillator */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                <span>SUB-OSC (-1 OCT)</span>
                <span className="font-mono text-amber-400">{Math.round(params.subOsc * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.subOsc}
                onChange={(e) => handleParamChange('subOsc', Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Detune Cents (Analog Spread) */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                <span>DETUNE SPREAD</span>
                <span className="font-mono text-amber-400">{params.detune} Cents</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={params.detune}
                onChange={(e) => handleParamChange('detune', Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Module 2: 24dB Ladder Low-Pass Filter */}
        <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 font-orbitron flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                VCF FILTER
              </span>
              <span className="text-[9px] font-mono text-neutral-500">24dB/OCT</span>
            </div>

            {/* Cutoff */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                <span>CUTOFF FREQ</span>
                <span className="font-mono text-amber-400">{params.cutoff} Hz</span>
              </div>
              <input
                type="range"
                min="100"
                max="8000"
                step="50"
                value={params.cutoff}
                onChange={(e) => handleParamChange('cutoff', Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Resonance */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                <span>RESONANCE (Q)</span>
                <span className="font-mono text-amber-400">{params.resonance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="16"
                step="0.5"
                value={params.resonance}
                onChange={(e) => handleParamChange('resonance', Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Env Mod */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                <span>ENV MODULATION</span>
                <span className="font-mono text-amber-400">{Math.round(params.envMod * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.envMod}
                onChange={(e) => handleParamChange('envMod', Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Module 3: VCA Envelope (ADSR) */}
        <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-yellow-400 font-orbitron flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                VCA ADSR ENVELOPE
              </span>
              <span className="text-[9px] font-mono text-neutral-500">ANALOG CONTOUR</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Attack */}
              <div>
                <span className="text-[9px] text-neutral-400 block mb-1">A</span>
                <input
                  type="range"
                  min="0.005"
                  max="0.8"
                  step="0.01"
                  value={params.attack}
                  onChange={(e) => handleParamChange('attack', Number(e.target.value))}
                  className="h-20 w-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl] mx-auto"
                />
                <span className="text-[8px] text-neutral-500 block mt-1">{params.attack}s</span>
              </div>

              {/* Decay */}
              <div>
                <span className="text-[9px] text-neutral-400 block mb-1">D</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.5"
                  step="0.05"
                  value={params.decay}
                  onChange={(e) => handleParamChange('decay', Number(e.target.value))}
                  className="h-20 w-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl] mx-auto"
                />
                <span className="text-[8px] text-neutral-500 block mt-1">{params.decay}s</span>
              </div>

              {/* Sustain */}
              <div>
                <span className="text-[9px] text-neutral-400 block mb-1">S</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={params.sustain}
                  onChange={(e) => handleParamChange('sustain', Number(e.target.value))}
                  className="h-20 w-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl] mx-auto"
                />
                <span className="text-[8px] text-neutral-500 block mt-1">{Math.round(params.sustain * 100)}%</span>
              </div>

              {/* Release */}
              <div>
                <span className="text-[9px] text-neutral-400 block mb-1">R</span>
                <input
                  type="range"
                  min="0.05"
                  max="2.0"
                  step="0.05"
                  value={params.release}
                  onChange={(e) => handleParamChange('release', Number(e.target.value))}
                  className="h-20 w-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl] mx-auto"
                />
                <span className="text-[8px] text-neutral-500 block mt-1">{params.release}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 4: 80s Arpeggiator & Chord Synced Sequencer */}
        <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 font-orbitron flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                ARPEGGIATOR
              </span>
              <button
                onClick={() => handleArpChange(!arpEnabled, arpMode, arpOctaves)}
                className={`text-[9px] font-bold px-2 py-0.5 rounded transition ${
                  arpEnabled
                    ? 'bg-cyan-500 text-black led-glow-cyan'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {arpEnabled ? 'SYNC ON' : 'OFF'}
              </button>
            </div>

            {/* Arp Mode */}
            <div className="mb-2">
              <span className="text-[10px] text-neutral-400 block mb-1">MODE</span>
              <div className="grid grid-cols-2 gap-1">
                {(['UP', 'DOWN', 'UP_DOWN', 'RANDOM'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleArpChange(arpEnabled, m, arpOctaves)}
                    className={`text-[9px] font-bold py-1 rounded transition border ${
                      arpMode === m
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {m.replace('_', '/')}
                  </button>
                ))}
              </div>
            </div>

            {/* Octave Range */}
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1">RANGE</span>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3].map((oct) => (
                  <button
                    key={oct}
                    onClick={() => handleArpChange(arpEnabled, arpMode, oct)}
                    className={`text-[9px] font-bold py-1 rounded transition border ${
                      arpOctaves === oct
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {oct} OCT
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 80s Chord Progression Picker */}
      <div className="mb-6 bg-black/50 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-orange-400 font-orbitron tracking-wide">
            1980s ARPEGGIO CHORD SELECTOR:
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            ACTIVE NOTES: {heldChord.join(', ')}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PRESET_CHORDS.map((chord) => {
            const isMatch = chord.notes.join('') === heldChord.join('');
            return (
              <button
                key={chord.name}
                onClick={() => handleSelectChord(chord.notes)}
                className={`p-2 rounded-lg text-left text-xs font-bold transition border ${
                  isMatch
                    ? 'bg-orange-950/60 border-orange-500 text-orange-300 shadow-md shadow-orange-950/50'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="truncate">{chord.name}</div>
                <div className="text-[9px] text-neutral-500 font-mono mt-0.5">{chord.notes.join(' ')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 2-Octave Keyboard */}
      <div className="bg-[#0b0c10] p-4 rounded-xl border border-neutral-800 shadow-inner flex flex-col items-center">
        <div className="w-full flex justify-between items-center text-xs text-neutral-400 mb-3 px-1">
          <span>CLICK KEYS OR USE COMPUTER KEYBOARD (A, W, S, E, D, F, T, G, Y, H, U, J, K...)</span>
          <span className="font-mono text-amber-400">PLAY LIVE VINTAGE JUNO KEYS</span>
        </div>

        <div className="relative flex justify-center pb-2 select-none overflow-x-auto max-w-full">
          {KEYBOARD_KEYS.map((k) => {
            let noteName = k.note;
            if (octaveShift !== 0) {
              const match = noteName.match(/^([A-G]#?)([0-9])$/);
              if (match) {
                noteName = `${match[1]}${parseInt(match[2]) + octaveShift}`;
              }
            }
            const isPlayingThisNote = activeNotes.has(noteName) || heldChord.includes(noteName);

            if (k.isBlack) {
              return (
                <div
                  key={k.note}
                  onMouseDown={() => triggerNoteOn(noteName)}
                  onMouseUp={() => triggerNoteOff(noteName)}
                  onMouseLeave={() => triggerNoteOff(noteName)}
                  onTouchStart={() => triggerNoteOn(noteName)}
                  onTouchEnd={() => triggerNoteOff(noteName)}
                  className={`w-7 md:w-9 h-28 -mx-3.5 md:-mx-4.5 z-10 rounded-b-md cursor-pointer transition-all duration-75 flex flex-col justify-end items-center pb-2 border border-black shadow-lg ${
                    isPlayingThisNote
                      ? 'bg-orange-500 text-black shadow-orange-500/80 scale-[0.98]'
                      : 'bg-[#1b1c22] hover:bg-[#2b2d38] text-neutral-400'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase">{k.key}</span>
                  <span className="text-[8px] font-mono opacity-60">{noteName}</span>
                </div>
              );
            }

            return (
              <div
                key={k.note}
                onMouseDown={() => triggerNoteOn(noteName)}
                onMouseUp={() => triggerNoteOff(noteName)}
                onMouseLeave={() => triggerNoteOff(noteName)}
                onTouchStart={() => triggerNoteOn(noteName)}
                onTouchEnd={() => triggerNoteOff(noteName)}
                className={`w-10 md:w-12 h-44 rounded-b-lg cursor-pointer transition-all duration-75 flex flex-col justify-end items-center pb-2 border border-neutral-700 shadow-md ${
                  isPlayingThisNote
                    ? 'bg-amber-300 text-black shadow-amber-300/80 scale-[0.98]'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{k.key}</span>
                <span className="text-[9px] font-mono text-neutral-600 font-semibold">{noteName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
