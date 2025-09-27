'use client';

import { useEffect, useState } from 'react';

interface RoundTimerProps {
  votingDeadline?: number | string;
  className?: string;
}

export default function RoundTimer({ votingDeadline, className = '' }: RoundTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('--:--');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!votingDeadline) {
      setTimeRemaining('--:--');
      return;
    }

    const updateTimer = () => {
      const deadline = typeof votingDeadline === 'string' ? parseFloat(votingDeadline) : votingDeadline;
      const now = Date.now() / 1000; // Convert to seconds
      const remaining = deadline - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        setIsUrgent(false);
        return;
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);

      // Format with leading zeros
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setTimeRemaining(formattedTime);

      // Mark as urgent if less than 5 minutes
      setIsUrgent(remaining < 300);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [votingDeadline]);

  const timerColor = isUrgent ? 'text-red-400' : 'text-yellow-400';
  const borderColor = isUrgent ? 'border-red-500' : 'border-yellow-500';

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <svg
        className={`w-4 h-4 ${timerColor}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className={`font-mono font-medium ${timerColor}`}>
        {timeRemaining}
      </span>
    </div>
  );
}