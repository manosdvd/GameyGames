
// responsible-gaming.js
(function () {
    const STORAGE_KEY_MODE = 'gameMode';
    const STORAGE_KEY_MAX_MINUTES = 'maxTimeMinutes';
    const STORAGE_KEY_USAGE = 'dailyTimeUsed';
    const STORAGE_KEY_DATE = 'lastPlayDate';

    // Check if Responsible Mode is active
    const mode = localStorage.getItem(STORAGE_KEY_MODE);
    if (mode !== 'responsible') return;

    // Configuration
    const maxMinutes = parseInt(localStorage.getItem(STORAGE_KEY_MAX_MINUTES) || '60', 10);
    const maxSeconds = maxMinutes * 60;

    // State
    const today = new Date().toDateString();
    let usage = parseFloat(localStorage.getItem(STORAGE_KEY_USAGE) || '0');
    const lastDate = localStorage.getItem(STORAGE_KEY_DATE);

    // Reset usage if new day
    if (lastDate !== today) {
        usage = 0;
        localStorage.setItem(STORAGE_KEY_USAGE, '0');
        localStorage.setItem(STORAGE_KEY_DATE, today);
    }

    // Overlay Creation
    let overlay = null;
    function showTimeUpOverlay() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.95); z-index: 9999; color: white;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: monospace; text-align: center;
        `;
        overlay.innerHTML = `
            <div style="font-size: 4rem; color: #ef4444; margin-bottom: 2rem; font-weight: bold;">TIME'S UP</div>
            <div style="font-size: 1.5rem; color: #cbd5e1; max-width: 600px;">
                You have reached your daily limit of ${maxMinutes} minutes.
                <br><br>
                Take a break and come back tomorrow.
            </div>
            <a href="../index.html" style="margin-top: 3rem; padding: 1rem 2rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: bold; font-size: 1.2rem;">RETURN TO HUB</a>
        `;
        document.body.appendChild(overlay);

        // Stop all audio/interactions if possible (hard without deeper integration, but overlay blocks clicks)
        const root = document.getElementById('root');
        if (root) root.style.filter = 'blur(10px)';
    }

    // Initial Check
    if (usage >= maxSeconds) {
        showTimeUpOverlay();
        return; // Don't start timer
    }

    // Timer Loop
    setInterval(() => {
        usage += 1;
        localStorage.setItem(STORAGE_KEY_USAGE, usage.toString());
        localStorage.setItem(STORAGE_KEY_DATE, today);

        if (usage >= maxSeconds) {
            showTimeUpOverlay();
        }
    }, 1000);



})();
