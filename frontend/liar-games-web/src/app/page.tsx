'use client';

import GameList from '@/components/GameList';
import CreateGame from '@/components/CreateGame';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Active Games</h2>
        <p className="text-gray-400">Vote with the minority to survive. Last player wins the entire prize pool.</p>
      </div>

      <div className="mb-8">
        <CreateGame />
      </div>

      <GameList />
    </div>
  );
}
