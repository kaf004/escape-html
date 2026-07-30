class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private texture: BiquadFilterNode | null = null;
  private ambient: OscillatorNode[] = [];
  private muted = false;

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
    this.master.connect(this.context.destination);

    this.texture = this.context.createBiquadFilter();
    this.texture.type = "lowpass";
    this.texture.frequency.value = 90;
    this.texture.Q.value = 1.4;
    this.texture.connect(this.master);

    [36, 54.2, 83].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = index === 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.07 : 0.025;
      oscillator.connect(gain).connect(this.texture!);
      oscillator.start();
      this.ambient.push(oscillator);
    });
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

  motion(speed: number, anomaly: number) {
    if (!this.context || !this.texture) return;
    const target = Math.min(2800, 90 + speed * 2.2 + anomaly * 900);
    this.texture.frequency.setTargetAtTime(
      target,
      this.context.currentTime,
      0.08,
    );
    this.texture.Q.setTargetAtTime(1.4 + anomaly * 5, this.context.currentTime, 0.1);
  }

  pulse(intensity = 0.45) {
    if (!this.context || !this.master || this.muted) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(82, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      31,
      this.context.currentTime + 0.34,
    );
    gain.gain.setValueAtTime(Math.min(0.18, intensity * 0.2), this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.36);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.4);
  }

  fracture(intensity = 1) {
    if (!this.context || !this.master || this.muted) return;
    const length = Math.floor(this.context.sampleRate * 1.2);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      const decay = 1 - index / length;
      data[index] = (Math.random() * 2 - 1) * decay * decay;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 320 + intensity * 260;
    gain.gain.value = 0.09 * intensity;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }
}

export const audioEngine = new AudioEngine();
