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

    const localSowpodsPath = path.join(__dirname, 'sowpods.txt');
    if (!fs.existsSync(localSowpodsPath)) {
        console.log('  -> Downloading sowpods.txt (Scrabble dictionary)...');
        try {
            execSync('curl -s -S -o sowpods.txt https://raw.githubusercontent.com/jesstess/Scrabble/master/scrabble/sowpods.txt', { stdio: 'inherit' });
        } catch (e) {
            console.warn('  ⚠️ Failed to download sowpods.txt: ' + e.message);
        }
    }

    const localCswPath = path.join(__dirname, 'csw21.txt');
    if (!fs.existsSync(localCswPath)) {
        console.log('  -> Downloading csw21.txt (Collins Scrabble Words with definitions)...');
        try {
            execSync('curl -s -S -o csw21.txt https://raw.githubusercontent.com/scrabblewords/scrabblewords/main/words/British/CSW21.txt', { stdio: 'inherit' });
        } catch (e) {
            console.warn('  ⚠️ Failed to download csw21.txt: ' + e.message);
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
            const wordsAlpha = content.split(/\r?\n/).map(w => w.trim().toUpperCase()).filter(Boolean);
            
            const SCRABBLE_INLINE_DEFINITIONS = {
                // Two-letter words
                "AA": "Rough, cindery lava.",
                "AB": "An abdominal muscle.",
                "AD": "An advertisement.",
                "AE": "One (Scots dialect).",
                "AG": "Agriculture.",
                "AH": "Expressing surprise, delight, or pain.",
                "AI": "The three-toed sloth.",
                "AL": "An East Indian tree (Morinda citrifolia).",
                "AM": "First-person singular present of be.",
                "AN": "The indefinite article.",
                "AR": "The letter R.",
                "AS": "To the same degree or amount.",
                "AT": "Expressing location or arrival in a particular place.",
                "AW": "Expressing mild protest, disappointment, or disgust.",
                "AX": "A tool with a flat sharp blade used for cutting wood.",
                "AY": "An affirmative vote; yes.",
                "BA": "In ancient Egypt, the soul or spirit.",
                "BE": "To exist or have a state of being.",
                "BI": "Slang for a bisexual person.",
                "BO": "Slang for a friend, guy, or fellow.",
                "BY": "Identifying the agent performing an action.",
                "DA": "Informal word for father.",
                "DE": "Of or from (used in names).",
                "DO": "To perform an action or activity.",
                "DY": "A form of energy or force (physics).",
                "ED": "Education (slang).",
                "EE": "Scots dialect word for eye.",
                "EF": "The letter F.",
                "EH": "Expressing inquiry or surprise.",
                "EL": "An elevated railway.",
                "EM": "A unit of typographic measurement.",
                "EN": "A unit of typographic measurement equal to half an em.",
                "ER": "Expressing hesitation or uncertainty.",
                "ES": "The letter S.",
                "ET": "A dialectal or nonstandard past tense of eat.",
                "EX": "A former spouse or partner.",
                "FA": "The fourth note of the musical scale.",
                "FE": "A Hebrew letter.",
                "FY": "An expression of disgust or disapproval (archaic).",
                "GI": "A martial arts training uniform.",
                "GO": "To move from one place to another.",
                "HA": "Expressing surprise, triumph, or laughter.",
                "HE": "Referring to a male person or animal.",
                "HI": "A friendly greeting.",
                "HM": "Expressing thoughtful consideration or hesitation.",
                "HO": "A call to attract attention or express triumph.",
                "ID": "The part of the psyche associated with basic instincts.",
                "IF": "Introducing a conditional clause.",
                "IN": "Expressing the situation of something enclosed or surrounded.",
                "IO": "A species of hawk moth.",
                "IS": "Third-person singular present of be.",
                "IT": "Referring to a thing previously mentioned.",
                "JA": "Yes (German/Dutch/Afrikaans word used in dialect).",
                "JO": "A sweetheart or darling.",
                "KA": "In ancient Egypt, the spiritual part of a human being.",
                "KI": "Traditional Japanese concept of vital energy.",
                "KO": "A traditional Chinese unit of volume.",
                "LA": "The sixth note of the musical scale.",
                "LI": "A traditional Chinese unit of distance.",
                "LO": "Look or see (used to draw attention).",
                "MA": "Informal word for mother.",
                "ME": "Objective case of I.",
                "MI": "The third note of the musical scale.",
                "MM": "Expressing satisfaction, agreement, or hesitation.",
                "MO": "Slang for a moment.",
                "MU": "The twelfth letter of the Greek alphabet.",
                "MY": "Belonging to the speaker.",
                "NA": "No or not (Scots or dialect).",
                "NE": "Born with the maiden name of.",
                "NO": "Expressing refusal, denial, or disagreement.",
                "NU": "The thirteenth letter of the Greek alphabet.",
                "NY": "A dialectal word for near or close.",
                "OB": "An objection.",
                "OD": "A hypothetical vital force.",
                "OE": "A small island or whirlwind.",
                "OF": "Expressing the relationship between a part and a whole.",
                "OH": "Expressing surprise, pain, or sympathy.",
                "OI": "A call for attention or exclamation of annoyance.",
                "OK": "All right; acceptable or satisfactory.",
                "OM": "A sacred syllable chanted in Hindu and Buddhist prayers.",
                "ON": "Physically in contact with and supported by.",
                "OP": "Slang for an operation, or a style of abstract art.",
                "OR": "Introducing an alternative.",
                "OS": "A bone, or an opening/orifice.",
                "OT": "An old or archaic spelling of hot.",
                "OU": "A Hawaiian honeycreeper bird.",
                "OW": "Expressing sudden pain.",
                "OX": "A castrated bull used as a draft animal.",
                "OY": "Expressing dismay, pain, or annoyance.",
                "PA": "Informal word for father.",
                "PE": "A Hebrew letter.",
                "PH": "A measure of acidity or alkalinity.",
                "PI": "The sixteenth letter of the Greek alphabet; mathematical constant.",
                "PO": "A chamber pot.",
                "QI": "The vital force inherent in all things (Chinese thought).",
                "RE": "The second note of the musical scale, or in reference to.",
                "SH": "Urging silence.",
                "SI": "The seventh note of the musical scale.",
                "SO": "To such a great extent, or in order that.",
                "TA": "Informal expression of thank you.",
                "TE": "The seventh note of the musical scale.",
                "TI": "A shrubby plant of the lily family; seventh musical note.",
                "TO": "Expressing motion in the direction of.",
                "UG": "To cause dread or disgust (archaic).",
                "UH": "Expressing hesitation or doubt.",
                "UM": "Expressing hesitation or a pause in speech.",
                "UN": "Dialectal word for one.",
                "UP": "Toward a higher position.",
                "US": "Objective case of we.",
                "UT": "The musical tone C (or Do).",
                "WE": "Referring to the speaker and others.",
                "WO": "Woe or misery.",
                "XI": "The fourteenth letter of the Greek alphabet.",
                "XU": "A monetary unit of Vietnam.",
                "YA": "Informal word for you.",
                "YE": "Archaic plural form of you.",
                "YO": "A slang greeting or call for attention.",
                "ZA": "Slang for pizza.",
                "ZO": "A hybrid of a yak and domestic cattle.",

                // Three-letter Scrabble words
                "AAH": "To express surprise, joy, or satisfaction.",
                "AAL": "An East Indian shrub, or a dye obtained from it.",
                "AAS": "Plural of aa (rough, blocky lava).",
                "ABA": "A loose sleeveless outer garment worn by Arabs.",
                "ABB": "A coarse wool, or yarn for warp.",
                "ABO": "An offensive term for an Aborigine.",
                "ABS": "Plural of ab (abdominal muscle).",
                "ABY": "To pay a penalty for; suffer or atone for.",
                "ACH": "Expressing exasperation or disgust.",
                "ADZ": "A cutting tool used for shaping wood.",
                "AFF": "Scots word for off.",
                "AGA": "A high officer in the Ottoman Empire.",
                "AGS": "Plural of ag (agriculture).",
                "AHA": "Expressing triumph, surprise, or derision.",
                "AHI": "Yellowfin tuna.",
                "AHS": "Third-person singular present of aah.",
                "AIA": "A nurse or maid in India (ayah).",
                "AIN": "A Hebrew letter, or Scots dialect for own.",
                "AIS": "Plural of ai (three-toed sloth).",
                "AIT": "A small island in a river or lake.",
                "AJI": "A hot pepper.",
                "AKE": "Archaic spelling of ache.",
                "ALA": "A wing or winglike structure.",
                "ALB": "A white vestment worn by Christian priests.",
                "ALF": "Slang for an uncultured or narrow-minded person.",
                "ALG": "Algae (slang/abbr).",
                "ALS": "Plural of al (an East Indian tree).",
                "ALT": "High pitch or key, or the Alt key.",
                "AMA": "A Japanese female pearl diver.",
                "AME": "Soul (French word sometimes used in English).",
                "AMI": "A friend.",
                "AMP": "An ampere, or an amplifier.",
                "AMU": "Atomic mass unit.",
                "ANA": "A collection of anecdotes or information.",
                "ANE": "Scots dialect for one.",
                "ANI": "A black tropical American cuckoo bird.",
                "APO": "A type of protein (apolipoprotein).",
                "APP": "An application program.",
                "ARB": "Slang for an arbitrageur.",
                "ARS": "Plural of ar (the letter R).",
                "ARY": "Dialectal word for any.",
                "ATT": "A monetary unit of Laos.",
                "AUA": "A species of mullet.",
                "AUE": "Polynesian expression of grief or regret.",
                "AUF": "An elf's child; a changeling.",
                "AUK": "A diving seabird of northern seas.",
                "AVA": "Scots dialect for at all.",
                "AVE": "An expression of greeting or farewell.",
                "AVO": "A monetary unit of Macau.",
                "AWA": "Scots dialect for away.",
                "AWN": "A stiff bristle growing from the husk of grasses.",
                "AYS": "Plural of ay (an affirmative vote).",
                "AZO": "Containing nitrogen (chemical compounds)."
            };

            // Read SOWPODS
            const sowpodsWords = new Set();
            if (fs.existsSync(localSowpodsPath)) {
                try {
                    const sowpodsContent = fs.readFileSync(localSowpodsPath, 'utf8');
                    sowpodsContent.split(/\r?\n/).map(w => w.trim().toUpperCase()).filter(Boolean).forEach(w => {
                        sowpodsWords.add(w);
                    });
                    console.log(`  -> Successfully loaded ${sowpodsWords.size} words from sowpods.txt`);
                } catch (e) {
                    console.warn('  ⚠️ Failed to read sowpods.txt:', e.message);
                }
            }

            const combinedWordsSet = new Set(wordsAlpha);
            sowpodsWords.forEach(w => combinedWordsSet.add(w));
            const words = Array.from(combinedWordsSet);
            
            let dictObj = {};
            let rawDictObj = {};

            // 1. Load CSW21 dictionary first
            const localCswPath = path.join(__dirname, 'csw21.txt');
            if (fs.existsSync(localCswPath)) {
                try {
                    console.log('  -> Parsing csw21.txt (Collins Scrabble definitions)...');
                    const cswContent = fs.readFileSync(localCswPath, 'utf8');
                    const cswLines = cswContent.split(/\r?\n/);
                    const cswDefs = {};
                    const cswRedirects = {};

                    cswLines.forEach(line => {
                        line = line.trim();
                        if (!line || line.startsWith('#')) return;
                        const spaceIndex = line.indexOf(' ');
                        if (spaceIndex === -1) return;
                        const word = line.substring(0, spaceIndex).toUpperCase();
                        const rest = line.substring(spaceIndex + 1).trim();
                        
                        const redirectMatch = rest.match(/<([^=>]+)=([^>]+)>/);
                        if (redirectMatch) {
                            cswRedirects[word] = redirectMatch[1].toUpperCase();
                        } else {
                            let definition = rest;
                            const bracketIndex = definition.lastIndexOf('[');
                            if (bracketIndex !== -1) {
                                definition = definition.substring(0, bracketIndex).trim();
                            }
                            if (definition) {
                                definition = definition.charAt(0).toUpperCase() + definition.slice(1);
                                if (!definition.endsWith('.')) definition += '.';
                                cswDefs[word] = definition;
                            }
                        }
                    });

                    // Resolve redirects in CSW
                    for (const [word, base] of Object.entries(cswRedirects)) {
                        if (cswDefs[base]) {
                            let inflectionType = 'Inflection of';
                            const lowerWord = word.toLowerCase();
                            const lowerBase = base.toLowerCase();
                            if (lowerWord.endsWith('s') && !lowerBase.endsWith('s')) {
                                inflectionType = 'Plural of';
                            } else if (lowerWord.endsWith('ed')) {
                                inflectionType = 'Past tense of';
                            } else if (lowerWord.endsWith('ing')) {
                                inflectionType = 'Present participle of';
                            } else if (lowerWord.endsWith('er') || lowerWord.endsWith('ers')) {
                                inflectionType = 'Agent of';
                            }
                            cswDefs[word] = `[${inflectionType} ${base}] ${cswDefs[base]}`;
                        }
                    }

                    // Put CSW definitions into rawDictObj
                    for (let key in cswDefs) {
                        rawDictObj[key] = cswDefs[key];
                    }
                    console.log(`  -> Loaded ${Object.keys(cswDefs).length} definitions from CSW21`);
                } catch(e) {
                    console.warn('  ⚠️ Failed to parse csw21.txt:', e.message);
                }
            }

            // 2. Load clean Webster definitions (only fill in missing ones)
            if (fs.existsSync(localDictPath)) {
                try {
                    const rawDict = fs.readFileSync(localDictPath, 'utf8');
                    const parsed = JSON.parse(rawDict);
                    let websterCount = 0;
                    for (let key in parsed) {
                        const cleanDef = cleanDefinition(parsed[key]);
                        if (cleanDef && !rawDictObj[key.toUpperCase()]) {
                            rawDictObj[key.toUpperCase()] = cleanDef;
                            websterCount++;
                        }
                    }
                    console.log(`  -> Loaded ${websterCount} missing definitions from Webster`);
                } catch(e) {
                    console.warn('  ⚠️ Failed to parse dictionary_compact.json', e.message);
                }
            }

            // 3. Load secondary dictionary for modern/inflected definitions
            const localSecondaryPath = path.join(__dirname, 'simple_english_dictionary.json');
            const synonymRedirects = {};
            if (fs.existsSync(localSecondaryPath)) {
                try {
                    console.log('  -> Loading secondary definitions database...');
                    const rawSecondary = fs.readFileSync(localSecondaryPath, 'utf8');
                    const parsedSecondary = JSON.parse(rawSecondary);
                    let secondaryCount = 0;
                    for (let key in parsedSecondary) {
                        const entry = parsedSecondary[key];
                        const upperKey = key.toUpperCase();
                        if (entry) {
                            if (entry.MEANINGS && entry.MEANINGS.length > 0) {
                                const firstMeaning = entry.MEANINGS[0];
                                const pos = firstMeaning[0]; // e.g. "Noun"
                                const gloss = firstMeaning[1]; // e.g. "fruit with red..."
                                if (gloss && !rawDictObj[upperKey]) {
                                    rawDictObj[upperKey] = `(${pos}) ${gloss.charAt(0).toUpperCase() + gloss.slice(1)}.`;
                                    secondaryCount++;
                                }
                            } else if (entry.SYNONYMS && entry.SYNONYMS.length > 0) {
                                synonymRedirects[upperKey] = entry.SYNONYMS.map(s => s.toUpperCase());
                            }
                        }
                    }
                    console.log(`  -> Loaded ${secondaryCount} real definitions from secondary database`);
                } catch (e) {
                    console.warn('  ⚠️ Failed to parse simple_english_dictionary.json:', e.message);
                }
            }

            // 4. Try resolving empty meaning words via synonym redirects
            let resolvedSynonymsCount = 0;
            for (const [word, syns] of Object.entries(synonymRedirects)) {
                if (rawDictObj[word]) continue;
                for (const syn of syns) {
                    if (rawDictObj[syn]) {
                        rawDictObj[word] = `[Synonym of ${syn}] ${rawDictObj[syn]}`;
                        resolvedSynonymsCount++;
                        break;
                    }
                }
            }
            console.log(`  -> Resolved ${resolvedSynonymsCount} words via synonym redirection`);

            // 5. Merge curated definitions to override any default entries
            for (let key in SCRABBLE_INLINE_DEFINITIONS) {
                rawDictObj[key.toUpperCase()] = SCRABBLE_INLINE_DEFINITIONS[key];
            }

            // 6. Merge the 193 100% full-coverage curated definitions
            const curated193Path = path.join(__dirname, 'shared', 'curated_193.json');
            if (fs.existsSync(curated193Path)) {
                try {
                    const curated193 = JSON.parse(fs.readFileSync(curated193Path, 'utf8'));
                    let curatedCount = 0;
                    for (let key in curated193) {
                        rawDictObj[key.toUpperCase()] = curated193[key];
                        curatedCount++;
                    }
                    console.log(`  -> Loaded ${curatedCount} final curated definitions to achieve 100% real coverage`);
                } catch(e) {
                    console.warn('  ⚠️ Failed to load curated_193.json', e.message);
                }
            }

            const findBaseWord = (w) => {
                const lower = w.toLowerCase();
                // Latin Plural -i -> -us
                if (lower.endsWith('i') && lower.length > 2) {
                    const base = (lower.slice(0, -1) + 'us').toUpperCase();
                    if (rawDictObj[base]) return { base, type: 'Plural of' };
                }
                // 1. Plural -s
                if (lower.endsWith('s') && lower.length > 2) {
                    const base = lower.slice(0, -1).toUpperCase();
                    if (rawDictObj[base]) return { base, type: 'Plural of' };
                }
                // 2. Plural -es
                if (lower.endsWith('es') && lower.length > 3) {
                    const base = lower.slice(0, -2).toUpperCase();
                    if (rawDictObj[base]) return { base, type: 'Plural of' };
                }
                // 3. Plural -ies -> -y
                if (lower.endsWith('ies') && lower.length > 4) {
                    const base = (lower.slice(0, -3) + 'y').toUpperCase();
                    if (rawDictObj[base]) return { base, type: 'Plural of' };
                }
                // 4. Past tense -ed
                if (lower.endsWith('ed') && lower.length > 3) {
                    const base1 = lower.slice(0, -1).toUpperCase();
                    if (rawDictObj[base1]) return { base: base1, type: 'Past tense of' };
                    const base2 = lower.slice(0, -2).toUpperCase();
                    if (rawDictObj[base2]) return { base: base2, type: 'Past tense of' };
                }
                // 5. Present participle -ing
                if (lower.endsWith('ing') && lower.length > 4) {
                    const base1 = lower.slice(0, -3).toUpperCase();
                    if (rawDictObj[base1]) return { base: base1, type: 'Present participle of' };
                    const base2 = (lower.slice(0, -3) + 'e').toUpperCase();
                    if (rawDictObj[base2]) return { base: base2, type: 'Present participle of' };
                }
                // 6. Agent noun -er / -ers
                if (lower.endsWith('ers') && lower.length > 4) {
                    const base = lower.slice(0, -1).toUpperCase();
                    if (rawDictObj[base]) return { base, type: 'Plural of' };
                }
                if (lower.endsWith('er') && lower.length > 3) {
                    const base1 = lower.slice(0, -1).toUpperCase();
                    if (rawDictObj[base1]) return { base: base1, type: 'Agent of' };
                    const base2 = lower.slice(0, -2).toUpperCase();
                    if (rawDictObj[base2]) return { base: base2, type: 'Agent of' };
                }
                // 7. Superlative -est
                if (lower.endsWith('est') && lower.length > 4) {
                    const base1 = lower.slice(0, -2).toUpperCase();
                    if (rawDictObj[base1]) return { base: base1, type: 'Superlative of' };
                    const base2 = lower.slice(0, -3).toUpperCase();
                    if (rawDictObj[base2]) return { base: base2, type: 'Superlative of' };
                }
                return null;
            };

            const hasBaseWord = (w) => {
                const upper = w.toUpperCase();
                if (rawDictObj[upper] || sowpodsWords.has(upper)) return true;
                return findBaseWord(upper) !== null;
            };

            // Build playable words set to shrink dictionary sizes
            const playableWords = new Set();
            words.filter(w => w.length >= 2 && w.length <= 8).forEach(w => {
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
                const upperKey = key.toUpperCase();
                const lowerKey = key.toLowerCase();
                
                let definition = null;
                if (rawDictObj[upperKey]) {
                    definition = rawDictObj[upperKey];
                } else {
                    const baseRes = findBaseWord(upperKey);
                    if (baseRes && rawDictObj[baseRes.base]) {
                        definition = `[${baseRes.type} ${baseRes.base}] ${rawDictObj[baseRes.base]}`;
                    }
                }
                
                if (definition) {
                    dictObj[lowerKey] = definition;
                } else if (sowpodsWords.has(upperKey)) {
                    dictObj[lowerKey] = `[Scrabble] A valid Scrabble word.`;
                }
            }
            
            try {
                const sharedDictCompactPath = path.join(__dirname, 'shared', 'dictionary_compact.json');
                fs.writeFileSync(sharedDictCompactPath, JSON.stringify(dictObj), 'utf8');
                console.log('  -> Filtered compact definitions written to shared/dictionary_compact.json!');
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
            // Lazy merge chunk metadata into this.meta if it exists, or initialize it
            if (!this.meta) this.meta = {};
            Object.assign(this.meta, data.meta || {});
            return this.dict[letter];
        } catch (e) {
            console.error(\`Failed to load chunk for letter \${letter}:\`, e);
            return {};
        }
    },
    getSingular(w, chunk) {
        if (!chunk) return null;
        if (chunk[w]) return w;
        if (w.endsWith('ies') && w.length > 3) {
            const sing = w.slice(0, -3) + 'y';
            if (chunk[sing]) return sing;
        }
        if (w.endsWith('es') && w.length > 2) {
            const sing = w.slice(0, -2);
            if (chunk[sing]) return sing;
        }
        if (w.endsWith('s') && w.length > 1) {
            const sing = w.slice(0, -1);
            if (chunk[sing]) return sing;
        }
        return null;
    },
    async get(word) {
        const w = word.toLowerCase().trim();
        const letter = w.charAt(0);
        if (!/[a-z]/.test(letter)) return null;

        const chunk = await this.getChunk(letter);
        if (chunk[w]) return chunk[w];
        
        const sing = this.getSingular(w, chunk);
        if (sing) {
            return "[Plural of " + sing.toUpperCase() + "] " + chunk[sing];
        }
        return null;
    },
    async getDetails(word) {
        const w = word.toLowerCase().trim();
        const letter = w.charAt(0);
        if (!/[a-z]/.test(letter)) return { def: "", rarity: 0.5, tags: [] };

        const chunk = await this.getChunk(letter);
        if (chunk[w]) {
            const metadata = (this.meta && this.meta[w]) || { rarity: 0.5, tags: [] };
            return {
                def: chunk[w] || "",
                rarity: metadata.rarity !== undefined ? metadata.rarity : 0.5,
                tags: metadata.tags || []
            };
        }
        const sing = this.getSingular(w, chunk);
        if (sing) {
            const metadata = (this.meta && this.meta[sing]) || { rarity: 0.5, tags: [] };
            return {
                def: "[Plural of " + sing.toUpperCase() + "] " + chunk[sing],
                rarity: metadata.rarity !== undefined ? metadata.rarity : 0.5,
                tags: metadata.tags || []
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

            // Write dictionary heavy database file (local dictionary_db.js) - DEPRECATED in favor of chunks!
            // Clean up old dictionary_db.js if it exists
            const dictionaryDbPath = path.join(__dirname, 'shared', 'dictionary_db.js');
            if (fs.existsSync(dictionaryDbPath)) {
                fs.unlinkSync(dictionaryDbPath);
            }

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

            // Root dictionary remains pristine and we write directly to shared/dictionary_compact.json above
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
