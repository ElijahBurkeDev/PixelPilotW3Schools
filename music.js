// --------------------------- DYNAMIC MUSIC ENGINE ---------------------------

let musicCtx, musicMaster, musicCompressor;
let musicStarted = false;
let musicIntensity = 0;
let musicBpm = 120;

let mStep = 0, mArpStep = 0, mMelStep = 0, mCounterStep = 0, mHarmStep = 0, mPadStep = 0;
let mChordIdx = 0, mBarCount = 0;
let mSeqTimer = null;

let mSubOsc, mSubGain;
let mBassOsc, mBassGain, mBassFilter;
let mMelOsc, mMelGain, mMelFilter;
let mArpOsc, mArpGain;
let mCounterOsc, mCounterGain, mCounterFilter;
let mHarmOsc, mHarmGain;
let mPadOscs = [], mPadGains = [];
let mChaosOsc, mChaosOsc2, mChaosGain;
let mKickGain, mSnareGain, mHihatGain, mPercGain;
let mReverbNode, mReverbGain;
let mDelayNode, mDelayGain, mDelayFeedback;

const mProgressions = [
  { chords: [[130.81,155.56,196.00],[174.61,207.65,261.63],[196.00,233.08,293.66],[130.81,155.56,196.00]] },
  { chords: [[130.81,155.56,196.00],[103.83,130.81,155.56],[155.56,196.00,233.08],[116.54,146.83,174.61]] },
  { chords: [[130.81,155.56,196.00],[174.61,207.65,261.63],[103.83,130.81,155.56],[196.00,233.08,293.66]] },
  { chords: [[138.59,164.81,207.65],[155.56,185.00,233.08],[174.61,207.65,261.63],[130.81,155.56,196.00]] },
];

const mBassPatterns = [
  [130.81,0,0,130.81, 0,0,196.00,0, 174.61,0,0,174.61, 0,0,155.56,0],
  [130.81,0,130.81,0, 155.56,0,196.00,0, 174.61,0,174.61,0, 155.56,0,130.81,0],
  [130.81,0,0,0, 155.56,0,0,196.00, 0,174.61,0,0, 155.56,0,130.81,155.56],
  [130.81,155.56,130.81,155.56, 196.00,174.61,155.56,130.81, 174.61,196.00,174.61,155.56, 130.81,0,196.00,0],
];

const mScale = [261.63,293.66,311.13,349.23,392.00,415.30,466.16,523.25,587.33,622.25,698.46,784.00,932.33,1046.50];

const mMelPatterns = [
  [0,2,4,2, 3,2,4,6, 5,4,6,7, 6,4,2,0],
  [4,6,7,6, 4,3,2,4, 6,7,9,7, 6,4,3,2],
  [0,0,2,4, 6,4,2,4, 6,7,6,4, 3,2,0,2],
  [7,6,4,3, 2,4,6,7, 9,7,6,4, 6,7,9,7],
];

const mArpPatterns = [
  [0,1,2,1, 0,2,1,0],
  [0,2,1,2, 0,1,2,0],
  [2,1,0,1, 2,0,1,2],
  [0,1,2,0, 2,1,0,2],
];

const mCounterPatterns = [
  [6,7,6,4, 5,6,4,2, 3,4,2,0, 1,2,4,3],
  [9,7,6,7, 9,7,6,4, 6,7,6,4, 3,4,6,4],
  [4,6,7,9, 7,6,4,6, 7,9,7,6, 4,3,2,4],
  [9,9,7,6, 7,9,7,6, 4,6,7,9, 11,9,7,6],
];

const mHarmOffsets = [2,2,3,2,2,3,2,2];

const mDrumPatterns = [
  "k..h s..h k..h s..h",
  "k.hh s.hh k.hh s.hh",
  "kphh sphh kphh sphh",
  "khhh shhh khhh shhh",
].map(p => p.replace(/ /g,'').split('').map(c => c === '.' ? '' : c));

function mMakeNoiseBuf(ctx) {
  const sz = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function mMakeNoiseSrc(ctx, buf) {
  const s = ctx.createBufferSource();
  s.buffer = buf; s.loop = true;
  return s;
}

function mTriggerOsc(osc, gainNode, freq, vol, atk, rel, when) {
  if (!freq) return;
  osc.frequency.setValueAtTime(freq, when);
  gainNode.gain.cancelScheduledValues(when);
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.linearRampToValueAtTime(vol, when + atk);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + atk + rel);
}

function mTriggerNoise(gainNode, vol, atk, rel, when) {
  gainNode.gain.cancelScheduledValues(when);
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.linearRampToValueAtTime(vol, when + atk);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + atk + rel);
}

function mBuildReverb(ctx, secs, decay) {
  const len = ctx.sampleRate * secs;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

function mTick() {
  const stepDur = 60 / musicBpm / 4;
  const now = musicCtx.currentTime;
  const pi = Math.min(Math.floor(musicIntensity * 4), 3);
  const chord = mProgressions[pi].chords[mChordIdx % 4];
  const bassP = mBassPatterns[pi];
  const melP = mMelPatterns[pi];
  const counterP = mCounterPatterns[pi];
  const drumP = mDrumPatterns[Math.min(pi, 3)];
  const arpP = mArpPatterns[pi];
  const s16 = mStep % 16;

  const bassFreq = bassP[s16];
  if (bassFreq) {
    mSubOsc.frequency.setValueAtTime(bassFreq / 2, now);
    mSubGain.gain.cancelScheduledValues(now);
    mSubGain.gain.setValueAtTime(0.0001, now);
    mSubGain.gain.linearRampToValueAtTime(0.22, now + 0.008);
    mSubGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDur * 1.8);
  }

  mTriggerOsc(mBassOsc, mBassGain, bassFreq, 0.32, 0.005, stepDur * 0.75, now);

  if (musicIntensity > 0.1) {
    mTriggerOsc(mMelOsc, mMelGain, mScale[melP[mMelStep % 16]], 0.10 + musicIntensity * 0.12, 0.008, stepDur * 0.6, now);
    mMelStep++;
  }

  if (musicIntensity > 0.35) {
    const hIdx = Math.min(melP[mMelStep % 16] + mHarmOffsets[mStep % 8], mScale.length - 1);
    mTriggerOsc(mHarmOsc, mHarmGain, mScale[hIdx], 0.06 + musicIntensity * 0.06, 0.01, stepDur * 0.55, now);
    mHarmStep++;
  }

  if (musicIntensity > 0.25) {
    mTriggerOsc(mArpOsc, mArpGain, chord[arpP[mArpStep % arpP.length]] * 2, 0.07 + musicIntensity * 0.09, 0.004, stepDur * 0.35, now);
    mArpStep++;
  }

  if (musicIntensity > 0.5 && s16 % 2 === 0) {
    mTriggerOsc(mCounterOsc, mCounterGain, mScale[counterP[mCounterStep % 16]] * 2, 0.065 + musicIntensity * 0.055, 0.006, stepDur * 0.5, now);
    mCounterStep++;
  }

  if (musicIntensity > 0.45 && s16 % 4 === 0) {
    chord.forEach((f, i) => {
      if (!mPadOscs[i]) return;
      mPadOscs[i].frequency.setValueAtTime(f, now);
      mPadGains[i].gain.cancelScheduledValues(now);
      mPadGains[i].gain.setValueAtTime(0.0001, now);
      mPadGains[i].gain.linearRampToValueAtTime(0.04 + musicIntensity * 0.035, now + 0.04);
      mPadGains[i].gain.exponentialRampToValueAtTime(0.0001, now + stepDur * 5);
    });
    mPadStep++;
  }

  const dc = drumP[s16] || '';
  if (dc.includes('k')) mTriggerNoise(mKickGain, 0.55 + musicIntensity * 0.3, 0.003, 0.07, now);
  if (dc.includes('s') && musicIntensity > 0.18) mTriggerNoise(mSnareGain, 0.38 + musicIntensity * 0.22, 0.003, 0.13, now);
  if (dc.includes('h') && musicIntensity > 0.38) mTriggerNoise(mHihatGain, 0.12 + musicIntensity * 0.14, 0.002, 0.035, now);
  if (dc.includes('p') && musicIntensity > 0.55) mTriggerNoise(mPercGain, 0.22 + musicIntensity * 0.12, 0.003, 0.06, now);

  if (musicIntensity > 0.72) {
    const cv = (musicIntensity - 0.72) * 0.55;
    mTriggerOsc(mChaosOsc, mChaosGain, mScale[Math.floor(Math.random() * mScale.length)] * (2 + Math.random()), cv * 0.6, 0.002, stepDur * 0.25, now);
    mTriggerOsc(mChaosOsc2, mChaosGain, mScale[Math.floor(Math.random() * mScale.length)] * (3 + Math.random()), cv * 0.4, 0.002, stepDur * 0.20, now);
  }

  mStep++;
  if (mStep % 16 === 0) {
    mBarCount++;
    mChordIdx = (mChordIdx + 1) % 4;
    if (mBarCount % 4 === 0 && musicIntensity > 0.5) mMelStep = Math.floor(Math.random() * 4) * 4;
  }

  const next = now + stepDur;
  mSeqTimer = setTimeout(mTick, Math.max(0, (next - musicCtx.currentTime) * 1000 - 12));
}

function startDynamicMusic() {
  if (musicStarted) return;
  musicStarted = true;

  musicCtx = new (window.AudioContext || window.webkitAudioContext)();

  musicCompressor = musicCtx.createDynamicsCompressor();
  musicCompressor.threshold.value = -18;
  musicCompressor.knee.value = 10;
  musicCompressor.ratio.value = 6;
  musicCompressor.attack.value = 0.003;
  musicCompressor.release.value = 0.18;
  musicCompressor.connect(musicCtx.destination);

  musicMaster = musicCtx.createGain();
  musicMaster.gain.value = settingsMusicVol;
  musicMaster.connect(musicCompressor);

  mReverbNode = mBuildReverb(musicCtx, 1.2, 2.8);
  mReverbGain = musicCtx.createGain();
  mReverbGain.gain.value = 0.15;
  mReverbNode.connect(mReverbGain).connect(musicMaster);

  mDelayNode = musicCtx.createDelay(1.0);
  mDelayNode.delayTime.value = 0.19;
  mDelayFeedback = musicCtx.createGain();
  mDelayFeedback.gain.value = 0.35;
  mDelayGain = musicCtx.createGain();
  mDelayGain.gain.value = 0.0;
  mDelayNode.connect(mDelayFeedback).connect(mDelayNode);
  mDelayNode.connect(mDelayGain).connect(musicMaster);

  const nBuf = mMakeNoiseBuf(musicCtx);

  function makeFiltered(src, type, freq, Q) {
    const f = musicCtx.createBiquadFilter();
    f.type = type; f.frequency.value = freq;
    if (Q) f.Q.value = Q;
    const g = musicCtx.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(musicMaster);
    src.start();
    return g;
  }

  mKickGain = makeFiltered(mMakeNoiseSrc(musicCtx, nBuf), 'lowpass', 160, null);
  mSnareGain = makeFiltered(mMakeNoiseSrc(musicCtx, nBuf), 'bandpass', 1600, 0.8);
  mHihatGain = makeFiltered(mMakeNoiseSrc(musicCtx, nBuf), 'highpass', 8000, null);
  mPercGain = makeFiltered(mMakeNoiseSrc(musicCtx, nBuf), 'bandpass', 900, 2.5);

  mSubOsc = musicCtx.createOscillator(); mSubOsc.type = 'sine'; mSubOsc.frequency.value = 65.41;
  mSubGain = musicCtx.createGain(); mSubGain.gain.value = 0;
  mSubOsc.connect(mSubGain).connect(musicMaster);
  mSubOsc.start();

  mBassOsc = musicCtx.createOscillator(); mBassOsc.type = 'square'; mBassOsc.frequency.value = 130.81;
  mBassFilter = musicCtx.createBiquadFilter(); mBassFilter.type = 'lowpass'; mBassFilter.frequency.value = 700;
  mBassGain = musicCtx.createGain(); mBassGain.gain.value = 0;
  mBassOsc.connect(mBassFilter).connect(mBassGain).connect(musicMaster);
  mBassGain.connect(mReverbNode);
  mBassOsc.start();

  mMelOsc = musicCtx.createOscillator(); mMelOsc.type = 'triangle'; mMelOsc.frequency.value = 440;
  mMelFilter = musicCtx.createBiquadFilter(); mMelFilter.type = 'lowpass'; mMelFilter.frequency.value = 1200;
  mMelGain = musicCtx.createGain(); mMelGain.gain.value = 0;
  mMelOsc.connect(mMelFilter).connect(mMelGain).connect(musicMaster);
  mMelGain.connect(mReverbNode); mMelGain.connect(mDelayNode);
  mMelOsc.start();

  mHarmOsc = musicCtx.createOscillator(); mHarmOsc.type = 'triangle'; mHarmOsc.frequency.value = 523.25;
  mHarmGain = musicCtx.createGain(); mHarmGain.gain.value = 0;
  mHarmOsc.connect(mHarmGain).connect(musicMaster);
  mHarmGain.connect(mReverbNode);
  mHarmOsc.start();

  mArpOsc = musicCtx.createOscillator(); mArpOsc.type = 'square'; mArpOsc.detune.value = 8;
  mArpGain = musicCtx.createGain(); mArpGain.gain.value = 0;
  mArpOsc.connect(mArpGain).connect(musicMaster);
  mArpGain.connect(mDelayNode);
  mArpOsc.start();

  mCounterOsc = musicCtx.createOscillator(); mCounterOsc.type = 'sawtooth'; mCounterOsc.frequency.value = 523.25;
  mCounterFilter = musicCtx.createBiquadFilter(); mCounterFilter.type = 'bandpass'; mCounterFilter.frequency.value = 1400; mCounterFilter.Q.value = 1.2;
  mCounterGain = musicCtx.createGain(); mCounterGain.gain.value = 0;
  mCounterOsc.connect(mCounterFilter).connect(mCounterGain).connect(musicMaster);
  mCounterGain.connect(mReverbNode);
  mCounterOsc.start();

  for (let i = 0; i < 3; i++) {
    const o = musicCtx.createOscillator(); o.type = 'sine';
    o.frequency.value = [261.63, 311.13, 392.00][i];
    const g = musicCtx.createGain(); g.gain.value = 0;
    o.connect(g).connect(mReverbNode); g.connect(musicMaster);
    o.start();
    mPadOscs.push(o); mPadGains.push(g);
  }

  mChaosOsc = musicCtx.createOscillator(); mChaosOsc.type = 'square'; mChaosOsc.frequency.value = 880;
  mChaosOsc2 = musicCtx.createOscillator(); mChaosOsc2.type = 'square'; mChaosOsc2.detune.value = -12;
  mChaosGain = musicCtx.createGain(); mChaosGain.gain.value = 0;
  const chaosHP = musicCtx.createBiquadFilter(); chaosHP.type = 'highpass'; chaosHP.frequency.value = 600;
  mChaosOsc.connect(chaosHP); mChaosOsc2.connect(chaosHP);
  chaosHP.connect(mChaosGain).connect(musicMaster);
  mChaosGain.connect(mDelayNode);
  mChaosOsc.start(); mChaosOsc2.start();

  mTick();
}

function stopDynamicMusic() {
  if (!musicStarted) return;
  clearTimeout(mSeqTimer);
  musicStarted = false;
  mStep = 0; mArpStep = 0; mMelStep = 0; mCounterStep = 0; mHarmStep = 0; mPadStep = 0;
  mChordIdx = 0; mBarCount = 0;
  mPadOscs = []; mPadGains = [];
  try { musicCtx.close(); } catch (e) {}
  musicCtx = null;
}

function updateDynamicMusic(score) {
  if (!musicStarted) return;

  const targetIntensity = typeof getGameIntensityFromScore === 'function'
    ? getGameIntensityFromScore(score)
    : Math.min(score / 5000, 1);

  musicIntensity += (targetIntensity - musicIntensity) * 0.07;
  musicBpm = 108 + musicIntensity * 40;

  if (musicMaster) musicMaster.gain.value = settingsMusicVol;
  if (mMelFilter) mMelFilter.frequency.value = 600 + musicIntensity * 4200;
  if (mBassFilter) mBassFilter.frequency.value = 350 + musicIntensity * 1000;
  if (mReverbGain) mReverbGain.gain.value = 0.06 + musicIntensity * 0.24;
  if (mDelayGain) mDelayGain.gain.value = musicIntensity > 0.38 ? (musicIntensity - 0.38) * 0.32 : 0;
  if (mDelayFeedback) mDelayFeedback.gain.value = 0.22 + musicIntensity * 0.18;
}

// --------------------------- END DYNAMIC MUSIC ENGINE -----------------------
