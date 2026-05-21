import { useMemo } from 'react';
import { isLetter } from '../utils/cipher';

export default function QuoteDisplay({
    quote,
    cipher,
    userGuesses,
    cursorIndex,
    selectedEncryptedChar,
    checkMode,
    solved,
    hintedChars,
    onSelectChar
}) {

    // Pre-calculate word chunks and their starting indices to avoid side-effects during render
    const words = useMemo(() => {
        if (!quote) return [];
        const tokens = [];
        let currentIndex = 0;

        // Split by space but preserve order
        const rawWords = quote.split(' ');

        rawWords.forEach((wordText, i) => {
            tokens.push({
                text: wordText,
                startIndex: currentIndex,
                type: 'word'
            });
            currentIndex += wordText.length;

            // Add space if not the last word
            if (i < rawWords.length - 1) {
                // We don't render spaces as elements, but we need to account for the index
                currentIndex += 1;
            }
        });
        return tokens;
    }, [quote]);

    const renderWord = (wordObj, index) => {
        const { text, startIndex } = wordObj;
        const isLast = index === words.length - 1;

        return (
            <div key={`${startIndex}-${text}`} className={`flex flex-nowrap max-w-full gap-0.5 sm:gap-1 ${isLast ? '' : 'mr-3 sm:mr-8'} mb-4 sm:mb-6`}>
                {text.split('').map((char, charOffset) => {
                    const currentIdx = startIndex + charOffset;

                    if (!isLetter(char)) {
                        return (
                            <div key={`punct-${currentIdx}`} className="flex flex-col justify-end w-3 sm:w-6 h-14 sm:h-20 pb-2 items-center shrink min-w-0">
                                <span className="text-lg sm:text-3xl text-cyber-text font-bold block">{char}</span>
                            </div>
                        );
                    }

                    const encryptedChar = cipher[char];
                    const isCursor = cursorIndex === currentIdx;
                    const isSelectedGroup = selectedEncryptedChar === encryptedChar;
                    const userGuess = userGuesses[encryptedChar] || '';
                    const isHinted = hintedChars.has(encryptedChar);

                    // Validation styles
                    const isWrong = checkMode && userGuess !== char;
                    const isCorrect = solved || (checkMode && userGuess === char) || isHinted;

                    return (
                        <div
                            key={`char-${currentIdx}`}
                            id={`char-${currentIdx}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectChar(currentIdx);
                            }}
                            className={`
                                flex flex-col items-center cursor-pointer transition-all duration-150 group
                                w-7 xs:w-8 sm:w-12 relative shrink min-w-0
                            `}
                        >
                            <div className={`
                                text-[10px] sm:text-sm font-semibold mb-0.5 sm:mb-1 select-none transition-colors
                                ${isSelectedGroup ? 'text-cyber-cyan font-bold scale-110' : 'text-cyber-text/50'}
                                ${isHinted ? 'text-green-400' : ''}
                            `}>
                                {encryptedChar}
                            </div>

                            <div className={`
                                w-full aspect-square border-2 rounded sm:rounded-lg flex items-center justify-center
                                text-lg sm:text-2xl font-bold uppercase select-none transition-all
                                ${isCursor ? 'border-cyber-cyan bg-cyber-magenta/20 shadow-md transform -translate-y-1' : ''}
                                ${isSelectedGroup && !isCursor ? 'bg-cyber-cyan/10 border-cyber-cyan/50' : ''}
                                ${!isSelectedGroup && !isCursor ? 'border-cyber-cyan/30 hover:border-cyber-cyan/60 bg-cyber-surface' : ''}
                                
                                /* Hint / Correct Styles */
                                ${isHinted ? 'bg-green-900/30 border-green-600 text-green-300' : ''}
                                ${solved ? 'text-green-400 border-green-500' : 'text-cyber-text'}
                                
                                /* Check Mode Styles */
                                ${isWrong ? 'bg-red-900/20 border-red-500 text-red-400' : ''}
                                ${checkMode && isCorrect && !solved ? 'text-green-400 border-green-400' : ''}
                            `}>
                                {userGuess}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-wrap justify-center content-center">
            {words.map((wordObj, i) => renderWord(wordObj, i))}
        </div>
    );
}
