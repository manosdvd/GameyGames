/**
 * Shared Settings Manager
 * Persists sound and haptics preferences to localStorage.
 */
class GameSettingsManager {
    constructor() {
        this.defaults = {
            sound: true,
            haptics: true
        };
        this.state = this.load();
        this.listeners = [];
    }

    load() {
        try {
            const stored = localStorage.getItem('neuro_hub_settings');
            return stored ? { ...this.defaults, ...JSON.parse(stored) } : { ...this.defaults };
        } catch (e) {
            return { ...this.defaults };
        }
    }

    save() {
        localStorage.setItem('neuro_hub_settings', JSON.stringify(this.state));
        this.notify();
    }

    get() {
        return { ...this.state };
    }

    set(key, value) {
        if (key in this.state) {
            this.state[key] = value;
            this.save();
        }
    }

    toggle(key) {
        if (key in this.state) {
            this.state[key] = !this.state[key];
            this.save();
            return this.state[key];
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        // Initial call
        callback(this.state);
        return () => this.listeners = this.listeners.filter(l => l !== callback);
    }

    notify() {
        this.listeners.forEach(l => l(this.state));
    }

    // UI Helper to inject a settings button/modal
    injectSettingsUI(containerFn) {
        // Pending implementation if needed for non-React games
    }
}

// Export singleton
window.GameSettings = new GameSettingsManager();

/**
 * Global Score Manager
 * Persists points across all games to localStorage.
 */
class GlobalScoreManager {
    constructor() {
        this.score = this.load();
        this.listeners = [];
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'neuro_hub_global_score' || e.key === 'neuro_hub_daily_streak') {
                const newScore = this.load();
                if (newScore !== this.score) {
                    this.score = newScore;
                    this.notify();
                }
            }
        });
    }

    load() {
        try {
            const stored = localStorage.getItem('neuro_hub_global_score');
            return stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    save() {
        localStorage.setItem('neuro_hub_global_score', this.score.toString());
        this.notify();
    }

    get() {
        return this.score;
    }

    // Dynamic level calculation (1000 XP per level)
    getLevel() {
        return Math.floor(this.score / 1000) + 1;
    }

    // Get current progress percentage inside the level (0 to 100)
    getLevelProgress() {
        return (this.score % 1000) / 10;
    }

    // Cognitive rank title
    getRank() {
        const xp = this.score;
        if (xp < 1000) return "NEURO_INITIATE";
        if (xp < 3000) return "SYNAPSE_DECODER";
        if (xp < 7000) return "LOGIC_OPERATOR";
        if (xp < 15000) return "COGNITIVE_SURGEON";
        if (xp < 30000) return "QUANTUM_MATRICIAN";
        return "NEURO_MASTER";
    }

    // Dynamic daily streak tracking
    updateStreak() {
        try {
            const todayStr = new Date().toDateString();
            const storedDate = localStorage.getItem('neuro_hub_last_play_date');
            let streak = parseInt(localStorage.getItem('neuro_hub_daily_streak') || '0', 10);
            
            if (storedDate === todayStr) {
                return streak || 1;
            }
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            
            if (storedDate === yesterdayStr) {
                streak++;
            } else {
                streak = 1;
            }
            
            localStorage.setItem('neuro_hub_last_play_date', todayStr);
            localStorage.setItem('neuro_hub_daily_streak', streak.toString());
            return streak;
        } catch (e) {
            return 1;
        }
    }

    getStreak() {
        try {
            // Check if streak was broken (last play was before yesterday)
            const storedDate = localStorage.getItem('neuro_hub_last_play_date');
            if (!storedDate) return 0;
            
            const todayStr = new Date().toDateString();
            if (storedDate === todayStr) {
                return parseInt(localStorage.getItem('neuro_hub_daily_streak') || '1', 10);
            }
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            if (storedDate === yesterdayStr) {
                return parseInt(localStorage.getItem('neuro_hub_daily_streak') || '1', 10);
            }
            
            // Streak broken
            localStorage.setItem('neuro_hub_daily_streak', '0');
            return 0;
        } catch (e) {
            return 0;
        }
    }

    getMultiplier() {
        const streak = this.getStreak();
        if (streak <= 1) return 1.0;
        if (streak === 2) return 1.1;
        if (streak === 3) return 1.2;
        if (streak === 4) return 1.3;
        return 1.5; // Streak >= 5
    }

    // Audio dopamine arpeggio chime (ascends C5 -> E5 -> G5 -> C6)
    playDopamineChime() {
        try {
            if (window.GameSettings && !window.GameSettings.get().sound) return;
            
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            
            const audioCtx = new AudioContextClass();
            const now = audioCtx.currentTime;
            
            const playNote = (freq, time, duration) => {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);
                
                gainNode.gain.setValueAtTime(0.12, time);
                gainNode.gain.exponentialRampToValueAtTime(0.005, time + duration);
                
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                osc.start(time);
                osc.stop(time + duration);
            };
            
            playNote(523.25, now, 0.1);        // C5
            playNote(659.25, now + 0.07, 0.1);  // E5
            playNote(783.99, now + 0.14, 0.15); // G5
            playNote(1046.50, now + 0.21, 0.3); // C6
        } catch (e) {
            console.warn("Audio chime failed to play:", e);
        }
    }

    triggerDopamineHaptic() {
        try {
            if (window.GameSettings && !window.GameSettings.get().haptics) return;
            if (navigator.vibrate) {
                navigator.vibrate([45, 30, 45]);
            }
        } catch (e) {}
    }

    add(points) {
        if (typeof points === 'number' && points > 0) {
            this.updateStreak();
            const mult = this.getMultiplier();
            const adjustedPoints = Math.round(points * mult);
            
            const oldLevel = this.getLevel();
            this.score += adjustedPoints;
            this.save();
            
            // Triumphant feedback loop
            this.playDopamineChime();
            this.triggerDopamineHaptic();
            
            const newLevel = this.getLevel();
            if (newLevel > oldLevel) {
                console.log(`%c LEVEL UP! You reached Level ${newLevel}! `, 'background: #00f3ff; color: #000; font-weight: bold; font-size: 14px;');
            }
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.score);
        return () => this.listeners = this.listeners.filter(l => l !== callback);
    }

    notify() {
        this.listeners.forEach(l => l(this.score));
    }
}

// Export singleton
window.GlobalScore = new GlobalScoreManager();

// Standardize Fullscreen API
function requestFullScreen() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
            // Once successfully in fullscreen, remove the listeners so we don't trap the user forever
            document.removeEventListener('pointerdown', requestFullScreen);
            document.removeEventListener('keydown', requestFullScreen);
        }).catch(() => {});
    }
}
document.addEventListener('pointerdown', requestFullScreen);
document.addEventListener('keydown', requestFullScreen);

/**
 * Responsible Gaming Manager
 * Stores user preferences for the Digital Wellbeing controls.
 */
class ResponsibleGamingManager {
    constructor() {
        this.defaults = {
            enabled: false,
            globalMinutes: 60,
            perGameMinutes: 0, // 0 = unlimited
            maxPlaysPerGame: 0, // 0 = unlimited
            cutoffTime: '' // e.g. "22:00" for 10 PM. Empty = unlimited
        };
        this.state = this.load();
        this.listeners = [];
    }

    load() {
        try {
            const stored = localStorage.getItem('neuro_hub_responsible_settings');
            return stored ? { ...this.defaults, ...JSON.parse(stored) } : { ...this.defaults };
        } catch (e) {
            return { ...this.defaults };
        }
    }

    save() {
        localStorage.setItem('neuro_hub_responsible_settings', JSON.stringify(this.state));
        this.notify();
    }

    get() {
        return { ...this.state };
    }

    set(key, value) {
        if (key in this.state) {
            this.state[key] = value;
            this.save();
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.state);
        return () => this.listeners = this.listeners.filter(l => l !== callback);
    }

    notify() {
        this.listeners.forEach(l => l(this.state));
    }
}

window.ResponsibleSettings = new ResponsibleGamingManager();
