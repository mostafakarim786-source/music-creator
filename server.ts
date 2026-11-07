import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side GoogleGenAI initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Built-in authentic 1980s period patterns & sound design presets
const PERIOD_PRESETS = [
  {
    id: 'mon-churi-disco',
    title: 'Mon Churi 1984 (Bengali / Bollywood 80s Disco)',
    artistInspiration: 'Bappi Lahiri, R.D. Burman & Nazia Hassan (Disco Deewane era)',
    bpm: 122,
    swing: 54,
    description: 'Energetic 1980s South Asian disco groove featuring four-on-the-floor kick, Syndrum octave sweeps, clap on 2 & 4, pulsating Minimoog bass, and bright Jupiter-8 brass stabs.',
    drumPattern: {
      kick:     [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap:     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hihatC:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      hihatO:   [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      tom:      [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      cowbell:  [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    },
    synthPreset: {
      name: 'Bappi Brass & Punch',
      oscWave: 'sawtooth',
      subOsc: 0.6,
      cutoff: 2800,
      resonance: 5.5,
      attack: 0.02,
      decay: 0.35,
      sustain: 0.5,
      release: 0.3,
      chorusMode: 2,
      tapeWarmth: 0.7,
      gatedReverb: 0.55,
      notes: ['D3', 'F3', 'A3', 'C4'],
    },
    lyriaPrompt: '1984 upbeat South Asian Bollywood disco anthem inspired by Bappi Lahiri, iconic LinnDrum four-on-the-floor beat, syncopated slap bass, sparkly DX7 bells, analog Jupiter-8 brass stabs, warm tape saturation, nostalgic infectious dance rhythm.'
  },
  {
    id: 'miami-vice',
    title: 'Miami Vice / Synthwave Pulse (1984)',
    artistInspiration: 'Jan Hammer, Harold Faltermeyer, Tangerine Dream',
    bpm: 116,
    swing: 50,
    description: 'Iconic driving 80s soundtrack rhythm with heavy gated LinnDrum snare, rolling 16th-note analog bassline, and lush Roland chorus pads.',
    drumPattern: {
      kick:     [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      snare:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap:     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihatC:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      hihatO:   [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      tom:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      cowbell:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    },
    synthPreset: {
      name: 'Jan Hammer Lead Pad',
      oscWave: 'square',
      subOsc: 0.8,
      cutoff: 1900,
      resonance: 6.2,
      attack: 0.04,
      decay: 0.6,
      sustain: 0.4,
      release: 0.8,
      chorusMode: 2,
      tapeWarmth: 0.85,
      gatedReverb: 0.8,
      notes: ['A2', 'C3', 'E3', 'G3'],
    },
    lyriaPrompt: '1984 Miami nocturnal synthwave theme, Jan Hammer style, pounding gated reverb LinnDrum snare, arpeggiated Roland Juno-106 bassline, neon saxophone synth solo, warm analog chorus, moody cinematic nostalgia.'
  },
  {
    id: 'blue-monday',
    title: 'Blue Monday Electro (1983)',
    artistInspiration: 'New Order, Arthur Baker, Giorgio Moroder',
    bpm: 130,
    swing: 50,
    description: 'Legendary Oberheim DMX staccato kick burst, relentless 16th-note hi-hat pulse, and biting Prophet-5 sequencer lines.',
    drumPattern: {
      kick:     [1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1],
      snare:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap:     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
      hihatC:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      hihatO:   [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      tom:      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
      cowbell:  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    },
    synthPreset: {
      name: 'Manchester DMX Bass',
      oscWave: 'sawtooth',
      subOsc: 0.9,
      cutoff: 1400,
      resonance: 7.0,
      attack: 0.005,
      decay: 0.22,
      sustain: 0.2,
      release: 0.15,
      chorusMode: 1,
      tapeWarmth: 0.75,
      gatedReverb: 0.4,
      notes: ['F2', 'F2', 'C3', 'D#3'],
    },
    lyriaPrompt: '1983 iconic New Wave electro dance track inspired by Blue Monday, rapid Oberheim DMX machine-gun kick drum, robotic 16th-note synthesizer bassline, ethereal vocoder pad, icy digital reverb, hypnotic synthpop groove.'
  },
  {
    id: 'billie-groove',
    title: 'Thriller / Pop Funk (1982)',
    artistInspiration: 'Michael Jackson, Quincy Jones, Leon Sylvers III',
    bpm: 117,
    swing: 62,
    description: 'Tight rhythm with classic TR-808/LM-1 syncopation, shaker-like hi-hats, iconic snare backbeat with tape slapback, and funky Yamaha DX7 electric piano.',
    drumPattern: {
      kick:     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap:     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihatC:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      hihatO:   [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      tom:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
      cowbell:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    },
    synthPreset: {
      name: 'Quincy Funk Bass & EP',
      oscWave: 'triangle',
      subOsc: 0.7,
      cutoff: 2200,
      resonance: 4.0,
      attack: 0.01,
      decay: 0.4,
      sustain: 0.3,
      release: 0.25,
      chorusMode: 2,
      tapeWarmth: 0.65,
      gatedReverb: 0.5,
      notes: ['F#2', 'C#3', 'E3', 'G#3'],
    },
    lyriaPrompt: '1982 quintessential Quincy Jones pop funk production, bouncy LinnDrum backbeat with acoustic snare layered with clap, funky Minimoog walking bassline, lush Rhodes and DX7 chords, dry tight vintage mixing with subtle EMT plate.'
  },
  {
    id: 'sweet-dreams',
    title: 'Sweet Dreams / Dark Eurythmics (1983)',
    artistInspiration: 'Eurythmics, Depeche Mode, Yazoo',
    bpm: 125,
    swing: 50,
    description: 'Chugging Movement MCS2/Roland CS-01 two-note arpeggiated bass, mechanical hi-hats, gated metallic snare, and haunting icy analog lead.',
    drumPattern: {
      kick:     [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap:     [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihatC:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      hihatO:   [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      tom:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
      cowbell:  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    },
    synthPreset: {
      name: 'Dark Chug Bass',
      oscWave: 'sawtooth',
      subOsc: 0.8,
      cutoff: 1600,
      resonance: 8.0,
      attack: 0.005,
      decay: 0.18,
      sustain: 0.1,
      release: 0.1,
      chorusMode: 1,
      tapeWarmth: 0.9,
      gatedReverb: 0.7,
      notes: ['C3', 'Eb3', 'G3', 'Ab3'],
    },
    lyriaPrompt: '1983 dark synth-pop anthem in the style of Eurythmics and Depeche Mode, relentless two-oscillator analog synth sequence, punchy gated snare on 2 and 4, eerie string machine pads, dramatic 1980s European synthwave production.'
  }
];

// Presets API
app.get('/api/presets', (req, res) => {
  res.json({ presets: PERIOD_PRESETS });
});

// Lyria AI Music Generation endpoint (lyria-3-clip-preview & lyria-3-pro-preview)
app.post('/api/music/generate', async (req, res) => {
  try {
    const { prompt, model = 'lyria-3-clip-preview', style = '80s Synthwave' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const selectedModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    // Enhance prompt with authentic 1980s studio gear vocabulary if not already present
    const enhancedPrompt = `${prompt}. Authentic 1980s production aesthetic: vintage LinnDrum & Roland TR-808 drum machines, gated reverb snare, Roland Jupiter-8 analog synthesizers, Yamaha DX7 FM bells, Minimoog bass, warm analog tape saturation, 1980s stereo chorus. Style: ${style}.`;

    console.log(`[Lyria Music Generation] Requesting model ${selectedModel} with prompt: ${enhancedPrompt}`);

    const response = await ai.models.generateContentStream({
      model: selectedModel,
      contents: enhancedPrompt,
    });

    const audioChunks: Buffer[] = [];
    let lyrics = '';
    let mimeType = 'audio/mpeg';

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (audioChunks.length === 0 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
        }
        if (part.text) {
          lyrics += part.text;
        }
      }
    }

    if (audioChunks.length === 0) {
      return res.status(502).json({
        error: 'No audio data received from Lyria model. Check your API key and quota.',
      });
    }

    const audioBase64 = Buffer.concat(audioChunks).toString('base64');
    const audioDataUrl = `data:${mimeType};base64,${audioBase64}`;

    res.json({
      success: true,
      audioDataUrl,
      lyrics: lyrics.trim(),
      model: selectedModel,
      prompt,
      mimeType,
    });
  } catch (error: any) {
    console.error('[Lyria Music Generation Error]:', error);
    const errorMessage = error?.message || 'Failed to generate music with Lyria';
    const isPaidKeyError =
      errorMessage.includes('403') ||
      errorMessage.includes('PERMISSION_DENIED') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('API key');

    res.status(500).json({
      success: false,
      error: errorMessage,
      isPaidKeyError,
      suggestion: isPaidKeyError
        ? 'Lyria requires a paid tier Gemini API Key. Please verify or configure your key in Settings > Secrets.'
        : undefined,
    });
  }
});

// Gemini 4 Argon High-Thinking 1980s Music Producer & Sound Designer
app.post('/api/producer/think', async (req, res) => {
  try {
    const { query, currentBpm, currentPreset, currentNotes } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const systemInstruction = `You are a legendary 1980s music producer, master synthesist, and recording engineer.
Your encyclopedic knowledge spans:
1. Vintage hardware: Roland Jupiter-8, Juno-106, Minimoog Model D, Yamaha DX7, Prophet-5, Oberheim OB-Xa, LinnDrum LM-1, Roland TR-808, TR-909, Simmons SDS-V.
2. 80s recording & studio craft: SSL 4000E console listen-mic gated reverb, AMS RMX16, Lexicon 224, tape saturation (Studer A800, Ampex ATR-102), BBD stereo chorus.
3. Iconic genres & movements: Miami synthwave, Italo disco, New Wave / New Romantic, Prince Minneapolis sound, Quincy Jones funk-pop, Dark Synth / Goth, and the revolutionary 1980s South Asian disco sound ("Mon Churi", Bappi Lahiri, R.D. Burman, Biddu, Nazia Hassan).
4. Music theory & period rhythmic swing: 16th-note syncopation, Latin-influenced disco percussion, swing percentages (50-66%), bass ostinatos, and chord voicings.

When answering, you MUST provide deep, high-level musicological reasoning and technical synthesis guidance.
Always return your response formatted as JSON conforming to this structure:
{
  "producerAnalysis": "Detailed musicological insight, period recording context, mixing advice, and analog circuitry details.",
  "gearAdvice": "Specific synthesizer patch settings (oscillators, filter cutoff/resonance, envelope ADSR, chorus mode, tape saturation level).",
  "recommendedBpm": number (e.g. 118),
  "recommendedSwing": number (50 to 66),
  "drumPattern": {
    "kick": [16 binary numbers 0 or 1],
    "snare": [16 binary numbers 0 or 1],
    "clap": [16 binary numbers 0 or 1],
    "hihatC": [16 binary numbers 0 or 1],
    "hihatO": [16 binary numbers 0 or 1],
    "tom": [16 binary numbers 0 or 1],
    "cowbell": [16 binary numbers 0 or 1]
  },
  "synthChords": ["Array of note names like 'D3', 'F3', 'A3', 'C4'"],
  "basslineNotes": ["Array of note names for an 80s arpeggio"],
  "lyriaPromptSuggestion": "A meticulously engineered prompt for Lyria 3 music generation.",
  "periodSongReference": "Famous 80s track that exemplifies this sound"
}`;

    const promptText = `User Query: "${query}".
Current Studio State: BPM ${currentBpm || 120}, Active Preset: "${currentPreset || 'Default'}", Active Notes: [${(currentNotes || []).join(', ')}].
Provide deep 1980s musicological thinking and generate an authentic 16-step rhythmic pattern and synth patch.`;

    console.log(`[Gemini-4-Argon Thinking] Requesting with High Thinking Level...`);

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn('Could not parse JSON response from gemini-4-argon, returning raw text wrap', parseErr);
      parsedData = {
        producerAnalysis: responseText,
        gearAdvice: 'Use dual saw oscillators detuned by 8 cents with a 24dB ladder filter and BBD stereo chorus.',
        recommendedBpm: currentBpm || 120,
        recommendedSwing: 52,
      };
    }

    res.json({
      success: true,
      data: parsedData,
      model: 'gemini-4-argon',
    });
  } catch (error: any) {
    console.error('[Gemini-4-Argon Thinking Error]:', error);
    const errorMessage = error?.message || 'Failed to process with Gemini 4 Argon';
    res.status(500).json({
      success: false,
      error: errorMessage,
      suggestion: 'Check that GEMINI_API_KEY is configured in Settings > Secrets with billing enabled for gemini-4-argon.',
    });
  }
});

// In development, hook up Vite middleware
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[SynthChuri 1984 Studio] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
