import type { Chapter, Point } from "../types/experience";

interface AmbientVoice {
  oscillator: OscillatorNode;
  panner: PannerNode;
}

class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private texture: BiquadFilterNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbLevel: GainNode | null = null;
  private ambient: AmbientVoice[] = [];
  private muted = false;
  private scene: Chapter = "interface";

  private setPannerPosition(
    panner: PannerNode,
    x: number,
    y: number,
    z: number,
    time: number,
  ) {
    panner.positionX.setTargetAtTime(x, time, 0.08);
    panner.positionY.setTargetAtTime(y, time, 0.08);
    panner.positionZ.setTargetAtTime(z, time, 0.08);
  }

  private createPanner(x: number, y: number, z: number) {
    const panner = this.context!.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1;
    panner.maxDistance = 30;
    panner.rolloffFactor = 0.72;
    this.setPannerPosition(panner, x, y, z, this.context!.currentTime);
    return panner;
  }

  private createImpulse(duration: number, decay: number) {
    const context = this.context!;
    const length = Math.floor(context.sampleRate * duration);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const envelope = Math.pow(1 - index / length, decay);
        data[index] = (Math.random() * 2 - 1) * envelope * 0.42;
      }
    }
    return impulse;
  }

  async start() {
    if (this.context) {
      await this.context.resume();
      return;
    }

    const AudioContextClass =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.setValueAtTime(this.muted ? 0 : 0.13, this.context.currentTime);

    const limiter = this.context.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 14;
    limiter.ratio.value = 5;
    limiter.attack.value = 0.012;
    limiter.release.value = 0.24;
    this.master.connect(limiter).connect(this.context.destination);

    this.texture = this.context.createBiquadFilter();
    this.texture.type = "lowpass";
    this.texture.frequency.value = 90;
    this.texture.Q.value = 1.4;
    this.texture.connect(this.master);

    this.reverb = this.context.createConvolver();
    this.reverb.buffer = this.createImpulse(2.4, 2.9);
    this.reverbLevel = this.context.createGain();
    this.reverbLevel.gain.value = 0.045;
    this.reverb.connect(this.reverbLevel).connect(this.master);

    const voicePositions = [
      [-3.8, 0.4, -3.5],
      [3.2, 1.2, -5.5],
      [0.3, -1.8, -8],
    ] as const;

    [36, 54.2, 83].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const [x, y, z] = voicePositions[index];
      const panner = this.createPanner(x, y, z);
      oscillator.type = index === 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.07 : 0.025;
      oscillator.connect(gain).connect(panner);
      panner.connect(this.texture!);
      panner.connect(this.reverb!);
      oscillator.start();
      this.ambient.push({ oscillator, panner });
    });

    const listener = this.context.listener;
    listener.positionX.value = 0;
    listener.positionY.value = 0;
    listener.positionZ.value = 0;
    listener.forwardX.value = 0;
    listener.forwardY.value = 0;
    listener.forwardZ.value = -1;
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
    this.setScene(this.scene);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(
      muted ? 0 : 0.13,
      this.context.currentTime,
      0.04,
    );
  }

  setScene(scene: Chapter) {
    this.scene = scene;
    if (!this.context || !this.texture || !this.reverbLevel) return;
    const time = this.context.currentTime;
    const openness =
      scene === "inside" ? 0.16 : scene === "escape" ? 0.21 : scene === "break" ? 0.1 : 0.045;
    const cutoff =
      scene === "inside" || scene === "escape" ? 540 : scene === "break" ? 260 : 90;
    this.reverbLevel.gain.setTargetAtTime(openness, time, 0.8);
    this.texture.frequency.setTargetAtTime(cutoff, time, 0.65);

    this.ambient.forEach(({ panner }, index) => {
      const spread = scene === "inside" || scene === "escape" ? 1.45 : 1;
      const side = index === 0 ? -3.8 : index === 1 ? 3.2 : 0.3;
      this.setPannerPosition(
        panner,
        side * spread,
        index === 2 ? -1.8 : 0.4 + index * 0.8,
        -3.5 - index * 2.1,
        time,
      );
    });
  }

  motion(speed: number, anomaly: number, pointer: Point) {
    if (!this.context || !this.texture) return;
    const time = this.context.currentTime;
    const target = Math.min(2800, 90 + speed * 2.2 + anomaly * 900);
    this.texture.frequency.setTargetAtTime(target, time, 0.08);
    this.texture.Q.setTargetAtTime(1.4 + anomaly * 5, time, 0.1);

    const listener = this.context.listener;
    listener.positionX.setTargetAtTime((pointer.x - 0.5) * 1.8, time, 0.06);
    listener.positionY.setTargetAtTime((0.5 - pointer.y) * 0.9, time, 0.06);

    this.ambient.forEach(({ panner }, index) => {
      const orbit = time * (0.05 + index * 0.012) + index * 2.1;
      const radius = 3.4 + index * 1.2;
      this.setPannerPosition(
        panner,
        Math.cos(orbit) * radius,
        Math.sin(orbit * 0.7) * 1.6,
        -4.5 - Math.sin(orbit) * 2.5 - index,
        time,
      );
    });
  }

  pulse(intensity = 0.45, point: Point = { x: 0.5, y: 0.5 }) {
    if (!this.context || !this.master || this.muted) return;
    const time = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const panner = this.createPanner(
      (point.x - 0.5) * 5.5,
      (0.5 - point.y) * 2.8,
      -1.4,
    );
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(82, time);
    oscillator.frequency.exponentialRampToValueAtTime(31, time + 0.34);
    gain.gain.setValueAtTime(Math.min(0.18, intensity * 0.2), time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.36);
    oscillator.connect(gain).connect(panner);
    panner.connect(this.master);
    if (this.reverb) panner.connect(this.reverb);
    oscillator.start();
    oscillator.stop(time + 0.4);
  }

  fracture(intensity = 1) {
    if (!this.context || !this.master || this.muted) return;
    const length = Math.floor(this.context.sampleRate * 1.2);
    const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const decay = 1 - index / length;
        const offset = channel === 0 ? index : length - index - 1;
        data[index] =
          (Math.random() * 2 - 1) *
          decay *
          decay *
          (0.7 + Math.sin(offset * 0.013) * 0.3);
      }
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const panner = this.createPanner(intensity % 0.4 > 0.2 ? 2.4 : -2.4, 0, -2.2);
    filter.type = "lowpass";
    filter.frequency.value = 320 + intensity * 260;
    gain.gain.value = 0.09 * intensity;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(panner);
    panner.connect(this.master);
    if (this.reverb) panner.connect(this.reverb);
    source.start();
  }
}

export const audioEngine = new AudioEngine();
