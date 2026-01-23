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

// Main Build Process
try {
    const distDir = path.join(__dirname, 'dist');

    // 1. Clean dist
    if (fs.existsSync(distDir)) {
        console.log('> Cleaning dist directory...');
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir);

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
    run('npm install && npm run build', cryptoDir);
    copyRecursiveWithLog(path.join(cryptoDir, 'dist'), path.join(distDir, 'cryptograms'));

    // 4. Build Anxiety3 (Manual Copy)
    console.log('> Copying Anxiety3 (Static)...');
    const anxietyDir = path.join(__dirname, 'anxiety3');
    const anxietyDist = path.join(distDir, 'anxiety3');
    if (!fs.existsSync(anxietyDist)) fs.mkdirSync(anxietyDist);

    fs.readdirSync(anxietyDir).forEach(file => {
        if (file.endsWith('.html') || file.endsWith('.js')) {
            // Exclude build artifacts if any, but copy html/js
            fs.copyFileSync(path.join(anxietyDir, file), path.join(anxietyDist, file));
        }
    });

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

    // 9. Copy Shared Scripts/Assets
    console.log('> Copying Shared Assets...');
    copyRecursiveWithLog(path.join(__dirname, 'shared'), path.join(distDir, 'shared'));

    // 8. Copy Shared Scripts
    if (fs.existsSync(path.join(__dirname, 'timeLimit.js'))) {
        fs.copyFileSync(path.join(__dirname, 'timeLimit.js'), path.join(distDir, 'timeLimit.js'));
    }

    console.log('\n✅ Build verification passed! Output is in /dist');

} catch (error) {
    console.error('\n❌ Build Failed:', error.message);
    process.exit(1);
}
