import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Star, Zap } from 'lucide-react';
import Header from './components/Header';
import QuoteDisplay from './components/QuoteDisplay';
import Keyboard from './components/Keyboard';
import GameControls from './components/GameControls';
import { fetchNewGameData } from './utils/api';
import { isLetter } from './utils/cipher';
import { saveGameState, loadGameState, clearGameState, saveHighScore, loadHighScore } from './utils/storage';
import { calculateScore } from './utils/score';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [originalQuote, setOriginalQuote] = useState(null);
    const [author, setAuthor] = useState("");
    const [source, setSource] = useState("");
    const [cipher, setCipher] = useState({}); // Map: Plain char -> Encrypted char
    const [reverseCipher, setReverseCipher] = useState({}); // Map: Encrypted char -> Plain char
    const [userGuesses, setUserGuesses] = useState({}); // Map: Encrypted char -> User guessed char

    // Track specific cursor index instead of just the selected character value
    const [cursorIndex, setCursorIndex] = useState(null);

    const [solved, setSolved] = useState(false);
    const [checkMode, setCheckMode] = useState(false);
    const [hintedChars, setHintedChars] = useState(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Scoring
    const [highScore, setHighScore] = useState(0);
    const [scoreData, setScoreData] = useState(null);
    const [isNewHighScore, setIsNewHighScore] = useState(false);

    // Theme - Default to light, check local storage
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    // Derived state for the currently selected encrypted character based on cursor position
    const selectedEncryptedChar = useMemo(() => {
        if (cursorIndex === null || !originalQuote || !cipher) return null;
        const plainChar = originalQuote[cursorIndex];
        return cipher[plainChar];
    }, [cursorIndex, originalQuote, cipher]);

    // Calculate duplicate assignments (same letter used for different encrypted chars)
    const duplicateLetters = useMemo(() => {
        const counts = {};
        const duplicates = new Set();
        Object.values(userGuesses).forEach(char => {
            counts[char] = (counts[char] || 0) + 1;
        });
        Object.entries(counts).forEach(([char, count]) => {
            if (count > 1) duplicates.add(char);
        });
        return duplicates;
    }, [userGuesses]);

    const startNewGame = useCallback(async (isRetry = false) => {
        setLoading(true);
        setSolved(false);
        setUserGuesses({});
        setCursorIndex(null);
        setCheckMode(false);
        setHintedChars(new Set());
        setShowConfetti(false);
        setElapsedTime(0);
        setScoreData(null);
        setIsNewHighScore(false);
        clearGameState();

        const data = await fetchNewGameData();
        setOriginalQuote(data.quote);
        setAuthor(data.author);
        setSource(data.source);
        setCipher(data.cipher);
        setReverseCipher(data.reverseCipher);
        setLoading(false);
    }, []);

    // InitialLoad / Persistence
    useEffect(() => {
        setHighScore(loadHighScore()); // Load high score once

        const saved = loadGameState();
        if (saved && saved.originalQuote) {
            setOriginalQuote(saved.originalQuote);
            setAuthor(saved.author);
            setSource(saved.source);
            setCipher(saved.cipher);
            setReverseCipher(saved.reverseCipher);
            setUserGuesses(saved.userGuesses);
            setHintedChars(saved.hintedChars);
            setSolved(saved.solved);
            setElapsedTime(saved.elapsedTime || 0);

            // Restore score data if we solved it?
            if (saved.solved && saved.scoreData) {
                setScoreData(saved.scoreData);
            }

            setLoading(false);
        } else {
            startNewGame();
        }
    }, [startNewGame]);

    // Save state on change
    useEffect(() => {
        if (!loading && originalQuote) {
            saveGameState({
                originalQuote,
                author,
                source,
                cipher,
                reverseCipher,
                userGuesses,
                hintedChars,
                solved,
                elapsedTime,
                scoreData
            });
        }
    }, [loading, originalQuote, author, source, cipher, reverseCipher, userGuesses, hintedChars, solved, elapsedTime, scoreData]);


    // Helper to find valid letter indices for navigation
    const getLetterIndices = useCallback(() => {
        if (!originalQuote) return [];
        return originalQuote.split('').map((c, i) => isLetter(c) ? i : -1).filter(i => i !== -1);
    }, [originalQuote]);

    // Auto-focus first empty cell on load if not solved
    useEffect(() => {
        if (!loading && !solved && cursorIndex === null && originalQuote) {
            const indices = getLetterIndices();
            if (indices.length > 0) {
                // Find first unfilled
                let firstUnfilled = indices.find(idx => {
                    const char = originalQuote[idx];
                    const enc = cipher[char];
                    return !userGuesses[enc];
                });

                // If all filled (but not solved?), fallback to first
                if (firstUnfilled === undefined) firstUnfilled = indices[0];

                setCursorIndex(firstUnfilled);
            }
        }
    }, [loading, solved, originalQuote, getLetterIndices, cipher, userGuesses]); // Careful with dependencies to avoid sticky focusing

    // Handle Navigation
    const moveCursor = useCallback((direction) => {
        if (cursorIndex === null) {
            const indices = getLetterIndices();
            if (indices.length > 0) setCursorIndex(indices[0]);
            return;
        }

        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        let newPos = currentPos + direction;
        // Clamp
        if (newPos < 0) newPos = 0;
        if (newPos >= indices.length) newPos = indices.length - 1;

        setCursorIndex(indices[newPos]);
    }, [cursorIndex, getLetterIndices]);

    const handleGuess = useCallback((guessChar) => {
        if (solved || !selectedEncryptedChar) return;
        // Prevent changing hinted characters
        if (hintedChars.has(selectedEncryptedChar)) return;

        setUserGuesses(prev => {
            const newGuesses = { ...prev };

            if (guessChar === null) {
                delete newGuesses[selectedEncryptedChar];
            } else {
                newGuesses[selectedEncryptedChar] = guessChar;
            }

            const isComplete = originalQuote.split('').every(char => {
                if (!isLetter(char)) return true;
                const encrypted = cipher[char];
                return newGuesses[encrypted] === char;
            });

            if (isComplete) {
                setSolved(true);
                setShowConfetti(true);
                setCursorIndex(null);
                setCheckMode(false);
                clearGameState(); // Clear state on win? Or keep it so they can see? Let's keep duplicate save logic for now.
            }

            return newGuesses;
        });
    }, [solved, selectedEncryptedChar, hintedChars, originalQuote, cipher]);


    // Handle Solve Side-Effects clearly
    useEffect(() => {
        if (solved && !scoreData && originalQuote) {
            const result = calculateScore(originalQuote, elapsedTime, hintedChars.size);
            setScoreData(result);
            const isNew = saveHighScore(result.finalScore);
            if (isNew) {
                setIsNewHighScore(true);
                setHighScore(result.finalScore);
            }
        }
    }, [solved, scoreData, originalQuote, elapsedTime, hintedChars.size]);

    const moveCursorToNextUnfilled = useCallback(() => {
        if (!originalQuote || cursorIndex === null) return;

        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        // Search for next unfilled
        let nextIndex = -1;
        for (let i = currentPos + 1; i < indices.length; i++) {
            const rawIndex = indices[i];
            const plainChar = originalQuote[rawIndex];
            const enc = cipher[plainChar];
            if (!userGuesses[enc]) {
                nextIndex = rawIndex;
                break;
            }
        }

        if (nextIndex !== -1) {
            setCursorIndex(nextIndex);
        } else {
            // If no more unfilled ahead, wrap around or just check everything?
            // Let's just standard move(1)
            moveCursor(1);
        }
    }, [cursorIndex, originalQuote, cipher, userGuesses, getLetterIndices, moveCursor]);

    const moveCursorLeft = useCallback(() => {
        if (!originalQuote || cursorIndex === null) return;

        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        // Try to move left
        let nextPos = currentPos - 1;
        while (nextPos >= 0) {
            const rawIndex = indices[nextPos];
            const plainChar = originalQuote[rawIndex];
            const enc = cipher[plainChar];

            // If it's a hint, keep going left
            if (hintedChars.has(enc)) {
                nextPos--;
                continue;
            }

            // Found a valid non-hint spot
            setCursorIndex(rawIndex);
            return;
        }
    }, [cursorIndex, originalQuote, cipher, hintedChars, getLetterIndices]);

    // Handle keyboard input (Physical Keyboard)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (solved || loading) return;

            const key = e.key.toUpperCase();

            // Navigation
            if (e.key === 'ArrowRight') {
                moveCursor(1);
                return;
            }
            if (e.key === 'ArrowLeft') {
                moveCursor(-1);
                return;
            }

            // Typing
            if (isLetter(key)) {
                if (cursorIndex !== null && selectedEncryptedChar) {
                    handleGuess(key);
                    moveCursorToNextUnfilled();
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                if (cursorIndex !== null && selectedEncryptedChar) {
                    handleGuess(null);
                    if (e.key === 'Backspace') {
                        moveCursorLeft();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cursorIndex, selectedEncryptedChar, solved, loading, moveCursor, handleGuess, moveCursorToNextUnfilled, moveCursorLeft]);


    const giveHint = () => {
        if (solved || !originalQuote) return;

        // 1. Try to hint the CURRENTLY selected character
        if (selectedEncryptedChar && !hintedChars.has(selectedEncryptedChar)) {
            const correctPlain = reverseCipher[selectedEncryptedChar];
            const currentGuess = userGuesses[selectedEncryptedChar];

            // Only hint if it's not arguably already correct (though usually hints lock it in)
            // Actually, hints should allow you to lock in even if you guessed right, or correct you if wrong.
            // So simply always allow if not already hinted.

            setHintedChars(prev => new Set(prev).add(selectedEncryptedChar));
            setUserGuesses(prev => {
                const newGuesses = { ...prev };
                newGuesses[selectedEncryptedChar] = correctPlain;

                // Win Check Helper
                const isComplete = originalQuote.split('').every(char => {
                    if (!isLetter(char)) return true;
                    const encrypted = cipher[char];
                    return newGuesses[encrypted] === char;
                });

                if (isComplete) {
                    setSolved(true);
                    setShowConfetti(true);
                    setCursorIndex(null);
                    setCheckMode(false);
                }
                return newGuesses;
            });
            return;
        }

        // 2. Fallback: Hint a random unknown/incorrect letter
        const availableHints = [];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

        alphabet.forEach(plainChar => {
            if (!originalQuote.includes(plainChar)) return;

            const encrypted = cipher[plainChar];
            if (hintedChars.has(encrypted)) return;

            const currentGuess = userGuesses[encrypted];
            // If it's wrong OR empty, it's a valid hint candidate.
            // Even if it's right but not "hinted" (locked), we could hint it? 
            // Let's stick to "if not correct" or "if not hinted" logic.
            // Explicitly: We want to help the user.
            if (currentGuess !== plainChar) {
                availableHints.push(encrypted);
            }
        });

        if (availableHints.length > 0) {
            const randomEncrypted = availableHints[Math.floor(Math.random() * availableHints.length)];
            const correctPlain = reverseCipher[randomEncrypted];

            setHintedChars(prev => new Set(prev).add(randomEncrypted));

            setUserGuesses(prev => {
                const newGuesses = { ...prev };
                newGuesses[randomEncrypted] = correctPlain;

                const isComplete = originalQuote.split('').every(char => {
                    if (!isLetter(char)) return true;
                    const encrypted = cipher[char];
                    return newGuesses[encrypted] === char;
                });

                if (isComplete) {
                    setSolved(true);
                    setShowConfetti(true);
                    setCursorIndex(null);
                    setCheckMode(false);
                }

                return newGuesses;
            });

            // Find the first occurrence of this encrypted char to select it visually
            const firstIndex = originalQuote.indexOf(reverseCipher[randomEncrypted]);
            if (firstIndex !== -1) setCursorIndex(firstIndex);
        }
    };

    const toggleCheckWork = () => {
        setCheckMode(!checkMode);
    };

    const clearMistakes = () => {
        if (solved) return;
        setUserGuesses(prev => {
            const newGuesses = { ...prev };
            Object.keys(newGuesses).forEach(enc => {
                if (hintedChars.has(enc)) return;
                delete newGuesses[enc];
            });
            return newGuesses;
        });
        setCheckMode(false);
    };

    const [hasStarted, setHasStarted] = useState(false);

    const handleStart = () => {
        setHasStarted(true);
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            }
        } catch (e) {
            console.warn("Fullscreen denied:", e);
        }
    };

    if (!hasStarted) {
        return (
            <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 z-50 fixed inset-0">
                <div className="text-center max-w-md">
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">CRYPTOGRAMS</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Decipher the quotes. Unlock the wisdom.</p>
                    <button
                        onClick={handleStart}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
                    >
                        START GAME
                    </button>
                    <p className="mt-8 text-xs text-slate-400">Tap to enter full screen</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900 flex flex-col overflow-hidden"
            onClick={() => setCursorIndex(null)}
        >
            <Header
                loading={loading}
                onNewGame={() => startNewGame()}
                solved={solved}
                time={elapsedTime}
                onTimeUpdate={setElapsedTime}
                isDark={isDark}
                toggleTheme={toggleTheme}
            />

            <main className="flex-grow overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 relative">
                <div className="max-w-4xl mx-auto px-4 py-6 pb-64">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
                            <p>Fetching a thought...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4 px-2">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    High Score: <span className="text-amber-500">{highScore.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="w-full bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[150px] flex flex-col justify-center mb-6">
                                <QuoteDisplay
                                    quote={originalQuote}
                                    cipher={cipher}
                                    userGuesses={userGuesses}
                                    cursorIndex={cursorIndex}
                                    selectedEncryptedChar={selectedEncryptedChar}
                                    checkMode={checkMode}
                                    solved={solved}
                                    hintedChars={hintedChars}
                                    onSelectChar={setCursorIndex}
                                />

                                {/* Author Reveal & Score */}
                                <div className={`
                        mt-8 text-center transition-all duration-700 overflow-hidden
                        ${solved ? 'opacity-100 max-h-96 translate-y-0' : 'opacity-0 max-h-0 translate-y-4'}
                    `}>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="inline-flex items-center gap-2 text-green-700 dark:text-green-400 font-medium px-4 py-2 bg-green-50 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                                            <Trophy size={18} />
                                            <span>Solved! &mdash; <span className="font-bold">{author}</span></span>
                                        </div>

                                        {scoreData && (
                                            <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 w-full max-w-sm">
                                                <div className="flex items-center justify-center gap-2 text-2xl font-black text-slate-800 dark:text-white mb-1">
                                                    {isNewHighScore && <Star className="text-amber-500 fill-amber-500 animate-spin-slow" />}
                                                    <span>{scoreData.finalScore.toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-3">
                                                    {isNewHighScore ? "New High Score!" : "Final Score"}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                    <div className="flex justify-between">
                                                        <span>Accuracy:</span>
                                                        <span className="font-mono">{scoreData.baseScore}</span>
                                                    </div>
                                                    <div className="flex justify-between text-red-500 dark:text-red-400">
                                                        <span>Hints:</span>
                                                        <span className="font-mono">-{scoreData.penalty}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center text-xs font-bold text-blue-600 dark:text-blue-400">
                                                    <span className="flex items-center gap-1"><Zap size={12} /> Speed Bonus</span>
                                                    <span>x{scoreData.multiplier.toFixed(1)} ({scoreData.rank})</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {solved && (
                                <div className="flex justify-center animate-bounce mt-8">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startNewGame(); }}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
                                    >
                                        Play Again
                                    </button>
                                </div>
                            )}

                            <footer className="mt-8 text-center text-slate-400 text-xs">
                                Cryptogram Challenge • Data provided by {source || 'Unknown'}
                            </footer>
                        </>
                    )}
                </div>
            </main>

            {!solved && !loading && (
                <>
                    <div
                        className="flex-none bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 w-full pb-12"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GameControls
                            onHint={giveHint}
                            onCheck={toggleCheckWork}
                            onClear={clearMistakes}
                            checkMode={checkMode}
                            selectedEncryptedChar={selectedEncryptedChar}
                            hintedChars={hintedChars}
                        />
                        <Keyboard
                            onGuess={(char) => {
                                handleGuess(char);
                                moveCursorToNextUnfilled();
                            }}
                            onDelete={() => {
                                handleGuess(null);
                                moveCursorLeft();
                            }}
                            selectedEncryptedChar={selectedEncryptedChar}
                            solved={solved}
                            hintedChars={hintedChars}
                            usedLetters={new Set(Object.values(userGuesses))}
                            duplicateLetters={duplicateLetters}
                        />
                    </div>
                </>
            )}

            {solved && showConfetti && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-5%`,
                                animationDuration: `${Math.random() * 3 + 2}s`,
                                animationDelay: `${Math.random() * 2}s`,
                                fontSize: `${Math.random() * 20 + 10}px`
                            }}
                        >
                            {['🎉', '✨', '👏', '⭐'][Math.floor(Math.random() * 4)]}
                        </div>
                    ))}
                </div>
            )}
            <style>{`
        @keyframes fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-fall {
            animation-name: fall;
            animation-timing-function: linear;
            animation-iteration-count: 1;
        }
      `}</style>
        </div>
    );
}
