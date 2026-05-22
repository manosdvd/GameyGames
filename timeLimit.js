// responsible-gaming.js
(function () {
    const STORAGE_KEY_USAGE = 'neuro_hub_daily_usage';
    const SETTINGS_KEY = 'neuro_hub_responsible_settings';

    function getSettings() {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            return stored ? JSON.parse(stored) : { enabled: false, globalMinutes: 60, perGameMinutes: 0, maxPlaysPerGame: 0, cutoffTime: '' };
        } catch (e) {
            return { enabled: false, globalMinutes: 60, perGameMinutes: 0, maxPlaysPerGame: 0, cutoffTime: '' };
        }
    }

    const today = new Date().toDateString();
    
    function getUsage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_USAGE);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.date === today) return parsed;
            }
        } catch (e) {}
        return { date: today, globalSeconds: 0, gameSeconds: {}, playCounts: {} };
    }

    function saveUsage(usage) {
        localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(usage));
    }

    const path = window.location.pathname;
    let currentGame = 'hub';
    if (path.includes('cryptograms')) currentGame = 'cryptograms';
    else if (path.includes('anxiety3') && path.includes('dyslexia.html')) currentGame = 'dyslexia';
    else if (path.includes('anxiety3') && path.includes('discalculia.html')) currentGame = 'discalculia';
    else if (path.includes('anxiety3')) currentGame = 'anxiety';
    else if (path.includes('hexenergy')) currentGame = 'hexenergy';
    else if (path.includes('wordle')) currentGame = 'wordle';
    else if (path.includes('bejewelled')) currentGame = 'bejewelled';
    else if (path.includes('lexicondrop')) currentGame = 'lexicondrop';
    else if (path.includes('lightsout')) currentGame = 'lightsout';
    else if (path.includes('synapseflow')) currentGame = 'synapseflow';
    else if (path.includes('clusterpurge')) currentGame = 'clusterpurge';
    else if (path.includes('signalmerge')) currentGame = 'signalmerge';
    else if (path.includes('memorypulse')) currentGame = 'memorypulse';
    else if (path.includes('pixeldecode')) currentGame = 'pixeldecode';
    else if (path.includes('minesweeperzen')) currentGame = 'minesweeperzen';

    let settings = getSettings();
    let usage = getUsage();

    if (!settings.enabled) return;

    if (currentGame !== 'hub') {
        const sessionPlayKey = `played_${currentGame}_today`;
        if (!sessionStorage.getItem(sessionPlayKey)) {
            usage.playCounts[currentGame] = (usage.playCounts[currentGame] || 0) + 1;
            saveUsage(usage);
            sessionStorage.setItem(sessionPlayKey, 'true');
        }
    }

    let overlay = null;
    function showBlockOverlay(reasonMessage) {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(10, 5, 20, 0.98); z-index: 2147483647; color: white;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: 'Orbitron', monospace; text-align: center; backdrop-filter: blur(15px);
            padding: 20px; box-sizing: border-box;
        `;
        
        let buttonHtml = '';
        if (currentGame === 'hub') {
            buttonHtml = `<div style="margin-top: 3rem; color: #ff3333; font-weight: bold; font-size: 1.2rem;">DIGITAL WELLBEING LOCK ENGAGED</div>`;
        } else {
            // Need absolute path back to hub in case of weird nesting, but ../index.html usually works
            const backPath = path.includes('anxiety3') ? '../index.html' : '../index.html';
            buttonHtml = `<a href="${backPath}" style="margin-top: 3rem; padding: 1rem 2rem; background: #00f3ff; color: #000; text-decoration: none; border-radius: 40px; font-weight: 800; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 2px;">RETURN TO HUB</a>`;
        }

        overlay.innerHTML = `
            <div style="font-size: 4rem; color: #ff3333; margin-bottom: 2rem; font-weight: 900; text-shadow: 0 0 20px #ff3333;">LOCKED</div>
            <div style="font-size: 1.5rem; color: #00f3ff; max-width: 600px; line-height: 1.6;">
                ${reasonMessage}
                <br><br>
                Take a break. Your brain will thank you.
            </div>
            ${buttonHtml}
        `;
        document.body.appendChild(overlay);

        const root = document.getElementById('root') || document.getElementById('game-wrapper');
        if (root) root.style.filter = 'blur(10px)';
        
        // Disable interactions on all other elements to prevent keyboard tabbing bypass
        Array.from(document.body.children).forEach(child => {
            if (child !== overlay) {
                child.style.pointerEvents = 'none';
                child.inert = true; // Modern HTML5 way to disable focus/clicks
            }
        });
    }

    function checkLimits() {
        settings = getSettings();
        if (!settings.enabled) return false;

        if (settings.cutoffTime) {
            const now = new Date();
            const [hours, minutes] = settings.cutoffTime.split(':').map(Number);
            const cutoff = new Date();
            cutoff.setHours(hours, minutes, 0, 0);
            
            if (now >= cutoff) {
                showBlockOverlay(\`It is past your strict cutoff time of \${settings.cutoffTime}.\`);
                return true;
            }
        }

        if (settings.globalMinutes > 0 && usage.globalSeconds >= settings.globalMinutes * 60) {
            showBlockOverlay(\`You have reached your total daily limit of \${settings.globalMinutes} minutes.\`);
            return true;
        }

        if (currentGame !== 'hub' && settings.perGameMinutes > 0) {
            const gTime = usage.gameSeconds[currentGame] || 0;
            if (gTime >= settings.perGameMinutes * 60) {
                showBlockOverlay(\`You have reached the per-game limit of \${settings.perGameMinutes} minutes for this module.\`);
                return true;
            }
        }

        if (currentGame !== 'hub' && settings.maxPlaysPerGame > 0) {
            const plays = usage.playCounts[currentGame] || 0;
            if (plays > settings.maxPlaysPerGame) {
                showBlockOverlay(\`You have reached your limit of \${settings.maxPlaysPerGame} play(s) for this module today.\`);
                return true;
            }
        }

        return false;
    }

    // Try check limits once DOM is ready so body exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (checkLimits()) return;
        });
    } else {
        if (checkLimits()) return;
    }

    setInterval(() => {
        if (!document.hidden && currentGame !== 'hub') {
            usage = getUsage();
            usage.globalSeconds++;
            usage.gameSeconds[currentGame] = (usage.gameSeconds[currentGame] || 0) + 1;
            saveUsage(usage);
        }
        checkLimits();
    }, 1000);
})();
