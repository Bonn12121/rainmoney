'use client';

import { useEffect, useRef } from 'react';

export function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rocketOscRef = useRef<OscillatorNode | null>(null);
  const rocketGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // AudioContext will be initialized on first user interaction to satisfy browser policies
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playClick = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(150, time + 0.08);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  };

  const playWin = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;
    // C Major Pentatonic arpeggio for gold victory theme
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const duration = 0.08;

    notes.forEach((freq, idx) => {
      const noteTime = time + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.2);
    });
  };

  const playLoss = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.linearRampToValueAtTime(85, time + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.35);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.35);
  };

  const playPlop = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(350, time + 0.05);

    gain.gain.setValueAtTime(0.07, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  };

  const startRocketEngine = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Stop existing rocket sound if running
    stopRocketEngine();

    const time = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, time); // Deep hum

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, time);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.06, time + 0.5); // Soft fade-in

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);

    rocketOscRef.current = osc;
    rocketGainRef.current = gain;
  };

  const updateRocketEnginePitch = (multiplier: number) => {
    const osc = rocketOscRef.current;
    const ctx = getAudioContext();
    if (!osc || !ctx) return;

    const time = ctx.currentTime;
    // Map multiplier 1.0 -> 5.0 to frequency 65Hz -> 200Hz
    const baseFreq = 65;
    const maxFreq = 220;
    const targetFreq = Math.min(maxFreq, baseFreq + (multiplier - 1.0) * 15);
    osc.frequency.setTargetAtTime(targetFreq, time, 0.1);
  };

  const stopRocketEngine = () => {
    if (rocketOscRef.current && rocketGainRef.current) {
      const ctx = getAudioContext();
      if (ctx) {
        const time = ctx.currentTime;
        const currentGain = rocketGainRef.current;
        const currentOsc = rocketOscRef.current;

        try {
          currentGain.gain.setValueAtTime(currentGain.gain.value, time);
          currentGain.gain.linearRampToValueAtTime(0, time + 0.1); // Quick fade-out
          currentOsc.stop(time + 0.15);
        } catch (e) {
          // ignore already stopped errors
        }
      }
    }
    rocketOscRef.current = null;
    rocketGainRef.current = null;
  };

  return {
    playClick,
    playWin,
    playLoss,
    playPlop,
    startRocketEngine,
    updateRocketEnginePitch,
    stopRocketEngine,
  };
}
