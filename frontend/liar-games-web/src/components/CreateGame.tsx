'use client';

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateGame() {
  const [entryFee, setEntryFee] = useState('10.0');
  const [questionText, setQuestionText] = useState('Will the majority vote YES?');
  const [roundDuration, setRoundDuration] = useState('30'); // in minutes
  const [durationType, setDurationType] = useState('standard');
  const [showForm, setShowForm] = useState(false);
  const { createGame, isLoading } = useGame();
  const { user } = useAuth();

  const handleDurationTypeChange = (type: string) => {
    setDurationType(type);
    switch (type) {
      case 'quick':
        setRoundDuration('5');
        break;
      case 'standard':
        setRoundDuration('30');
        break;
      case 'long':
        setRoundDuration('60');
        break;
      // custom keeps current value
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.addr) {
      alert('Please connect your wallet first');
      return;
    }

    // Validate duration
    const durationMinutes = parseFloat(roundDuration);
    if (isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
      alert('Round duration must be between 1 minute and 24 hours');
      return;
    }

    try {
      // Convert minutes to seconds for the contract
      const durationSeconds = (durationMinutes * 60).toString();
      await createGame(entryFee, questionText, durationSeconds);
      setShowForm(false);
      setEntryFee('10.0');
      setQuestionText('Will the majority vote YES?');
      setRoundDuration('30');
      setDurationType('standard');
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  // Only render if user is authenticated
  if (!user?.addr) {
    return null;
  }

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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Round Duration
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleDurationTypeChange('quick')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                durationType === 'quick'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Quick
              <span className="block text-xs">5 min</span>
            </button>
            <button
              type="button"
              onClick={() => handleDurationTypeChange('standard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                durationType === 'standard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Standard
              <span className="block text-xs">30 min</span>
            </button>
            <button
              type="button"
              onClick={() => handleDurationTypeChange('long')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                durationType === 'long'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Long
              <span className="block text-xs">1 hour</span>
            </button>
            <button
              type="button"
              onClick={() => handleDurationTypeChange('custom')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                durationType === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Custom
            </button>
          </div>
          {durationType === 'custom' && (
            <input
              type="number"
              id="roundDuration"
              value={roundDuration}
              onChange={(e) => setRoundDuration(e.target.value)}
              min="1"
              max="1440"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter duration in minutes (1-1440)"
            />
          )}
          <p className="text-xs text-gray-400 mt-1">
            Each round will last {roundDuration} minute{parseFloat(roundDuration) !== 1 ? 's' : ''}. Game starts immediately after creation.
          </p>
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