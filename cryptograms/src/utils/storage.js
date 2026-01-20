const STORAGE_KEY = 'crypto_puzzle_state_v1';

export const saveGameState = (state) => {
    try {
        const serialized = JSON.stringify({
            ...state,
            hintedChars: Array.from(state.hintedChars || [])
        });
        localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
        console.warn("Failed to save state", e);
    }
};

export const loadGameState = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);
        // Hydrate Sets
        if (data.hintedChars) {
            data.hintedChars = new Set(data.hintedChars);
        }
        return data;
    } catch (e) {
        console.warn("Failed to load state", e);
        return null;
    }
};

export const clearGameState = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn("Failed to clear state", e);
    }
};

const HIGH_SCORE_KEY = 'crypto_puzzle_high_score';

export const saveHighScore = (score) => {
    try {
        const current = loadHighScore();
        if (score > current) {
            localStorage.setItem(HIGH_SCORE_KEY, score.toString());
            return true; // New high score!
        }
        return false;
    } catch (e) {
        console.warn("Failed to save high score", e);
        return false;
    }
};

export const loadHighScore = () => {
    try {
        const raw = localStorage.getItem(HIGH_SCORE_KEY);
        return raw ? parseInt(raw, 10) : 0;
    } catch (e) {
        return 0;
    }
};
