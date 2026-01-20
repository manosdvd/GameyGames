
import { RefreshCw, Info, Moon, Sun } from 'lucide-react';
import Timer from './Timer';

export default function Header({ loading, onNewGame, solved, time, onTimeUpdate, isDark, toggleTheme }) {
    return (
        <header className="flex-none flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-10 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="hidden sm:block p-1.5 bg-blue-600 rounded-lg text-white shadow-sm">
                    <Info size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none">Cryptogram</h1>
                    <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-xs mt-1">Decipher the quote</p>
                </div>
            </div>

            <Timer
                solved={solved}
                loading={loading}
                initialSeconds={time}
                onTimeUpdate={onTimeUpdate}
            />

            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onNewGame(); }}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                    title="New Game"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        </header>
    );
}
