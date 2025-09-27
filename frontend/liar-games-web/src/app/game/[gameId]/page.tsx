'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { GameState } from '@/types/game';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { currentGame, fetchGameById, joinGame, submitVote, claimPrize, isLoading, error } = useGame();
  const { user, logIn } = useAuth();
  const [vote, setVote] = useState<boolean | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const gameId = params.gameId as string;

  useEffect(() => {
    if (gameId) {
      fetchGameById(gameId);
    }
  }, [gameId, fetchGameById]);

  const handleJoinGame = async () => {
    if (!user?.addr) {
      // Instead of alert, we'll handle this in the UI
      return;
    }
    await joinGame(gameId);
    // Refresh the game data after joining
    await fetchGameById(gameId);
  };

  const handleSubmitVote = async () => {
    if (vote === null) {
      alert('Please select a vote');
      return;
    }
    await submitVote(gameId, vote);
    setHasVoted(true);
  };

  const handleClaimPrize = async () => {
    await claimPrize(gameId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-400">Game not found</p>
      </div>
    );
  }

  const isPlayer = user?.addr && currentGame.players[user.addr];
  const isActive = isPlayer && currentGame.players[user.addr].isActive;
  const isWinner = currentGame.winner === user?.addr;
  const isInRegistration = currentGame.state === GameState.ACTIVE && currentGame.currentRound === 1;
  const canJoin = isInRegistration && !isPlayer && user?.addr;
  const canVote = currentGame.state === GameState.ACTIVE && isActive && !hasVoted;
  const canClaim = currentGame.state === GameState.COMPLETE && isWinner;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push('/')}
        className="mb-6 text-gray-400 hover:text-white transition-colors"
      >
        ← Back to Games
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Game Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-white">Game #{gameId}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                isInRegistration
                  ? 'bg-yellow-900/50 text-yellow-400 border-yellow-700'
                  : currentGame.state === GameState.ACTIVE
                  ? 'bg-green-900/50 text-green-400 border-green-700'
                  : 'bg-gray-900/50 text-gray-400 border-gray-700'
              }`}>
                {isInRegistration ? 'REGISTRATION' : currentGame.state}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Prize Pool:</span>
                <span className="text-green-400 font-semibold text-xl">{currentGame.prizePool} FLOW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Entry Fee:</span>
                <span className="text-white">{currentGame.entryFee} FLOW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Round:</span>
                <span className="text-white">{currentGame.currentRound}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Players:</span>
                <span className="text-white">
                  {Object.values(currentGame.players).filter(p => p.isActive).length} / {Object.keys(currentGame.players).length}
                </span>
              </div>
            </div>

            {currentGame.questionText && (
              <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Question:</p>
                <p className="text-white text-lg">&ldquo;{currentGame.questionText}&rdquo;</p>
              </div>
            )}

            {currentGame.winner && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <p className="text-yellow-400 font-semibold">
                  Winner: {currentGame.winner.slice(0, 6)}...{currentGame.winner.slice(-4)}
                </p>
              </div>
            )}
          </div>

          {/* Action Section - Always visible with appropriate state */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Game Actions</h3>

            {/* Registration State */}
            {isInRegistration && (
              <>
                {!user?.addr ? (
                  <>
                    <p className="text-gray-400 mb-4">
                      Connect your wallet to join this game
                    </p>
                    <button
                      onClick={logIn}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      Connect Wallet to Join
                    </button>
                  </>
                ) : isPlayer ? (
                  <>
                    <p className="text-gray-400 mb-4">
                      You are registered for this game. Waiting for more players...
                    </p>
                    <button
                      disabled
                      className="w-full bg-gray-600 text-gray-300 font-medium py-3 rounded-lg cursor-not-allowed"
                    >
                      Already Joined ✓
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 mb-4">
                      Entry fee: {currentGame.entryFee} FLOW
                    </p>
                    <button
                      onClick={handleJoinGame}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      {isLoading ? 'Joining...' : 'Join Game'}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Active State - Not a Player */}
            {currentGame.state === GameState.ACTIVE && !isInRegistration && !isPlayer && (
              <>
                <p className="text-gray-400 mb-4">
                  This game is currently in progress. You cannot join an active game.
                </p>
                <button
                  disabled
                  className="w-full bg-yellow-600/20 text-yellow-400 font-medium py-3 rounded-lg cursor-not-allowed border border-yellow-600/50"
                >
                  Game in Progress
                </button>
              </>
            )}

            {/* Active State - Eliminated Player */}
            {currentGame.state === GameState.ACTIVE && !isInRegistration && isPlayer && !isActive && (
              <>
                <p className="text-gray-400 mb-4">
                  You were eliminated in round {currentGame.players[user.addr].eliminatedRound}.
                </p>
                <button
                  disabled
                  className="w-full bg-red-600/20 text-red-400 font-medium py-3 rounded-lg cursor-not-allowed border border-red-600/50"
                >
                  Eliminated from Game
                </button>
              </>
            )}

            {/* Complete State - Not Winner */}
            {currentGame.state === GameState.COMPLETE && !isWinner && (
              <>
                <p className="text-gray-400 mb-4">
                  Game has ended. {currentGame.winner ? `Winner: ${currentGame.winner.slice(0, 6)}...${currentGame.winner.slice(-4)}` : 'No winner'}
                </p>
                <button
                  disabled
                  className="w-full bg-gray-600/20 text-gray-400 font-medium py-3 rounded-lg cursor-not-allowed border border-gray-600/50"
                >
                  Game Completed
                </button>
              </>
            )}
          </div>

          {canVote && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Submit Your Vote</h3>
              <p className="text-gray-400 mb-4">Choose wisely - vote with the minority to survive!</p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="vote"
                    value="true"
                    onChange={() => setVote(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-white font-medium">YES</span>
                </label>

                <label className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="vote"
                    value="false"
                    onChange={() => setVote(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-white font-medium">NO</span>
                </label>
              </div>

              <button
                onClick={handleSubmitVote}
                disabled={isLoading || vote === null}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Submitting...' : 'Submit Vote'}
              </button>
            </div>
          )}

          {canClaim && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">🏆 Congratulations!</h3>
              <p className="text-gray-400 mb-4">
                You won the game! Claim your prize of {currentGame.prizePool} FLOW
              </p>
              <button
                onClick={handleClaimPrize}
                disabled={isLoading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-900 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Claiming...' : 'Claim Prize'}
              </button>
            </div>
          )}

          {/* Round History */}
          {currentGame.roundHistory && currentGame.roundHistory.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Round History</h3>
              <div className="space-y-4">
                {currentGame.roundHistory.map((round, index) => (
                  <div key={index} className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-medium">Round {round.round}</span>
                      <span className="text-xs text-gray-400">
                        {round.eliminatedPlayers.length} eliminated
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Minority voted:</span>
                        <span className="text-green-400">{round.minorityChoice ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total votes:</span>
                        <span className="text-white">{Object.keys(round.votes).length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Players</h3>
            <div className="space-y-2">
              {Object.entries(currentGame.players).map(([address, player]) => (
                <div
                  key={address}
                  className={`p-3 rounded-lg ${
                    player.isActive
                      ? 'bg-gray-700'
                      : 'bg-gray-900 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      player.isActive
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}>
                      {player.isActive ? 'Active' : `Eliminated R${player.eliminatedRound}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}