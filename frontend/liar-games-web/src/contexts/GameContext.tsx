'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Game, GameState } from '@/types/game';
import fcl, { initializeFCL } from '@/lib/flow/config';

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
  setCurrentGame: () => {},
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
          args: (arg: any, t: any) => [arg(gameId, t.UInt64)]
        })
      );

      const gameData = await Promise.all(gamePromises);
      const formattedGames = gameData.filter(Boolean).map((game: any) => {
        // Map Cadence state strings to frontend enum
        let mappedState: GameState;
        switch (game.state) {
          case 'created': // Should not happen anymore, but handle legacy games
          case 'active':
          case 'votingOpen':
          case 'processingRound':
            mappedState = GameState.ACTIVE;
            break;
          case 'complete':
            mappedState = GameState.COMPLETE;
            break;
          default:
            mappedState = GameState.ACTIVE;
        }

        return {
          gameId: game.gameId,
          entryFee: game.entryFee,
          state: mappedState,
          currentRound: parseInt(game.currentRound),
          players: game.players || {},
          prizePool: game.prizePool,
          roundHistory: game.roundHistory || [],
          votingDeadline: game.votingDeadline,
          questionText: game.questionText,
          creator: game.creator,
          winner: game.winner,
        };
      });

      setGames(formattedGames);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to fetch games');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

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
        args: (arg: any, t: any) => [arg(gameId, t.UInt64)]
      });

      if (response) {
        // Map Cadence state strings to frontend enum
        let mappedState: GameState;
        switch (response.state) {
          case 'created': // Should not happen anymore, but handle legacy games
          case 'active':
          case 'votingOpen':
          case 'processingRound':
            mappedState = GameState.ACTIVE;
            break;
          case 'complete':
            mappedState = GameState.COMPLETE;
            break;
          default:
            mappedState = GameState.ACTIVE;
        }

        const formattedGame: Game = {
          gameId: response.gameId,
          entryFee: response.entryFee,
          state: mappedState,
          currentRound: parseInt(response.currentRound),
          players: response.players || {},
          prizePool: response.prizePool,
          roundHistory: response.roundHistory || [],
          votingDeadline: response.votingDeadline,
          questionText: response.questionText,
          creator: response.creator,
          winner: response.winner,
        };
        setCurrentGame(formattedGame);
      }
    } catch (err) {
      console.error('Error fetching game:', err);
      setError('Failed to fetch game details');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

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
        args: (arg: any, t: any) => [
          arg(formatUFix64(entryFee), t.UFix64),
          arg(formatUFix64(roundDuration), t.UFix64),
          arg(questionText, t.String)
        ],
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGames();
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGames, isInitialized]);

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
        args: (arg: any, t: any) => [
          arg(gameId, t.UInt64),
          arg(formatUFix64(gameEntryFee), t.UFix64)
        ],
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGames(); // Refresh all games
      await fetchGameById(gameId);
    } catch (err: any) {
      console.error('Error joining game:', err);
      // Check if it's an "already joined" error (shouldn't happen with pre-check, but just in case)
      if (err?.message?.includes('Player already in game')) {
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
  }, [games, currentGame, fetchGames, fetchGameById, isInitialized]);

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
            prepare(signer: auth(BorrowValue) &Account) {
              MinorityRuleGame.submitVote(gameId: gameId, player: signer.address, vote: vote)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(gameId, t.UInt64),
          arg(vote, t.Bool)
        ],
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
            prepare(signer: auth(BorrowValue, InsertValue) &Account) {
              let vault = signer.storage.borrow<auth(FungibleToken.Deposit) &FlowToken.Vault>(
                from: /storage/flowTokenVault
              ) ?? panic("Could not borrow FlowToken vault")

              let prize <- MinorityRuleGame.claimPrize(gameId: gameId, winner: signer.address)
              vault.deposit(from: <-prize)
            }
          }
        `,
        args: (arg: any, t: any) => [arg(gameId, t.UInt64)],
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGameById(gameId);
    } catch (err) {
      console.error('Error claiming prize:', err);
      setError('Failed to claim prize');
    } finally {
      setIsLoading(false);
    }
  }, [fetchGameById, isInitialized]);

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