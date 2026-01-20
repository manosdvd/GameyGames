import { useState, useEffect } from 'react';
import { Timer as TimerIcon } from 'lucide-react';

export default function Timer({ solved, loading, initialSeconds = 0, onTimeUpdate }) {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        setSeconds(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        if (solved || loading) return;

        const interval = setInterval(() => {
            setSeconds(prev => {
                const next = prev + 1;
                if (onTimeUpdate && next % 5 === 0) onTimeUpdate(next); // Sync occasionally
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [solved, loading, onTimeUpdate]);

    // Force final sync on solve
    useEffect(() => {
        if (solved && onTimeUpdate) {
            onTimeUpdate(seconds);
        }
    }, [solved, seconds, onTimeUpdate]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-1.5 text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full text-xs sm:text-sm border border-slate-200">
            <TimerIcon size={14} />
            <span className="tabular-nums">{formatTime(seconds)}</span>
        </div>
    );
}
