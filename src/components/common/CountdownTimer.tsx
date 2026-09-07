import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  className = '',
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    isExpired: boolean;
    percentage: number;
  }>({ minutes: 15, seconds: 0, isExpired: false, percentage: 100 });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const totalSecondsLeft = Math.max(0, Math.floor((target - now) / 1000));

      if (totalSecondsLeft <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true, percentage: 0 });
        if (onExpire) onExpire();
        return;
      }

      const mins = Math.floor(totalSecondsLeft / 60);
      const secs = totalSecondsLeft % 60;
      const totalAllowedSeconds = 15 * 60; // 15 mins window
      const pct = Math.min(100, Math.max(0, (totalSecondsLeft / totalAllowedSeconds) * 100));

      setTimeLeft({
        minutes: mins,
        seconds: secs,
        isExpired: false,
        percentage: pct,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isUrgent = timeLeft.minutes < 5 && !timeLeft.isExpired;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
          timeLeft.isExpired
            ? 'bg-slate-100 text-slate-500 line-through'
            : isUrgent
            ? 'bg-red-100 text-red-700 animate-pulse'
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        } ${className}`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>
          {timeLeft.isExpired
            ? 'Expired'
            : `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        timeLeft.isExpired
          ? 'bg-slate-50 border-slate-200 text-slate-500'
          : isUrgent
          ? 'bg-red-50/80 border-red-200 text-red-900 shadow-sm'
          : 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertCircle className="w-5 h-5 text-red-600 animate-bounce" />
          ) : (
            <Clock className="w-5 h-5 text-amber-600" />
          )}
          <span className="font-bold text-xs uppercase tracking-wide">
            {timeLeft.isExpired ? 'Reservation Expired' : '15-Minute Reservation Hold'}
          </span>
        </div>
        <div className="font-mono text-lg font-extrabold tracking-tight">
          {timeLeft.isExpired
            ? '00:00'
            : `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft.isExpired
              ? 'bg-slate-400'
              : isUrgent
              ? 'bg-red-600'
              : 'bg-amber-500'
          }`}
          style={{ width: `${timeLeft.percentage}%` }}
        ></div>
      </div>

      <p className="text-[11px] text-slate-500 mt-2 leading-tight">
        {timeLeft.isExpired
          ? 'Stock has been released back into the shared emergency allocation pool.'
          : 'Hold guarantee in place. Collect medicines before timer reaches zero.'}
      </p>
    </div>
  );
};
