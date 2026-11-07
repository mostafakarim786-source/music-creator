import React, { useState } from 'react';
import { audioEngine } from '../audio/engine';
import { Cpu, Sparkles, Send, ArrowRight, Music, Disc, Sliders, Check, HelpCircle, Loader2 } from 'lucide-react';

interface ProducerThinkingStudioProps {
  onLoadPatternToSequencer: (pattern: any, bpm: number, swing: number, synthParams: any) => void;
  onSendPromptToLyria: (prompt: string) => void;
}

const SAMPLE_QUERIES = [
  {
    title: 'Mon Churi 1984 & South Asian 80s Disco',
    query: 'Analyze the 1980s South Asian disco revolution ("Mon Churi" / Bappi Lahiri / Biddu / Disco Deewane): How were LinnDrum 4-on-the-floor beats, Syndrum pitch dives, and Roland Jupiter-8 brass combined with soulful melodies? Give me a production blueprint and step matrix.',
  },
  {
    title: 'The Phil Collins SSL 4000E Gated Snare',
    query: 'Deconstruct the exact 1980s gated reverb snare drum signal chain (Hugh Padgham, Phil Collins, Peter Gabriel). How does the SSL Listen Mic Compressor and AMS RMX16/Lexicon 224 envelope gate achieve this iconic explosive cut? Provide an authentic 80s drum pattern.',
  },
  {
    title: 'Miami Vice & Jan Hammer Synthwave',
    query: 'What made Jan Hammer\'s Miami Vice soundtrack sound so effortlessly cool in 1984? Break down the LinnDrum programming, the rolling 16th-note analog bass, tape saturation, and DX7 FM bells.',
  },
  {
    title: 'Blue Monday & Oberheim DMX Machine',
    query: 'Explain how New Order programmed the Oberheim DMX drum machine on "Blue Monday" (1983). How does 50% straight mechanical quantization contrast with 80s funk swing?',
  },
];

export const ProducerThinkingStudio: React.FC<ProducerThinkingStudioProps> = ({
  onLoadPatternToSequencer,
  onSendPromptToLyria,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingOutput, setThinkingOutput] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPaidKeyError, setIsPaidKeyError] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleAskProducer = async (queryString: string) => {
    const activeQuery = queryString || query;
    if (!activeQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setIsPaidKeyError(false);
    setAppliedSuccess(false);

    try {
      const response = await fetch('/api/producer/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: activeQuery,
          currentBpm: audioEngine.getTempo(),
          currentPreset: 'Vintage Studio Session',
          currentNotes: audioEngine.getHeldNotes(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get analysis from Gemini 4 Argon');
      }

      setThinkingOutput(data.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error executing Gemini 4 Argon reasoning');
      if (err.message?.includes('API key') || err.message?.includes('403') || err.message?.includes('billing')) {
        setIsPaidKeyError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToStudio = () => {
    if (!thinkingOutput) return;

    const pattern = thinkingOutput.drumPattern;
    const bpm = thinkingOutput.recommendedBpm || 120;
    const swing = thinkingOutput.recommendedSwing || 52;

    const synthParams = {
      notes: thinkingOutput.synthChords || ['D3', 'F3', 'A3', 'C4'],
    };

    onLoadPatternToSequencer(pattern, bpm, swing, synthParams);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  return (
    <div className="bg-[#12141a] rounded-xl border border-neutral-800 p-4 md:p-6 shadow-2xl relative">
      {/* Studio Engineer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 led-glow-purple inline-block" />
            <h2 className="text-lg md:text-xl font-orbitron font-black text-neutral-200 tracking-wider">
              1980s MASTER PRODUCER <span className="text-purple-400">THINKING LAB</span>
            </h2>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40">
              POWERED BY GEMINI 4 ARGON • HIGH THINKING
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Deep musicological reasoning, vintage analog topology, LinnDrum/TR-808 rhythm formulation, and sound design.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-800/40 text-purple-300 text-xs font-mono">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>thinkingLevel: HIGH</span>
        </div>
      </div>

      {/* Suggested Complex Inquiries */}
      <div className="mb-4">
        <span className="text-xs font-bold text-neutral-400 block mb-2 uppercase tracking-wide">
          SELECT A CLASSIC 1980s DEEP PRODUCTION QUERY:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_QUERIES.map((sq) => (
            <button
              key={sq.title}
              onClick={() => {
                setQuery(sq.query);
                handleAskProducer(sq.query);
              }}
              className="text-left p-2.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-purple-600/50 transition group flex flex-col justify-between"
            >
              <div className="text-xs font-bold text-purple-300 group-hover:text-purple-200">
                {sq.title}
              </div>
              <div className="text-[10px] text-neutral-400 line-clamp-2 mt-1">
                {sq.query}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskProducer(query)}
            placeholder="Ask the Master 80s Producer anything (e.g. how to recreate 'Mon Churi' or mix an SSL gated snare)..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-xs md:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
        <button
          onClick={() => handleAskProducer(query)}
          disabled={isLoading || !query.trim()}
          className="px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs md:text-sm font-orbitron transition flex items-center gap-2 shadow-lg shadow-purple-950/50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>THINKING (HIGH)...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ANALYZE</span>
            </>
          )}
        </button>
      </div>

      {/* Error / Key Guidance Message */}
      {errorMsg && (
        <div className="p-4 mb-6 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
          <div className="font-bold flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-red-400" />
            <span>High Thinking Mode Notice</span>
          </div>
          <p>{errorMsg}</p>
          {isPaidKeyError && (
            <p className="mt-2 text-red-300">
              Note: <code>gemini-4-argon</code> with high reasoning requires an attached billing-enabled API Key in AI Studio Settings &gt; Secrets.
            </p>
          )}
        </div>
      )}

      {/* AI Producer Output Card */}
      {thinkingOutput && (
        <div className="bg-neutral-900/90 rounded-xl border border-purple-900/50 p-5 shadow-inner space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-neutral-200 font-orbitron">
                PRODUCER INSIGHT & REASONING DECONSTRUCTION
              </span>
            </div>

            {thinkingOutput.periodSongReference && (
              <span className="text-xs bg-purple-950 px-2.5 py-1 rounded-full text-purple-300 border border-purple-800 font-mono">
                Track Reference: {thinkingOutput.periodSongReference}
              </span>
            )}
          </div>

          {/* Deep Musicological Analysis */}
          <div className="bg-black/60 p-4 rounded-lg border border-neutral-800">
            <h4 className="text-xs font-bold text-purple-400 font-orbitron mb-2 uppercase tracking-wide">
              Deep Musicological & Studio Analysis:
            </h4>
            <p className="text-xs md:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {thinkingOutput.producerAnalysis}
            </p>
          </div>

          {/* Gear Advice & Synthesis Topologies */}
          {thinkingOutput.gearAdvice && (
            <div className="bg-black/60 p-4 rounded-lg border border-neutral-800">
              <h4 className="text-xs font-bold text-amber-400 font-orbitron mb-2 uppercase tracking-wide">
                Hardware & Sound Design Advice:
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {thinkingOutput.gearAdvice}
              </p>
            </div>
          )}

          {/* Recommended Parameters & Instant Apply Button */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-black/40 p-3 rounded-lg border border-neutral-800">
            <div>
              <span className="text-[10px] text-neutral-400 block font-mono">RECOMMENDED TEMPO</span>
              <span className="text-sm font-bold text-amber-400 font-orbitron">
                {thinkingOutput.recommendedBpm || 120} BPM
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block font-mono">PERIOD SHUFFLE / SWING</span>
              <span className="text-sm font-bold text-orange-400 font-orbitron">
                {thinkingOutput.recommendedSwing || 52}% Swing
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block font-mono">CHORDS / VOICINGS</span>
              <span className="text-xs font-bold text-cyan-400 font-mono truncate">
                {(thinkingOutput.synthChords || []).join(' • ') || 'D minor 80s'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {thinkingOutput.drumPattern && (
              <button
                onClick={handleApplyToStudio}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold font-orbitron transition flex items-center gap-2 border ${
                  appliedSuccess
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-300 led-glow-amber'
                }`}
              >
                {appliedSuccess ? <Check className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
                <span>{appliedSuccess ? 'APPLIED TO STUDIO DAW!' : 'APPLY THIS PATTERN TO DRUMS & SYNTH'}</span>
              </button>
            )}

            {thinkingOutput.lyriaPromptSuggestion && (
              <button
                onClick={() => onSendPromptToLyria(thinkingOutput.lyriaPromptSuggestion)}
                className="px-4 py-2.5 rounded-lg text-xs font-bold font-orbitron bg-pink-600 hover:bg-pink-500 text-white transition flex items-center gap-2 border border-pink-400"
              >
                <Sparkles className="w-4 h-4" />
                <span>GENERATE WITH LYRIA-3 &rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
