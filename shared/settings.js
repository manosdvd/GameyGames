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
