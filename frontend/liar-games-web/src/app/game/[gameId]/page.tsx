'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { GameState } from '@/types/game';
import RoundTimer from '@/components/RoundTimer';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { currentGame, fetchGameById, joinGame, submitVote, claimPrize, processRound, hasPlayerVoted, isLoading, error } = useGame();
  const { user, logIn } = useAuth();
  const [vote, setVote] = useState<boolean | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const gameId = params.gameId as string;

  useEffect(() => {
    if (gameId) {
      fetchGameById(gameId);
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        fetchGameById(gameId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [gameId, fetchGameById]);

  // Check if player has voted
  useEffect(() => {
    if (user?.addr && currentGame && currentGame.state === GameState.VOTING_OPEN) {
      hasPlayerVoted(gameId, user.addr).then(setHasVoted);
    }
  }, [user?.addr, currentGame, gameId, hasPlayerVoted]);

  const handleJoinGame = async () => {
    if (!user?.addr) {
      await logIn();
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
    // Refresh to get updated voting status
    await fetchGameById(gameId);
  };

  const handleClaimPrize = async () => {
    await claimPrize(gameId);
    await fetchGameById(gameId);
  };

  const handleProcessRound = async () => {
    setIsProcessing(true);
    try {
      await processRound(gameId);
      await fetchGameById(gameId);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading && !currentGame) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !currentGame) {
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
  const canJoin = (currentGame.state === GameState.VOTING_OPEN || currentGame.state === GameState.ACTIVE) &&
                  currentGame.currentRound === 1 && !isPlayer;
  const canVote = currentGame.state === GameState.VOTING_OPEN && isActive && !hasVoted;
  const canClaim = currentGame.state === GameState.COMPLETE && isWinner;

  // Check if voting deadline has passed and round can be processed
  const votingDeadlinePassed = currentGame.votingDeadline &&
    parseFloat(currentGame.votingDeadline) < Date.now() / 1000;
  const canProcessRound = currentGame.state === GameState.VOTING_OPEN && votingDeadlinePassed;

  const getStateDisplay = () => {
    switch (currentGame.state) {
      case GameState.CREATED:
        return { text: 'Created', color: 'bg-blue-900/50 text-blue-400 border-blue-700' };
      case GameState.ACTIVE:
        return { text: 'Active', color: 'bg-yellow-900/50 text-yellow-400 border-yellow-700' };
      case GameState.VOTING_OPEN:
        if (currentGame.currentRound === 1) {
          return { text: 'Round 1 - Voting (Join Open)', color: 'bg-green-900/50 text-green-400 border-green-700' };
        }
        return { text: `Round ${currentGame.currentRound} - Voting`, color: 'bg-green-900/50 text-green-400 border-green-700' };
      case GameState.PROCESSING_ROUND:
        return { text: 'Processing Round', color: 'bg-orange-900/50 text-orange-400 border-orange-700' };
      case GameState.COMPLETE:
        return { text: 'Complete', color: 'bg-gray-900/50 text-gray-400 border-gray-700' };
      default:
        return { text: currentGame.state, color: 'bg-gray-900/50 text-gray-400 border-gray-700' };
    }
  };

  const stateDisplay = getStateDisplay();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push('/')}
        className="mb-6 text-gray-400 hover:text-white transition-colors"
      >
        ← Back to Games
      </button>

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Game Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-white">Game #{gameId}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${stateDisplay.color}`}>
                {stateDisplay.text}
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
              {currentGame.state === GameState.VOTING_OPEN && currentGame.votingDeadline && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Remaining:</span>
                  <RoundTimer votingDeadline={currentGame.votingDeadline} />
                </div>
              )}
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
                  {isWinner && " (You!)"}
                </p>
              </div>
            )}
          </div>

          {/* Action Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Game Actions</h3>

            {/* Join Game */}
            {canJoin && (
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

            {/* Already Joined */}
            {isPlayer && currentGame.state === GameState.VOTING_OPEN && currentGame.currentRound === 1 && (
              <button
                disabled
                className="w-full bg-gray-600 text-gray-300 font-medium py-3 rounded-lg cursor-not-allowed"
              >
                Already Joined ✓
              </button>
            )}

            {/* Vote Section */}
            {canVote && (
              <div className="space-y-4">
                <p className="text-gray-400">Choose wisely - vote with the minority to survive!</p>

                <div className="space-y-3">
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

            {/* Already Voted */}
            {hasVoted && currentGame.state === GameState.VOTING_OPEN && isActive && (
              <div>
                <p className="text-gray-400 mb-4">
                  You have submitted your vote. Waiting for other players...
                </p>
                <button
                  disabled
                  className="w-full bg-gray-600 text-gray-300 font-medium py-3 rounded-lg cursor-not-allowed"
                >
                  Vote Submitted ✓
                </button>
              </div>
            )}

            {/* Process Round */}
            {canProcessRound && (
              <div>
                <p className="text-gray-400 mb-4">
                  Voting deadline has passed. Anyone can process the round results.
                </p>
                <button
                  onClick={handleProcessRound}
                  disabled={isProcessing}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isProcessing ? 'Processing Round...' : 'Process Round Results'}
                </button>
              </div>
            )}

            {/* Processing State */}
            {currentGame.state === GameState.PROCESSING_ROUND && (
              <div>
                <p className="text-gray-400 mb-4">
                  Round is being processed. Please wait...
                </p>
                <button
                  disabled
                  className="w-full bg-orange-600/20 text-orange-400 font-medium py-3 rounded-lg cursor-not-allowed border border-orange-600/50"
                >
                  Processing Round...
                </button>
              </div>
            )}

            {/* Eliminated */}
            {isPlayer && !isActive && currentGame.state !== GameState.COMPLETE && (
              <div>
                <p className="text-gray-400 mb-4">
                  You were eliminated in round {currentGame.players[user.addr].eliminatedRound}.
                </p>
                <button
                  disabled
                  className="w-full bg-red-600/20 text-red-400 font-medium py-3 rounded-lg cursor-not-allowed border border-red-600/50"
                >
                  Eliminated from Game
                </button>
              </div>
            )}

            {/* Claim Prize */}
            {canClaim && (
              <div>
                <p className="text-gray-400 mb-4">
                  🏆 You won! Claim your prize of {currentGame.prizePool} FLOW
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

            {/* Game Complete - Not Winner */}
            {currentGame.state === GameState.COMPLETE && !isWinner && (
              <div>
                <p className="text-gray-400 mb-4">
                  Game has ended. {currentGame.winner ? `Winner: ${currentGame.winner.slice(0, 6)}...${currentGame.winner.slice(-4)}` : 'No winner'}
                </p>
                <button
                  disabled
                  className="w-full bg-gray-600/20 text-gray-400 font-medium py-3 rounded-lg cursor-not-allowed border border-gray-600/50"
                >
                  Game Completed
                </button>
              </div>
            )}
          </div>

          {/* Voting Status */}
          {currentGame.state === GameState.VOTING_OPEN && currentGame.votingStatus && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Voting Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-900 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">
                    {Object.values(currentGame.votingStatus).filter(Boolean).length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Players Voted</p>
                </div>
                <div className="text-center p-4 bg-gray-900 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-400">
                    {Object.values(currentGame.players).filter(p => p.isActive).length -
                     Object.values(currentGame.votingStatus).filter(Boolean).length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Waiting</p>
                </div>
              </div>
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
                      {round.survivingPlayers.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Survivors:</span>
                          <span className="text-green-400">{round.survivingPlayers.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Players ({Object.values(currentGame.players).filter(p => p.isActive).length} active)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                      {address === user?.addr && '👤 '}
                      {address === currentGame.creator && '👑 '}
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <div className="flex items-center gap-2">
                      {currentGame.state === GameState.VOTING_OPEN &&
                       currentGame.votingStatus?.[address] && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-400">
                          Voted
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        player.isActive
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {player.isActive ? 'Active' : `R${player.eliminatedRound}`}
                      </span>
                    </div>
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