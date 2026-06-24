import confetti from 'canvas-confetti';

export function triggerWinConfetti() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;
  const colors = ['#D4AF37', '#FFDF00', '#FFFFFF', '#eada9b', '#a78224'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.85 },
      colors: colors
    });
    
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.85 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

export function triggerJackpotConfetti() {
  const duration = 4 * 1000;
  const end = Date.now() + duration;
  const colors = ['#D4AF37', '#FFDF00', '#FFFFFF', '#eada9b', '#a78224'];

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 80,
      origin: { x: 0.1, y: 0.8 },
      colors: colors
    });
    
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 80,
      origin: { x: 0.9, y: 0.8 },
      colors: colors
    });
    
    confetti({
      particleCount: 4,
      angle: 90,
      spread: 100,
      origin: { x: 0.5, y: 0.7 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}
