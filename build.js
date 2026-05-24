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
    console.log(`> Copying ${src} to ${dest}`);
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    fs.cpSync(src, dest, { recursive: true });
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

    // A. Ensure dictionary.js is compiled/updated from raw word list if possible
    console.log('> Compiling/Verifying shared dictionary...');
    const localWordsPath = path.join(__dirname, 'words_alpha.txt');
    const dictionaryPath = path.join(__dirname, 'shared', 'dictionary.js');

    if (!fs.existsSync(localWordsPath)) {
        console.log('  -> Downloading words_alpha.txt cache from GitHub...');
        try {
            execSync('curl -s -S -o words_alpha.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt', { stdio: 'inherit' });
        } catch (e) {
            console.warn('  ⚠️ Failed to download word list: ' + e.message);
        }
    }

    const localDictPath = path.join(__dirname, 'dictionary_compact.json');
    if (!fs.existsSync(localDictPath)) {
        console.log('  -> Downloading dictionary_compact.json...');
        try {
            execSync('curl -s -S -o dictionary_compact.json https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json', { stdio: 'inherit' });
        } catch (e) {
            console.warn('  ⚠️ Failed to download dictionary: ' + e.message);
        }
    }

    let commonSeed = "THE AND FOR ARE BUT NOT YOU ALL ANY CAN HAD HAS HIM HIS HOW MAN NEW NOW OLD ONE OUR OUT SAY SEE SHE SIT TOO USE WAY WHO WHY YES ACT ADD AGE AIR AGO ART ASK BAD BAG BED BET BIG BIT BOX BOY BUS CAR CAT CUP CUT DAD DAY DID DOG DRY EAR EAT EGG END EYE FAR FAT FEW FIT FLY FUN GET GOT GUN GUY GYM HAT HER HIT HOT HUT ICE ILL INK JAR JOB JOY KEY KID KIT LAW LAY LEG LIE LIP LOW MAD MAP MIX MUD NET NOD NOR NUT OFF OIL OWN PAY PEN PET PIE PIG PIN POT PUT RAN RED RIP RUN SAD SAW SEA SET SEX SIN SIT SIX SKY SON SUN TAX TEA TEN TIE TIP TOE TOP TOY TRY TWO VAN WAR WET WIN YES YET ABLE ACID AGED ALSO AREA ARMY AWAY BABY BACK BALL BAND BANK BASE BATH BEAR BEAT BEER BELL BELT BEST BIRD BLOW BLUE BOAT BODY BOND BONE BORN BOSS BOTH BOWL BURN BUSH BUSY CALL CALM CAMP CARD CARE CASE CASH CAST CELL CHAT CHIP CITY CLUB COAL COAT CODE COLD COME COOK COOL COPY CORE COST CREW CROP DARK DATE DEAD DEAL DEAR DEBT DEEP DENY DESK DIET DIRT DISC DISK DOES DONE DOOR DOWN DRAW DRESS DRINK DRIVE DROP DRUG DUST DUTY EACH EARN EAST EASY EDGE ELSE EVEN EVER EVIL EXIT FACE FACT FAIL FAIR FALL FARM FAST FEAR FEED FEEL FEET FELL FILL FILM FIND FINE FIRE FIRM FISH FIVE FLAT FLOW FOOD FOOT FORD FORM FORT FOUR FREE FROM FULL FUND GAIN GAME GATE GAVE GEAR GIFT GIRL GIVE GLAD GOAL GOES GOLD GOLF GONE GOOD GRAY GREW GREY GROW GULF HAIR HALF HALL HAND HANG HARD HARM HATE HAVE HEAD HEAR HEAT HELD HELL HELP HERE HERO HIGH HILL HIRE HOLD HOLE HOLY HOME HOPE HOST HOUR HUGE HUNG HUNT HURT IDEA INCH INTO IRON ITEM JACK JOIN JUMP JUST KEPT KEEP KICK KILL KIND KING KNEE KNEE KNEW KNOW LACK LADY LAID LAKE LAND LANE LAST LATE LEAD LEFT LESS LIFE LIFT LIKE LINE LINK LIST LIVE LOAD LOAN LOCK LONG LOOK LORD LOSS LOST LOTS LOVE LUCK MADE MAIL MAIN MAKE MALE MANY MARK MASS MEAL MEAN MEAT MEET MILE MILK MILL MIND MINE MISS MODE MOOD MOON MORE MOST MOVE MUCH MUST NAME NEAR NECK NEED NEWS NEXT NICE NINE NONE NOSE NOTE OKAY ONCE ONLY OPEN ORAL OVER PACE PACK PAGE PAID PAIN PAIR PARK PART PASS PAST PATH PEAK PICK PILE PINK PIPE PLAN PLAY PLOT PLUS POET POOL POOR POST PULL PURE PUSH QUIT RACE RAIN RANK RARE RATE READ REAL REAR RELY RENT REST RICE RICH RIDE RING RISE RISK ROAD ROCK ROLE ROLL ROOF ROOM ROOT ROSE RULE RUSH SAFE SAID SAKE SALE SALT SAME SAND SAVE SEAT SEED SEEK SEEM SEEN SELF SELL SEND SENT SETS SHED SHIP SHOE SHOP SHUT SICK SIDE SIGN SILK SITE SIZE SKIN SLIP SLOW SNOW SOFT SOIL SOLD SOLE SOME SONG SOON SORT SOUL SPOT STAR STAY STEP STOP SUCH SUIT SURE SWIM TAKE TALK TALL TANK TAPE TASK TEAM TEAR TELL TENT TERM TEST TEXT THAN THAT THEM THEN THEY THIN THIS TIDE TILL TIME TINY TOLD TOOK TOOL TOUR TOWN TREE TRIP TRUE TUBE TURN TWIN TYPE UNIT UPON USER USUAL VARY VERY VIEW VILL VOTE WAIT WAKE WALK WALL WANT WARM WASH WAVE WEAR WEEK WELL WENT WERE WEST WHAT WHEN WIDE WIFE WILD WILL WIND WINE WING WIRE WISH WITH WOOD WOOL WORD WORK WARD YARD YEAR ZERO ZONE";

    // A2. Advanced Webster cleaner, rarity calculator, and Connections categories
    const cleanDefinition = (def) => {
        if (!def) return "";
        let cleaned = def;

        // Remove Synonyms section
        const synIndex = cleaned.indexOf("Syn. --");
        if (synIndex !== -1) {
            cleaned = cleaned.substring(0, synIndex).trim();
        }
        
        // Remove obsolete, colloquial, or rare tags
        cleaned = cleaned.replace(/\[Obs\.?\]/g, "");
        cleaned = cleaned.replace(/\[Obs\. or Prov\. Eng\.\]/g, "");
        cleaned = cleaned.replace(/\[R\.\]/g, "");
        cleaned = cleaned.replace(/\[Colloq\.\]/g, "");
        cleaned = cleaned.replace(/\[Local, U\. S\.\]/g, "");
        cleaned = cleaned.replace(/\[Prov\.? Eng\.?\]/g, "");
        cleaned = cleaned.replace(/\[Archaic\]/g, "");

        // Remove typical author citations
        const authors = [
            "Chaucer", "Shak\\.?\\b", "Milton\\b", "Spenser\\b", "Dryden\\b", "Pope\\b", "Addison\\b", 
            "Locke\\b", "Bacon\\b", "South\\b", "Macaulay\\b", "Johnson\\b", "Goldsmith\\b", 
            "Prior\\b", "Cowper\\b", "Dryden\\b", "Fuller\\b", "Sir T\\. Browne", "Bp\\. Hall", 
            "South\\.", "Tennyson\\b", "Swift\\b", "Hooker\\b"
        ];
        authors.forEach(author => {
            const regex = new RegExp(`"[^"]+"\\s*${author}\\.?`, 'gi');
            cleaned = cleaned.replace(regex, "");
        });
        
        // Remove quotes followed by capitalized words
        cleaned = cleaned.replace(/"[^"]+"\s*[A-Z][a-zA-Z\.\s]*/g, "");

        // Remove Bible verses
        cleaned = cleaned.replace(/\d+\s+[A-Z][a-z]+\.\s+[a-z\d\.\s]+/g, "");

        // Clean spaces and trim
        cleaned = cleaned.replace(/\s+/g, " ");
        cleaned = cleaned.trim();

        if (cleaned.startsWith("1. ") && !cleaned.includes(" 2. ")) {
            cleaned = cleaned.substring(3);
        }

        cleaned = cleaned.replace(/^[;,\.\s\-]+/, "");

        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }

        cleaned = cleaned.replace(/[;,]+$/, ".");
        if (cleaned && !cleaned.endsWith(".")) {
            cleaned += ".";
        }

        return cleaned || def;
    };

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

    if (fs.existsSync(localWordsPath)) {
        try {
            console.log('  -> Compiling dictionary file with definitions...');
            const content = fs.readFileSync(localWordsPath, 'utf8');
            const words = content.split(/\r?\n/).map(w => w.trim().toUpperCase()).filter(Boolean);
            
            let dictObj = {};
            let rawDictObj = {};
            if (fs.existsSync(localDictPath)) {
                try {
                    const rawDict = fs.readFileSync(localDictPath, 'utf8');
                    const parsed = JSON.parse(rawDict);
                    for (let key in parsed) {
                        rawDictObj[key.toUpperCase()] = cleanDefinition(parsed[key]);
                    }
                } catch(e) {
                    console.warn('  ⚠️ Failed to parse dictionary_compact.json', e.message);
                }
            }

            const hasBaseWord = (w) => {
                if (rawDictObj[w]) return true;
                const lower = w.toLowerCase();
                if (lower.endsWith('ies') && lower.length > 3) {
                    if (rawDictObj[(lower.slice(0, -3) + 'y').toUpperCase()]) return true;
                }
                if (lower.endsWith('es') && lower.length > 2) {
                    if (rawDictObj[(lower.slice(0, -2)).toUpperCase()]) return true;
                }
                if (lower.endsWith('s') && lower.length > 1) {
                    if (rawDictObj[(lower.slice(0, -1)).toUpperCase()]) return true;
                }
                return false;
            };

            // Build playable words set to shrink dictionary sizes
            const playableWords = new Set();
            words.filter(w => w.length >= 3 && w.length <= 8).forEach(w => {
                if (hasBaseWord(w)) {
                    playableWords.add(w.toUpperCase());
                    const lower = w.toLowerCase();
                    if (lower.endsWith('ies') && lower.length > 3) playableWords.add((lower.slice(0, -3) + 'y').toUpperCase());
                    if (lower.endsWith('es') && lower.length > 2) playableWords.add((lower.slice(0, -2)).toUpperCase());
                    if (lower.endsWith('s') && lower.length > 1) playableWords.add((lower.slice(0, -1)).toUpperCase());
                }
            });

            commonSeed.split(' ').forEach(w => {
                if (w && hasBaseWord(w)) {
                    playableWords.add(w.toUpperCase());
                    const lower = w.toLowerCase();
                    if (lower.endsWith('ies') && lower.length > 3) playableWords.add((lower.slice(0, -3) + 'y').toUpperCase());
                    if (lower.endsWith('es') && lower.length > 2) playableWords.add((lower.slice(0, -2)).toUpperCase());
                    if (lower.endsWith('s') && lower.length > 1) playableWords.add((lower.slice(0, -1)).toUpperCase());
                }
            });

            // Filter dictObj to only include playableWords!
            dictObj = {};
            for (let key of playableWords) {
                if (rawDictObj[key]) {
                    dictObj[key.toLowerCase()] = rawDictObj[key];
                }
            }
            
            try {
                fs.writeFileSync(localDictPath, JSON.stringify(dictObj), 'utf8');
                console.log('  -> Filtered compact definitions written to dictionary_compact.json!');
            } catch (e) {
                console.warn('  ⚠️ Failed to write dictionary_compact.json', e.message);
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
                if(hasBaseWord(w)) commonArr.push(w);
            });

            const wordleArr = [];
            words.filter(w => w.length === 5).forEach(w => {
                if(hasBaseWord(w)) wordleArr.push(w);
            });

            const lexiconArr = [];
            words.filter(w => w.length >= 3 && w.length <= 8).forEach(w => {
                if(hasBaseWord(w)) lexiconArr.push(w);
            });

            // DefinitionManager update supporting getDetails and plural resolution
            const managerScript = `
window.DefinitionManager = {
    dict: \${JSON.stringify(dictObj)},
    meta: \${JSON.stringify(dictionaryMeta)},
    async load() {
        // Definitions and metadata are loaded synchronously from inlined data!
    },
    getSingular(w) {
        if (this.dict[w]) return w;
        if (w.endsWith('ies') && w.length > 3) {
            const sing = w.slice(0, -3) + 'y';
            if (this.dict[sing]) return sing;
        }
        if (w.endsWith('es') && w.length > 2) {
            const sing = w.slice(0, -2);
            if (this.dict[sing]) return sing;
        }
        if (w.endsWith('s') && w.length > 1) {
            const sing = w.slice(0, -1);
            if (this.dict[sing]) return sing;
        }
        return null;
    },
    async get(word) {
        await this.load();
        const w = word.toLowerCase();
        if (this.dict[w]) return this.dict[w];
        const sing = this.getSingular(w);
        if (sing) {
            return "[Plural of " + sing.toUpperCase() + "] " + this.dict[sing];
        }
        return null;
    },
    async getDetails(word) {
        await this.load();
        const w = word.toLowerCase();
        if (this.dict[w]) {
            const metadata = this.meta[w] || { rarity: 0.5, tags: [] };
            return {
                def: this.dict[w] || "",
                rarity: metadata.rarity,
                tags: metadata.tags
            };
        }
        const sing = this.getSingular(w);
        if (sing) {
            const metadata = this.meta[sing] || { rarity: 0.5, tags: [] };
            return {
                def: "[Plural of " + sing.toUpperCase() + "] " + this.dict[sing],
                rarity: metadata.rarity,
                tags: metadata.tags
            };
        }
        return {
            def: "",
            rarity: 0.5,
            tags: []
        };
    }
};
`;

            const jsContent = `window.COMMON_WORDS_SEED = "${commonArr.join(' ')}";\nwindow.WORDLE_WORDS = "${wordleArr.join(' ')}";\nwindow.LEXICON_WORDS = "${lexiconArr.join(' ')}";\n${managerScript}`;
            fs.writeFileSync(dictionaryPath, jsContent, 'utf8');
            console.log('  -> shared/dictionary.js successfully compiled offline fast database!');
            
            if (fs.existsSync(localDictPath)) {
                // Ensure dictionary_compact.json is also deployed to shared for lazy-loading definitions
                fs.copyFileSync(localDictPath, path.join(__dirname, 'shared', 'dictionary_compact.json'));
            }
        } catch (err) {
            console.error('  ⚠️ Error parsing word list:', err.message);
        }
    } else {

        console.log('  -> words_alpha.txt not available. Generating default seed/emergency file...');
        if (!fs.existsSync(dictionaryPath)) {
            const jsContent = `window.COMMON_WORDS_SEED = "${commonSeed}";\nwindow.WORDLE_WORDS = "";\nwindow.LEXICON_WORDS = "";\n`;
            fs.writeFileSync(dictionaryPath, jsContent, 'utf8');
        }
    }

    // 2. Build Root Assets
    console.log('> Copying root assets...');
    ['index.html', 'style.css', 'main.js'].forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(distDir, file));
        }
    });

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
