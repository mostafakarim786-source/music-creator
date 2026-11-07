// Web Audio API engine for 1980s Vintage Synth & Drum Machine Workstation
// Implements LinnDrum / TR-808 drum synthesis, Roland Jupiter/Juno analog synth,
// Cassette Tape Saturation, Wow/Flutter, Gated Reverb, BBD Chorus, and Master Sequencer.

export type DrumInstrument = 'kick' | 'snare' | 'clap' | 'hihatC' | 'hihatO' | 'tom' | 'cowbell';

export interface DrumStepPattern {
  kick: number[];
  snare: number[];
  clap: number[];
  hihatC: number[];
  hihatO: number[];
  tom: number[];
  cowbell: number[];
}

export interface SynthParams {
  oscWave: OscillatorType;
  subOsc: number; // 0 to 1
  detune: number; // cents, 0 to 30
  cutoff: number; // 80 to 12000 Hz
  resonance: number; // 0.5 to 20
  envMod: number; // 0 to 1
  attack: number; // seconds
  decay: number;
  sustain: number; // 0 to 1
  release: number;
  chorusMode: number; // 0: off, 1: Chorus I, 2: Chorus II, 3: Chorus I+II
  tapeWarmth: number; // 0 to 1
  gatedReverb: number; // 0 to 1
  delayFeedback: number; // 0 to 0.8
  delayTime: number; // seconds (synced to BPM)
}

export const NOTE_FREQUENCIES: Record<string, number> = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;

  // Master Gain & Effects
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private tapeShaper: WaveShaperNode | null = null;
  private tapeFilter: BiquadFilterNode | null = null;
  private wowDelay: DelayNode | null = null;
  private wowLFO: OscillatorNode | null = null;
  private wowGain: GainNode | null = null;
  private flutterLFO: OscillatorNode | null = null;
  private flutterGain: GainNode | null = null;

  // Chorus Nodes
  private chorusDelayL: DelayNode | null = null;
  private chorusDelayR: DelayNode | null = null;
  private chorusLFOL: OscillatorNode | null = null;
  private chorusLFOR: OscillatorNode | null = null;
  private chorusGainL: GainNode | null = null;
  private chorusGainR: GainNode | null = null;
  private chorusWetGain: GainNode | null = null;
  private chorusDryGain: GainNode | null = null;

  // Delay & Gated Reverb Nodes
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;

  // Analyser for real-time visualizer
  public analyser: AnalyserNode | null = null;

  // Live Recording Stream
  private mediaDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Active Synth Voices
  private activeVoices: Map<string, { osc1: OscillatorNode; osc2: OscillatorNode; sub: OscillatorNode; filter: BiquadFilterNode; vca: GainNode }> = new Map();

  // Sequencer state
  private isPlaying = false;
  private currentStep = 0;
  private tempo = 120; // BPM
  private swing = 50; // 50% = straight, 66% = triplet swing
  private timerId: number | null = null;
  private nextStepTime = 0;
  private scheduleAheadTime = 0.1; // seconds
  private lookaheadMs = 25; // ms
  private onStepCallback: ((step: number) => void) | null = null;
  private pattern: DrumStepPattern = {
    kick:    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare:   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    clap:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihatC:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    hihatO:  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    tom:     [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    cowbell: [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
  };

  // Drum Track Mutes & Levels
  public trackMutes: Record<DrumInstrument, boolean> = {
    kick: false,
    snare: false,
    clap: false,
    hihatC: false,
    hihatO: false,
    tom: false,
    cowbell: false,
  };
  public trackVolumes: Record<DrumInstrument, number> = {
    kick: 0.9,
    snare: 0.85,
    clap: 0.75,
    hihatC: 0.65,
    hihatO: 0.6,
    tom: 0.7,
    cowbell: 0.65,
  };

  // Arpeggiator & Synth state
  private arpEnabled = true;
  private arpMode: 'UP' | 'DOWN' | 'UP_DOWN' | 'RANDOM' = 'UP_DOWN';
  private arpRate: '1/8' | '1/16' | '1/16T' = '1/16';
  private arpOctaves = 2;
  private heldNotes: string[] = ['D3', 'F3', 'A3', 'C4'];
  private synthParams: SynthParams = {
    oscWave: 'sawtooth',
    subOsc: 0.6,
    detune: 8,
    cutoff: 2400,
    resonance: 5.0,
    envMod: 0.65,
    attack: 0.02,
    decay: 0.35,
    sustain: 0.45,
    release: 0.3,
    chorusMode: 2,
    tapeWarmth: 0.7,
    gatedReverb: 0.6,
    delayFeedback: 0.35,
    delayTime: 0.25,
  };

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();

    // 1. Master Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.85;

    // 2. Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // 3. Compressor (SSL G-Master Bus compressor style: fast punch, smooth glue)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    // 4. Analog Tape Saturation & Wow/Flutter Stage
    this.buildTapeStage();

    // 5. Roland BBD Chorus Stage
    this.buildChorusStage();

    // 6. Gated Reverb & Delay Stage
    this.buildReverbAndDelayStage();

    // 7. MediaStreamDestination for live recording
    this.mediaDest = this.ctx.createMediaStreamDestination();

    // Wire up master chain:
    // (Sources) -> Chorus/FX -> Tape Saturation -> Compressor -> Master Gain -> Analyser -> Output & Recorder
    if (this.tapeShaper && this.tapeFilter && this.wowDelay) {
      this.tapeShaper.connect(this.tapeFilter);
      this.tapeFilter.connect(this.wowDelay);
      this.wowDelay.connect(this.compressor);
    } else {
      this.masterGain.connect(this.compressor);
    }

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.analyser.connect(this.mediaDest);
  }

  public async unlockAudio() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isUnlocked = true;
  }

  // --- Analog Tape Saturation & Wow/Flutter Modeling ---
  private buildTapeStage() {
    if (!this.ctx) return;

    // Distortion curve for soft magnetic tape saturation
    this.tapeShaper = this.ctx.createWaveShaper();
    this.tapeShaper.curve = this.createTapeDistortionCurve(0.7) as any;
    this.tapeShaper.oversample = '4x';

    // Warm high-end tape roll-off at 13.5kHz
    this.tapeFilter = this.ctx.createBiquadFilter();
    this.tapeFilter.type = 'lowpass';
    this.tapeFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);
    this.tapeFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // Tape wow (slow 0.45Hz) & flutter (fast 5.2Hz) delay drift
    this.wowDelay = this.ctx.createDelay();
    this.wowDelay.delayTime.setValueAtTime(0.006, this.ctx.currentTime);

    this.wowLFO = this.ctx.createOscillator();
    this.wowLFO.type = 'sine';
    this.wowLFO.frequency.setValueAtTime(0.45, this.ctx.currentTime);

    this.wowGain = this.ctx.createGain();
    this.wowGain.gain.setValueAtTime(0.00045, this.ctx.currentTime);

    this.flutterLFO = this.ctx.createOscillator();
    this.flutterLFO.type = 'sine';
    this.flutterLFO.frequency.setValueAtTime(5.4, this.ctx.currentTime);

    this.flutterGain = this.ctx.createGain();
    this.flutterGain.gain.setValueAtTime(0.00015, this.ctx.currentTime);

    this.wowLFO.connect(this.wowGain);
    this.flutterLFO.connect(this.flutterGain);
    this.wowGain.connect(this.wowDelay.delayTime);
    this.flutterGain.connect(this.wowDelay.delayTime);

    this.wowLFO.start();
    this.flutterLFO.start();
  }

  private createTapeDistortionCurve(amount: number): Float32Array {
    const k = amount * 3.5;
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      // Soft saturation with subtle asymmetry (even harmonics)
      const y = ((1 + k) * x) / (1 + k * Math.abs(x)) + 0.05 * Math.sin(Math.PI * x);
      curve[i] = Math.tanh(y * 1.15);
    }
    return curve;
  }

  public setTapeWarmth(val: number) {
    this.synthParams.tapeWarmth = val;
    if (this.tapeShaper) {
      this.tapeShaper.curve = this.createTapeDistortionCurve(val) as any;
    }
    if (this.tapeFilter && this.ctx) {
      // More warmth rolls off extreme highs like 1980s magnetic tape heads
      const cutoff = 16000 - val * 6000;
      this.tapeFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.05);
    }
    if (this.wowGain && this.ctx) {
      this.wowGain.gain.setTargetAtTime(0.0002 + val * 0.0005, this.ctx.currentTime, 0.05);
    }
  }

  // --- Roland Juno / Jupiter BBD Stereo Chorus Modeling ---
  private buildChorusStage() {
    if (!this.ctx) return;

    this.chorusWetGain = this.ctx.createGain();
    this.chorusDryGain = this.ctx.createGain();
    this.chorusDelayL = this.ctx.createDelay();
    this.chorusDelayR = this.ctx.createDelay();

    this.chorusDelayL.delayTime.setValueAtTime(0.012, this.ctx.currentTime);
    this.chorusDelayR.delayTime.setValueAtTime(0.016, this.ctx.currentTime);

    this.chorusLFOL = this.ctx.createOscillator();
    this.chorusLFOR = this.ctx.createOscillator();
    this.chorusLFOL.type = 'sine';
    this.chorusLFOR.type = 'triangle';

    this.chorusGainL = this.ctx.createGain();
    this.chorusGainR = this.ctx.createGain();

    this.chorusLFOL.connect(this.chorusGainL);
    this.chorusLFOR.connect(this.chorusGainR);

    this.chorusGainL.connect(this.chorusDelayL.delayTime);
    this.chorusGainR.connect(this.chorusDelayR.delayTime);

    this.updateChorusMode(this.synthParams.chorusMode);

    this.chorusLFOL.start();
    this.chorusLFOR.start();
  }

  public updateChorusMode(mode: number) {
    this.synthParams.chorusMode = mode;
    const ctx = this.ctx;
    const lfol = this.chorusLFOL;
    const lfor = this.chorusLFOR;
    const gainl = this.chorusGainL;
    const gainr = this.chorusGainR;
    const wet = this.chorusWetGain;
    const dry = this.chorusDryGain;
    if (!ctx || !lfol || !lfor || !gainl || !gainr || !wet || !dry) return;

    const t = ctx.currentTime;
    if (mode === 0) {
      // Off
      wet.gain.setTargetAtTime(0, t, 0.02);
      dry.gain.setTargetAtTime(1, t, 0.02);
    } else if (mode === 1) {
      // Chorus I: Gentle swirl (0.5Hz, subtle depth)
      lfol.frequency.setTargetAtTime(0.5, t, 0.05);
      lfor.frequency.setTargetAtTime(0.52, t, 0.05);
      gainl.gain.setTargetAtTime(0.0018, t, 0.05);
      gainr.gain.setTargetAtTime(0.0022, t, 0.05);
      wet.gain.setTargetAtTime(0.7, t, 0.05);
      dry.gain.setTargetAtTime(0.75, t, 0.05);
    } else if (mode === 2) {
      // Chorus II: Deep 80s Jupiter/Juno width (0.85Hz, deeper depth)
      lfol.frequency.setTargetAtTime(0.85, t, 0.05);
      lfor.frequency.setTargetAtTime(0.9, t, 0.05);
      gainl.gain.setTargetAtTime(0.0035, t, 0.05);
      gainr.gain.setTargetAtTime(0.0038, t, 0.05);
      wet.gain.setTargetAtTime(0.85, t, 0.05);
      dry.gain.setTargetAtTime(0.7, t, 0.05);
    } else {
      // Chorus I+II: Famous hyper-lush 80s rotary wash
      lfol.frequency.setTargetAtTime(1.4, t, 0.05);
      lfor.frequency.setTargetAtTime(1.5, t, 0.05);
      gainl.gain.setTargetAtTime(0.005, t, 0.05);
      gainr.gain.setTargetAtTime(0.0055, t, 0.05);
      wet.gain.setTargetAtTime(0.95, t, 0.05);
      dry.gain.setTargetAtTime(0.65, t, 0.05);
    }
  }

  // --- Gated Reverb & Vintage Delay Stage ---
  private buildReverbAndDelayStage() {
    if (!this.ctx) return;

    // Algorithmic 1980s Gated Reverb Impulse Generator
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createGatedReverbImpulse(0.24); // 240ms gated cut

    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(this.synthParams.gatedReverb * 0.7, this.ctx.currentTime);

    // BPM Synced Tape Delay
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime((60 / this.tempo) * 0.5, this.ctx.currentTime);

    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(this.synthParams.delayFeedback, this.ctx.currentTime);

    this.delayWetGain = this.ctx.createGain();
    this.delayWetGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    // Feedback loop with lowpass damping for tape echoes
    const delayDampFilter = this.ctx.createBiquadFilter();
    delayDampFilter.type = 'lowpass';
    delayDampFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

    this.delayNode.connect(delayDampFilter);
    delayDampFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayWetGain);

    if (this.tapeShaper) {
      this.delayWetGain.connect(this.tapeShaper);
      this.reverbConvolver.connect(this.reverbWetGain);
      this.reverbWetGain.connect(this.tapeShaper);
    }
  }

  // Creates the iconic Phil Collins / SSL 4000E talkback gated reverb response
  private createGatedReverbImpulse(gateDuration: number): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const sampleRate = this.ctx.sampleRate;
    const totalLength = Math.floor(sampleRate * 0.4);
    const gateSamples = Math.floor(sampleRate * gateDuration);
    const impulse = this.ctx.createBuffer(2, totalLength, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < totalLength; i++) {
      if (i < gateSamples) {
        // Flat dense high-energy reflections
        const env = 1.0;
        left[i] = (Math.random() * 2 - 1) * env;
        right[i] = (Math.random() * 2 - 1) * env;
      } else if (i < gateSamples + 300) {
        // Instant brick-wall gate cut!
        const cutoffFade = 1 - (i - gateSamples) / 300;
        left[i] = (Math.random() * 2 - 1) * cutoffFade;
        right[i] = (Math.random() * 2 - 1) * cutoffFade;
      } else {
        left[i] = 0;
        right[i] = 0;
      }
    }
    return impulse;
  }

  public setGatedReverb(val: number) {
    this.synthParams.gatedReverb = val;
    if (this.reverbWetGain && this.ctx) {
      this.reverbWetGain.gain.setTargetAtTime(val * 0.8, this.ctx.currentTime, 0.05);
    }
  }

  public setDelayFeedback(val: number) {
    this.synthParams.delayFeedback = val;
    if (this.delayFeedbackGain && this.ctx) {
      this.delayFeedbackGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  // --- Drum Voice Synthesis (LinnDrum & TR-808/909 Emulation) ---
  public playDrum(instrument: DrumInstrument, time?: number, velocity: number = 1.0) {
    if (!this.ctx || this.trackMutes[instrument]) return;
    const t = time ?? this.ctx.currentTime;
    const vol = this.trackVolumes[instrument] * velocity;

    switch (instrument) {
      case 'kick':
        this.synthesize80sKick(t, vol);
        break;
      case 'snare':
        this.synthesize80sGatedSnare(t, vol);
        break;
      case 'clap':
        this.synthesize80sClap(t, vol);
        break;
      case 'hihatC':
        this.synthesize80sHiHat(t, vol, false);
        break;
      case 'hihatO':
        this.synthesize80sHiHat(t, vol, true);
        break;
      case 'tom':
        this.synthesizeSimmonsTom(t, vol);
        break;
      case 'cowbell':
        this.synthesize80sCowbell(t, vol);
        break;
    }
  }

  // LinnDrum / TR-808 Hybrid Kick
  private synthesize80sKick(t: number, vol: number) {
    if (!this.ctx || !this.tapeShaper) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency pitch dive: 130Hz transient down to 42Hz punch
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(vol * 1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    // Subtle click click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(320, t);
    clickGain.gain.setValueAtTime(vol * 0.7, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc.connect(gain);
    click.connect(clickGain);
    gain.connect(this.tapeShaper);
    clickGain.connect(this.tapeShaper);

    osc.start(t);
    click.start(t);
    osc.stop(t + 0.45);
    click.stop(t + 0.03);
  }

  // Phil Collins / LinnDrum Gated Reverb Snare
  private synthesize80sGatedSnare(t: number, vol: number) {
    if (!this.ctx || !this.tapeShaper || !this.reverbConvolver) return;

    // 1. Tonal body (185Hz snare drum skin)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.07);
    oscGain.gain.setValueAtTime(vol * 0.9, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.tapeShaper);
    osc.start(t);
    osc.stop(t + 0.18);

    // 2. Snare rattle white noise
    const bufferSize = this.ctx.sampleRate * 0.3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2600, t);
    noiseFilter.Q.setValueAtTime(1.8, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 1.0, t);
    // Steep 80s gated shutoff
    noiseGain.gain.setValueAtTime(vol * 0.75, t + 0.12);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.tapeShaper);

    // Send into gated reverb unit
    if (this.synthParams.gatedReverb > 0.05) {
      noiseGain.connect(this.reverbConvolver);
    }

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.25);
  }

  // TR-808 Multi-burst Analog Clap
  private synthesize80sClap(t: number, vol: number) {
    if (!this.ctx || !this.tapeShaper) return;

    const bufferSize = this.ctx.sampleRate * 0.35;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(2.2, t);

    const gain = this.ctx.createGain();
    // 3 distinct handclaps 12ms apart followed by the reverb tail
    gain.gain.setValueAtTime(0, t);
    gain.gain.setValueAtTime(vol * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.011);
    gain.gain.setValueAtTime(vol * 0.8, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.023);
    gain.gain.setValueAtTime(vol * 0.9, t + 0.024);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.035);
    gain.gain.setValueAtTime(vol * 1.0, t + 0.036);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.tapeShaper);
    if (this.reverbConvolver) gain.connect(this.reverbConvolver);

    noise.start(t);
    noise.stop(t + 0.3);
  }

  // TR-808 6-Oscillator Metallic Hi-Hat
  private synthesize80sHiHat(t: number, vol: number, isOpen: boolean) {
    if (!this.ctx || !this.tapeShaper) return;

    // Authentic TR-808 frequencies: 200, 300, 415, 543, 679, 821 Hz
    const freqs = [205, 305, 418, 540, 680, 825];
    const gain = this.ctx.createGain();
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(7500, t);
    bandpass.Q.setValueAtTime(3.5, t);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(8000, t);

    const decayTime = isOpen ? 0.38 : 0.055;
    gain.gain.setValueAtTime(vol * (isOpen ? 0.7 : 0.65), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(bandpass);
      osc.start(t);
      osc.stop(t + decayTime + 0.05);
    });

    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.tapeShaper);
  }

  // Simmons SDS-V Electronic Synth Tom ("Peww" pitch dive)
  private synthesizeSimmonsTom(t: number, vol: number) {
    if (!this.ctx || !this.tapeShaper) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Dramatic 80s Simmons pitch sweep
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(85, t + 0.22);

    gain.gain.setValueAtTime(vol * 0.95, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    // Click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'sawtooth';
    click.frequency.setValueAtTime(800, t);
    clickGain.gain.setValueAtTime(vol * 0.5, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(gain);
    click.connect(clickGain);
    gain.connect(this.tapeShaper);
    clickGain.connect(this.tapeShaper);
    if (this.reverbConvolver) gain.connect(this.reverbConvolver);

    osc.start(t);
    click.start(t);
    osc.stop(t + 0.4);
    click.stop(t + 0.03);
  }

  // Roland TR-808 Dual-Square Cowbell
  private synthesize80sCowbell(t: number, vol: number) {
    if (!this.ctx || !this.tapeShaper) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(540, t);
    osc2.frequency.setValueAtTime(800, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(vol * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.tapeShaper);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.2);
    osc2.stop(t + 0.2);
  }

  // --- Polyphonic Analog Synthesizer (Roland Jupiter-8 / Juno-106 emulation) ---
  public noteOn(note: string, velocity: number = 0.9) {
    if (!this.ctx) return;
    this.unlockAudio();

    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;

    // If note is already active, shut it down smoothly
    this.noteOff(note);

    const t = this.ctx.currentTime;
    const p = this.synthParams;

    // VCO 1: Main Oscillator (Saw / Square / Triangle)
    const osc1 = this.ctx.createOscillator();
    osc1.type = p.oscWave;
    osc1.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(-p.detune, t);

    // VCO 2: Detuned Oscillator (+cents for analog width)
    const osc2 = this.ctx.createOscillator();
    osc2.type = p.oscWave;
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.setValueAtTime(p.detune, t);

    // Sub-Oscillator: 1 Octave Down Square wave
    const sub = this.ctx.createOscillator();
    sub.type = 'square';
    sub.frequency.setValueAtTime(freq / 2, t);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(p.subOsc * 0.6, t);
    sub.connect(subGain);

    // 24dB Resonant Low-Pass Filter (Ladder emulation)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(60, p.cutoff * 0.4), t);
    filter.Q.setValueAtTime(p.resonance, t);

    // Filter Envelope modulation
    const targetCutoff = Math.min(18000, p.cutoff + p.envMod * 4000);
    filter.frequency.exponentialRampToValueAtTime(targetCutoff, t + p.attack);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, p.cutoff * p.sustain), t + p.attack + p.decay);

    // Amplifier VCA
    const vca = this.ctx.createGain();
    vca.gain.setValueAtTime(0, t);
    vca.gain.linearRampToValueAtTime(velocity * 0.5, t + Math.max(0.005, p.attack));
    vca.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.5 * p.sustain), t + p.attack + p.decay);

    // Routing into Chorus stage
    osc1.connect(filter);
    osc2.connect(filter);
    subGain.connect(filter);
    filter.connect(vca);

    if (this.chorusWetGain && this.chorusDelayL && this.chorusDelayR && this.chorusDryGain && this.tapeShaper) {
      vca.connect(this.chorusDelayL);
      vca.connect(this.chorusDelayR);
      vca.connect(this.chorusDryGain);

      this.chorusDelayL.connect(this.chorusWetGain);
      this.chorusDelayR.connect(this.chorusWetGain);
      this.chorusWetGain.connect(this.tapeShaper);
      this.chorusDryGain.connect(this.tapeShaper);
    } else if (this.tapeShaper) {
      vca.connect(this.tapeShaper);
    }

    // Connect to delay & reverb send
    if (this.delayNode && p.delayFeedback > 0.05) {
      vca.connect(this.delayNode);
    }
    if (this.reverbConvolver && p.gatedReverb > 0.05) {
      vca.connect(this.reverbConvolver);
    }

    osc1.start(t);
    osc2.start(t);
    sub.start(t);

    this.activeVoices.set(note, { osc1, osc2, sub, filter, vca });
  }

  public noteOff(note: string) {
    if (!this.ctx) return;
    const voice = this.activeVoices.get(note);
    if (!voice) return;

    const t = this.ctx.currentTime;
    const rel = Math.max(0.05, this.synthParams.release);

    voice.vca.gain.cancelScheduledValues(t);
    voice.vca.gain.setValueAtTime(voice.vca.gain.value, t);
    voice.vca.gain.exponentialRampToValueAtTime(0.0001, t + rel);

    voice.osc1.stop(t + rel + 0.05);
    voice.osc2.stop(t + rel + 0.05);
    voice.sub.stop(t + rel + 0.05);

    this.activeVoices.delete(note);
  }

  // --- Sequencer & Clock ---
  public setTempo(bpm: number) {
    this.tempo = Math.max(50, Math.min(220, bpm));
    if (this.delayNode && this.ctx) {
      this.delayNode.delayTime.setTargetAtTime((60 / this.tempo) * 0.5, this.ctx.currentTime, 0.05);
    }
  }

  public getTempo() {
    return this.tempo;
  }

  public setSwing(swing: number) {
    // 50: straight 16ths, 66: triplet swing
    this.swing = Math.max(50, Math.min(75, swing));
  }

  public getSwing() {
    return this.swing;
  }

  public setPattern(pattern: DrumStepPattern) {
    this.pattern = JSON.parse(JSON.stringify(pattern));
  }

  public getPattern() {
    return this.pattern;
  }

  public toggleStep(instrument: DrumInstrument, stepIndex: number) {
    if (this.pattern[instrument]) {
      this.pattern[instrument][stepIndex] = this.pattern[instrument][stepIndex] ? 0 : 1;
    }
  }

  public setHeldNotes(notes: string[]) {
    this.heldNotes = notes;
  }

  public getHeldNotes() {
    return this.heldNotes;
  }

  public setSynthParams(params: Partial<SynthParams>) {
    this.synthParams = { ...this.synthParams, ...params };
    if (params.tapeWarmth !== undefined) this.setTapeWarmth(params.tapeWarmth);
    if (params.gatedReverb !== undefined) this.setGatedReverb(params.gatedReverb);
    if (params.chorusMode !== undefined) this.updateChorusMode(params.chorusMode);
    if (params.delayFeedback !== undefined) this.setDelayFeedback(params.delayFeedback);
  }

  public getSynthParams() {
    return this.synthParams;
  }

  public setArpConfig(enabled: boolean, mode: 'UP' | 'DOWN' | 'UP_DOWN' | 'RANDOM', octaves: number = 2) {
    this.arpEnabled = enabled;
    this.arpMode = mode;
    this.arpOctaves = octaves;
  }

  public onStep(cb: (step: number) => void) {
    this.onStepCallback = cb;
  }

  public start() {
    if (this.isPlaying) return;
    this.unlockAudio();
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx!.currentTime + 0.05;
    this.schedule();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    // Release any stuck notes
    this.activeVoices.forEach((_, note) => this.noteOff(note));
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  private schedule = () => {
    if (!this.isPlaying || !this.ctx) return;

    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.schedule, this.lookaheadMs);
  };

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.tempo;
    const straightStepTime = 0.25 * secondsPerBeat; // 16th note

    // Calculate 80s Swing / Shuffle delay
    // On odd 16th notes (step 1, 3, 5...), add swing offset:
    const swingFactor = (this.swing - 50) / 50; // 0 to 0.5
    const isOddStep = this.currentStep % 2 === 1;

    let stepDuration = straightStepTime;
    if (isOddStep) {
      stepDuration = straightStepTime * (1 - swingFactor * 0.6);
    } else {
      stepDuration = straightStepTime * (1 + swingFactor * 0.6);
    }

    this.nextStepTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleStep(step: number, time: number) {
    // Notify UI for LED runner animation
    if (this.onStepCallback) {
      const delayMs = Math.max(0, (time - this.ctx!.currentTime) * 1000);
      setTimeout(() => {
        if (this.isPlaying && this.onStepCallback) {
          this.onStepCallback(step);
        }
      }, delayMs);
    }

    // Trigger Drums for this step
    const instruments: DrumInstrument[] = ['kick', 'snare', 'clap', 'hihatC', 'hihatO', 'tom', 'cowbell'];
    instruments.forEach((inst) => {
      if (this.pattern[inst] && this.pattern[inst][step]) {
        // Accents on 80s downbeats
        const isAccent = step === 0 || step === 4 || step === 8 || step === 12;
        const velocity = isAccent ? 1.0 : 0.85;
        this.playDrum(inst, time, velocity);
      }
    });

    // Trigger Arpeggiated Synth Note for this step
    if (this.arpEnabled && this.heldNotes.length > 0) {
      const arpNote = this.calculateArpNote(step);
      if (arpNote) {
        const dur = (60.0 / this.tempo) * 0.25 * 0.8;
        this.scheduleSynthNote(arpNote, time, dur);
      }
    }
  }

  private calculateArpNote(step: number): string | null {
    if (this.heldNotes.length === 0) return null;

    // Expand notes across octaves if requested
    const allNotes: string[] = [];
    for (let oct = 0; oct < this.arpOctaves; oct++) {
      this.heldNotes.forEach((n) => {
        if (oct === 0) {
          allNotes.push(n);
        } else {
          // Bump octave
          const match = n.match(/^([A-G]#?)([0-9])$/);
          if (match) {
            const newOct = parseInt(match[2]) + oct;
            const transposed = `${match[1]}${newOct}`;
            if (NOTE_FREQUENCIES[transposed]) allNotes.push(transposed);
          }
        }
      });
    }

    if (allNotes.length === 0) return null;

    if (this.arpMode === 'UP') {
      return allNotes[step % allNotes.length];
    } else if (this.arpMode === 'DOWN') {
      const reversed = [...allNotes].reverse();
      return reversed[step % reversed.length];
    } else if (this.arpMode === 'UP_DOWN') {
      const pingpong = [...allNotes, ...[...allNotes].slice(1, -1).reverse()];
      return pingpong[step % pingpong.length];
    } else {
      // RANDOM
      const idx = Math.floor(Math.random() * allNotes.length);
      return allNotes[idx];
    }
  }

  private scheduleSynthNote(note: string, time: number, duration: number) {
    if (!this.ctx) return;
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;

    const p = this.synthParams;

    // Dual VCOs
    const osc1 = this.ctx.createOscillator();
    osc1.type = p.oscWave;
    osc1.frequency.setValueAtTime(freq, time);
    osc1.detune.setValueAtTime(-p.detune, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = p.oscWave;
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.setValueAtTime(p.detune, time);

    // Sub oscillator
    const sub = this.ctx.createOscillator();
    sub.type = 'square';
    sub.frequency.setValueAtTime(freq / 2, time);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(p.subOsc * 0.6, time);
    sub.connect(subGain);

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(60, p.cutoff * 0.4), time);
    filter.Q.setValueAtTime(p.resonance, time);

    const targetCutoff = Math.min(18000, p.cutoff + p.envMod * 3500);
    filter.frequency.exponentialRampToValueAtTime(targetCutoff, time + p.attack);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, p.cutoff * p.sustain), time + p.attack + p.decay);

    // VCA
    const vca = this.ctx.createGain();
    vca.gain.setValueAtTime(0, time);
    vca.gain.linearRampToValueAtTime(0.4, time + Math.max(0.005, p.attack));
    vca.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.4 * p.sustain), time + p.attack + p.decay);
    vca.gain.setValueAtTime(Math.max(0.001, 0.4 * p.sustain), time + duration);
    vca.gain.exponentialRampToValueAtTime(0.0001, time + duration + p.release);

    osc1.connect(filter);
    osc2.connect(filter);
    subGain.connect(filter);
    filter.connect(vca);

    if (this.chorusWetGain && this.chorusDelayL && this.chorusDelayR && this.chorusDryGain && this.tapeShaper) {
      vca.connect(this.chorusDelayL);
      vca.connect(this.chorusDelayR);
      vca.connect(this.chorusDryGain);
    } else if (this.tapeShaper) {
      vca.connect(this.tapeShaper);
    }

    if (this.delayNode && p.delayFeedback > 0.05) {
      vca.connect(this.delayNode);
    }
    if (this.reverbConvolver && p.gatedReverb > 0.05) {
      vca.connect(this.reverbConvolver);
    }

    osc1.start(time);
    osc2.start(time);
    sub.start(time);

    osc1.stop(time + duration + p.release + 0.05);
    osc2.stop(time + duration + p.release + 0.05);
    sub.stop(time + duration + p.release + 0.05);
  }

  // --- Live Cassette Tape Recorder (Export performance to audio file) ---
  public startRecording(): boolean {
    if (!this.mediaDest) return false;
    try {
      this.recordedChunks = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      this.mediaRecorder = new MediaRecorder(this.mediaDest.stream, { mimeType: mime });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start();
      return true;
    } catch (err) {
      console.error('Error starting media recorder:', err);
      return false;
    }
  }

  public stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recorder not active'));
        return;
      }
      this.mediaRecorder.onstop = () => {
        const mime = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mime });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };
      this.mediaRecorder.stop();
    });
  }

  public isRecordingActive(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}

export const audioEngine = new AudioEngine();
