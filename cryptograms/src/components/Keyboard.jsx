

export default function Keyboard({ onGuess, onDelete, selectedEncryptedChar, solved, hintedChars, usedLetters, duplicateLetters }) {
    const rows = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    ];

    return (
        <div className="select-none touch-manipulation max-w-2xl mx-auto px-2 pb-3 bg-white dark:bg-slate-800">
            {rows.map((row, i) => (
                <div key={i} className="flex justify-center gap-1 mb-2">
                    {row.split('').map(key => {
                        const isDuplicate = duplicateLetters?.has(key);
                        const isUsed = usedLetters?.has(key);

                        let btnClass = 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]';

                        if (!selectedEncryptedChar || hintedChars.has(selectedEncryptedChar)) {
                            btnClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-transparent shadow-none';
                        } else if (isDuplicate) {
                            btnClass = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-2 border-orange-400 dark:border-orange-600 font-bold';
                        } else if (isUsed) {
                            btnClass = 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-500';
                        }

                        return (
                            <button
                                key={key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onGuess) onGuess(key);
                                }}
                                disabled={!selectedEncryptedChar || solved || hintedChars.has(selectedEncryptedChar)}
                                className={`
                  flex-1 max-w-[40px] h-10 sm:h-12 rounded shadow-sm text-sm sm:text-lg font-semibold transition-colors
                  active:scale-90 active:bg-blue-100
                  ${btnClass}
                `}
                            >
                                {key}
                            </button>
                        );
                    })}
                </div>
            ))}
            <div className="flex justify-center mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete();
                    }}
                    disabled={!selectedEncryptedChar || hintedChars.has(selectedEncryptedChar)}
                    className="px-8 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 border border-red-100 dark:border-red-800 shadow-sm transition-colors"
                >
                    Backspace / Erase
                </button>
            </div>
        </div>
    );
}
