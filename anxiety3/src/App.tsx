import React, { useState, useEffect, useRef } from 'react';
import './style.css';

// --- Icons ---
const IconPause = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
const IconBack = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;

// --- Color Blind Shapes ---
const ShapeSquare = () => <svg className="w-full h-full p-1.5 text-white opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
const ShapeTriangle = () => <svg className="w-full h-full p-1.5 text-white opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 3L21 21H3L12 3Z" /></svg>;
const ShapeCircle = () => <svg className="w-full h-full p-1.5 text-white opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle cx="12" cy="12" r="9" /></svg>;
const ShapeStar = () => <svg className="w-full h-full p-1.5 text-white opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const ShapeDiamond = () => <svg className="w-full h-full p-1.5 text-white opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polygon points="12 2 22 12 12 22 2 12 12 2" /></svg>;
const ShapeCross = () => <svg className="w-full h-full p-1.5 text-white opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>;

// --- Audio Context ---
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

// --- Constants ---
const ROWS = 10;
const COLS = 8;
const COLORS = ['#DC2626', '#2563EB', '#16A34A', '#FACC15', '#7C3AED', '#06B6D4'];
const SHAPES = [ShapeSquare, ShapeTriangle, ShapeCircle, ShapeStar, ShapeDiamond, ShapeCross];

interface Block {
    id: string;
    color: string;
    colorIndex: number;
    row: number;
    col: number;
    isFalling: boolean;
    isNew: boolean;
}

const generateBlock = (row: number, col: number): Block => {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    return {
        id: Math.random().toString(36).substr(2, 9),
        color: COLORS[colorIndex],
        colorIndex: colorIndex,
        row, col, isFalling: false, isNew: false
    };
};

const getTickRateForLevel = (lvl: number) => {
    if (lvl < 5) return 1200 - ((lvl - 1) * 200);
    if (lvl < 10) return 400 - ((lvl - 5) * 50);
    const progress = (lvl - 10) / 5;
    return Math.floor(180 * (1 - progress) + 60 * progress);
};

const getThresholdForLevel = (lvl: number) => {
    return 1000 + (lvl * 250);
};

export default function App() {
    // Settings
    const [settings, setSettings] = useState(() => {
        try {
            const stored = localStorage.getItem('neuro_hub_settings');
            const defaults = { sound: true, haptics: true, crt: true, colorBlind: false };
            return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
        } catch (e) {
            return { sound: true, haptics: true, crt: true, colorBlind: false };
        }
    });

    useEffect(() => {
        localStorage.setItem('neuro_hub_settings', JSON.stringify({
            sound: settings.sound,
            haptics: settings.haptics
        }));
    }, [settings.sound, settings.haptics]);

    const [isPaused, setIsPaused] = useState(false);

    // Game State
    const [board, setBoard] = useState<(Block | null)[][]>([]);
    const [previewRow, setPreviewRow] = useState<(Block | null)[]>(Array(8).fill(null));
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('anxiety_highscore') || '0'));
    const [level, setLevel] = useState(1);
    const [startLevel, setStartLevel] = useState(1);
    const [levelScore, setLevelScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<{ r: number, c: number } | null>(null);
    const [shake, setShake] = useState(false);
    const [levelAnim, setLevelAnim] = useState(false);
    const [particles, setParticles] = useState<any[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<any[]>([]);
    const [comboChain, setComboChain] = useState(0);
    const [tickRate, setTickRate] = useState(1200);
    const [previewIndex, setPreviewIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Helpers ---
    const triggerHaptic = (pattern: number | number[]) => {
        if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
    };

    const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
        if (!settings.sound) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    };

    const playMatchSound = (combo: number) => {
        const baseFreq = 300 + (combo * 100);
        playTone(baseFreq, 'sine', 0.3, 0.2);
        playTone(baseFreq * 1.5, 'triangle', 0.1, 0.1);
    };
    const playExplosionSound = () => {
        playTone(100, 'sawtooth', 0.4, 0.3);
        setTimeout(() => playTone(80, 'square', 0.4, 0.3), 50);
    };
    const playDropSound = () => playTone(100, 'square', 0.1, 0.05);
    const playTickSound = (i: number) => playTone(400 + (i * 100), 'sawtooth', 0.05, 0.05);
    const playSwapSound = () => playTone(600, 'sine', 0.1, 0.1);
    const playLevelUpSound = () => {
        playTone(400, 'square', 0.1, 0.2);
        setTimeout(() => playTone(600, 'square', 0.1, 0.2), 100);
        setTimeout(() => playTone(800, 'square', 0.2, 0.2), 200);
    };
    const playGameOverSound = () => {
        playTone(150, 'sawtooth', 1, 0.3);
        setTimeout(() => playTone(100, 'sawtooth', 1, 0.3), 200);
    };

    const initGame = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if ((document.documentElement as any).webkitRequestFullscreen) {
                (document.documentElement as any).webkitRequestFullscreen();
            }
        } catch (e) { console.warn("Fullscreen denied", e); }

        const newBoard: (Block | null)[][] = [];
        for (let r = 0; r < ROWS; r++) {
            const row: (Block | null)[] = [];
            for (let c = 0; c < COLS; c++) {
                if (r >= ROWS - 5) {
                    let block = generateBlock(r, c);
                    while (
                        (c >= 2 && block.color === row[c - 1]?.color && block.color === row[c - 2]?.color) ||
                        (r >= ROWS - 3 && block.color === newBoard[r - 1][c]?.color && block.color === newBoard[r - 2][c]?.color)
                    ) block = generateBlock(r, c);
                    row.push(block);
                } else row.push(null);
            }
            newBoard.push(row);
        }
        setBoard(newBoard);
        setPreviewRow(Array(8).fill(null));
        setPreviewIndex(0);
        setScore(0);
        setLevel(startLevel);
        setLevelScore(0);
        setGameOver(false);
        setGameStarted(true);
        setTickRate(getTickRateForLevel(startLevel));
        setSelectedBlock(null);
        setParticles([]);
        setFloatingTexts([]);
        setComboChain(0);
        setIsPaused(false);
    };

    const createExplosion = (r: number, c: number, color: string) => {
        const newParticles: any[] = [];
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            newParticles.push({
                id: Math.random(), r, c, color,
                tx: Math.cos(angle) * 100 + 'px',
                ty: Math.sin(angle) * 100 + 'px'
            });
        }
        setParticles(prev => [...prev, ...newParticles]);
        setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.includes(p))), 600);
    };

    const showFloatingText = (r: number, c: number, text: string, color = '#fff') => {
        const id = Math.random();
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        setFloatingTexts(prev => [...prev, { id, r, c, text, color, offsetX, offsetY }]);
        setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1200);
    };

    useEffect(() => {
        if (!gameStarted) return;
        const threshold = getThresholdForLevel(level);

        if (levelScore >= threshold) {
            const newLevel = level + 1;
            setLevel(newLevel);
            setLevelScore(0);

            playLevelUpSound();
            triggerHaptic([100, 50, 100]);
            setLevelAnim(true);
            setTimeout(() => setLevelAnim(false), 500);

            showFloatingText(ROWS / 2 - 2, COLS / 2, `LEVEL ${newLevel}!`, '#FFFFFF');

            setTickRate(getTickRateForLevel(newLevel));
        }
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('anxiety_highscore', score.toString());
        }
    }, [levelScore, gameStarted, level, score, highScore]);

    // Timers
    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => fillPreviewSlot(), tickRate);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameStarted, gameOver, isPaused, tickRate, previewIndex, previewRow]);

    const fillPreviewSlot = () => {
        setPreviewIndex(prev => {
            if (prev >= COLS) { dropPreviewRow(); return 0; }
            setPreviewRow(curr => {
                const newRow = [...curr];
                newRow[prev] = generateBlock(-1, prev);
                return newRow;
            });
            playTickSound(prev);
            return prev + 1;
        });
    };

    const dropPreviewRow = () => {
        setBoard(cur => {
            for (let c = 0; c < COLS; c++) if (cur[0][c]) { handleGameOver(); return cur; }
            return cur;
        });
        performDrop();
    };

    const performDrop = () => {
        setPreviewRow(prev => {
            setBoard(cur => {
                for (let c = 0; c < COLS; c++) if (cur[0][c]) { handleGameOver(); return cur; }
                const nb = cur.map(r => [...r]);
                for (let c = 0; c < COLS; c++) if (prev[c]) nb[0][c] = { ...prev[c]!, row: 0, col: c };
                playDropSound();
                return nb;
            });
            triggerHaptic(50);
            return Array(8).fill(null);
        });
    };

    const handleGameOver = () => {
        setGameOver(true); setGameStarted(false); setIsPaused(false);
        playGameOverSound(); triggerHaptic(1000);
        setShake(true); setTimeout(() => setShake(false), 500);
    };

    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) return;
        const int = setTimeout(() => {
            applyGravity();
            let res = checkMatches(board);
            if (res.matched && res.board && res.points) {
                playMatchSound(comboChain); triggerHaptic([30, 30]);
                setBoard(res.board);
                setScore(s => s + res.points!);
                setLevelScore(s => s + res.points!);
                setComboChain(c => c + 1);
                setShake(true); setTimeout(() => setShake(false), 300);
            }
        }, 65);
        return () => clearTimeout(int);
    }, [board, gameStarted, gameOver, isPaused, comboChain]);

    const applyGravity = () => {
        let moved = false;
        const nb = board.map(r => [...r]);
        for (let c = 0; c < COLS; c++) {
            for (let r = ROWS - 2; r >= 0; r--) {
                if (nb[r][c] && !nb[r + 1][c]) {
                    nb[r + 1][c] = { ...nb[r][c]!, row: r + 1 }; nb[r][c] = null; moved = true;
                }
            }
        }
        if (moved) setBoard(nb);
        return moved;
    };

    const isSettled = (r: number, c: number, b: (Block | null)[][]) => {
        let curr = r;
        while (curr < ROWS - 1) {
            if (b[curr + 1][c] === null) return false;
            curr++;
        }
        return true;
    };

    const checkMatches = (b: (Block | null)[][]) => {
        let matches = new Set<string>();
        let hRuns: any[][] = [], vRuns: any[][] = [];

        const scanLine = (isRow: boolean) => {
            const outer = isRow ? ROWS : COLS;
            const inner = isRow ? COLS : ROWS;
            for (let i = 0; i < outer; i++) {
                let run: any[] = [];
                for (let j = 0; j < inner; j++) {
                    const r = isRow ? i : j;
                    const c = isRow ? j : i;
                    const blk = b[r][c];
                    const settled = blk && isSettled(r, c, b);
                    if (settled) {
                        if (run.length === 0) run.push({ r, c, color: blk!.color });
                        else if (blk!.color === run[0].color) run.push({ r, c, color: blk!.color });
                        else {
                            if (run.length >= 3) { (isRow ? hRuns : vRuns).push(run); run.forEach(p => matches.add(`${p.r},${p.c}`)); }
                            run = [{ r, c, color: blk!.color }];
                        }
                    } else {
                        if (run.length >= 3) { (isRow ? hRuns : vRuns).push(run); run.forEach(p => matches.add(`${p.r},${p.c}`)); }
                        run = [];
                    }
                }
                if (run.length >= 3) { (isRow ? hRuns : vRuns).push(run); run.forEach(p => matches.add(`${p.r},${p.c}`)); }
            }
        };
        scanLine(true); scanLine(false);

        if (matches.size > 0) {
            const nb = b.map(r => [...r]);
            let mult = 1;
            [...hRuns, ...vRuns].forEach(run => { if (run.length === 4) mult = Math.max(mult, 2); if (run.length >= 5) mult = Math.max(mult, 3); });
            let bonus = (comboChain > 0) ? (comboChain * 0.5) + 1 : 1;
            let pts = Math.floor(matches.size * 10 * mult * bonus);

            let cr = 0, cc = 0;
            if (hRuns[0]) { cr = hRuns[0][0].r; cc = hRuns[0][0].c; }
            else if (vRuns[0]) { cr = vRuns[0][0].r; cc = vRuns[0][0].c; }

            let txt = `+${pts}`;
            if (comboChain > 1) txt += ` x${Math.floor(bonus)}`;
            if (mult > 1) txt = (mult === 2 ? "4-MATCH! " : "MEGA! ") + txt;
            showFloatingText(cr, cc, txt, '#FBBF24');

            matches.forEach(k => {
                const [r, c] = k.split(',').map(Number);
                if (nb[r][c]) createExplosion(r, c, nb[r][c]!.color);
                nb[r][c] = null;
            });
            return { matched: true, board: nb, points: pts };
        }
        return { matched: false };
    };

    const handleBlockClick = (r: number, c: number) => {
        if (gameOver || !gameStarted || isPaused) return;

        const blk = board[r][c];

        if (!selectedBlock) {
            if (!blk) return;
            setSelectedBlock({ r, c });
            playTone(500, 'sine', 0.05, 0.1);
            triggerHaptic(10);
        } else {
            if (selectedBlock.r === r && selectedBlock.c === c) { setSelectedBlock(null); return; }

            const nb = board.map(rw => [...rw]);
            const b1 = nb[selectedBlock.r][selectedBlock.c];
            const b2 = nb[r][c];

            if (b2) {
                nb[selectedBlock.r][selectedBlock.c] = { ...b2, row: selectedBlock.r, col: selectedBlock.c } as Block;
                nb[r][c] = { ...b1!, row: r, col: c } as Block;
            } else {
                nb[selectedBlock.r][selectedBlock.c] = null;
                nb[r][c] = { ...b1!, row: r, col: c } as Block;
            }

            playSwapSound(); triggerHaptic(30);

            const res = checkMatches(nb);
            if (res.matched && res.board && res.points) {
                setBoard(res.board);
                setScore(s => s + res.points!);
                setLevelScore(s => s + res.points!);
                setComboChain(1); playMatchSound(1); triggerHaptic([30, 30]);
                setShake(true); setTimeout(() => setShake(false), 300);
            } else {
                setBoard(nb); setComboChain(0);
            }
            setSelectedBlock(null);
        }
    };

    const togglePause = () => setIsPaused(prev => !prev);

    const progress = Math.min(100, (levelScore / getThresholdForLevel(level)) * 100);

    // Initial Screen
    if (!gameStarted) {
        return (
            <div className="h-full w-full bg-gray-900 flex flex-col items-center justify-center p-4">
                <h1 className="text-6xl font-black text-red-500 mb-2" style={{ fontFamily: '"Black Ops One", cursive' }}>ANXIETY</h1>
                <p className="text-gray-400 mb-8 font-mono">PANIC ATTACK SIMULATOR</p>

                <div className="flex gap-4 mb-12">
                    <div onClick={() => initGame()} className="cursor-pointer px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
                        START PANIC
                    </div>
                </div>
                <div className="text-gray-600 text-xs">
                    V 3.0.1 - REACT MIGRATION
                </div>
            </div>
        );
    }


    return (
        <div className={`h-full w-full flex flex-col relative ${shake ? 'shake' : ''} bg-gray-900 overflow-hidden select-none`}>
            {settings.crt && <div className="scanlines"></div>}

            <div className="flex-none p-2 z-10 bg-gray-900 border-b-2 border-gray-800">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <a href="../index.html" className="text-gray-500 hover:text-white"><IconBack /></a>
                            <h1 className="text-2xl font-black text-red-500 tracking-tighter leading-none" style={{ fontFamily: '"Black Ops One", cursive' }}>ANXIETY</h1>
                        </div>
                        <div className="text-xs text-gray-400 flex gap-3 items-center mt-1">
                            <span className={levelAnim ? 'level-up-anim font-bold' : ''}>LVL:{level}</span>
                            <div className="w-24 h-2 bg-gray-800 rounded overflow-hidden border border-gray-700">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[10px] text-gray-400 font-bold">HIGH: {highScore}</div>
                            <div className="text-2xl font-bold text-white leading-none">{score}</div>
                            <div className="text-[10px] text-gray-400">SCORE</div>
                        </div>
                        <button onClick={togglePause} className="p-2 bg-gray-800 rounded border border-gray-600 hover:bg-gray-700 text-white">
                            <IconPause />
                        </button>
                    </div>
                </div>
                <div className="flex w-full h-8 md:h-10 bg-black/50 p-1 rounded border border-gray-700 relative overflow-hidden">
                    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${previewIndex > 5 ? 'bg-red-900/30 pulse-red' : 'opacity-0'}`}></div>
                    {Array(8).fill(0).map((_, i) => {
                        const Shape = previewRow[i] && SHAPES[previewRow[i]!.colorIndex];
                        return (
                            <div key={`prev-${i}`} className="flex-1 h-full mx-[2px] rounded flex items-center justify-center border border-gray-800/50 bg-gray-800/30 relative">
                                {previewRow[i] && (
                                    <>
                                        <div className="absolute inset-0 rounded shadow-inner border-t border-white/20" style={{ backgroundColor: previewRow[i]!.color }}></div>
                                        {settings.colorBlind && Shape && <div className="absolute inset-0 flex items-center justify-center p-1"><Shape /></div>}
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex-grow relative p-2 z-10 overflow-hidden cursor-crosshair flex items-center justify-center">
                <div className="grid-container">
                    {Array.from({ length: ROWS }).map((_, r) => (
                        Array.from({ length: COLS }).map((_, c) => {
                            const block = board[r]?.[c];
                            const Shape = block && SHAPES[block.colorIndex];
                            return (
                                <div
                                    key={`cell-${r}-${c}`}
                                    onClick={() => handleBlockClick(r, c)}
                                    className={`
                                        w-full h-full rounded cursor-pointer relative
                                        ${!block ? 'bg-gray-800/20' : ''}
                                        ${selectedBlock && selectedBlock.r === r && selectedBlock.c === c ? 'ring-2 ring-white z-20' : ''}
                                    `}
                                >
                                    {block && (
                                        <div
                                            className="w-full h-full rounded shadow-lg border-t border-white/30 block relative overflow-visible"
                                            style={{
                                                backgroundColor: block.color,
                                                transform: block.isFalling ? 'translateY(-20%)' : 'none',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            <div className="absolute inset-0 rounded bg-gradient-to-br from-white/20 to-black/30 pointer-events-none"></div>
                                            {settings.colorBlind && Shape && (
                                                <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none opacity-80">
                                                    <Shape />
                                                </div>
                                            )}
                                            {selectedBlock && selectedBlock.r === r && selectedBlock.c === c && (
                                                <div className="absolute inset-0 border-2 border-white rounded selected-ring opacity-50"></div>
                                            )}
                                        </div>
                                    )}
                                    {particles.filter(p => p.r === r && p.c === c).map(p => (
                                        <div key={p.id} className="particle w-3 h-3 rounded-full z-30" style={{ backgroundColor: p.color, left: '50%', top: '50%', '--tx': p.tx, '--ty': p.ty, boxShadow: `0 0 10px ${p.color}` }}></div>
                                    ))}
                                    {floatingTexts.filter(t => t.r === r && t.c === c).map(t => (
                                        <div key={t.id} className="floating-score" style={{ color: t.color, left: '50%', top: '50%', transform: `translate(${t.offsetX}px, ${t.offsetY}px)` }}>
                                            {t.text}
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>

            {/* Modal Overlay for Pause/Game Over not fully implemented in source but simplified here */}
            {(gameOver || isPaused) && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-800 border-2 border-red-500 rounded p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                        <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: '"Black Ops One"' }}>{gameOver ? 'PANIC OVER' : 'PAUSED'}</h2>
                        {gameOver && <p className="text-xl text-red-400 mb-6">SCORE: {score}</p>}

                        <button onClick={initGame} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded mb-3">
                            {gameOver ? 'TRY AGAIN' : 'RESUME'}
                        </button>
                        <button onClick={() => window.location.href = '../index.html'} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded">
                            EXIT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
