import React from "react";

const PlayerSelectionModal = ({
  isVisible,
  players,
  onPlayerSelect,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black bg-opacity-80">
      <div className="w-[80%] max-w-4xl h-[70%] bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border-4 border-yellow-500 flex flex-col relative">
        {/* Header */}
        <div className="relative p-6 border-b border-yellow-500/30">
          <h1 className="text-4xl font-bold text-center text-yellow-500">
            בחר שחקן לספירה
          </h1>
          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Players Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            dir="rtl"
          >
            {players?.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => onPlayerSelect(player)}
              >
                {/* Avatar */}
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-transparent group-hover:border-yellow-500 transition-all duration-300 group-hover:scale-110">
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Entry number badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full border-2 border-yellow-300 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-red-800">
                      {player.entries}
                    </span>
                  </div>
                </div>

                {/* Player Name */}
                <span className="text-lg font-bold text-white text-center group-hover:text-yellow-500 transition-colors duration-300 max-w-full truncate">
                  {player.name}
                </span>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-yellow-500/30">
          <p className="text-center text-gray-400 text-lg">
            לחץ על השחקן כדי להתחיל את הספירה
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectionModal;
