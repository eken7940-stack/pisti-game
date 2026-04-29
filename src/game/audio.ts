// Web Audio API ile programatik ses üretimi — harici dosya gerekmez

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  attack = 0.01,
  decay = 0.1,
  startTime?: number
) {
  const ac = getCtx();
  const t = startTime ?? ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay + duration);
  osc.start(t);
  osc.stop(t + attack + decay + duration + 0.05);
}

function noise(duration: number, volume: number) {
  const ac = getCtx();
  const bufSize = ac.sampleRate * duration;
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

export const SFX = {
  // Kart bırakma — kısa plastik tık
  cardPlay() {
    noise(0.06, 0.18);
    playTone(320, 'triangle', 0.04, 0.12, 0.005, 0.06);
  },

  // Kart alma — tatmin edici çarpma
  cardCapture() {
    noise(0.08, 0.22);
    playTone(220, 'triangle', 0.06, 0.18, 0.005, 0.1);
    playTone(180, 'sine', 0.1, 0.1, 0.01, 0.12);
  },

  // Pişti — zafer fanfarı
  pisti() {
    const ac = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      playTone(freq, 'triangle', 0.12, 0.22, 0.01, 0.15, ac.currentTime + i * 0.1);
    });
  },

  // Bot pişti — ters fanfar
  botPisti() {
    const ac = getCtx();
    const notes = [1047, 784, 659, 523];
    notes.forEach((freq, i) => {
      playTone(freq, 'sawtooth', 0.1, 0.15, 0.01, 0.12, ac.currentTime + i * 0.09);
    });
  },

  // Kart dağıtma — hızlı shuffle
  deal() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        noise(0.04, 0.12);
        playTone(400 + i * 40, 'triangle', 0.03, 0.08, 0.003, 0.04);
      }, i * 80);
    }
  },

  // Kazanma
  win() {
    const ac = getCtx();
    const melody = [523, 659, 784, 659, 784, 1047];
    melody.forEach((freq, i) => {
      playTone(freq, 'triangle', 0.15, 0.2, 0.01, 0.18, ac.currentTime + i * 0.12);
    });
  },

  // Kaybetme
  lose() {
    const ac = getCtx();
    playTone(400, 'sawtooth', 0.1, 0.2, 0.01, 0.15, ac.currentTime);
    playTone(300, 'sawtooth', 0.1, 0.18, 0.01, 0.2, ac.currentTime + 0.15);
    playTone(220, 'sawtooth', 0.2, 0.15, 0.01, 0.3, ac.currentTime + 0.32);
  },

  // Hover
  hover() {
    playTone(600, 'sine', 0.02, 0.05, 0.005, 0.03);
  },
};
