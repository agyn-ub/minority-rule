'use client';

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateGame() {
  const [entryFee, setEntryFee] = useState('10.0');
  const [questionText, setQuestionText] = useState('Will the majority vote YES?');
  const [showForm, setShowForm] = useState(false);
  const { createGame, isLoading } = useGame();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.addr) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await createGame(entryFee, questionText);
      setShowForm(false);
      setEntryFee('10.0');
      setQuestionText('Will the majority vote YES?');
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        Create New Game
      </button>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Create New Game</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="entryFee" className="block text-sm font-medium text-gray-300 mb-2">
            Entry Fee (FLOW)
          </label>
          <input
            type="number"
            id="entryFee"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            min="0.1"
            step="0.1"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-300 mb-2">
            Question Text
          </label>
          <textarea
            id="question"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the question for voting rounds..."
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !user?.addr}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Game'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}