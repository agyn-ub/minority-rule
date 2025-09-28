'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Game, GameState, Player } from '@/types/game';
import fcl, { initializeFCL } from '@/lib/flow/config';
import { useAuth } from '@/contexts/AuthContext';
import * as types from '@onflow/types';

// Type for FCL args function
type ArgsFn = (arg: typeof fcl.arg, t: typeof types) => unknown[];

interface GameContextType {
  games: Game[];
  currentGame: Game | null;
  isLoading: boolean;
  error: string | null;
  fetchGames: () => Promise<void>;
  fetchGameById: (gameId: string) => Promise<void>;
  createGame: (entryFee: string, questionText: string, roundDuration?: string) => Promise<void>;
  joinGame: (gameId: string, entryFee?: string) => Promise<void>;
  submitVote: (gameId: string, vote: boolean) => Promise<void>;
  claimPrize: (gameId: string) => Promise<void>;
  processRound: (gameId: string) => Promise<void>;
  hasPlayerVoted: (gameId: string, playerAddress: string) => Promise<boolean>;
  setCurrentGame: (game: Game | null) => void;
}

const GameContext = createContext<GameContextType>({
  games: [],
  currentGame: null,
  isLoading: false,
  error: null,
  fetchGames: async () => {},
  fetchGameById: async () => {},
  createGame: async () => {},
  joinGame: async () => {},
  submitVote: async () => {},
  claimPrize: async () => {},
  processRound: async () => {},
  hasPlayerVoted: async () => false,
  setCurrentGame: () => {},
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { fetchBalance } = useAuth();

  // Initialize FCL on mount
  useEffect(() => {
    initializeFCL();
    setIsInitialized(true);
  }, []);

  const fetchGames = useCallback(async () => {
    // Wait for FCL to be initialized
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping fetchGames');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fcl.query({
        cadence: `
          import MinorityRuleGame from 0xMinorityRuleGame

          access(all) fun main(): [UInt64] {
            return MinorityRuleGame.getAllGames()
          }
        `
      });

      const gamePromises = response.map((gameId: string) =>
        fcl.query({
          cadence: `
            import MinorityRuleGame from 0xMinorityRuleGame

            access(all) fun main(gameId: UInt64): MinorityRuleGame.GameInfo? {
              return MinorityRuleGame.getGameInfo(gameId: gameId)
            }
          `,
          args: ((arg, t) => [arg(gameId, t.UInt64)]) as ArgsFn
        })
      );

      const gameData = await Promise.all(gamePromises);
      const formattedGames = gameData.filter(Boolean).map((game: Record<string, unknown>) => {
        // Map Cadence state to frontend enum
        let mappedState: GameState;
        switch (game.state) {
          case 'created':
            mappedState = GameState.CREATED;
            break;
          case 'active':
            mappedState = GameState.ACTIVE;
            break;
          case 'votingOpen':
            mappedState = GameState.VOTING_OPEN;
            break;
          case 'processingRound':
            mappedState = GameState.PROCESSING_ROUND;
            break;
          case 'complete':
            mappedState = GameState.COMPLETE;
            break;
          default:
            mappedState = GameState.ACTIVE;
        }

        // Parse players - GameInfo returns an array of addresses
        const playersObj: Record<string, Player> = {};
        if (game.players && Array.isArray(game.players)) {
          // Fetch detailed player data if needed
          game.players.forEach((address: string) => {
            playersObj[address] = {
              address,
              isActive: true, // Will be updated with proper data later
              joinedAt: 0,
              votingHistory: [],
              eliminatedRound: undefined
            };
          });
        }

        // Parse round history properly
        const roundHistory = (game.roundHistory as Array<Record<string, unknown>>)?.map((round) => ({
          round: parseInt(String(round.round)),
          votes: (round.votes || {}) as Record<string, boolean>,
          minorityChoice: round.minorityChoice as boolean | undefined,
          eliminatedPlayers: (round.eliminatedPlayers || []) as string[],
          survivingPlayers: (round.survivingPlayers || []) as string[],
          timestamp: parseFloat(String(round.timestamp))
        })) || [];

        return {
          gameId: String(game.gameId),
          entryFee: String(game.entryFee),
          state: mappedState,
          currentRound: parseInt(String(game.currentRound)),
          players: playersObj,
          prizePool: String(game.prizePool),
          roundHistory,
          votingDeadline: String(game.votingDeadline),
          questionText: String(game.questionText),
          creator: String(game.creator),
          winner: game.winner ? String(game.winner) : undefined,
          roundDuration: String(game.roundDuration || '1800.0')
        } as Game;
      });

      setGames(formattedGames);
    } catch (err) {
      // Only log in development to reduce console spam
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching games:', err);
      }
      // Don't set error for network issues if we already have data
      if (games.length === 0) {
        setError('Failed to fetch games');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, games.length]);

  const fetchGameById = useCallback(async (gameId: string) => {
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping fetchGameById');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fcl.query({
        cadence: `
          import MinorityRuleGame from 0xMinorityRuleGame

          access(all) fun main(gameId: UInt64): MinorityRuleGame.GameInfo? {
            return MinorityRuleGame.getGameInfo(gameId: gameId)
          }
        `,
        args: ((arg, t) => [arg(gameId, t.UInt64)]) as ArgsFn
      });

      if (response) {
        // Map Cadence state to frontend enum
        let mappedState: GameState;
        switch (response.state) {
          case 'created':
            mappedState = GameState.CREATED;
            break;
          case 'active':
            mappedState = GameState.ACTIVE;
            break;
          case 'votingOpen':
            mappedState = GameState.VOTING_OPEN;
            break;
          case 'processingRound':
            mappedState = GameState.PROCESSING_ROUND;
            break;
          case 'complete':
            mappedState = GameState.COMPLETE;
            break;
          default:
            mappedState = GameState.ACTIVE;
        }

        // Parse players - GameInfo returns an array of addresses
        const playersObj: Record<string, Player> = {};
        if (response.players && Array.isArray(response.players)) {
          response.players.forEach((address: string) => {
            playersObj[address] = {
              address,
              isActive: true, // Will be updated with proper data later
              joinedAt: 0,
              votingHistory: [],
              eliminatedRound: undefined
            };
          });
        }

        // Parse round history properly
        const roundHistory = (response.roundHistory as Array<Record<string, unknown>>)?.map((round) => ({
          round: parseInt(String(round.round)),
          votes: (round.votes || {}) as Record<string, boolean>,
          minorityChoice: round.minorityChoice as boolean | undefined,
          eliminatedPlayers: (round.eliminatedPlayers || []) as string[],
          survivingPlayers: (round.survivingPlayers || []) as string[],
          timestamp: parseFloat(String(round.timestamp))
        })) || [];

        // Get voting status if game is in voting state
        let votingStatus = undefined;
        if (mappedState === GameState.VOTING_OPEN) {
          try {
            const votingResponse = await fcl.query({
              cadence: `
                import MinorityRuleGame from 0xMinorityRuleGame

                access(all) fun main(gameId: UInt64): {Address: Bool}? {
                  let game = MinorityRuleGame.borrowGame(gameId)
                  if game == nil {
                    return nil
                  }
                  return game!.getVotingStatus()
                }
              `,
              args: ((arg, t) => [arg(response.gameId, t.UInt64)]) as ArgsFn
            });
            votingStatus = votingResponse;
          } catch (err) {
            console.error('Error fetching voting status:', err);
          }
        }

        // Update player active status based on round history
        roundHistory.forEach((round) => {
          round.eliminatedPlayers?.forEach((address: string) => {
            if (playersObj[address]) {
              playersObj[address].isActive = false;
              playersObj[address].eliminatedRound = round.round;
            }
          });
        });

        const formattedGame: Game = {
          gameId: String(response.gameId),
          entryFee: String(response.entryFee),
          state: mappedState,
          currentRound: parseInt(String(response.currentRound)),
          players: playersObj,
          prizePool: String(response.prizePool),
          roundHistory,
          votingDeadline: String(response.votingDeadline),
          questionText: String(response.questionText),
          creator: String(response.creator),
          winner: response.winner ? String(response.winner) : undefined,
          roundDuration: String(response.roundDuration || '1800.0'),
          votingStatus
        };
        setCurrentGame(formattedGame);
      }
    } catch (err) {
      // Only log in development to reduce console spam
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching game:', err);
      }
      // Don't set error if we already have the game data
      if (!currentGame || currentGame.gameId !== gameId) {
        setError('Failed to fetch game details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, currentGame]);

  // Helper function to format UFix64 values for Cadence
  const formatUFix64 = (value: string): string => {
    // If no decimal point, add .0
    return value.includes('.') ? value : `${value}.0`;
  };

  const createGame = useCallback(async (entryFee: string, questionText: string, roundDuration: string = '1800') => {
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping createGame');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import MinorityRuleGame from 0xMinorityRuleGame
          import FungibleToken from 0xFungibleToken
          import FlowToken from 0xFlowToken

          transaction(entryFee: UFix64, roundDuration: UFix64, questionText: String) {
            let creator: Address
            let paymentVault: @{FungibleToken.Vault}

            prepare(signer: auth(BorrowValue, SaveValue) &Account) {
              self.creator = signer.address

              // Get the creator's FlowToken vault
              let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
                  ?? panic("Could not borrow reference to owner's vault")

              // Withdraw the entry fee for the creator
              self.paymentVault <- vaultRef.withdraw(amount: entryFee)
            }

            execute {
              // Create the game with creator's payment (creator is automatically added as first player)
              let gameId = MinorityRuleGame.createGame(
                creator: self.creator,
                entryFee: entryFee,
                roundDuration: roundDuration,
                questionText: questionText,
                payment: <- self.paymentVault
              )

              log("Created new game with ID: ".concat(gameId.toString()).concat(" and joined as creator"))
            }
          }
        `,
        args: ((arg, t) => [
          arg(formatUFix64(entryFee), t.UFix64),
          arg(formatUFix64(roundDuration), t.UFix64),
          arg(questionText, t.String)
        ]) as ArgsFn,
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGames();
      await fetchBalance(); // Refresh balance after creating game
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGames, isInitialized, fetchBalance]);

  const joinGame = useCallback(async (gameId: string, entryFee?: string) => {
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping joinGame');
      return;
    }

    // Get current user
    const user = await fcl.currentUser.snapshot();
    if (!user?.addr) {
      setError('Please connect your wallet first');
      return;
    }

    // Check if player has already joined this game
    const game = games.find(g => g.gameId === gameId) || currentGame;
    if (game?.players && game.players[user.addr]) {
      console.log('Player has already joined this game');
      setError('You have already joined this game');
      // Refresh to ensure UI is in sync
      await fetchGames();
      if (currentGame?.gameId === gameId) {
        await fetchGameById(gameId);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get the entry fee from the game if not provided
      const gameEntryFee = entryFee || game?.entryFee || "0.0";

      const transactionId = await fcl.mutate({
        cadence: `
          import FungibleToken from 0xFungibleToken
          import FlowToken from 0xFlowToken
          import MinorityRuleGame from 0xMinorityRuleGame

          transaction(gameId: UInt64, amount: UFix64) {

            let paymentVault: @{FungibleToken.Vault}
            let playerAddress: Address

            prepare(signer: auth(BorrowValue, SaveValue) &Account) {
              // Get the player's FlowToken vault
              let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
                  ?? panic("Could not borrow reference to owner's vault")

              // Withdraw the entry fee
              self.paymentVault <- vaultRef.withdraw(amount: amount)
              self.playerAddress = signer.address
            }

            execute {
              // Get reference to the game
              let game = MinorityRuleGame.borrowGame(gameId)
                  ?? panic("Game does not exist")

              // Join the game with payment
              // The contract will handle duplicate join validation
              game.joinGame(player: self.playerAddress, payment: <- self.paymentVault)

              log("Player ".concat(self.playerAddress.toString()).concat(" joined game ").concat(gameId.toString()))
            }
          }
        `,
        args: ((arg, t) => [
          arg(gameId, t.UInt64),
          arg(formatUFix64(gameEntryFee), t.UFix64)
        ]) as ArgsFn,
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGames(); // Refresh all games
      await fetchGameById(gameId);
      await fetchBalance(); // Refresh balance after joining game
    } catch (err) {
      console.error('Error joining game:', err);
      // Check if it's an "already joined" error (shouldn't happen with pre-check, but just in case)
      if ((err as Error)?.message?.includes('Player already in game')) {
        setError('You have already joined this game');
        // Still refresh to ensure UI is in sync
        await fetchGames();
        await fetchGameById(gameId);
      } else {
        setError('Failed to join game');
      }
      // Don't throw - handle error gracefully in UI
    } finally {
      setIsLoading(false);
    }
  }, [games, currentGame, fetchGames, fetchGameById, isInitialized, fetchBalance]);

  const submitVote = useCallback(async (gameId: string, vote: boolean) => {
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping submitVote');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import MinorityRuleGame from 0xMinorityRuleGame

          transaction(gameId: UInt64, vote: Bool) {
            let playerAddress: Address

            prepare(signer: auth(BorrowValue) &Account) {
              self.playerAddress = signer.address
            }

            execute {
              // Get reference to the game
              let game = MinorityRuleGame.borrowGame(gameId)
                  ?? panic("Game does not exist")

              // Submit the vote
              game.submitVote(player: self.playerAddress, vote: vote)

              log("Player ".concat(self.playerAddress.toString()).concat(" submitted vote for game ").concat(gameId.toString()))
            }
          }
        `,
        args: ((arg, t) => [
          arg(gameId, t.UInt64),
          arg(vote, t.Bool)
        ]) as ArgsFn,
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGameById(gameId);
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError('Failed to submit vote');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGameById, isInitialized]);

  const claimPrize = useCallback(async (gameId: string) => {
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping claimPrize');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import MinorityRuleGame from 0xMinorityRuleGame
          import FlowToken from 0xFlowToken
          import FungibleToken from 0xFungibleToken

          transaction(gameId: UInt64) {
            let winnerAddress: Address
            let receiverRef: &{FungibleToken.Receiver}

            prepare(signer: auth(BorrowValue) &Account) {
              self.winnerAddress = signer.address

              // Get reference to winner's FlowToken receiver
              self.receiverRef = signer.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                  ?? panic("Could not borrow reference to receiver")
            }

            execute {
              // Get reference to the game
              let game = MinorityRuleGame.borrowGame(gameId)
                  ?? panic("Game does not exist")

              // Claim the prize
              let prize <- game.claimPrize(winner: self.winnerAddress)
              let prizeAmount = prize.balance

              // Deposit prize into winner's vault
              self.receiverRef.deposit(from: <- prize)

              log("Winner ".concat(self.winnerAddress.toString())
                  .concat(" claimed prize of ")
                  .concat(prizeAmount.toString())
                  .concat(" FLOW from game ")
                  .concat(gameId.toString()))
            }
          }
        `,
        args: ((arg, t) => [arg(gameId, t.UInt64)]) as ArgsFn,
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGameById(gameId);
      await fetchBalance(); // Refresh balance after claiming prize
    } catch (err) {
      console.error('Error claiming prize:', err);
      setError('Failed to claim prize');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGameById, isInitialized, fetchBalance]);

  const processRound = useCallback(async (gameId: string) => {
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping processRound');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import MinorityRuleGame from 0xMinorityRuleGame

          transaction(gameId: UInt64) {
            let signerAddress: Address

            prepare(signer: auth(Storage) &Account) {
              self.signerAddress = signer.address
            }

            execute {
              // Get reference to the game
              let game = MinorityRuleGame.borrowGame(gameId)
                  ?? panic("Game does not exist")

              // Check if the signer is the creator
              if game.creator == self.signerAddress {
                  // Creator can process anytime
                  game.processRoundAsCreator(creator: self.signerAddress)
                  log("Creator processed round ".concat(game.currentRound.toString())
                      .concat(" for game ")
                      .concat(gameId.toString()))
              } else {
                  // Regular processing (requires deadline to be reached)
                  game.processRound()
                  log("Processed round ".concat(game.currentRound.toString())
                      .concat(" for game ")
                      .concat(gameId.toString())
                      .concat(" after deadline"))
              }
            }
          }
        `,
        args: ((arg, t) => [arg(gameId, t.UInt64)]) as ArgsFn,
        limit: 1000 // Higher limit for processing
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGameById(gameId);
      await fetchGames(); // Refresh all games as well
    } catch (err) {
      console.error('Error processing round:', err);
      setError('Failed to process round');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGameById, fetchGames, isInitialized]);

  const hasPlayerVoted = useCallback(async (gameId: string, playerAddress: string): Promise<boolean> => {
    if (!isInitialized) {
      return false;
    }
    try {
      const response = await fcl.query({
        cadence: `
          import MinorityRuleGame from 0xMinorityRuleGame

          access(all) fun main(gameId: UInt64, player: Address): Bool {
            let game = MinorityRuleGame.borrowGame(gameId)
            if game == nil {
              return false
            }
            return game!.hasPlayerVoted(player: player)
          }
        `,
        args: ((arg, t) => [
          arg(gameId, t.UInt64),
          arg(playerAddress, t.Address)
        ]) as ArgsFn
      });
      return response || false;
    } catch (err) {
      console.error('Error checking vote status:', err);
      return false;
    }
  }, [isInitialized]);

  return (
    <GameContext.Provider
      value={{
        games,
        currentGame,
        isLoading,
        error,
        fetchGames,
        fetchGameById,
        createGame,
        joinGame,
        submitVote,
        claimPrize,
        processRound,
        hasPlayerVoted,
        setCurrentGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};