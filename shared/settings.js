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
            if (e.key === 'neuro_hub_global_score') {
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

    add(points) {
        if (typeof points === 'number' && points > 0) {
            this.score += points;
            this.save();
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        // Initial call
        callback(this.score);
        return () => this.listeners = this.listeners.filter(l => l !== callback);
    }

    notify() {
        this.listeners.forEach(l => l(this.score));}
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
