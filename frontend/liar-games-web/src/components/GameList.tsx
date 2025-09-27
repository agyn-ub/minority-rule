'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { GameState } from '@/types/game';
import { useRouter } from 'next/navigation';
import RoundTimer from './RoundTimer';

export default function GameList() {
  const { games, fetchGames, isLoading, joinGame } = useGame();
  const { user, logIn } = useAuth();
  const router = useRouter();
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const getStateColor = (state: GameState) => {
    switch (state) {
      case GameState.ACTIVE:
        return 'text-green-400';
      case GameState.COMPLETE:
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStateBadge = (state: GameState, currentRound: number) => {
    if (state === GameState.ACTIVE) {
      if (currentRound === 1) {
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
      }
      return 'bg-green-900/50 text-green-400 border-green-700';
    }
    if (state === GameState.COMPLETE) {
      return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
    return 'bg-gray-900/50 text-gray-400 border-gray-700';
  };

  const getStateText = (state: GameState, currentRound: number) => {
    if (state === GameState.ACTIVE) {
      if (currentRound === 1) {
        return 'Round 1 - Open';
      }
      return `Round ${currentRound}`;
    }
    return state;
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
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStateBadge(game.state, game.currentRound)}`}>
                {getStateText(game.state, game.currentRound)}
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
              {game.state === GameState.ACTIVE && game.votingDeadline && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time left:</span>
                  <RoundTimer votingDeadline={game.votingDeadline} />
                </div>
              )}
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

            {/* Join Game Button - Only available in Round 1 */}
            {game.state === GameState.ACTIVE && game.currentRound === 1 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                {!user?.addr ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      logIn();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Connect Wallet to Join
                  </button>
                ) : user?.addr && game.players[user.addr] ? (
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Already Joined
                  </button>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setJoiningGameId(game.gameId);
                      await joinGame(game.gameId, game.entryFee);
                      await fetchGames(); // Refresh the games list after joining
                      setJoiningGameId(null);
                    }}
                    disabled={joiningGameId === game.gameId || (user?.addr && game.players[user.addr])}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joiningGameId === game.gameId ? 'Joining...' : `Join Game (${game.entryFee} FLOW)`}
                  </button>
                )}
              </div>
            )}

            {/* Game Status for Round 2+ */}
            {game.state === GameState.ACTIVE && game.currentRound > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg cursor-not-allowed border border-yellow-600/50"
                  disabled
                >
                  Game in Progress
                </button>
              </div>
            )}

            {game.state === GameState.COMPLETE && !game.winner && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg cursor-not-allowed border border-gray-600/50"
                  disabled
                >
                  Game Completed
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}