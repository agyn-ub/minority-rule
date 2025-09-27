'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, balance, logIn, logOut } = useAuth();

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">Minority Rule Game</h1>
          </div>

          <div className="flex items-center space-x-4">
            {user?.addr ? (
              <>
                <span className="text-gray-300 text-sm">
                  {user.addr.slice(0, 6)}...{user.addr.slice(-4)}
                </span>
                {balance !== null && (
                  <span className="text-green-400 text-sm font-medium">
                    {balance} FLOW
                  </span>
                )}
                <button
                  onClick={logOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={logIn}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}