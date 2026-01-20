
const fs = require('fs');
const path = require('path');

// Helper to get formatted date for logging/comments if needed
// const date = new Date().toISOString().split('T')[0];

const customQuotesPath = path.join(__dirname, 'src', 'data', 'customQuotes.js');
const candidateFiles = [
    'candidate_quotes_1.js',
    'candidate_quotes_2.js',
    'candidate_quotes_3.js'
];

try {
    // 1. Read existing quotes
    let existingContent = fs.readFileSync(customQuotesPath, 'utf8');

    // Extract existing quotes to a Set to prevent duplicates
    const existingQuotesSet = new Set();
    const quoteRegex = /quote:\s*"(.*?)",/g;
    let match;
    while ((match = quoteRegex.exec(existingContent)) !== null) {
        existingQuotesSet.add(match[1]); // Exact match check
    }

    console.log(`Loaded ${existingQuotesSet.size} unique existing quotes.`);

    // 2. Read and filter candidate quotes
    const newQuotesToAdd = [];
    let processedCount = 0;
    let lengthFilteredCount = 0;
    let duplicateFilteredCount = 0;

    for (const file of candidateFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const candidates = require('./' + file);

            for (const q of candidates) {
                processedCount++;
                const text = q.quote;

                // Length check (80-150)
                if (text.length < 80 || text.length > 150) {
                    lengthFilteredCount++;
                    continue;
                }

                // Duplicate check
                if (existingQuotesSet.has(text)) {
                    duplicateFilteredCount++;
                    continue;
                }

                // Passed checks
                newQuotesToAdd.push(q);
                existingQuotesSet.add(text); // Add to set to prevent internal duplicates in batch
            }
        } else {
            console.error(`File not found: ${file}`);
        }
    }

    console.log(`Processed ${processedCount} candidates.`);
    console.log(`Filtered (Length): ${lengthFilteredCount}`);
    console.log(`Filtered (Duplicate): ${duplicateFilteredCount}`);
    console.log(`New Valid Quotes: ${newQuotesToAdd.length}`);

    // 3. Append to file
    if (newQuotesToAdd.length > 0) {
        // Find the end of the array to insert before the closing bracket
        const lastBracketIndex = existingContent.lastIndexOf('];');
        if (lastBracketIndex !== -1) {
            const contentBefore = existingContent.substring(0, lastBracketIndex);
            const contentAfter = existingContent.substring(lastBracketIndex);

            let newContentBlock = "\n    // --- Newly Added Unique Quotes (80-150 chars) ---\n";

            for (const q of newQuotesToAdd) {
                newContentBlock += `    { quote: "${q.quote}", author: "${q.author}" },\n`;
            }

            const finalContent = contentBefore + newContentBlock + contentAfter;
            fs.writeFileSync(customQuotesPath, finalContent, 'utf8');
            console.log('Successfully appended new quotes.');
        } else {
            console.error('Could not find closing bracket "];" in customQuotes.js');
        }
    } else {
        console.log('No new quotes to add.');
    }

} catch (err) {
    console.error('Error:', err);
}
