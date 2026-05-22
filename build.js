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

    if (fs.existsSync(localWordsPath)) {
        try {
            console.log('  -> Compiling dictionary file with definitions...');
            const content = fs.readFileSync(localWordsPath, 'utf8');
            const words = content.split(/\r?\n/).map(w => w.trim().toUpperCase()).filter(Boolean);
            
            let dictObj = {};
            if (fs.existsSync(localDictPath)) {
                try {
                    const rawDict = fs.readFileSync(localDictPath, 'utf8');
                    const parsed = JSON.parse(rawDict);
                    for (let key in parsed) {
                        dictObj[key.toUpperCase()] = parsed[key];
                    }
                } catch(e) {
                    console.warn('  ⚠️ Failed to parse dictionary_compact.json', e.message);
                }
            }

            const commonArr = [];
            commonSeed.split(' ').forEach(w => {
                if(!w) return;
                if(dictObj[w]) commonArr.push(w);
            });

            const wordleArr = [];
            words.filter(w => w.length === 5).forEach(w => {
                if(dictObj[w]) wordleArr.push(w);
            });

            const lexiconArr = [];
            words.filter(w => w.length >= 3 && w.length <= 8).forEach(w => {
                if(dictObj[w]) lexiconArr.push(w);
            });

            const managerScript = `
window.DefinitionManager = {
    dict: null,
    async get(word) {
        if (!this.dict) {
            try {
                const res = await fetch('../shared/dictionary_compact.json');
                this.dict = await res.json();
            } catch(e) {
                console.error("Failed to load dictionary definitions:", e);
                return null;
            }
        }
        return this.dict[word.toUpperCase()];
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
