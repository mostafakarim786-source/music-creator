import React, { useState, useEffect } from 'react';
import { audioEngine } from './audio/engine';
import { ConsoleHeader } from './components/ConsoleHeader';
import { DrumMachine } from './components/DrumMachine';
import { SynthKeyboard } from './components/SynthKeyboard';
import { ProducerThinkingStudio } from './components/ProducerThinkingStudio';
import { LyriaMusicGenerator } from './components/LyriaMusicGenerator';
import { CassetteDeck } from './components/CassetteDeck';
import { Radio, Music, Cpu, Sparkles, Disc, Sliders, Volume2 } from 'lucide-react';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'drums' | 'synth' | 'producer' | 'lyria' | 'tape'>('drums');
  const [lyriaDraftPrompt, setLyriaDraftPrompt] = useState<string>('');

  useEffect(() => {
    // Listen to real-time Web Audio step sequencer clock
    audioEngine.onStep((step) => {
      setCurrentStep(step);
    });

    return () => {
      audioEngine.stop();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.start();
      setIsPlaying(true);
    }
  };

  const handleLoadPatternFromProducer = (pattern: any, bpm: number, swing: number, synthParams: any) => {
    if (pattern) audioEngine.setPattern(pattern);
    if (bpm) audioEngine.setTempo(bpm);
    if (swing) audioEngine.setSwing(swing);
    if (synthParams?.notes) audioEngine.setHeldNotes(synthParams.notes);
    // Switch to drum machine tab to let user see and hear the new groove
    setActiveTab('drums');
  };

  const handleSendPromptToLyria = (prompt: string) => {
    setLyriaDraftPrompt(prompt);
    setActiveTab('lyria');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Wood-grained Side Cheeks Studio Wrapper */}
      <div className="flex-1 flex flex-row w-full justify-center">
        {/* Left Wood Cheek (Analog Studio Chassis) */}
        <div className="hidden lg:block w-7 wood-panel border-r border-black/80 shadow-2xl flex-shrink-0" />

        {/* Central Studio Workstation Chassis */}
        <main className="flex-1 max-w-7xl flex flex-col min-w-0 bg-[#0e1017]">
          {/* Top Console Bar (Master Transport, Tempo, Swing, Saturation, Chorus) */}
          <ConsoleHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
          />

          {/* Active Workstation Module Area */}
          <div className="p-4 md:p-6 flex-1">
            {activeTab === 'drums' && (
              <DrumMachine currentStep={currentStep} />
            )}

            {activeTab === 'synth' && (
              <SynthKeyboard currentStep={currentStep} />
            )}

            {activeTab === 'producer' && (
              <ProducerThinkingStudio
                onLoadPatternToSequencer={handleLoadPatternFromProducer}
                onSendPromptToLyria={handleSendPromptToLyria}
              />
            )}

            {activeTab === 'lyria' && (
              <LyriaMusicGenerator initialPrompt={lyriaDraftPrompt} />
            )}

            {activeTab === 'tape' && (
              <CassetteDeck isPlaying={isPlaying} />
            )}
          </div>

          {/* Bottom Period Aesthetic Footer */}
          <footer className="bg-[#0b0c12] border-t border-neutral-800/80 p-4 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-orbitron font-bold text-amber-500">SYNTH-CHURI 1984</span>
              <span className="text-neutral-500 font-mono">
                1980s Vintage Synthesizer & Drum Machine Studio
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 led-glow-green" />
                WEB AUDIO DSP
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 led-glow-purple" />
                GEMINI 4 ARGON (HIGH THINKING)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 led-glow-pink" />
                LYRIA-3 (MUSIC GEN)
              </span>
            </div>
          </footer>
        </main>

        {/* Right Wood Cheek */}
        <div className="hidden lg:block w-7 wood-panel border-l border-black/80 shadow-2xl flex-shrink-0" />
      </div>
    </div>
  );
}
