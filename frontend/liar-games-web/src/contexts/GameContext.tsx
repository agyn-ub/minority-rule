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
  createGame: (entryFee: string, questionText: string) => Promise<void>;
  joinGame: (gameId: string) => Promise<void>;
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
      const formattedGames = gameData.filter(Boolean).map((game: any) => ({
        gameId: game.gameId,
        entryFee: game.entryFee,
        state: game.state as GameState,
        currentRound: parseInt(game.currentRound),
        players: game.players,
        prizePool: game.prizePool,
        roundHistory: game.roundHistory || [],
        votingDeadline: game.votingDeadline,
        questionText: game.questionText,
        creator: game.creator,
        winner: game.winner,
      }));

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
        const formattedGame: Game = {
          gameId: response.gameId,
          entryFee: response.entryFee,
          state: response.state as GameState,
          currentRound: parseInt(response.currentRound),
          players: response.players,
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

  const createGame = useCallback(async (entryFee: string, questionText: string) => {
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
          import FlowToken from 0xFlowToken

          transaction(entryFee: UFix64, questionText: String) {
            prepare(signer: auth(BorrowValue) &Account) {
              let gameId = MinorityRuleGame.createGame(
                creator: signer.address,
                entryFee: entryFee,
                roundDuration: 3600.0,  // 1 hour rounds
                questionText: questionText
              )
              log("Created game with ID: ".concat(gameId.toString()))
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(entryFee, t.UFix64),
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

  const joinGame = useCallback(async (gameId: string) => {
    if (!isInitialized) {
      console.log('FCL not yet initialized, skipping joinGame');
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

          transaction(gameId: UInt64, amount: UFix64) {
            prepare(signer: auth(BorrowValue) &Account) {
              let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
              ) ?? panic("Could not borrow FlowToken vault")

              let payment <- vault.withdraw(amount: amount)
              MinorityRuleGame.joinGame(gameId: gameId, player: signer.address, payment: <-payment)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(gameId, t.UInt64),
          arg(currentGame?.entryFee || "0.0", t.UFix64)
        ],
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchGameById(gameId);
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Failed to join game');
    } finally {
      setIsLoading(false);
    }
  }, [currentGame, fetchGameById]);

  const submitVote = useCallback(async (gameId: string, vote: boolean) => {
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
  }, [fetchGameById]);

  const claimPrize = useCallback(async (gameId: string) => {
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
  }, [fetchGameById]);

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