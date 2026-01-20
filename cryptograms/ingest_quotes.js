import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_CSV = path.join(__dirname, 'src', 'data', 'quotes_all.csv');
const INPUT_JSON = path.join(__dirname, 'src', 'data', 'quotemore.json');
const INPUT_DUMMY_JSON = path.join(__dirname, 'src', 'data', 'quotesdummy.json');
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'bulkQuotes.json');

// Configuration
const MIN_LENGTH = 60;
const MAX_LENGTH = 160;
const TARGET_COUNT = 55000;

const uniqueQuotes = new Map();

function cleanQuote(text) {
    if (!text) return null;
    return text.trim().replace(/\s+/g, ' ');
}

function addQuote(text, author) {
    const qt = cleanQuote(text);
    const auth = cleanQuote(author) || 'Unknown';

    if (!qt) return;

    // Constraints
    if (qt.length < MIN_LENGTH || qt.length > MAX_LENGTH) return;

    // Basic character validation
    if (/[^a-zA-Z0-9\s.,'?!;:"\-]/.test(qt)) {
        // Strict regex for cryptograms
    }

    // Check duplication (collision based on text only)
    if (uniqueQuotes.has(qt)) return;

    uniqueQuotes.set(qt, { quote: qt, author: auth });
}

console.log('Starting ingestion...');

// 1. Process quotesdummy.json (High priority)
if (fs.existsSync(INPUT_DUMMY_JSON)) {
    console.log(`Reading ${INPUT_DUMMY_JSON}...`);
    try {
        const raw = fs.readFileSync(INPUT_DUMMY_JSON, 'utf8');
        const data = JSON.parse(raw);
        // Format is { quotes: [ {quote, author, ...}, ... ] }
        const list = data.quotes || [];

        for (const item of list) {
            addQuote(item.quote, item.author);
        }
        console.log(` > Added ${uniqueQuotes.size} quotes from quotesdummy.json.`);
    } catch (e) {
        console.error('Error reading quotesdummy.json:', e.message);
    }
}

// 2. Process JSON (quotemore.json)
if (fs.existsSync(INPUT_JSON)) {
    console.log(`Reading ${INPUT_JSON}...`);
    try {
        const raw = fs.readFileSync(INPUT_JSON, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
            data.sort((a, b) => (b.Popularity || 0) - (a.Popularity || 0));

            for (const item of data) {
                addQuote(item.Quote, item.Author);
                if (uniqueQuotes.size >= TARGET_COUNT) break;
            }
        }
        console.log(` > Total quotes after quotemore.json: ${uniqueQuotes.size}`);
    } catch (e) {
        console.error('Error reading quotemore.json:', e.message);
    }
}

// 3. Process CSV (quotes_all.csv)
if (uniqueQuotes.size < TARGET_COUNT && fs.existsSync(INPUT_CSV)) {
    console.log(`Reading ${INPUT_CSV}...`);
    try {
        const raw = fs.readFileSync(INPUT_CSV, 'utf8');
        const records = parse(raw, {
            delimiter: ';',
            columns: false,
            skip_empty_lines: true,
            relax_quotes: true
        });

        for (const row of records) {
            if (uniqueQuotes.size >= TARGET_COUNT) break;
            // row[0] = quote, row[1] = author
            if (row.length >= 2) {
                addQuote(row[0], row[1]);
            }
        }
        console.log(` > Total quotes after CSV: ${uniqueQuotes.size}`);
    } catch (e) {
        console.error('Error reading CSV:', e.message);
    }
}

// 4. Write Output
const finalQuotes = Array.from(uniqueQuotes.values());
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalQuotes, null, 2), 'utf8');
console.log(`Written ${finalQuotes.length} quotes to ${OUTPUT_FILE}`);
