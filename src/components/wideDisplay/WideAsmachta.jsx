import React, { useEffect, useState } from "react";

const WideAsmachta = ({ onClose, player }) => {
  const [progress, setProgress] = useState(0);
  const [isRedLight, setIsRedLight] = useState(true);
  const DURATION = 7000;
  const INTERVAL = 50;
  const STEPS = DURATION / INTERVAL;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, DURATION);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / STEPS, 100));
    }, INTERVAL);

    // Police light effect interval
    let policeInterval;
    if (player.entries > 4) {
      policeInterval = setInterval(() => {
        setIsRedLight((prev) => !prev);
      }, 500);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      if (policeInterval) clearInterval(policeInterval);
    };
  }, [onClose, player.entries]);

  const radius = (96 + 24) / 2; // Reduced from 128 + 32
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl border-2 border-yellow-500 w-full max-w-xl mx-auto transition-colors duration-300 ${
          player.entries > 4
            ? isRedLight
              ? "shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              : "shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            : ""
        }`}
        dir="rtl"
      >
        <div className="relative p-3 border-b border-yellow-500/30">
          <h1
            className={`text-2xl font-bold text-center transition-colors duration-300 ${
              player.entries > 4
                ? isRedLight
                  ? "text-red-500"
                  : "text-blue-500"
                : "text-yellow-500"
            }`}
          >
            אסמכתא
          </h1>
          <button
            onClick={onClose}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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

        <div className="p-4">
          <div
            className={`bg-gray-800/50 rounded-lg p-4 transition-shadow duration-300 ${
              player.entries > 4
                ? isRedLight
                  ? "shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]"
                  : "shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]"
                : ""
            }`}
          >
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="relative p-3">
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 w-[120px] h-[120px]">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke={
                      player.entries > 4
                        ? isRedLight
                          ? "#EF4444"
                          : "#3B82F6"
                        : "#EAB308"
                    }
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset:
                        -((100 - progress) / 100) * circumference,
                      transition:
                        "stroke-dashoffset 50ms linear, stroke 300ms ease-in-out",
                    }}
                  />
                </svg>
                <div className="w-24 h-24 rounded-full overflow-hidden relative z-10">
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
                {player.name}
              </h2>
            </div>

            <div className="text-center">
              <div className="text-base text-gray-300 mb-2">מספר כניסות</div>
              <div
                className={`text-4xl md:text-5xl font-bold transition-colors duration-300 ${
                  player.entries > 4
                    ? isRedLight
                      ? "text-red-500"
                      : "text-blue-500"
                    : "text-yellow-500"
                }`}
              >
                {player.entries}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-full mt-4 font-bold py-2 px-4 rounded-lg transition-all text-base ${
              player.entries > 4
                ? isRedLight
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700"
            }`}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default WideAsmachta;
