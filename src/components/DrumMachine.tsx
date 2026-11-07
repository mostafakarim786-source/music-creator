import React, { useState, useEffect } from 'react';
import { audioEngine, DrumInstrument, DrumStepPattern } from '../audio/engine';
import { Volume2, VolumeX, Sparkles, RotateCcw, Play, Check } from 'lucide-react';

interface DrumMachineProps {
  currentStep: number;
}

const INSTRUMENT_LABELS: Record<DrumInstrument, { name: string; subtitle: string; color: string }> = {
  kick: { name: 'KICK DRUM', subtitle: 'Linn LM-1 / 808 Dive', color: 'border-red-500 text-red-400' },
  snare: { name: 'GATED SNARE', subtitle: 'SSL Listen Mic Reverb', color: 'border-orange-500 text-orange-400' },
  clap: { name: 'HAND CLAP', subtitle: 'TR-808 Triple Burst', color: 'border-amber-500 text-amber-400' },
  hihatC: { name: 'CLOSED HAT', subtitle: '6-Osc Metallic Bank', color: 'border-yellow-500 text-yellow-400' },
  hihatO: { name: 'OPEN HAT', subtitle: 'Sizzle Decay 380ms', color: 'border-lime-500 text-lime-400' },
  tom: { name: 'SIMMONS TOM', subtitle: 'SDS-V Pitch Dive Pew', color: 'border-cyan-500 text-cyan-400' },
  cowbell: { name: '80s COWBELL', subtitle: 'Dual Square Bandpass', color: 'border-purple-500 text-purple-400' },
};

export const DrumMachine: React.FC<DrumMachineProps> = ({ currentStep }) => {
  const [pattern, setPattern] = useState<DrumStepPattern>(audioEngine.getPattern());
  const [mutes, setMutes] = useState<Record<DrumInstrument, boolean>>({ ...audioEngine.trackMutes });
  const [volumes, setVolumes] = useState<Record<DrumInstrument, number>>({ ...audioEngine.trackVolumes });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mon-churi-disco');
  const [presets, setPresets] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/presets')
      .then((res) => res.json())
      .then((data) => {
        if (data.presets) {
          setPresets(data.presets);
        }
      })
      .catch((err) => console.error('Failed to load presets', err));
  }, []);

  const handleToggleStep = (inst: DrumInstrument, stepIdx: number) => {
    audioEngine.unlockAudio();
    audioEngine.toggleStep(inst, stepIdx);
    setPattern({ ...audioEngine.getPattern() });
  };

  const handleAudition = (inst: DrumInstrument) => {
    audioEngine.unlockAudio();
    audioEngine.playDrum(inst);
  };

  const handleToggleMute = (inst: DrumInstrument) => {
    const newMutes = { ...mutes, [inst]: !mutes[inst] };
    setMutes(newMutes);
    audioEngine.trackMutes[inst] = newMutes[inst];
  };

  const handleVolumeChange = (inst: DrumInstrument, val: number) => {
    const newVols = { ...volumes, [inst]: val };
    setVolumes(newVols);
    audioEngine.trackVolumes[inst] = val;
  };

  const handleLoadPreset = (preset: any) => {
    setSelectedPresetId(preset.id);
    audioEngine.setPattern(preset.drumPattern);
    setPattern(preset.drumPattern);
    if (preset.bpm) audioEngine.setTempo(preset.bpm);
    if (preset.swing) audioEngine.setSwing(preset.swing);
    if (preset.synthPreset) {
      audioEngine.setSynthParams(preset.synthPreset);
      if (preset.synthPreset.notes) {
        audioEngine.setHeldNotes(preset.synthPreset.notes);
      }
    }
  };

  const handleClear = () => {
    const empty: DrumStepPattern = {
      kick: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihatC: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihatO: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    audioEngine.setPattern(empty);
    setPattern(empty);
  };

  const handleRandomize = () => {
    const randomPattern: DrumStepPattern = {
      kick: Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : Math.random() > 0.75 ? 1 : 0)),
      snare: Array.from({ length: 16 }, (_, i) => (i === 4 || i === 12 ? 1 : Math.random() > 0.85 ? 1 : 0)),
      clap: Array.from({ length: 16 }, (_, i) => (i === 4 || i === 12 ? (Math.random() > 0.4 ? 1 : 0) : 0)),
      hihatC: Array.from({ length: 16 }, (_, i) => (Math.random() > 0.3 ? 1 : 0)),
      hihatO: Array.from({ length: 16 }, (_, i) => (i % 4 === 2 ? 1 : 0)),
      tom: Array.from({ length: 16 }, () => (Math.random() > 0.85 ? 1 : 0)),
      cowbell: Array.from({ length: 16 }, () => (Math.random() > 0.8 ? 1 : 0)),
    };
    audioEngine.setPattern(randomPattern);
    setPattern(randomPattern);
  };

  // 80s TR-808 color group for 16 steps
  const getStepColorClass = (stepIndex: number, isActive: boolean, isCurrent: boolean) => {
    // 4 blocks of 4 steps (Red, Orange, Yellow, Cream)
    const block = Math.floor(stepIndex / 4);

    if (isCurrent) {
      return 'bg-white text-black scale-105 border-white shadow-lg shadow-white/80 ring-2 ring-amber-400 font-extrabold';
    }

    if (isActive) {
      if (block === 0) return 'bg-red-500 text-white border-red-300 shadow-md shadow-red-900/60';
      if (block === 1) return 'bg-orange-500 text-white border-orange-300 shadow-md shadow-orange-900/60';
      if (block === 2) return 'bg-amber-400 text-neutral-950 border-amber-200 shadow-md shadow-amber-900/60 font-bold';
      return 'bg-slate-200 text-neutral-950 border-white shadow-md shadow-slate-900/60 font-bold';
    }

    // Inactive state with subtle block hue
    if (block === 0) return 'bg-[#241315] hover:bg-[#381a1d] text-red-500/50 border-red-950/80';
    if (block === 1) return 'bg-[#241a12] hover:bg-[#382618] text-orange-500/50 border-orange-950/80';
    if (block === 2) return 'bg-[#242112] hover:bg-[#383318] text-amber-500/50 border-amber-950/80';
    return 'bg-[#181a22] hover:bg-[#252834] text-slate-400/50 border-slate-900/80';
  };

  const instruments: DrumInstrument[] = ['kick', 'snare', 'clap', 'hihatC', 'hihatO', 'tom', 'cowbell'];

  return (
    <div className="bg-[#12141a] rounded-xl border border-neutral-800 p-4 md:p-6 shadow-2xl relative overflow-hidden">
      {/* 80s TR-808 Style Badge and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 led-glow-red inline-block" />
            <h2 className="text-lg md:text-xl font-orbitron font-black text-neutral-200 tracking-wider">
              RHYTHM COMPOSER <span className="text-amber-400">LM-808</span>
            </h2>
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              16-STEP ANALOG SEQUENCER
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Gated Reverb Snare, Deep 808 Kick, Simmons SDS-V Tom, and 1980s period-accurate shuffle grooves.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold transition flex items-center gap-1.5 border border-amber-900/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Randomize</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs font-bold transition flex items-center gap-1.5 border border-neutral-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Grid</span>
          </button>
        </div>
      </div>

      {/* Period Rhythmic Presets Bar */}
      <div className="mb-6 bg-black/60 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-400 font-orbitron tracking-wide">
            PERIOD-ACCURATE 1980s RHYTHM PRESETS:
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">1-CLICK INSTANT GROOVE LOAD</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className={`p-2.5 rounded-lg text-left transition border relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/60'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200 line-clamp-1">{preset.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono block mt-0.5">
                    {preset.bpm} BPM • {preset.swing}% Swing
                  </span>
                </div>
                <p className="text-[9px] text-neutral-400 line-clamp-2 mt-1.5">{preset.artistInspiration}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 16-Step Sequencer Grid */}
      <div className="space-y-3 overflow-x-auto pb-2">
        {/* Step Numbers & LED Runner Row */}
        <div className="grid grid-cols-16 gap-1 min-w-[700px] ml-44 pr-2">
          {Array.from({ length: 16 }).map((_, stepIdx) => {
            const isCurrent = currentStep === stepIdx;
            const isDownbeat = stepIdx % 4 === 0;
            return (
              <div key={stepIdx} className="flex flex-col items-center">
                {/* Active LED light */}
                <div
                  className={`w-2.5 h-2.5 rounded-full mb-1 transition-all duration-75 ${
                    isCurrent
                      ? 'bg-amber-400 led-glow-amber scale-125'
                      : 'bg-neutral-800 border border-neutral-700'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono ${
                    isDownbeat ? 'text-amber-400 font-bold' : 'text-neutral-500'
                  }`}
                >
                  {stepIdx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Instruments Rows */}
        {instruments.map((inst) => {
          const info = INSTRUMENT_LABELS[inst];
          const isMuted = mutes[inst];
          const vol = volumes[inst];

          return (
            <div key={inst} className="flex items-center gap-2 min-w-[700px] bg-neutral-900/60 p-1.5 rounded-lg border border-neutral-800/80">
              {/* Instrument Control Header */}
              <div className="w-40 flex items-center justify-between pr-2 border-r border-neutral-800">
                <div className="flex-1 cursor-pointer" onClick={() => handleAudition(inst)}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-orbitron tracking-wide text-neutral-200 hover:text-amber-400 transition">
                      {info.name}
                    </span>
                  </div>
                  <span className="text-[9px] text-neutral-500 block truncate">{info.subtitle}</span>
                </div>

                {/* Mute Button */}
                <button
                  onClick={() => handleToggleMute(inst)}
                  className={`p-1 rounded text-[10px] transition font-bold ${
                    isMuted ? 'bg-red-950 text-red-400 border border-red-800' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* 16 Step Buttons */}
              <div className="grid grid-cols-16 gap-1 flex-1">
                {pattern[inst]?.map((stepVal, stepIdx) => {
                  const isActive = stepVal === 1;
                  const isCurrent = currentStep === stepIdx;
                  const colorClass = getStepColorClass(stepIdx, isActive, isCurrent);

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => handleToggleStep(inst, stepIdx)}
                      className={`h-11 rounded flex items-center justify-center text-xs transition border cursor-pointer ${colorClass}`}
                      title={`${info.name} Step ${stepIdx + 1}`}
                    >
                      {isActive && <div className="w-2 h-2 rounded-full bg-current" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Retro Footnote Bar */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500" /> Beat 1
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-orange-500" /> Beat 2 (Backbeat)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-400" /> Beat 3
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-slate-200" /> Beat 4 (Backbeat)
          </span>
        </div>
        <span className="text-neutral-500 font-mono">
          TR-808 / LINNDRUM ARCHITECTURE • LOOKAHEAD SCHEDULER
        </span>
      </div>
    </div>
  );
};
