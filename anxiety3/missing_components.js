
// --- Helper Components ---
const SettingBtn = ({ label, active, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded border-2 transition-all ${active ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'}`}
    >
        <div className="flex items-center gap-3">
            {Icon && <Icon />}
            <span className="font-bold tracking-wider">{label}</span>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 ${active ? 'bg-white border-white' : 'bg-transparent border-gray-600'}`}></div>
    </button>
);

// --- Helpers ---
const getThresholdForLevel = (level) => level * 1000;
