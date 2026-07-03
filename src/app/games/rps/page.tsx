'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Scissors as ScissorsIcon } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';
import { CustomEmoji } from '@/components/ui/CustomEmoji';

type HandOption = 'rock' | 'paper' | 'scissors';
type GameStatus = 'idle' | 'countdown' | 'revealed';

const LABELS: Record<HandOption, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
};

export default function RPSGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [playerChoice, setPlayerChoice] = useState<HandOption | null>(null);
  const [botChoice, setBotChoice] = useState<HandOption | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [countdownText, setCountdownText] = useState<string>('');
  const [result, setResult] = useState<'win' | 'lose' | 'tie' | null>(null);

  const handlePlay = (choice: HandOption) => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setPlayerChoice(choice);
    setBotChoice(null);
    setStatus('countdown');
    setResult(null);

    const sequence = ['Rock...', 'Paper...', 'Scissors...', 'Shoot!'];
    let step = 0;
    
    setCountdownText(sequence[0]);
    playPlop();

    const interval = setInterval(() => {
      step++;
      if (step < sequence.length) {
        setCountdownText(sequence[step]);
        playPlop();
      } else {
        clearInterval(interval);
        
        // Bot choice
        const options: HandOption[] = ['rock', 'paper', 'scissors'];
        const randomBotChoice = options[Math.floor(Math.random() * options.length)];
        setBotChoice(randomBotChoice);
        setStatus('revealed');

        // Evaluate Winner
        if (choice === randomBotChoice) {
          // Tie
          setResult('tie');
          playPlop();
          addCredits(betAmount); // Refund
          addHistoryItem('RPS', betAmount, 1.0, betAmount, 'win');
        } else if (
          (choice === 'rock' && randomBotChoice === 'scissors') ||
          (choice === 'paper' && randomBotChoice === 'rock') ||
          (choice === 'scissors' && randomBotChoice === 'paper')
        ) {
          // Win
          setResult('win');
          playWin();
          triggerWinConfetti();
          const winPayout = Math.round(betAmount * 2.0 * 100) / 100;
          addCredits(winPayout);
          addHistoryItem('RPS', betAmount, 2.0, winPayout, 'win');
        } else {
          // Lose
          setResult('lose');
          playLoss();
          addHistoryItem('RPS', betAmount, 0, 0, 'loss');
        }
      }
    }, 450);
  };

  const handleReset = () => {
    setPlayerChoice(null);
    setBotChoice(null);
    setStatus('idle');
    setResult(null);
    setCountdownText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 flex-grow">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-luxury-border/60 pb-5">
        <Link 
          href="/" 
          onClick={playClick}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors uppercase font-bold tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lobby
        </Link>
        <span className="text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Player vs House Bot
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Bet Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <ScissorsIcon className="w-4 h-4 text-orange-400" />
                RPS BET CONTROLS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              
              {/* Bet Amount */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-neutral-400">
                  <span>Bet Amount</span>
                  <span>Balance: ${credits.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-neutral-500 font-extrabold text-xs">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    disabled={status !== 'idle'}
                    className="w-full bg-black border border-luxury-border focus:border-orange-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={status !== 'idle'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={status !== 'idle'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={status !== 'idle'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-orange-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Hand Buttons */}
              <div className="flex flex-col gap-2.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Choose Hand (Starts Game)</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['rock', 'paper', 'scissors'] as HandOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => handlePlay(option)}
                      disabled={status !== 'idle'}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-luxury-border hover:border-orange-500/50 bg-[#070707] hover:bg-orange-500/5 transition-all text-neutral-300 hover:text-white disabled:opacity-50 font-bold"
                    >
                      <CustomEmoji name={option} className="w-10 h-10" />
                      <span className="text-[10px] uppercase font-bold">{LABELS[option]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {status === 'revealed' && (
                <Button variant="dark" fullWidth size="md" onClick={handleReset} className="font-bold">
                  Play Again
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Duel Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          <Card className="bg-[#050505] border-luxury-border min-h-[420px] flex flex-col items-center justify-center p-8 select-none relative overflow-hidden">
            
            {status === 'idle' && (
              <div className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest">
                Select Rock, Paper, or Scissors to challenge the bot!
              </div>
            )}

            {status === 'countdown' && (
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="flex gap-16">
                   <div className="animate-bounce">
                     <CustomEmoji name="rock" className="w-16 h-16" />
                   </div>
                   <div className="animate-bounce delay-150">
                     <CustomEmoji name="rock" className="w-16 h-16" />
                   </div>
                </div>
                <span className="text-3xl font-black uppercase text-orange-400 tracking-wider animate-pulse">
                  {countdownText}
                </span>
              </div>
            )}

            {status === 'revealed' && playerChoice && botChoice && (
              <div className="w-full flex flex-col items-center gap-8">
                
            <WinLoseOverlay
              isOpen={status === 'revealed' && result !== null}
              onClose={handleReset}
              outcome={result === 'win' ? 'win' : result === 'tie' ? 'cashout' : 'loss'}
              multiplier={result === 'win' ? 2.0 : result === 'tie' ? 1.0 : 0}
              payout={result === 'win' ? betAmount * 2.0 : result === 'tie' ? betAmount : 0}
            />

                {/* Hands Battle layout */}
                <div className="flex items-center justify-center gap-12 sm:gap-20 w-full">
                  {/* Player Hand */}
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Your Choice</span>
                    <div className="w-24 h-28 rounded-2xl bg-neutral-900 border border-luxury-border flex items-center justify-center shadow-lg shadow-black/80">
                      <CustomEmoji name={playerChoice} className="w-14 h-14" />
                    </div>
                    <span className="text-sm font-extrabold text-white uppercase">{LABELS[playerChoice]}</span>
                  </div>

                  {/* VS circle */}
                  <div className="w-10 h-10 rounded-full border border-luxury-border/60 flex items-center justify-center text-xs font-black text-neutral-500 bg-[#070707]">
                    VS
                  </div>

                  {/* Bot Hand */}
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">House Bot</span>
                    <div className="w-24 h-28 rounded-2xl bg-neutral-900 border border-luxury-border flex items-center justify-center shadow-lg shadow-black/80">
                      <CustomEmoji name={botChoice} className="w-14 h-14" />
                    </div>
                    <span className="text-sm font-extrabold text-white uppercase">{LABELS[botChoice]}</span>
                  </div>
                </div>

              </div>
            )}

          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Rock Paper Scissors Rules</strong>:
                  Enter a bet, then choose one of the three hands to start the countdown. 
                  Rock beats Scissors, Scissors beats Paper, and Paper beats Rock. 
                  Winning pays out double (2.0x) your initial bet. 
                  A draw returns your bet amount (1.0x). 
                  Losing means you lose your bet. Good luck!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
