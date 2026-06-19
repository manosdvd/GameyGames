const fs = require('fs');
const path = require('path');

const masterDictPath = path.join(__dirname, '..', 'master_dictionary.json');
if (!fs.existsSync(masterDictPath)) {
    console.error("Master dictionary not found!");
    process.exit(1);
}

const masterDict = JSON.parse(fs.readFileSync(masterDictPath, 'utf8'));

// Load dictionary_meta for rarity scores
const metaPath = path.join(__dirname, '..', 'shared', 'dictionary_meta.json');
let dictionaryMeta = {};
if (fs.existsSync(metaPath)) {
    dictionaryMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

const trekWords = {};
const slangWords = {};
const popWords = {};
const generalWords = {};

// Regex patterns
const trekRegex = /star trek|vulcan|klingon|starfleet|romulan|holodeck|phaser|tricorder|dilithium|nanoprobe|quadrant|subspace|teleport/i;

// Slang: modern slang, or colloquial/slang with rarity < 0.95
const modernSlangRegex = /gen-z|internet|90s|millennial|british slang|australian slang|slang term|yeet|cheugy|cringe|sus|noob|bruh|glowup/i;
const colloquialRegex = /\bslang\b|colloquial/i;

// Pop culture: sci-fi, fantasy, characters, books, movies
const popRegex = /sci-fi|fantasy|fictional|tolkien|star wars|pop culture|marvel|dc comics|hogwarts|wizarding|middle-earth|hobbit|vampire|cyberpunk|matrix|superhero|literary/i;

const allWords = Object.keys(masterDict);

for (const word of allWords) {
    const w = word.toUpperCase();
    if (w.length < 3 || w.length > 10) continue;
    if (!/^[A-Z]+$/.test(w)) continue;

    const def = masterDict[word];
    const meta = dictionaryMeta[word] || { rarity: 1.0 };
    const rarity = meta.rarity;

    if (trekRegex.test(def) || trekRegex.test(w)) {
        trekWords[w] = def;
    } else if (modernSlangRegex.test(def)) {
        slangWords[w] = def;
    } else if (colloquialRegex.test(def)) {
        if (rarity < 0.95) {
            slangWords[w] = def;
        }
    } else if (popRegex.test(def) || popRegex.test(w)) {
        popWords[w] = def;
    } else {
        if (rarity < 0.85) {
            generalWords[w] = def;
        }
    }
}

// Let's print counts
console.log(`Found:`);
console.log(`- Star Trek: ${Object.keys(trekWords).length} words`);
console.log(`- Slang: ${Object.keys(slangWords).length} words`);
console.log(`- Pop Culture: ${Object.keys(popWords).length} words`);
console.log(`- General: ${Object.keys(generalWords).length} words`);

// Select top General words
const sortedGeneral = Object.keys(generalWords)
    .map(w => ({ word: w, rarity: (dictionaryMeta[w.toLowerCase()] || { rarity: 1 }).rarity, def: generalWords[w] }))
    .sort((a, b) => a.rarity - b.rarity)
    .slice(0, 1000);

const themes = {
    general: {},
    pop_culture: popWords,
    star_trek: trekWords,
    slang: slangWords
};

sortedGeneral.forEach(item => {
    themes.general[item.word] = item.def;
});

// Let's write them to crossword/themes.json
const crosswordDir = path.join(__dirname, '..', 'crossword');
if (!fs.existsSync(crosswordDir)) {
    fs.mkdirSync(crosswordDir, { recursive: true });
}

fs.writeFileSync(
    path.join(crosswordDir, 'themes.json'),
    JSON.stringify(themes, null, 2),
    'utf8'
);

console.log(`Written themes.json to crossword/themes.json`);
