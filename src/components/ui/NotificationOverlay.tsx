'use client';

import React, { useState, useEffect } from 'react';

interface AlertItem {
  id: string;
  message: string;
  title: string;
  type: 'success' | 'warning' | 'info' | 'error';
  icon: string;
}

export function NotificationOverlay() {
  const [currentAlert, setCurrentAlert] = useState<AlertItem | null>(null);
  const [alertQueue, setAlertQueue] = useState<AlertItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Helper to determine title, type, and emoji icon based on message content
  const parseAlert = (message: string): Omit<AlertItem, 'id'> => {
    const msg = message.toLowerCase();
    
    if (msg.includes('congratulations') || msg.includes('won') || msg.includes('success') || msg.includes('profit') || msg.includes('reward')) {
      return {
        message,
        title: 'Platform Payout',
        type: 'success',
        icon: '💸',
      };
    }
    if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('limit')) {
      return {
        message,
        title: 'System Balance',
        type: 'warning',
        icon: '⚠️',
      };
    }
    if (msg.includes('invalid') || msg.includes('error') || msg.includes('fail') || msg.includes('not allow')) {
      return {
        message,
        title: 'Action Error',
        type: 'error',
        icon: '❌',
      };
    }
    return {
      message,
      title: 'RainMoney Alert',
      type: 'info',
      icon: '🔔',
    };
  };

  const playChime = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      const time = ctx.currentTime;
      // High-low dual note premium chime (C5 to E5 arpeggio)
      const notes = [523.25, 659.25];
      notes.forEach((freq, idx) => {
        const noteTime = time + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.04, noteTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } catch (e) {}
  };

  const triggerAlert = (message: string) => {
    const parsed = parseAlert(message);
    const newItem: AlertItem = {
      id: Math.random().toString(36).substring(2, 9),
      ...parsed,
    };
    setAlertQueue((prev) => [...prev, newItem]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Save reference to old alert just in case
      const originalAlert = window.alert;
      
      // Override window.alert
      window.alert = (message: string) => {
        console.log('Intercepted alert:', message);
        triggerAlert(message);
      };

      // Listen to custom show-notification event
      const handleCustomNotification = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail && customEvent.detail.message) {
          triggerAlert(customEvent.detail.message);
        }
      };

      window.addEventListener('show-notification', handleCustomNotification);
      
      return () => {
        window.alert = originalAlert;
        window.removeEventListener('show-notification', handleCustomNotification);
      };
    }
  }, []);

  // Process queue
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const next = alertQueue[0];
      setAlertQueue((prev) => prev.slice(1));
      setCurrentAlert(next);
      setIsVisible(true);
      playChime();

      // Show for 4.2 seconds then close
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Let it slide out before resetting currentAlert
        setTimeout(() => {
          setCurrentAlert(null);
        }, 600);
      }, 4200);

      return () => clearTimeout(timer);
    }
  }, [alertQueue, currentAlert]);

  if (!currentAlert) return null;

  // Colorful light borders/glows based on type
  const typeBorderColor = {
    success: 'border-emerald-500/20 shadow-[0_20px_50px_rgba(16,185,129,0.22)]',
    warning: 'border-amber-500/20 shadow-[0_20px_50px_rgba(245,158,11,0.18)]',
    error: 'border-red-500/20 shadow-[0_20px_50px_rgba(239,68,68,0.18)]',
    info: 'border-blue-500/20 shadow-[0_20px_50px_rgba(59,130,246,0.18)]',
  }[currentAlert.type];

  const typeIconBg = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }[currentAlert.type];

  return (
    <div 
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] w-[370px] sm:w-[410px] pointer-events-none"
    >
      <div 
        className={`w-full bg-[#0b0f22]/95 backdrop-blur-xl border ${typeBorderColor} rounded-3xl p-4 flex flex-row items-start gap-3.5 shadow-2xl relative transition-all duration-600 pointer-events-auto`}
        style={{
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-140%) scale(0.9)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* Left Side Icon App Container */}
        <div className={`w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center text-xl shadow-inner ${typeIconBg}`}>
          {currentAlert.icon}
        </div>

        {/* Center content */}
        <div className="flex-grow flex flex-col min-w-0 pr-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 leading-none font-sans">
              {currentAlert.title}
            </span>
          </div>
          <p className="text-[11px] sm:text-[12px] text-white font-semibold leading-relaxed mt-1.5 break-words font-sans">
            {currentAlert.message}
          </p>
        </div>

        {/* Timestamp on right */}
        <span className="absolute top-4 right-4 text-[9px] font-black text-neutral-500 uppercase tracking-wider font-sans">
          now
        </span>
      </div>
    </div>
  );
}
