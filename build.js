const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper to run commands
const run = (cmd, cwd) => {
    console.log(`> Running: ${cmd} in ${cwd || '.'}`);
    execSync(cmd, { stdio: 'inherit', cwd: cwd || process.cwd() });
};

// Helper for recursive copy
const copyRecursiveWithLog = (src, dest) => {
    console.log(`> Copying sanitized ${src} to ${dest}`);
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const excludePatterns = [
        'node_modules',
        '.git',
        '.vscode',
        'package-lock.json',
        'package.json',
        'README.md',
        '.DS_Store'
    ];
    
    fs.cpSync(src, dest, { 
        recursive: true,
        filter: (srcPath) => {
            const relPath = path.relative(src, srcPath);
            if (!relPath) return true; // Include root itself
            const parts = relPath.split(path.sep);
            const shouldExclude = parts.some(part => excludePatterns.includes(part));
            return !shouldExclude;
        }
    });
};

const hasNodeModules = (dir) => fs.existsSync(path.join(dir, 'node_modules'));

// Main Build Process
try {
    const distDir = path.join(__dirname, 'dist');

    // 1. Clean dist
    if (fs.existsSync(distDir)) {
        console.log('> Cleaning dist directory...');
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir);

    // A. Ensure dictionary.js is compiled/updated from raw master dictionary
    console.log('> Compiling/Verifying shared dictionary from master source...');
    const masterDictPath = path.join(__dirname, 'master_dictionary.json');
    const dictionaryPath = path.join(__dirname, 'shared', 'dictionary.js');

    if (!fs.existsSync(masterDictPath)) {
        throw new Error('master_dictionary.json not found in the root directory! Please run the copy/generate step.');
    }

    let commonSeed = "THE AND FOR ARE BUT NOT YOU ALL ANY CAN HAD HAS HIM HIS HOW MAN NEW NOW OLD ONE OUR OUT SAY SEE SHE SIT TOO USE WAY WHO WHY YES ACT ADD AGE AIR AGO ART ASK BAD BAG BED BET BIG BIT BOX BOY BUS CAR CAT CUP CUT DAD DAY DID DOG DRY EAR EAT EGG END EYE FAR FAT FEW FIT FLY FUN GET GOT GUN GUY GYM HAT HER HIT HOT HUT ICE ILL INK JAR JOB JOY KEY KID KIT LAW LAY LEG LIE LIP LOW MAD MAP MIX MUD NET NOD NOR NUT OFF OIL OWN PAY PEN PET PIE PIG PIN POT PUT RAN RED RIP RUN SAD SAW SEA SET SEX SIN SIT SIX SKY SON SUN TAX TEA TEN TIE TIP TOE TOP TOY TRY TWO VAN WAR WET WIN YES YET ABLE ACID AGED ALSO AREA ARMY AWAY BABY BACK BALL BAND BANK BASE BATH BEAR BEAT BEER BELL BELT BEST BIRD BLOW BLUE BOAT BODY BOND BONE BORN BOSS BOTH BOWL BURN BUSH BUSY CALL CALM CAMP CARD CARE CASE CASH CAST CELL CHAT CHIP CITY CLUB COAL COAT CODE COLD COME COOK COOL COPY CORE COST CREW CROP DARK DATE DEAD DEAL DEAR DEBT DEEP DENY DESK DIET DIRT DISC DISK DOES DONE DOOR DOWN DRAW DRESS DRINK DRIVE DROP DRUG DUST DUTY EACH EARN EAST EASY EDGE ELSE EVEN EVER EVIL EXIT FACE FACT FAIL FAIR FALL FARM FAST FEAR FEED FEEL FEET FELL FILL FILM FIND FINE FIRE FIRM FISH FIVE FLAT FLOW FOOD FOOT FORD FORM FORT FOUR FREE FROM FULL FUND GAIN GAME GATE GAVE GEAR GIFT GIRL GIVE GLAD GOAL GOES GOLD GOLF GONE GOOD GRAY GREW GREY GROW GULF HAIR HALF HALL HAND HANG HARD HARM HATE HAVE HEAD HEAR HEAT HELD HELL HELP HERE HERO HIGH HILL HIRE HOLD HOLE HOLY HOME HOPE HOST HOUR HUGE HUNG HUNT HURT IDEA INCH INTO IRON ITEM JACK JOIN JUMP JUST KEPT KEEP KICK KILL KIND KING KNEE KNEE KNEW KNOW LACK LADY LAID LAKE LAND LANE LAST LATE LEAD LEFT LESS LIFE LIFT LIKE LINE LINK LIST LIVE LOAD LOAN LOCK LONG LOOK LORD LOSS LOST LOTS LOVE LUCK MADE MAIL MAIN MAKE MALE MANY MARK MASS MEAL MEAN MEAT MEET MILE MILK MILL MIND MINE MISS MODE MOOD MOON MORE MOST MOVE MUCH MUST NAME NEAR NECK NEED NEWS NEXT NICE NINE NONE NOSE NOTE OKAY ONCE ONLY OPEN ORAL OVER PACE PACK PAGE PAID PAIN PAIR PARK PART PASS PAST PATH PEAK PICK PILE PINK PIPE PLAN PLAY PLOT PLUS POET POOL POOR POST PULL PURE PUSH QUIT RACE RAIN RANK RARE RATE READ REAL REAR RELY RENT REST RICE RICH RIDE RING RISE RISK ROAD ROCK ROLE ROLL ROOF ROOM ROOT ROSE RULE RUSH SAFE SAID SAKE SALE SALT SAME SAND SAVE SEAT SEED SEEK SEEM SEEN SELF SELL SEND SENT SETS SHED SHIP SHOE SHOP SHUT SICK SIDE SIGN SILK SITE SIZE SKIN SLIP SLOW SNOW SOFT SOIL SOLD SOLE SOME SONG SOON SORT SOUL SPOT STAR STAY STEP STOP SUCH SUIT SURE SWIM TAKE TALK TALL TANK TAPE TASK TEAM TEAR TELL TENT TERM TEST TEXT THAN THAT THEM THEN THEY THIN THIS TIDE TILL TIME TINY TOLD TOOK TOOL TOUR TOWN TREE TRIP TRUE TUBE TURN TWIN TYPE UNIT UPON USER USUAL VARY VERY VIEW VILL VOTE WAIT WAKE WALK WALL WANT WARM WASH WAVE WEAR WEEK WELL WENT WERE WEST WHAT WHEN WIDE WIFE WILD WILL WIND WINE WING WIRE WISH WITH WOOD WOOL WORD WORK WARD YARD YEAR ZERO ZONE";

    const CONNECTIONS_CATEGORIES = {
        "Vibrant Colors": ["RED", "BLUE", "GREEN", "YELLOW", "PINK", "PURPLE", "ORANGE", "BROWN"],
        "Loyal Animals": ["DOG", "CAT", "LION", "BEAR", "TIGER", "WOLF", "DEER", "HORSE"],
        "Sweet Fruits": ["APPLE", "PEACH", "PEAR", "GRAPE", "BANANA", "CHERRY", "LEMON", "ORANGE"],
        "Body Parts": ["HEAD", "HAND", "FOOT", "FACE", "NECK", "EYE", "NOSE", "EAR", "BACK", "ARM", "LEG"],
        "Units of Time": ["SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "YEAR"],
        "Strong Emotions": ["JOY", "ANGER", "FEAR", "LOVE", "HATE", "SAD", "HAPPY"],
        "Vehicles": ["CAR", "BUS", "TRAIN", "BOAT", "PLANE", "TRUCK", "SHIP"],
        "Musical Instruments": ["DRUM", "HARP", "FLUTE", "PIANO", "GUITAR", "VIOLIN"],
        "Kitchen Items": ["SPOON", "FORK", "KNIFE", "PLATE", "CUP", "BOWL"],
        "Clothing Items": ["SHIRT", "PANTS", "DRESS", "SHOE", "HAT", "GLOVE", "COAT", "SOCK"],
        "Natural Elements": ["TREE", "FLOWER", "GRASS", "BUSH", "MOSS", "LEAF", "WOOD", "SOIL"],
        "Noble Professions": ["DOCTOR", "NURSE", "TEACHER", "PILOT", "COACH", "ARTIST", "ACTOR", "JUDGE"],
        "Geometrical Shapes": ["CIRCLE", "SQUARE", "LINE", "OVAL", "STAR", "RING", "CONE"],
        "Valuable Materials": ["GOLD", "SILVER", "IRON", "BRONZE", "RUBY", "PEARL", "STONE", "GLASS"],
        "Weather States": ["RAIN", "SNOW", "WIND", "STORM", "CLOUD", "HAIL", "MIST", "HEAT"],
        "Water Bodies": ["OCEAN", "SEA", "RIVER", "LAKE", "POND", "WAVE", "GULF", "BAY"],
        "Astronomy": ["SUN", "MOON", "STAR", "SKY", "EARTH", "ORBIT", "SPACE", "COMET"],
        "Types of Rooms": ["BEDROOM", "KITCHEN", "OFFICE", "GYM", "HALL", "BATH", "LOFT"],
        "Card Suits / Games": ["SPADE", "HEART", "CLUB", "DIAMOND", "DECK", "GAME", "PLAY"],
        "Metals": ["IRON", "GOLD", "COPPER", "BRASS", "LEAD", "STEEL", "ZINC", "TIN"],
        "Furniture": ["DESK", "CHAIR", "TABLE", "BED", "SOFA", "BENCH", "SHELF"],
        "Footwear": ["SHOE", "BOOT", "SLIPPER", "SANDAL", "HEEL", "CLOG"],
        "Container Types": ["BOX", "BAG", "JAR", "CUP", "BOWL", "TUBE", "TANK", "CAN"],
        "Jewelry": ["RING", "BAND", "PEARL", "CHAIN", "GEM", "BEAD", "CROWN"],
        "Limb Extremities": ["TOE", "LIP", "NECK", "KNEE", "HEEL", "SOLE"],
        "Weaponry": ["SWORD", "BOW", "GUN", "AXE", "KNIFE", "SHIELD", "SPEAR"],
        "Buildings": ["HOUSE", "FORT", "TOWER", "HALL", "CABIN", "SHED", "CASTLE", "HOME"],
        "Card/Board Games": ["CHESS", "POKER", "BRIDGE", "DICE", "GAME", "TILE"],
        "Actions with Feet": ["WALK", "RUN", "JUMP", "SKIP", "HOP", "STEP", "TREAD", "KICK"],
        "Types of Fuel": ["OIL", "COAL", "GAS", "WOOD", "PEAT"]
    };

    const wordTags = {};
    for (const [category, wordsList] of Object.entries(CONNECTIONS_CATEGORIES)) {
        wordsList.forEach(w => {
            const lowerW = w.toLowerCase();
            if (!wordTags[lowerW]) {
                wordTags[lowerW] = [];
            }
            wordTags[lowerW].push(category);
        });
    }

    try {
        console.log('  -> Loading master_dictionary.json...');
        const dictContent = fs.readFileSync(masterDictPath, 'utf8');
        const dictObj = JSON.parse(dictContent);
        
        const playableWords = new Set(Object.keys(dictObj).map(w => w.toUpperCase()));
        console.log(`  -> Successfully loaded ${playableWords.size} words from master source.`);

        try {
            const sharedDictCompactPath = path.join(__dirname, 'shared', 'dictionary_compact.json');
            fs.writeFileSync(sharedDictCompactPath, JSON.stringify(dictObj), 'utf8');
            console.log('  -> Compact definitions written to shared/dictionary_compact.json!');
        } catch (e) {
            console.warn('  ⚠️ Failed to write shared/dictionary_compact.json', e.message);
        }

        // Load all cryptogram quotes to build frequencies
        const customQuotesPath = path.join(__dirname, 'cryptograms', 'src', 'data', 'customQuotes.js');
        const bulkQuotesPath = path.join(__dirname, 'cryptograms', 'src', 'data', 'bulkQuotes.json');
        
        let customQuotes = [];
        if (fs.existsSync(customQuotesPath)) {
            try {
                const rawCustom = fs.readFileSync(customQuotesPath, 'utf8');
                const jsModuleText = rawCustom
                    .replace('export const CUSTOM_QUOTES =', 'module.exports =')
                    .replace(/\/\/.*$/gm, '');
                const tempFile = path.join(__dirname, 'customQuotes_temp.js');
                fs.writeFileSync(tempFile, jsModuleText, 'utf8');
                customQuotes = require(tempFile);
                fs.unlinkSync(tempFile);
            } catch(e) {
                console.warn("Failed to load customQuotes dynamically, parsing using Regex fallback:", e.message);
                const rawCustom = fs.readFileSync(customQuotesPath, 'utf8');
                const quoteRegex = /quote:\s*"([^"]+)"/g;
                let match;
                while ((match = quoteRegex.exec(rawCustom)) !== null) {
                    customQuotes.push({ quote: match[1] });
                }
            }
        }

        let bulkQuotes = [];
        if (fs.existsSync(bulkQuotesPath)) {
            try {
                bulkQuotes = JSON.parse(fs.readFileSync(bulkQuotesPath, 'utf8'));
            } catch(e) {
                console.warn("Failed to parse bulkQuotes.json:", e.message);
            }
        }

        // Build word counts from quotes
        const wordCounts = {};
        const addQuoteWords = (quoteText) => {
            if (!quoteText) return;
            const matches = quoteText.toUpperCase().match(/[A-Z']{2,}/g) || [];
            matches.forEach(w => {
                const cleanW = w.replace(/^'|'$/g, '');
                if (cleanW.length >= 2) {
                    wordCounts[cleanW] = (wordCounts[cleanW] || 0) + 1;
                }
            });
        };
        customQuotes.forEach(q => addQuoteWords(q.quote));
        bulkQuotes.forEach(q => addQuoteWords(q.quote));

        let maxCount = 1;
        for (let w in wordCounts) {
            if (wordCounts[w] > maxCount) maxCount = wordCounts[w];
        }

        // Generate rarity score metadata (filtered only to playableWords!)
        const dictionaryMeta = {};
        for (let key of playableWords) {
            const w = key.toLowerCase();
            const count = wordCounts[key] || 0;
            const rarity = 1.0 - (Math.log2(count + 1) / Math.log2(maxCount + 1));
            dictionaryMeta[w] = {
                rarity: parseFloat(rarity.toFixed(4)),
                tags: wordTags[w] || []
            };
        }

        // Write shared metadata file
        const metaPath = path.join(__dirname, 'shared', 'dictionary_meta.json');
        fs.writeFileSync(metaPath, JSON.stringify(dictionaryMeta), 'utf8');
        console.log('  -> shared/dictionary_meta.json compiled successfully!');

        // Calculate Quote Difficulties
        const quoteDifficulties = {};
        const calculateQuoteDifficulty = (quoteText) => {
            const matches = (quoteText.toUpperCase().match(/[A-Z']{3,}/g) || [])
                .map(w => w.replace(/^'|'$/g, ''))
                .filter(w => w.length >= 3);
            if (matches.length === 0) return 0.1;
            let sum = 0;
            matches.forEach(w => {
                const count = wordCounts[w] || 0;
                const rarity = 1.0 - (Math.log2(count + 1) / Math.log2(maxCount + 1));
                const lenFactor = Math.min(1, Math.max(0, (w.length - 3) / 8));
                const wordDiff = 0.6 * rarity + 0.4 * lenFactor;
                sum += wordDiff;
            });
            return parseFloat((sum / matches.length).toFixed(4));
        };

        customQuotes.forEach((q, idx) => {
            quoteDifficulties[`c:${idx}`] = calculateQuoteDifficulty(q.quote);
        });
        bulkQuotes.forEach((q, idx) => {
            quoteDifficulties[`b:${idx}`] = calculateQuoteDifficulty(q.quote);
        });

        // Write Cryptogram difficulties mapping
        const difficultiesPath = path.join(__dirname, 'cryptograms', 'src', 'data', 'quoteDifficulties.json');
        fs.writeFileSync(difficultiesPath, JSON.stringify(quoteDifficulties), 'utf8');
        console.log('  -> cryptograms/src/data/quoteDifficulties.json generated successfully!');

        const commonArr = [];
        commonSeed.split(' ').forEach(w => {
            if(!w) return;
            if(playableWords.has(w)) commonArr.push(w);
        });

        const wordleArr = [];
        for (let key of playableWords) {
            if (key.length === 5) {
                wordleArr.push(key);
            }
        }

        const lexiconArr = [];
        for (let key of playableWords) {
            if (key.length >= 3) {
                lexiconArr.push(key);
            }
        }

        // DefinitionManager update supporting highly optimized getDetails and plural/inflection resolution
        const managerScript = `
window.DefinitionManager = {
    dict: {}, // Cache of loaded letter chunks, e.g. { a: { apple: "...", ... } }
    meta: null,
    _loadingPromise: null,
    async load() {
        if (this.meta) return;
        if (this._loadingPromise) return this._loadingPromise;
        
        this._loadingPromise = new Promise((resolve) => {
            fetch('../shared/dictionary_meta.json')
                .then(res => res.json())
                .then(data => {
                    this.meta = data;
                    resolve();
                })
                .catch(err => {
                    console.error("Failed to load local dictionary meta:", err);
                    this.meta = {};
                    resolve();
                });
        });

        return this._loadingPromise;
    },
    async getChunk(letter) {
        if (this.dict[letter]) return this.dict[letter];
        try {
            const res = await fetch(\`../shared/dict/\${letter}.json\`);
            const data = await res.json();
            this.dict[letter] = data.words || {};
            if (!this.meta) this.meta = {};
            Object.assign(this.meta, data.meta || {});
            return this.dict[letter];
        } catch (e) {
            console.error(\`Failed to load chunk for letter \${letter}:\`, e);
            return {};
        }
    },
    // Resolves plurals, past tense (-ed), active participles (-ing), agent nouns (-er)
    getBaseWord(w, chunk) {
        if (!chunk) return null;
        if (chunk[w]) return { word: w, prefix: "" };
        
        const len = w.length;

        // 1. Plurals ending in -ies -> -y (e.g. berries -> berry)
        if (w.endsWith('ies') && len > 3) {
            const base = w.slice(0, -3) + 'y';
            if (chunk[base]) return { word: base, prefix: \`[Plural of \${base.toUpperCase()}] \` };
        }
        // 2. Plurals ending in -es (e.g. foxes -> fox)
        if (w.endsWith('es') && len > 2) {
            const base = w.slice(0, -2);
            if (chunk[base]) return { word: base, prefix: \`[Plural of \${base.toUpperCase()}] \` };
        }
        // 3. Plurals ending in -s (e.g. dogs -> dog)
        if (w.endsWith('s') && len > 1) {
            const base = w.slice(0, -1);
            if (chunk[base]) return { word: base, prefix: \`[Plural of \${base.toUpperCase()}] \` };
        }
        // 4. Past tense ending in -ed (e.g. walked -> walk, baked -> bake)
        if (w.endsWith('ed') && len > 3) {
            let base = w.slice(0, -2);
            if (chunk[base]) return { word: base, prefix: \`[Past tense of \${base.toUpperCase()}] \` };
            base = w.slice(0, -1); // e.g. baked -> bake
            if (chunk[base]) return { word: base, prefix: \`[Past tense of \${base.toUpperCase()}] \` };
        }
        // 5. Present participle ending in -ing (e.g. walking -> walk)
        if (w.endsWith('ing') && len > 4) {
            const base = w.slice(0, -3);
            if (chunk[base]) return { word: base, prefix: \`[Present participle of \${base.toUpperCase()}] \` };
        }
        // 6. Agent nouns ending in -er (e.g. runner -> run)
        if (w.endsWith('er') && len > 3) {
            const base = w.slice(0, -2);
            if (chunk[base]) return { word: base, prefix: \`[Agent of \${base.toUpperCase()}] \` };
        }

        return null;
    },
    async getDetails(word) {
        if (!word) return { def: "", rarity: 0.5, tags: [] };
        const w = word.toLowerCase().trim();
        const letter = w.charAt(0);
        if (!/[a-z]/.test(letter)) return { def: "", rarity: 0.5, tags: [] };

        const chunk = await this.getChunk(letter);
        const resolved = this.getBaseWord(w, chunk);
        
        if (resolved) {
            const targetWord = resolved.word;
            const metadata = (this.meta && this.meta[targetWord]) || { rarity: 0.5, tags: [] };
            return {
                def: resolved.prefix + (chunk[targetWord] || "A valid English word."),
                rarity: metadata.rarity !== undefined ? metadata.rarity : 0.5,
                tags: metadata.tags || []
            };
        }

        return { def: "", rarity: 0.5, tags: [] };
    },
    async get(word) {
        const details = await this.getDetails(word);
        return details.def || null;
    }
};
`;

        const jsContent = `window.COMMON_WORDS_SEED = "${commonArr.join(' ')}";\nwindow.WORDLE_WORDS = "${wordleArr.join(' ')}";\nwindow.LEXICON_WORDS = "${lexiconArr.join(' ')}";\n${managerScript}`;
        fs.writeFileSync(dictionaryPath, jsContent, 'utf8');
        console.log('  -> shared/dictionary.js successfully compiled offline fast database!');

        // Write 26 alphabetical dictionary chunks to shared/dict/*.json
        const dictOutputDir = path.join(__dirname, 'shared', 'dict');
        if (!fs.existsSync(dictOutputDir)) {
            fs.mkdirSync(dictOutputDir, { recursive: true });
        } else {
            // Clear existing JSON files in shared/dict/ to avoid orphaned data
            fs.readdirSync(dictOutputDir).forEach(file => {
                if (file.endsWith('.json')) {
                    fs.unlinkSync(path.join(dictOutputDir, file));
                }
            });
        }

        const chunks = {};
        for (let i = 97; i <= 122; i++) {
            chunks[String.fromCharCode(i)] = { words: {}, meta: {} };
        }

        for (let key of playableWords) {
            const w = key.toLowerCase();
            const firstChar = w.charAt(0);
            if (chunks[firstChar]) {
                if (dictObj[w]) {
                    chunks[firstChar].words[w] = dictObj[w];
                }
                if (dictionaryMeta[w]) {
                    chunks[firstChar].meta[w] = dictionaryMeta[w];
                }
            }
        }

        for (let char in chunks) {
            const chunkPath = path.join(dictOutputDir, `${char}.json`);
            fs.writeFileSync(chunkPath, JSON.stringify(chunks[char]), 'utf8');
        }
        console.log('  -> 26 alphabetical dictionary chunks written successfully to shared/dict/*.json!');
    } catch (err) {
        console.error('  ⚠️ Error parsing master dictionary:', err.message);
        process.exit(1);
    }

    // 2. Build Root Assets
    console.log('> Copying root assets...');
    ['index.html', 'style.css', 'main.js', 'manifest.json', 'sw.js'].forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(distDir, file));
        }
    });

    // 2b. Copy PWA Icons
    console.log('> Copying PWA Icons...');
    copyRecursiveWithLog(path.join(__dirname, 'icons'), path.join(distDir, 'icons'));

    // 3. Build Cryptograms
    console.log('> Building Cryptograms...');
    const cryptoDir = path.join(__dirname, 'cryptograms');
    const cryptoCmd = hasNodeModules(cryptoDir) ? 'npm run build' : 'npm install && npm run build';
    run(cryptoCmd, cryptoDir);
    copyRecursiveWithLog(path.join(cryptoDir, 'dist'), path.join(distDir, 'cryptograms'));

    // 4. Build Anxiety3 (React)
    console.log('> Building Anxiety3...');
    const anxietyDir = path.join(__dirname, 'anxiety3');
    const anxietyCmd = hasNodeModules(anxietyDir) ? 'npm run build' : 'npm install && npm run build';
    run(anxietyCmd, anxietyDir);
    copyRecursiveWithLog(path.join(anxietyDir, 'dist'), path.join(distDir, 'anxiety3'));

    // 5. Build HexEnergy (Static + Assets)
    console.log('> Building HexEnergy...');
    copyRecursiveWithLog(path.join(__dirname, 'hexenergy'), path.join(distDir, 'hexenergy'));

    // 6. Build Wordle (Static + Assets)
    console.log('> Building Wordle...');
    copyRecursiveWithLog(path.join(__dirname, 'wordle'), path.join(distDir, 'wordle'));

    // 7. Build Bejewelled (Static + Assets)
    console.log('> Building Gem Rush (Bejewelled)...');
    copyRecursiveWithLog(path.join(__dirname, 'bejewelled'), path.join(distDir, 'bejewelled'));

    // 8. Build Lexicon Drop (Static + Assets)
    console.log('> Building Lexicon Drop (Static)...');
    copyRecursiveWithLog(path.join(__dirname, 'lexicondrop'), path.join(distDir, 'lexicondrop'));

    // 8b. Build Lights Out (Static + Assets)
    console.log('> Building Lights Out...');
    copyRecursiveWithLog(path.join(__dirname, 'lightsout'), path.join(distDir, 'lightsout'));

    // 8c. Build Synapse Flow (Static + Assets)
    console.log('> Building Synapse Flow...');
    copyRecursiveWithLog(path.join(__dirname, 'synapseflow'), path.join(distDir, 'synapseflow'));

    // 8d. Build Cluster Purge (Static + Assets)
    console.log('> Building Cluster Purge...');
    copyRecursiveWithLog(path.join(__dirname, 'clusterpurge'), path.join(distDir, 'clusterpurge'));

    // 8e. Build Signal Merge (Static + Assets)
    console.log('> Building Signal Merge...');
    copyRecursiveWithLog(path.join(__dirname, 'signalmerge'), path.join(distDir, 'signalmerge'));

    // 8f. Build Memory Pulse (Static + Assets)
    console.log('> Building Memory Pulse...');
    copyRecursiveWithLog(path.join(__dirname, 'memorypulse'), path.join(distDir, 'memorypulse'));

    // 8g. Build Pixel Decode (Static + Assets)
    console.log('> Building Pixel Decode...');
    copyRecursiveWithLog(path.join(__dirname, 'pixeldecode'), path.join(distDir, 'pixeldecode'));

    // 8h. Build Minesweeper Zen (Static + Assets)
    console.log('> Building Minesweeper Zen...');
    copyRecursiveWithLog(path.join(__dirname, 'minesweeperzen'), path.join(distDir, 'minesweeperzen'));

    // 8i. Build Spelling Bee (Static + Assets)
    console.log('> Building Spelling Bee...');
    copyRecursiveWithLog(path.join(__dirname, 'spellingbee'), path.join(distDir, 'spellingbee'));

    // 8j. Build Tetraflow (Static + Assets)
    console.log('> Building Tetraflow...');
    copyRecursiveWithLog(path.join(__dirname, 'tetris'), path.join(distDir, 'tetris'));

    // 8l. Build GeoSnap (Static + Assets)
    console.log('> Building GeoSnap...');
    copyRecursiveWithLog(path.join(__dirname, 'geopuzzle'), path.join(distDir, 'geopuzzle'));

    // 9. Copy Shared Scripts/Assets
    console.log('> Copying Shared Assets...');
    copyRecursiveWithLog(path.join(__dirname, 'shared'), path.join(distDir, 'shared'));

    // 10. Copy Shared Scripts
    if (fs.existsSync(path.join(__dirname, 'timeLimit.js'))) {
        fs.copyFileSync(path.join(__dirname, 'timeLimit.js'), path.join(distDir, 'timeLimit.js'));
    }

    console.log('\n✅ Build verification passed! Output is in /dist');

} catch (error) {
    console.error('\n❌ Build Failed:', error.message);
    process.exit(1);
}
