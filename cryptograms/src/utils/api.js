import { generateCipher } from './cipher';
import { CUSTOM_QUOTES } from '../data/customQuotes';

const SEEN_STORAGE_KEY = 'crypto_puzzle_seen_hashes';
const DECK_STORAGE_KEY = 'crypto_puzzle_deck';
const DECK_POINTER_KEY = 'crypto_puzzle_deck_pointer';
const DECK_META_KEY = 'crypto_puzzle_deck_metadata';
const MAX_HISTORY = 50;

// --- Helper: Shuffle ---
const fisherYates = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// --- History / Deduping Logic ---

const getSeenHashes = () => {
    try {
        const stored = localStorage.getItem(SEEN_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn("Failed to read seen hashes", e);
        return [];
    }
};

const saveSeenHash = (hash) => {
    try {
        const seen = getSeenHashes();
        const newSeen = [hash, ...seen].slice(0, MAX_HISTORY);
        localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(newSeen));
    } catch (e) {
        console.warn("Failed to save seen hash", e);
    }
};

const hashString = (str) => {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash.toString();
};

// --- Deck Storage Helpers ---

const getDeck = () => {
    try {
        const stored = localStorage.getItem(DECK_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const saveDeck = (deck) => {
    try {
        localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    } catch (e) {
        console.warn("Failed to save deck", e);
    }
};

const getDeckPointer = () => {
    try {
        const stored = localStorage.getItem(DECK_POINTER_KEY);
        return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
        return 0;
    }
};

const saveDeckPointer = (pointer) => {
    try {
        localStorage.setItem(DECK_POINTER_KEY, pointer.toString());
    } catch (e) {
        console.warn("Failed to save deck pointer", e);
    }
};

const getDeckMetadata = () => {
    try {
        const stored = localStorage.getItem(DECK_META_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
};

const saveDeckMetadata = (metadata) => {
    try {
        localStorage.setItem(DECK_META_KEY, JSON.stringify(metadata));
    } catch (e) {
        console.warn("Failed to save deck metadata", e);
    }
};

// --- Deck Lifecycle Engine ---

let cachedDeck = null;

const createDeck = async () => {
    const module = await import('../data/bulkQuotes.json');
    const BULK_QUOTES = module.default || module;

    const diffModule = await import('../data/quoteDifficulties.json');
    const difficulties = diffModule.default || diffModule;

    const allIds = [];
    CUSTOM_QUOTES.forEach((_, i) => allIds.push(`c:${i}`));
    BULK_QUOTES.forEach((_, i) => allIds.push(`b:${i}`));

    // Sort all quote IDs by their precomputed difficulty
    allIds.sort((a, b) => (difficulties[a] || 0.5) - (difficulties[b] || 0.5));

    const total = allIds.length;
    const deck = [];
    const period = 12; // easy -> medium -> hard -> medium -> easy... every 12 quotes
    const windowFraction = 0.05; // 5% search window for local randomization
    
    let available = [...allIds];

    for (let i = 0; i < total; i++) {
        // Shift by -pi/2 so that it starts at -1 (minimum / easy)
        const theta = (2 * Math.PI * i) / period - Math.PI / 2;
        // sin(theta) ranges from -1 to 1.
        // Map it to target percentile between 0.15 (easy) and 0.85 (hard)
        const targetPercentile = 0.5 + 0.35 * Math.sin(theta);

        // Find target index in the sorted available quotes
        const targetIdx = Math.round(targetPercentile * (available.length - 1));

        // Add local randomization: select within a +/- 5% window of remaining items
        const windowSize = Math.max(1, Math.round(available.length * windowFraction));
        const startIdx = Math.max(0, targetIdx - windowSize);
        const endIdx = Math.min(available.length - 1, targetIdx + windowSize);
        const randomIdx = Math.floor(Math.random() * (endIdx - startIdx + 1)) + startIdx;

        const [selectedId] = available.splice(randomIdx, 1);
        deck.push(selectedId);
    }

    saveDeck(deck);
    saveDeckPointer(0);
    saveDeckMetadata({
        customCount: CUSTOM_QUOTES.length,
        bulkCount: BULK_QUOTES.length
    });
    
    cachedDeck = deck;
    return deck;
};

const syncDeckWithLatestQuotes = (deck, pointer, storedMetadata, currentCustomCount, currentBulkCount) => {
    // 1. Filter out any out-of-bounds indices in case files shrunk
    const filteredDeck = deck.map((id) => {
        const [type, indexStr] = id.split(':');
        const index = parseInt(indexStr, 10);
        if (type === 'c' && index >= currentCustomCount) return null;
        if (type === 'b' && index >= currentBulkCount) return null;
        return id;
    }).filter(Boolean);

    // 2. Identify new indices
    const newIndices = [];
    if (currentCustomCount > storedMetadata.customCount) {
        for (let i = storedMetadata.customCount; i < currentCustomCount; i++) {
            newIndices.push(`c:${i}`);
        }
    }
    if (currentBulkCount > storedMetadata.bulkCount) {
        for (let i = storedMetadata.bulkCount; i < currentBulkCount; i++) {
            newIndices.push(`b:${i}`);
        }
    }

    let updatedDeck = filteredDeck;

    // 3. Splice new indices randomly into the remaining portion of the deck
    if (newIndices.length > 0) {
        const shuffledNew = fisherYates(newIndices);
        const remainingStart = Math.min(pointer, filteredDeck.length);
        const playedPart = filteredDeck.slice(0, remainingStart);
        const remainingPart = filteredDeck.slice(remainingStart);

        for (const id of shuffledNew) {
            const insertIdx = Math.floor(Math.random() * (remainingPart.length + 1));
            remainingPart.splice(insertIdx, 0, id);
        }

        updatedDeck = [...playedPart, ...remainingPart];
    }

    // 4. Save updated state
    saveDeck(updatedDeck);
    saveDeckMetadata({
        customCount: currentCustomCount,
        bulkCount: currentBulkCount
    });

    return updatedDeck;
};

const ensureDeckInitialized = async () => {
    if (cachedDeck) return cachedDeck;

    let deck = getDeck();
    let pointer = getDeckPointer();
    const metadata = getDeckMetadata();

    const currentCustomCount = CUSTOM_QUOTES.length;
    const module = await import('../data/bulkQuotes.json');
    const BULK_QUOTES = module.default || module;
    const currentBulkCount = BULK_QUOTES.length;

    if (deck.length === 0 || !metadata) {
        console.info("Initializing brand new deck...");
        deck = await createDeck();
        pointer = 0;
        saveDeckPointer(0);
    } else if (
        metadata.customCount !== currentCustomCount ||
        metadata.bulkCount !== currentBulkCount
    ) {
        console.info("New quotes detected! Synchronizing deck delta...");
        deck = syncDeckWithLatestQuotes(
            deck,
            pointer,
            metadata,
            currentCustomCount,
            currentBulkCount
        );
    }

    cachedDeck = deck;
    return deck;
};

const getQuoteFromDeck = async () => {
    let deck = await ensureDeckInitialized();
    let pointer = getDeckPointer();

    if (pointer >= deck.length) {
        console.info("Deck fully exhausted! Reshuffling a fresh deck...");
        deck = await createDeck();
        pointer = 0;
        saveDeckPointer(0);
    }

    const nextId = deck[pointer];

    if (!nextId) {
        console.warn("Invalid ID retrieved from deck. Rebuilding deck...");
        deck = await createDeck();
        pointer = 0;
        saveDeckPointer(0);
        return getQuoteFromDeck();
    }

    saveDeckPointer(pointer + 1);

    const [type, indexStr] = nextId.split(':');
    const index = parseInt(indexStr, 10);

    let quoteData = null;

    if (type === 'c') {
        const item = CUSTOM_QUOTES[index];
        quoteData = { ...item, source: 'Curated Collection' };
    } else {
        const module = await import('../data/bulkQuotes.json');
        const BULK_QUOTES = module.default || module;
        const item = BULK_QUOTES[index];
        quoteData = {
            quote: item.quote,
            author: item.author,
            source: 'Quote Database'
        };
    }

    quoteData.id = nextId;
    return quoteData;
};

// --- Main Game API ---

export const fetchNewGameData = async () => {
    const prepareData = (q, a, s) => {
        const cleanQuote = q.trim().toUpperCase();
        const cleanAuthor = a ? a.trim() : "Unknown";
        const { newCipher, newReverseCipher } = generateCipher();

        saveSeenHash(hashString(cleanQuote));

        return {
            quote: cleanQuote,
            author: cleanAuthor,
            source: s,
            cipher: newCipher,
            reverseCipher: newReverseCipher
        };
    };

    try {
        const rawQuoteData = await getQuoteFromDeck();

        if (rawQuoteData && rawQuoteData.quote) {
            const gameData = prepareData(rawQuoteData.quote, rawQuoteData.author, rawQuoteData.source);
            const diffModule = await import('../data/quoteDifficulties.json');
            const difficulties = diffModule.default || diffModule;
            gameData.difficulty = difficulties[rawQuoteData.id] || 0.5;
            return gameData;
        }
    } catch (error) {
        console.error("Error fetching quote from deck:", error);
    }

    const fallbackCipher = generateCipher();
    return {
        quote: "FALLBACK QUOTE: SYSTEM ERROR",
        author: "System",
        source: "Error Handler",
        cipher: fallbackCipher.newCipher,
        reverseCipher: fallbackCipher.newReverseCipher,
        difficulty: 0.5
    };
};

