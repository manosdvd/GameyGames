import { generateCipher } from './cipher';
import { CUSTOM_QUOTES } from '../data/customQuotes';

const SEEN_STORAGE_KEY = 'crypto_puzzle_seen_hashes';
const DECK_STORAGE_KEY = 'crypto_puzzle_deck';
const MAX_HISTORY = 50;

// --- Helper: Shuffle ---
const fisherYates = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// --- History / Deduping Logic (For API mainly) ---

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
        // Add new hash to the front
        const newSeen = [hash, ...seen].slice(0, MAX_HISTORY);
        localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(newSeen));
    } catch (e) {
        console.warn("Failed to save seen hash", e);
    }
};

// Simple string hash for deduping
const hashString = (str) => {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};


// --- Deck Logic (For Local Quotes) ---

const getDeck = () => {
    try {
        const stored = localStorage.getItem(DECK_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const saveDeck = (deck) => {
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
};

const createDeck = async () => {
    // Load bulk quotes to know validity/length
    const module = await import('../data/bulkQuotes.json');
    const BULK_QUOTES = module.default || module;

    // Create indices
    // 'c:index' for Custom Quotes
    // 'b:index' for Bulk Quotes
    const deck = [];

    CUSTOM_QUOTES.forEach((_, i) => deck.push(`c:${i}`));
    BULK_QUOTES.forEach((_, i) => deck.push(`b:${i}`));

    // Shuffle
    const shuffled = fisherYates(deck);
    saveDeck(shuffled);
    return shuffled;
};

const getQuoteFromDeck = async () => {
    let deck = getDeck();

    // If empty, rebuild
    if (deck.length === 0) {
        console.info("Deck exhausted! Reshuffling...");
        deck = await createDeck();
    }

    // Pop the next quote
    const nextId = deck.pop();
    saveDeck(deck);

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
        // Ingest script outputs { quote, author }
        quoteData = {
            quote: item.quote,
            author: item.author,
            source: 'Quote Database'
        };
    }

    return quoteData;
};


// --- Main Logic ---

export const fetchNewGameData = async () => {
    // Helper to get formatted data
    const prepareData = (q, a, s) => {
        const cleanQuote = q.trim().toUpperCase();
        const cleanAuthor = a ? a.trim() : "Unknown";
        const { newCipher, newReverseCipher } = generateCipher();

        // Save to history (mainly for API deduping, but good to track all)
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
        // ALWAYS use the local deck. 
        // The deck handles mixing Custom + Bulk quotes and ensures exhaustion (no repeats).
        const rawQuoteData = await getQuoteFromDeck();

        if (rawQuoteData && rawQuoteData.quote) {
            return prepareData(rawQuoteData.quote, rawQuoteData.author, rawQuoteData.source);
        }
    } catch (error) {
        console.error("Error fetching quote from deck:", error);
    }

    // Emergency Fallback (Should rarely happen if deck logic is sound)
    // If deck fails, we might technically repeat a quote by forcing a reshuffle implicitly 
    // but getQuoteFromDeck handles reshuffle automatically.
    // This is just a last-ditch hardcoded fallback to prevent a crash.
    const fallbackCipher = generateCipher();
    return {
        quote: "FALLBACK QUOTE: SYSTEM ERROR",
        author: "System",
        source: "Error Handler",
        cipher: fallbackCipher.newCipher,
        reverseCipher: fallbackCipher.newReverseCipher
    };
};
