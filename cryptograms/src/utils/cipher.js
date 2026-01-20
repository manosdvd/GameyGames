export const isLetter = (char) => /^[A-Z]$/.test(char);

export const generateCipher = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    let shuffled = [...alphabet];

    // Fisher-Yates Shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Ensure no letter maps to itself (Derangement)
    // If we find a clash, just swap it with the next one (or previous if last)
    for (let i = 0; i < alphabet.length; i++) {
        if (alphabet[i] === shuffled[i]) {
            const swapIdx = (i === alphabet.length - 1) ? i - 1 : i + 1;
            [shuffled[i], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i]];
        }
    }

    const newCipher = {};
    const newReverseCipher = {};
    alphabet.forEach((char, index) => {
        newCipher[char] = shuffled[index];
        newReverseCipher[shuffled[index]] = char;
    });

    return { newCipher, newReverseCipher };
};
