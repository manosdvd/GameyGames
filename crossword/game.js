// Sound Effects Synthesizer using Web Audio API
class SoundController {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playSuccess() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            
            gain.gain.setValueAtTime(0.12, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.45);
        });
    }

    playWordCorrect() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25]; // C5, E5
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            
            gain.gain.setValueAtTime(0.08, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });
    }

    playError() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110.00, now); // A2 low buzz
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playClick() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }
}

// Crossword Generation Algorithm
class CrosswordGenerator {
    constructor() {}

    generate(wordMap, gridSize = 13, maxWords = 14) {
        this.gridSize = gridSize;
        const words = Object.keys(wordMap);
        if (words.length < 5) return null;

        let bestResult = null;
        let attempts = 40;

        while (attempts > 0) {
            attempts--;
            // Shuffle and pick subset
            const candidates = this.shuffle(words.map(w => ({ word: w, def: wordMap[w] })));
            // Prioritize longer words
            candidates.sort((a, b) => b.word.length - a.word.length);

            const grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
            const placed = [];

            // Place first word in center Across
            const first = candidates[0];
            const startR = Math.floor(this.gridSize / 2);
            const startC = Math.floor((this.gridSize - first.word.length) / 2);
            
            if (startC >= 0) {
                this.placeWord(grid, first.word, startR, startC, 'across', placed, first.def);
            } else {
                continue;
            }

            // Try to place subsequent words
            for (let i = 1; i < candidates.length; i++) {
                if (placed.length >= maxWords) break;
                const candidate = candidates[i];
                const bestPlacement = this.findBestPlacement(grid, candidate.word, placed);
                if (bestPlacement) {
                    this.placeWord(grid, candidate.word, bestPlacement.r, bestPlacement.c, bestPlacement.dir, placed, candidate.def);
                }
            }

            // Ensure grid has a good density (at least 7 words placed)
            if (placed.length >= 7) {
                if (!bestResult || placed.length > bestResult.placed.length) {
                    bestResult = { grid: this.cloneGrid(grid), placed: [...placed] };
                }
            }
        }

        return bestResult;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    cloneGrid(grid) {
        return grid.map(row => [...row]);
    }

    placeWord(grid, word, r, c, dir, placed, def) {
        const L = word.length;
        const dr = dir === 'down' ? 1 : 0;
        const dc = dir === 'across' ? 1 : 0;

        for (let i = 0; i < L; i++) {
            grid[r + dr * i][c + dc * i] = word[i];
        }

        placed.push({
            word,
            def,
            r,
            c,
            dir
        });
    }

    findBestPlacement(grid, word, placed) {
        let bestPlacement = null;
        let maxScore = -1;
        const L = word.length;

        for (let wordIdx = 0; wordIdx < L; wordIdx++) {
            const letter = word[wordIdx];

            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (grid[r][c] === letter) {
                        const directions = ['across', 'down'];
                        for (const dir of directions) {
                            const startR = dir === 'down' ? r - wordIdx : r;
                            const startC = dir === 'across' ? c - wordIdx : c;

                            if (this.isValidPlacement(grid, word, startR, startC, dir)) {
                                const score = this.calculatePlacementScore(grid, word, startR, startC, dir);
                                if (score > maxScore) {
                                    maxScore = score;
                                    bestPlacement = { r: startR, c: startC, dir };
                                }
                            }
                        }
                    }
                }
            }
        }

        return bestPlacement;
    }

    isValidPlacement(grid, word, startR, startC, dir) {
        const L = word.length;
        const dr = dir === 'down' ? 1 : 0;
        const dc = dir === 'across' ? 1 : 0;

        if (startR < 0 || startR + (dir === 'down' ? L : 1) > this.gridSize) return false;
        if (startC < 0 || startC + (dir === 'across' ? L : 1) > this.gridSize) return false;

        // Neighbor check before start
        const preR = startR - dr;
        const preC = startC - dc;
        if (preR >= 0 && preC >= 0 && grid[preR][preC] !== null) return false;

        // Neighbor check after end
        const postR = startR + dr * L;
        const postC = startC + dc * L;
        if (postR < this.gridSize && postC < this.gridSize && grid[postR][postC] !== null) return false;

        let hasIntersection = false;

        for (let i = 0; i < L; i++) {
            const r = startR + dr * i;
            const c = startC + dc * i;
            const val = grid[r][c];

            if (val !== null) {
                if (val !== word[i]) return false;
                hasIntersection = true;
            } else {
                // Perpendicular side adjacency checks to avoid parallel words touching side-by-side
                const perpDr = dir === 'across' ? 1 : 0;
                const perpDc = dir === 'down' ? 1 : 0;

                const n1R = r - perpDr;
                const n1C = c - perpDc;
                if (n1R >= 0 && n1C >= 0 && grid[n1R][n1C] !== null) return false;

                const n2R = r + perpDr;
                const n2C = c + perpDc;
                if (n2R < this.gridSize && n2C < this.gridSize && grid[n2R][n2C] !== null) return false;
            }
        }

        return hasIntersection;
    }

    calculatePlacementScore(grid, word, startR, startC, dir) {
        const L = word.length;
        const dr = dir === 'down' ? 1 : 0;
        const dc = dir === 'across' ? 1 : 0;

        let intersections = 0;
        let distFromCenter = 0;
        const center = this.gridSize / 2;

        for (let i = 0; i < L; i++) {
            const r = startR + dr * i;
            const c = startC + dc * i;
            if (grid[r][c] !== null) {
                intersections++;
            }
            distFromCenter += Math.abs(r - center) + Math.abs(c - center);
        }

        const connectivityScore = intersections * 15;
        const centerScore = 15 - (distFromCenter / L);

        return connectivityScore + centerScore;
    }
}

// Difficulty Level Parameters
const DIFFICULTY_SETTINGS = {
    easy: {
        gridSize: 9,
        maxWords: 8,
        minLen: 3,
        maxLen: 6,
        maxRarity: 0.70 // highly common words
    },
    medium: {
        gridSize: 13,
        maxWords: 12,
        minLen: 3,
        maxLen: 8,
        maxRarity: 0.88 // moderately common words
    },
    hard: {
        gridSize: 15,
        maxWords: 16,
        minLen: 4,
        maxLen: 11,
        maxRarity: 1.01 // allow all vocabulary complexity
    }
};

// Global Game Variables
let themesData = null;
let currentGrid = null;
let currentPlaced = [];
let cellsData = []; // size x size
let activeCell = { r: -1, c: -1 };
let activeDir = 'across'; // 'across' or 'down'
let activeWordCells = []; // array of { r, c }
let timerInterval = null;
let timeElapsed = 0;
let isPaused = false;
let isSolved = false;
let gridSize = 13;

const sound = new SoundController();
const generator = new CrosswordGenerator();

// Initialize Game elements on page load
document.addEventListener('DOMContentLoaded', async () => {
    setupThemeSelector();
    setupDifficultySelector();
    setupEventHandlers();
    
    // Load local themes & dictionary metadata in parallel
    try {
        const [themesRes] = await Promise.all([
            fetch('themes.json'),
            window.DefinitionManager ? window.DefinitionManager.load() : Promise.resolve()
        ]);
        themesData = await themesRes.json();
        initializeNewGame();
    } catch (e) {
        console.error("Failed to load themes or dictionary meta:", e);
    }
});

// Selector settings
function setupThemeSelector() {
    const select = document.getElementById('theme-select');
    const saved = localStorage.getItem('cyber_crossword_theme');
    if (saved) {
        select.value = saved;
    }
    
    select.addEventListener('change', () => {
        localStorage.setItem('cyber_crossword_theme', select.value);
        initializeNewGame();
    });
}

function setupDifficultySelector() {
    const select = document.getElementById('difficulty-select');
    const saved = localStorage.getItem('cyber_crossword_difficulty');
    if (saved) {
        select.value = saved;
    }
    
    select.addEventListener('change', () => {
        localStorage.setItem('cyber_crossword_difficulty', select.value);
        initializeNewGame();
    });
}

// Filter words based on chosen difficulty constraints
function filterWordsByDifficulty(themeWords, difficulty) {
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.medium;
    const metaData = (window.DefinitionManager && window.DefinitionManager.meta) || {};
    
    const words = Object.keys(themeWords);
    let filtered = [];

    for (const w of words) {
        const lowerW = w.toLowerCase();
        const meta = metaData[lowerW] || { rarity: 0.5 };
        const rarity = meta.rarity;
        const len = w.length;

        if (len >= settings.minLen && len <= settings.maxLen && rarity <= settings.maxRarity) {
            filtered.push({ word: w, def: themeWords[w] });
        }
    }

    // Fallback: If filter is too strict and returns too few candidates, relax the rarity filter
    if (filtered.length < 15) {
        filtered = [];
        for (const w of words) {
            const len = w.length;
            if (len >= settings.minLen && len <= settings.maxLen) {
                filtered.push({ word: w, def: themeWords[w] });
            }
        }
    }

    // Fallback 2: If still too small, relax all length filters
    if (filtered.length < 10) {
        filtered = words.map(w => ({ word: w, def: themeWords[w] }));
    }

    const result = {};
    filtered.forEach(item => {
        result[item.word] = item.def;
    });
    return result;
}

// Set up UI listeners
function setupEventHandlers() {
    document.getElementById('btn-new-game').addEventListener('click', () => {
        sound.playClick();
        initializeNewGame();
    });
    
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    
    // Toolbar Actions
    document.getElementById('btn-check-letter').addEventListener('click', () => checkSolveState('letter'));
    document.getElementById('btn-check-word').addEventListener('click', () => checkSolveState('word'));
    document.getElementById('btn-check-grid').addEventListener('click', () => checkSolveState('grid'));
    
    document.getElementById('btn-reveal-letter').addEventListener('click', () => revealState('letter'));
    document.getElementById('btn-reveal-word').addEventListener('click', () => revealState('word'));
    document.getElementById('btn-reveal-grid').addEventListener('click', () => revealState('grid'));
    
    document.getElementById('btn-reset').addEventListener('click', resetBoardInputs);
    
    // Modals
    const helpModal = document.getElementById('modal-help');
    document.getElementById('btn-help-trigger').addEventListener('click', () => {
        sound.playClick();
        helpModal.showModal();
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
        sound.playClick();
        helpModal.close();
    });
    
    // Modal Light Dismiss Fallbacks (Safari compatibility)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
        [helpModal, document.getElementById('modal-victory')].forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target !== modal) return;
                const rect = modal.getBoundingClientRect();
                const isInside = (
                    rect.top <= event.clientY &&
                    event.clientY <= rect.top + rect.height &&
                    rect.left <= event.clientX &&
                    event.clientX <= rect.left + rect.width
                );
                if (!isInside) {
                    modal.close();
                }
            });
        });
    }

    // Win Modal Action
    document.getElementById('btn-win-new-game').addEventListener('click', () => {
        sound.playClick();
        document.getElementById('modal-victory').close();
        initializeNewGame();
    });

    // Keyboard Events routed through hidden-input for virtual keyboard compatibility
    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) {
        hiddenInput.value = " ";
        hiddenInput.addEventListener('keydown', handleKeyboardControlKeys);
        hiddenInput.addEventListener('input', handleMobileTextAndBackspace);
        
        // Clicking anywhere in the grid container should focus the input to keep the keyboard visible
        document.getElementById('crossword-grid').addEventListener('click', () => {
            hiddenInput.focus();
        });
    }
}

// Generate and setup game states
function initializeNewGame() {
    if (!themesData) return;
    
    const themeName = document.getElementById('theme-select').value;
    const difficultyName = document.getElementById('difficulty-select').value;
    
    const settings = DIFFICULTY_SETTINGS[difficultyName] || DIFFICULTY_SETTINGS.medium;
    gridSize = settings.gridSize;

    // Filter the selected theme's words based on difficulty parameters
    const filteredWords = filterWordsByDifficulty(themesData[themeName], difficultyName);

    const result = generator.generate(filteredWords, settings.gridSize, settings.maxWords);
    if (!result) {
        // Fallback retry
        console.warn("Failed to generate, retrying with relaxed bounds...");
        setTimeout(initializeNewGame, 50);
        return;
    }

    currentGrid = result.grid;
    currentPlaced = result.placed;

    // Structure cells and compute numbers
    const processed = setupGridAndClues(currentGrid, currentPlaced);
    cellsData = processed.cells;
    currentPlaced = processed.wordsWithNumbers;

    // Reset status
    timeElapsed = 0;
    isPaused = false;
    isSolved = false;
    activeCell = { r: -1, c: -1 };
    activeDir = 'across';
    activeWordCells = [];

    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('btn-pause').querySelector('.pause-icon').classList.remove('hidden');
    document.getElementById('btn-pause').querySelector('.play-icon').classList.add('hidden');

    // Build DOM Grid and Clue Columns
    renderGridBoard();
    renderCluesList();
    updateActiveClueBar();
    
    // Start Timer
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    updateTimerDisplay();

    // Focus first playable cell
    focusFirstCell();
}

function focusFirstCell() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (cellsData[r][c] !== null) {
                selectCell(r, c);
                return;
            }
        }
    }
}

// Scan grid top-down to map numbers and assign clues
function setupGridAndClues(grid, placedWords) {
    const size = grid.length;
    const cells = Array(size).fill(null).map((_, r) => {
        return Array(size).fill(null).map((_, c) => {
            if (grid[r][c] === null) return null;
            return {
                r,
                c,
                letter: grid[r][c],
                input: '',
                number: null,
                acrossWord: null,
                downWord: null,
                state: ''
            };
        });
    });

    let currentNumber = 1;
    const wordsWithNumbers = [];

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (cells[r][c] === null) continue;

            const startsAcross = (c === 0 || cells[r][c - 1] === null) && (c + 1 < size && cells[r][c + 1] !== null);
            const startsDown = (r === 0 || cells[r - 1][c] === null) && (r + 1 < size && cells[r + 1][c] !== null);

            if (startsAcross || startsDown) {
                cells[r][c].number = currentNumber;

                if (startsAcross) {
                    const wordObj = placedWords.find(w => w.r === r && w.c === c && w.dir === 'across');
                    if (wordObj) {
                        wordObj.number = currentNumber;
                        wordsWithNumbers.push(wordObj);
                        for (let col = c; col < size && cells[r][col] !== null; col++) {
                            cells[r][col].acrossWord = wordObj;
                        }
                    }
                }

                if (startsDown) {
                    const wordObj = placedWords.find(w => w.r === r && w.c === c && w.dir === 'down');
                    if (wordObj) {
                        wordObj.number = currentNumber;
                        wordsWithNumbers.push(wordObj);
                        for (let row = r; row < size && cells[row][c] !== null; row++) {
                            cells[row][c].downWord = wordObj;
                        }
                    }
                }

                currentNumber++;
            }
        }
    }

    return { cells, wordsWithNumbers };
}

// DOM Rendering: Board
function renderGridBoard() {
    const board = document.getElementById('crossword-grid');
    board.innerHTML = '';
    
    // Set custom grid template columns dynamically
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = cellsData[r][c];
            const div = document.createElement('div');
            div.className = 'grid-cell';
            div.dataset.row = r;
            div.dataset.col = c;
            
            if (cell === null) {
                div.classList.add('block');
            } else {
                div.classList.add('playable');
                div.tabIndex = 0;
                
                // Set cell number if starting a word
                if (cell.number) {
                    const numSpan = document.createElement('span');
                    numSpan.className = 'cell-number';
                    numSpan.innerText = cell.number;
                    div.appendChild(numSpan);
                }

                // Add letter text wrapper
                const textSpan = document.createElement('span');
                textSpan.className = 'cell-input';
                textSpan.innerText = cell.input || '';
                div.appendChild(textSpan);

                // Setup Click Listener
                div.addEventListener('click', () => {
                    sound.playClick();
                    if (activeCell.r === r && activeCell.c === c) {
                        // Toggle direction
                        toggleActiveDirection();
                    } else {
                        selectCell(r, c);
                    }
                    const hiddenInput = document.getElementById('hidden-input');
                    if (hiddenInput) {
                        hiddenInput.focus();
                    }
                });
            }

            board.appendChild(div);
        }
    }
}

// DOM Rendering: Clue Columns
function renderCluesList() {
    const acrossList = document.getElementById('clues-across');
    const downList = document.getElementById('clues-down');
    
    acrossList.innerHTML = '';
    downList.innerHTML = '';

    // Sort placed words by number
    const sorted = [...currentPlaced].sort((a, b) => a.number - b.number);

    sorted.forEach(word => {
        const li = document.createElement('li');
        li.dataset.number = word.number;
        li.dataset.dir = word.dir;
        li.id = `clue-${word.number}-${word.dir}`;
        
        li.innerHTML = `<strong>${word.number}</strong> <span>${word.def}</span>`;
        
        // Listeners for clue list selections
        li.addEventListener('click', () => {
            sound.playClick();
            activeDir = word.dir;
            selectCell(word.r, word.c);
        });

        if (word.dir === 'across') {
            acrossList.appendChild(li);
        } else {
            downList.appendChild(li);
        }
    });

    updateCluesCompletion();
}

// Select cell and calculate highlight sets
function selectCell(r, c) {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return;
    const cell = cellsData[r][c];
    if (cell === null) return;

    activeCell = { r, c };
    
    // Resolve active direction: if cell doesn't belong to current direction, switch it
    if (activeDir === 'across' && !cell.acrossWord) {
        activeDir = 'down';
    } else if (activeDir === 'down' && !cell.downWord) {
        activeDir = 'across';
    }

    calculateActiveWordCells();
    updateHighlightDOM();
    updateActiveClueBar();

    // Trigger virtual mobile keyboard focus and space buffer
    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) {
        hiddenInput.value = " ";
        hiddenInput.focus();
    }
}

// Switch direction on click or toggle trigger
function toggleActiveDirection() {
    const cell = cellsData[activeCell.r][activeCell.c];
    if (!cell) return;

    if (activeDir === 'across') {
        if (cell.downWord) activeDir = 'down';
    } else {
        if (cell.acrossWord) activeDir = 'across';
    }

    calculateActiveWordCells();
    updateHighlightDOM();
    updateActiveClueBar();
}

// Figure out what cells belong to the active word
function calculateActiveWordCells() {
    activeWordCells = [];
    if (activeCell.r === -1 || activeCell.c === -1) return;

    const cell = cellsData[activeCell.r][activeCell.c];
    if (!cell) return;

    const word = activeDir === 'across' ? cell.acrossWord : cell.downWord;
    if (!word) return;

    const dr = word.dir === 'down' ? 1 : 0;
    const dc = word.dir === 'across' ? 1 : 0;

    for (let i = 0; i < word.word.length; i++) {
        activeWordCells.push({
            r: word.r + dr * i,
            c: word.c + dc * i
        });
    }
}

// Redraw Highlights
function updateHighlightDOM() {
    document.querySelectorAll('.grid-cell.playable').forEach(div => {
        div.classList.remove('highlight-word', 'highlight-active');
        const r = parseInt(div.dataset.row);
        const c = parseInt(div.dataset.col);

        if (r === activeCell.r && c === activeCell.c) {
            div.classList.add('highlight-active');
        } else if (activeWordCells.some(cell => cell.r === r && cell.c === c)) {
            div.classList.add('highlight-word');
        }
    });

    // Highlight Clues lists
    document.querySelectorAll('.clue-list li').forEach(li => li.classList.remove('active'));
    
    if (activeCell.r !== -1) {
        const cell = cellsData[activeCell.r][activeCell.c];
        const activeWord = activeDir === 'across' ? cell.acrossWord : cell.downWord;
        if (activeWord) {
            const li = document.getElementById(`clue-${activeWord.number}-${activeWord.dir}`);
            if (li) {
                li.classList.add('active');
                li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }
}

// Set text at clue bar
function updateActiveClueBar() {
    const label = document.getElementById('active-clue-label');
    const text = document.getElementById('active-clue-text');

    if (activeCell.r === -1 || activeCell.c === -1) {
        label.innerText = "STANDBY";
        text.innerText = "Select a data cell to initialize solving sequence.";
        return;
    }

    const cell = cellsData[activeCell.r][activeCell.c];
    const word = activeDir === 'across' ? cell.acrossWord : cell.downWord;

    if (word) {
        label.innerText = `${word.number}-${word.dir.toUpperCase()}`;
        text.innerText = word.def;
    } else {
        label.innerText = "STANDBY";
        text.innerText = "Select a cell to initialize solving sequence.";
    }
}

// Timer Functions
function updateTimer() {
    if (isPaused || isSolved) return;
    timeElapsed++;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
    const s = (timeElapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

function togglePause() {
    sound.playClick();
    isPaused = !isPaused;
    
    const pauseScreen = document.getElementById('pause-screen');
    const pauseBtn = document.getElementById('btn-pause');
    
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        pauseBtn.querySelector('.pause-icon').classList.add('hidden');
        pauseBtn.querySelector('.play-icon').classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
        pauseBtn.querySelector('.pause-icon').classList.remove('hidden');
        pauseBtn.querySelector('.play-icon').classList.add('hidden');
        
        // Refocus active cell to bring mobile keyboard back up
        if (activeCell.r !== -1) {
            const hiddenInput = document.getElementById('hidden-input');
            if (hiddenInput) {
                hiddenInput.focus();
            }
        }
    }
}

// Keyboard control keys Router (arrow keys, tab, enter, space)
function handleKeyboardControlKeys(e) {
    if (isPaused || isSolved) return;
    if (activeCell.r === -1 || activeCell.c === -1) return;

    // Ignore keypresses if help modal is open
    if (document.getElementById('modal-help').open || document.getElementById('modal-victory').open) return;

    if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveCursor(0, 1);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveCursor(0, -1);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveCursor(1, 0);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveCursor(-1, 0);
    } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleActiveDirection();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        navigateClues(e.shiftKey ? -1 : 1);
    }
}

// Text and Backspace Router supporting virtual keyboard inputs on mobile
function handleMobileTextAndBackspace(e) {
    if (isPaused || isSolved) return;
    if (activeCell.r === -1 || activeCell.c === -1) return;

    const hiddenInput = document.getElementById('hidden-input');
    if (!hiddenInput) return;

    const val = hiddenInput.value;
    const r = activeCell.r;
    const c = activeCell.c;
    const cell = cellsData[r][c];

    if (val.length > 1) {
        // Character added after the initial space
        const char = val.charAt(1).toUpperCase();
        if (/^[A-Z]$/.test(char)) {
            const cellEl = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
            cell.input = char;
            cell.state = '';
            cellEl.classList.remove('correct', 'error', 'revealed');
            cellEl.querySelector('.cell-input').innerText = char;

            sound.playClick();
            moveCursorInActiveWord(1);
            updateCluesCompletion();
            checkCompletion();
        }
        hiddenInput.value = " "; // Reset to space buffer
    } else if (val.length === 0) {
        // Space deleted (Backspace pressed on virtual/physical keyboard)
        const cellEl = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
        cell.input = '';
        cell.state = '';
        cellEl.classList.remove('correct', 'error', 'revealed');
        cellEl.querySelector('.cell-input').innerText = '';

        moveCursorInActiveWord(-1);
        updateCluesCompletion();
        hiddenInput.value = " "; // Reset to space buffer
    }
}

// Move cursor inside active word bounds
function moveCursorInActiveWord(delta) {
    if (activeWordCells.length === 0) return;
    
    const currentIndex = activeWordCells.findIndex(cell => cell.r === activeCell.r && cell.c === activeCell.c);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + delta;
    if (nextIndex >= 0 && nextIndex < activeWordCells.length) {
        selectCell(activeWordCells[nextIndex].r, activeWordCells[nextIndex].c);
    }
}

// Free navigation with arrow keys (finds next playable cell in that direction)
function moveCursor(dr, dc) {
    let currR = activeCell.r + dr;
    let currC = activeCell.c + dc;

    // Scan in direction for playable cell
    while (currR >= 0 && currR < gridSize && currC >= 0 && currC < gridSize) {
        if (cellsData[currR][currC] !== null) {
            selectCell(currR, currC);
            return;
        }
        currR += dr;
        currC += dc;
    }
}

// Tab / Shift-Tab cycle clues
function navigateClues(direction) {
    if (currentPlaced.length === 0) return;

    // Get combined list of all clues sorted by number
    const list = [...currentPlaced].sort((a, b) => a.number - b.number);
    
    // Find active word
    const activeWordCellObj = cellsData[activeCell.r][activeCell.c];
    const activeWord = activeDir === 'across' ? activeWordCellObj.acrossWord : activeWordCellObj.downWord;

    if (!activeWord) return;

    const index = list.findIndex(w => w.number === activeWord.number && w.dir === activeWord.dir);
    if (index === -1) return;

    let nextIndex = index + direction;
    if (nextIndex >= list.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = list.length - 1;

    const nextWord = list[nextIndex];
    activeDir = nextWord.dir;
    selectCell(nextWord.r, nextWord.c);
}

// Crossed clues solved styling
function updateCluesCompletion() {
    currentPlaced.forEach(word => {
        const li = document.getElementById(`clue-${word.number}-${word.dir}`);
        if (!li) return;

        let completed = true;
        const dr = word.dir === 'down' ? 1 : 0;
        const dc = word.dir === 'across' ? 1 : 0;

        for (let i = 0; i < word.word.length; i++) {
            const r = word.r + dr * i;
            const c = word.c + dc * i;
            if (!cellsData[r][c] || cellsData[r][c].input.toUpperCase() !== cellsData[r][c].letter.toUpperCase()) {
                completed = false;
                break;
            }
        }

        if (completed) {
            li.classList.add('completed');
        } else {
            li.classList.remove('completed');
        }
    });
}

// Verification Utilities
function checkSolveState(scope) {
    sound.init();
    let hasError = false;
    let checkedCount = 0;

    const processCell = (cell) => {
        if (!cell || !cell.input) return;
        checkedCount++;
        const cellEl = document.querySelector(`.grid-cell[data-row="${cell.r}"][data-col="${cell.c}"]`);
        
        if (cell.input.toUpperCase() === cell.letter.toUpperCase()) {
            cell.state = 'correct';
            cellEl.classList.add('correct');
            cellEl.classList.remove('error');
        } else {
            cell.state = 'error';
            cellEl.classList.add('error');
            cellEl.classList.remove('correct');
            hasError = true;
        }
    };

    if (scope === 'letter') {
        const cell = cellsData[activeCell.r][activeCell.c];
        processCell(cell);
    } else if (scope === 'word') {
        activeWordCells.forEach(coords => {
            processCell(cellsData[coords.r][coords.c]);
        });
    } else if (scope === 'grid') {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                processCell(cellsData[r][c]);
            }
        }
    }

    if (checkedCount > 0) {
        if (hasError) {
            sound.playError();
        } else {
            sound.playWordCorrect();
        }
    }
}

// Reveal Utilities
function revealState(scope) {
    sound.init();

    const revealCell = (cell) => {
        if (!cell) return;
        cell.input = cell.letter;
        cell.state = 'revealed';
        
        const cellEl = document.querySelector(`.grid-cell[data-row="${cell.r}"][data-col="${cell.c}"]`);
        cellEl.classList.remove('error', 'correct');
        cellEl.classList.add('revealed');
        cellEl.querySelector('.cell-input').innerText = cell.letter;
    };

    if (scope === 'letter') {
        const cell = cellsData[activeCell.r][activeCell.c];
        revealCell(cell);
    } else if (scope === 'word') {
        activeWordCells.forEach(coords => {
            revealCell(cellsData[coords.r][coords.c]);
        });
    } else if (scope === 'grid') {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                revealCell(cellsData[r][c]);
            }
        }
    }

    updateCluesCompletion();
    sound.playWordCorrect();
    checkCompletion();
}

// Reset inputs
function resetBoardInputs() {
    sound.playClick();
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = cellsData[r][c];
            if (cell) {
                cell.input = '';
                cell.state = '';
                const cellEl = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
                cellEl.classList.remove('correct', 'error', 'revealed');
                cellEl.querySelector('.cell-input').innerText = '';
            }
        }
    }
    updateCluesCompletion();
    if (activeCell.r !== -1) {
        selectCell(activeCell.r, activeCell.c);
    }
}

// Success Win checks
function checkCompletion() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = cellsData[r][c];
            if (cell) {
                if (cell.input.toUpperCase() !== cell.letter.toUpperCase()) {
                    return; // not solved yet
                }
            }
        }
    }

    // Solved!
    isSolved = true;
    clearInterval(timerInterval);
    sound.playSuccess();

    // Prepare victory data
    const m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
    const s = (timeElapsed % 60).toString().padStart(2, '0');
    
    document.getElementById('win-time-display').innerText = `${m}:${s}`;
    
    const themeName = document.getElementById('theme-select').value;
    document.getElementById('win-theme-display').innerText = themeName.toUpperCase().replace('_', ' ');

    const difficultyName = document.getElementById('difficulty-select').value;
    document.getElementById('win-difficulty-display').innerText = difficultyName.toUpperCase();

    // Open victory modal with delayed buffer to enjoy visual completion
    setTimeout(() => {
        document.getElementById('modal-victory').showModal();
    }, 800);
}
