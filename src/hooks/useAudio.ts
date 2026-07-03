'use client';

import { useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';

export function useAudio() {
  const { soundEnabled, voiceEnabled, volume } = useGameState();
  const volMultiplier = volume / 100;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rocketOscRef = useRef<OscillatorNode | null>(null);
  const rocketGainRef = useRef<GainNode | null>(null);

  const speakText = (text: string, isWin: boolean) => {
    if (!voiceEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        
        // Punctuation helps guide TTS engines for inflection (excited vs sad)
        const phrase = isWin ? "YOU WIN!!!" : "YOU LOSE...";
        const utterance = new SpeechSynthesisUtterance(phrase);
        
        // Find best female voice
        const voices = window.speechSynthesis.getVoices();
        const femalePatterns = [
          'samantha', 'zira', 'salli', 'jessa', 'kiana', 'karen', 'hazel', 
          'susan', 'moira', 'tessa', 'aria', 'jenny', 'sonia', 'stephanie', 
          'libby', 'michelle', 'haruka', 'female', 'woman', 'girl'
        ];
        
        const isFemaleName = (name: string) => {
          const lower = name.toLowerCase();
          return femalePatterns.some(pattern => lower.includes(pattern));
        };

        // Try to find English female voice, then general female voice, then English voice
        let selectedVoice = voices.find(v => {
          const isEn = v.lang.toLowerCase().startsWith('en');
          return isEn && isFemaleName(v.name);
        });

        if (!selectedVoice) {
          selectedVoice = voices.find(v => isFemaleName(v.name));
        }

        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
        }

        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.default) || voices[0];
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Configure speed, pitch, and volume for maximum excitement or sadness (female voice)
        if (isWin) {
          utterance.rate = 1.35; // Fast, high-energy speech rate
          utterance.pitch = 1.5;  // Highly excited high-pitch female tone
          utterance.volume = 1.0 * volMultiplier; // Full volume scaled
        } else {
          utterance.rate = 0.70;  // Slow, disappointed speech rate
          utterance.pitch = 0.60; // Low-pitch sad tone
          utterance.volume = 0.85 * volMultiplier; // Slightly quieter, disappointed tone scaled
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('SpeechSynthesis error:', e);
      }
    }
  };

  useEffect(() => {
    // Warm up the speechSynthesis voices cache (especially for Chrome/Safari)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!soundEnabled) {
      stopRocketEngine();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (rocketGainRef.current && audioCtxRef.current) {
      const time = audioCtxRef.current.currentTime;
      try {
        rocketGainRef.current.gain.setTargetAtTime(0.06 * volMultiplier, time, 0.1);
      } catch (e) {}
    }
  }, [volMultiplier]);

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
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(150, time + 0.08);

    gain.gain.setValueAtTime(0.12 * volMultiplier, time);
    gain.gain.exponentialRampToValueAtTime(0.01 * volMultiplier, time + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  };

  const playWin = () => {
    if (soundEnabled) {
      const ctx = getAudioContext();
      if (ctx) {
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
          gain.gain.linearRampToValueAtTime(0.08 * volMultiplier, noteTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001 * volMultiplier, noteTime + duration + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + duration + 0.2);
        });
      }
    }

    if (voiceEnabled) {
      try {
        const audio = new Audio('/audio/youwin.mp3');
        audio.volume = volume / 100;
        audio.play().catch(() => {
          speakText('WIN', true);
        });
      } catch (e) {
        speakText('WIN', true);
      }
    }
  };

  const playLoss = () => {
    if (soundEnabled) {
      const ctx = getAudioContext();
      if (ctx) {
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

        gain.gain.setValueAtTime(0.12 * volMultiplier, time);
        gain.gain.linearRampToValueAtTime(0.001 * volMultiplier, time + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.35);
      }
    }

    if (voiceEnabled) {
      try {
        const audio = new Audio('/audio/youlose.mp3');
        audio.volume = volume / 100;
        audio.play().catch(() => {
          speakText('You Lose', false);
        });
      } catch (e) {
        speakText('You Lose', false);
      }
    }
  };

  const playPlop = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(350, time + 0.05);

    gain.gain.setValueAtTime(0.07 * volMultiplier, time);
    gain.gain.exponentialRampToValueAtTime(0.001 * volMultiplier, time + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  };

  const startRocketEngine = () => {
    if (!soundEnabled) return;
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

    gain.gain.setValueAtTime(0.01 * volMultiplier, time);
    gain.gain.linearRampToValueAtTime(0.06 * volMultiplier, time + 0.5); // Soft fade-in

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);

    rocketOscRef.current = osc;
    rocketGainRef.current = gain;
  };

  const updateRocketEnginePitch = (multiplier: number) => {
    if (!soundEnabled) return;
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
