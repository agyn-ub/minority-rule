'use client';

import GameList from '@/components/GameList';
import CreateGame from '@/components/CreateGame';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Active Games</h2>
        <p className="text-gray-400">Vote with the minority to survive. Last player wins the entire prize pool.</p>
      </div>

      <div className="mb-8">
        {!user?.addr ? (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <p className="text-gray-300 mb-4">Connect your wallet to create a new game</p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-auth-button]')?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <CreateGame />
        )}
      </div>

      <GameList />
    </div>
  );
}
