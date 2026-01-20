
import { Lightbulb, CheckCircle, Info, Eraser } from 'lucide-react';

export default function GameControls({ onHint, onCheck, onClear, checkMode, selectedEncryptedChar, hintedChars }) {
    return (
        <div className="max-w-2xl mx-auto px-2 py-3 pb-safe">
            {/* Action Bar */}
            <div className="flex justify-between gap-2 mb-3 px-1">
                <button
                    onClick={onHint}
                    className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors font-medium text-xs sm:text-sm border border-amber-200 dark:border-amber-700 active:scale-95"
                >
                    <Lightbulb size={16} /> <span>Hint</span>
                </button>

                <button
                    onClick={onCheck}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm border active:scale-95
            ${checkMode
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                >
                    {checkMode ? <CheckCircle size={16} /> : <Info size={16} />}
                    <span>{checkMode ? 'Errors' : 'Check'}</span>
                </button>

                <button
                    onClick={onClear}
                    className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium text-xs sm:text-sm border border-slate-200 dark:border-slate-600 active:scale-95"
                >
                    <Eraser size={16} /> <span>Clear</span>
                </button>
            </div>

            {/* Helper Text */}
            <div className="text-center text-xs text-slate-400 mb-2 h-4 overflow-hidden">
                {selectedEncryptedChar && hintedChars.has(selectedEncryptedChar) ? (
                    <span className="text-green-600 font-bold">Hint revealed!</span>
                ) : selectedEncryptedChar ? (
                    <span>Editing <span className="font-bold text-slate-800 dark:text-white">{selectedEncryptedChar}</span></span>
                ) : (
                    <span>Select a letter...</span>
                )}
            </div>
        </div>
    );
}
