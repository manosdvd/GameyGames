// Main JS for Game Hub

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Dynamic Favorites Section
    initializeFavorites();

    // 2. FAB interaction
    const fab = document.querySelector('.cyber-fab');
    if (fab) {
        fab.addEventListener('click', () => {
            alert('Add Game feature coming soon!');
        });
    }

    // 3. Ripple effect for buttons (Simple generic ripple)
    const buttons = document.querySelectorAll('button, .card');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function (e) {
            // Optional: Implement complex ripple here if needed
            // For now, CSS active state and transition is used
        });
    });

    // 4. Initialize PWA Features
    initializePWA();
});

/**
 * Dynamically selects and renders the top 4 most played games into FAVORITE_MODULES section.
 * Falls back to curated popular defaults if the user has a fresh profile with 0 plays.
 */
function initializeFavorites() {
    const favoritesGrid = document.getElementById('favoritesGrid');
    const allGamesGrid = document.getElementById('allGamesGrid');
    if (!favoritesGrid || !allGamesGrid) return;

    // Fetch all cards from ALL_MODULES
    const allCards = Array.from(allGamesGrid.querySelectorAll('.cyber-card'));
    if (allCards.length === 0) return;

    // Load all-time play counts from localStorage
    let allTimePlays = {};
    try {
        const storedPlays = localStorage.getItem('neuro_hub_all_time_plays');
        if (storedPlays) {
            allTimePlays = JSON.parse(storedPlays);
        }
    } catch (e) {
        console.error('Failed to load all-time play counts:', e);
    }

    // Check if total play count is completely 0 (e.g. brand new profile)
    const totalPlays = Object.values(allTimePlays).reduce((sum, count) => sum + count, 0);
    let topCards = [];

    if (totalPlays === 0) {
        // CURATED DEFAULTS: Distinct and highly engaging starter games
        const curatedDefaultIds = ['anxiety', 'hexenergy', 'wordle', 'cryptograms'];
        curatedDefaultIds.forEach(id => {
            const card = allCards.find(c => c.getAttribute('data-game-id') === id);
            if (card) topCards.push(card);
        });

        // Safe fallback in case any of the curated default cards are missing or renamed in index.html
        if (topCards.length < 4) {
            allCards.forEach(card => {
                if (topCards.length < 4 && !topCards.includes(card)) {
                    topCards.push(card);
                }
            });
        }
    } else {
        // SORTING: Sort all games descending by play count, using original DOM position as tie-breaker
        const sortedCards = [...allCards].sort((a, b) => {
            const idA = a.getAttribute('data-game-id');
            const idB = b.getAttribute('data-game-id');
            const playsA = allTimePlays[idA] || 0;
            const playsB = allTimePlays[idB] || 0;

            if (playsB !== playsA) {
                return playsB - playsA;
            }
            // Preserve the original curated grid hierarchy order for ties
            return allCards.indexOf(a) - allCards.indexOf(b);
        });

        topCards = sortedCards.slice(0, 4);
    }

    // RENDER: Clear favorites container, clone top 4 cards, and append them
    favoritesGrid.innerHTML = '';
    topCards.forEach(card => {
        const clonedCard = card.cloneNode(true);
        favoritesGrid.appendChild(clonedCard);
    });
}

/**
 * Initializes Service Worker registration and handles the Progressive Web App (PWA) installation flow.
 */
function initializePWA() {
    // Register Service Worker for offline play
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('[PWA] Service Worker registered successfully on scope:', reg.scope);
                })
                .catch(err => {
                    console.error('[PWA] Service Worker registration failed:', err);
                });
        });
    }

    let deferredPrompt;
    const installPanel = document.getElementById('pwaInstallPanel');
    const installBtn = document.getElementById('pwaInstallBtn');

    if (!installPanel || !installBtn) return;

    // Listen for PWA install capability
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installPanel.style.display = 'block';
        console.log('[PWA] App is installable! Install panel displayed.');
    });

    // Handle install button click
    installBtn.addEventListener('click', () => {
        if (!deferredPrompt) return;
        
        installPanel.style.display = 'none';
        deferredPrompt.prompt();
        
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('[PWA] User accepted the installation.');
            } else {
                console.log('[PWA] User dismissed the installation.');
                installPanel.style.display = 'block';
            }
            deferredPrompt = null;
        });
    });

    // Clean up if already installed
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] NEURO_HUB successfully installed natively!');
        installPanel.style.display = 'none';
    });
}
