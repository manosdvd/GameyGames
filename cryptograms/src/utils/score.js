export const calculateScore = (quote, elapsedTime, hintCount) => {
    // Only count letters for length to avoid punishing punctuation heavy quotes? 
    // Actually simpler to just use length, but let's be fair.
    const length = quote.replace(/[^A-Z]/g, '').length;

    // Base Score
    const BASE_PER_CHAR = 100;
    const baseScore = length * BASE_PER_CHAR;

    // Penalties
    const PENALTY_PER_HINT = 250;
    const penalty = hintCount * PENALTY_PER_HINT;

    // Speed Multiplier
    const secondsPerChar = length > 0 ? elapsedTime / length : 10;
    let multiplier = 1.0;
    let rank = 'Standard';

    if (secondsPerChar < 2.0) {
        multiplier = 2.0;
        rank = 'Legendary';
    } else if (secondsPerChar < 3.5) {
        multiplier = 1.5;
        rank = 'Fast';
    } else if (secondsPerChar < 5.0) {
        multiplier = 1.2;
        rank = 'Steady';
    }

    // Calculation
    let rawScore = (baseScore - penalty);
    if (rawScore < 0) rawScore = 0; // No negative base

    const finalScore = Math.round(rawScore * multiplier);

    return {
        finalScore,
        baseScore,
        penalty,
        multiplier,
        rank
    };
};
