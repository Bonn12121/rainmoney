'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Award, Grid as GridIcon } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

type Player = 'X' | 'O';
type CellValue = Player | null;
type Board = CellValue[];

export default function ToeGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [winner, setWinner] = useState<CellValue | 'draw' | null>(null);

  const multiplier = 2.5;
  const potentialPayout = Math.round(betAmount * multiplier * 100) / 100;

  const handleStartGame = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlaying(true);
  };

  const checkWinner = (tempBoard: Board): CellValue | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (tempBoard[a] && tempBoard[a] === tempBoard[b] && tempBoard[a] === tempBoard[c]) {
        return tempBoard[a];
      }
    }

    if (tempBoard.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  };

  const makeBotMove = (currentBoard: Board) => {
    const emptyIndices = currentBoard
      .map((cell, idx) => cell === null ? idx : null)
      .filter((val): val is number => val !== null);

    if (emptyIndices.length === 0) return;

    // 1. Can bot win in one move? (O)
    for (let i = 0; i < emptyIndices.length; i++) {
      const idx = emptyIndices[i];
      const testBoard = [...currentBoard];
      testBoard[idx] = 'O';
      if (checkWinner(testBoard) === 'O') {
        executeBotMove(idx, currentBoard);
        return;
      }
    }

    // 2. Can player win in one move? Block player (X)
    for (let i = 0; i < emptyIndices.length; i++) {
      const idx = emptyIndices[i];
      const testBoard = [...currentBoard];
      testBoard[idx] = 'X';
      if (checkWinner(testBoard) === 'X') {
        executeBotMove(idx, currentBoard);
        return;
      }
    }

    // 3. Take center if open
    if (currentBoard[4] === null) {
      executeBotMove(4, currentBoard);
      return;
    }

    // 4. Take random open corner
    const corners = [0, 2, 6, 8].filter(idx => currentBoard[idx] === null);
    if (corners.length > 0) {
      const randomCorner = corners[Math.floor(Math.random() * corners.length)];
      executeBotMove(randomCorner, currentBoard);
      return;
    }

    // 5. Take random edge
    const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    executeBotMove(randomIdx, currentBoard);
  };

  const executeBotMove = (index: number, currentBoard: Board) => {
    setTimeout(() => {
      const nextBoard = [...currentBoard];
      nextBoard[index] = 'O';
      setBoard(nextBoard);
      playPlop();

      const gameWinner = checkWinner(nextBoard);
      if (gameWinner) {
        handleGameEnd(gameWinner);
      }
    }, 400);
  };

  const handleCellClick = (index: number) => {
    if (!isPlaying || board[index] !== null) return;

    // Player Move
    playPlop();
    const nextBoard = [...board];
    nextBoard[index] = 'X';
    setBoard(nextBoard);

    const gameWinner = checkWinner(nextBoard);
    if (gameWinner) {
      handleGameEnd(gameWinner);
    } else {
      // Bot Move
      makeBotMove(nextBoard);
    }
  };

  const handleGameEnd = (gameWinner: CellValue | 'draw') => {
    setIsPlaying(false);
    setWinner(gameWinner);

    if (gameWinner === 'X') {
      // Player won
      playWin();
      triggerWinConfetti();
      addCredits(potentialPayout);
      addHistoryItem('Tic-Tac-Toe', betAmount, multiplier, potentialPayout, 'win');
    } else if (gameWinner === 'O') {
      // Bot won
      playLoss();
      addHistoryItem('Tic-Tac-Toe', betAmount, 0, 0, 'loss');
    } else if (gameWinner === 'draw') {
      // Draw
      playPlop();
      addCredits(betAmount); // Refund
      addHistoryItem('Tic-Tac-Toe', betAmount, 1.0, betAmount, 'win');
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlaying(false);
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
        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Tic-Tac-Toe vs Bot
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <GridIcon className="w-4 h-4 text-indigo-400" />
                TOE BET CONTROLS
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
                    disabled={isPlaying}
                    className="w-full bg-black border border-luxury-border focus:border-indigo-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-indigo-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isPlaying && winner === null && (
                <Button variant="gold" fullWidth size="lg" onClick={handleStartGame} className="bg-indigo-500 hover:bg-indigo-400 text-black border-none font-bold">
                  Place Bet & Play
                </Button>
              )}

              {winner !== null && (
                <Button variant="dark" fullWidth size="lg" onClick={handleReset} className="font-bold">
                  Play Again
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Board Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          <Card className="bg-[#050505] border-luxury-border min-h-[420px] flex flex-col items-center justify-center p-8 select-none relative overflow-hidden">
            
            {!isPlaying && winner === null && (
              <div className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest">
                Place a bet and challenge the bot!
              </div>
            )}

            <WinLoseOverlay
              isOpen={winner !== null}
              onClose={handleReset}
              outcome={winner === 'X' ? 'win' : winner === 'draw' ? 'cashout' : 'loss'}
              multiplier={winner === 'X' ? 2.5 : winner === 'draw' ? 1.0 : 0}
              payout={winner === 'X' ? potentialPayout : winner === 'draw' ? betAmount : 0}
            />

            {/* Tic Tac Toe Grid */}
            {(isPlaying || winner !== null) && (
              <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] aspect-square mt-8">
                {board.map((cell, idx) => (
                  <button
                    key={idx}
                    disabled={!isPlaying || cell !== null}
                    onClick={() => handleCellClick(idx)}
                    className={`aspect-square rounded-2xl border flex items-center justify-center font-sans font-black text-3xl transition-all ${
                      cell === null
                        ? isPlaying
                          ? 'bg-neutral-900 border-luxury-border hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer'
                          : 'bg-neutral-900 border-luxury-border/30 opacity-50'
                        : cell === 'X'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                        : 'bg-pink-500/10 border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.2)]'
                    }`}
                  >
                    {cell}
                  </button>
                ))}
              </div>
            )}

          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Tic-Tac-Toe Rules</strong>:
                  Place your bet. You will be playing as <strong>X</strong> and the House bot will play as <strong>O</strong>. 
                  Place three of your marks in a horizontal, vertical, or diagonal row to win the game. 
                  Winning rewards a <strong>2.5x</strong> payout. 
                  A draw refunds your initial bet (1.0x). 
                  Losing to the AI results in losing the bet.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
