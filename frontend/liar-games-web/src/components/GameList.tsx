'use client';

import { useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GameState } from '@/types/game';
import { useRouter } from 'next/navigation';

export default function GameList() {
  const { games, fetchGames, isLoading } = useGame();
  const router = useRouter();

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const getStateColor = (state: GameState) => {
    switch (state) {
      case GameState.REGISTRATION:
        return 'text-yellow-400';
      case GameState.ACTIVE:
        return 'text-green-400';
      case GameState.COMPLETE:
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStateBadge = (state: GameState) => {
    switch (state) {
      case GameState.REGISTRATION:
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
      case GameState.ACTIVE:
        return 'bg-green-900/50 text-green-400 border-green-700';
      case GameState.COMPLETE:
        return 'bg-gray-900/50 text-gray-400 border-gray-700';
      default:
        return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-400">No games available. Create one to get started!</p>
        </div>
      ) : (
        games.map((game) => (
          <div
            key={game.gameId}
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer border border-gray-700"
            onClick={() => router.push(`/game/${game.gameId}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">Game #{game.gameId}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStateBadge(game.state)}`}>
                {game.state}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Entry Fee:</span>
                <span className="text-white">{game.entryFee} FLOW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prize Pool:</span>
                <span className="text-green-400 font-semibold">{game.prizePool} FLOW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Players:</span>
                <span className="text-white">{Object.keys(game.players).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Round:</span>
                <span className="text-white">{game.currentRound}</span>
              </div>
            </div>

            {game.questionText && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-300 text-sm italic">&ldquo;{game.questionText}&rdquo;</p>
              </div>
            )}

            {game.winner && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-yellow-400 text-sm">
                  Winner: {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}