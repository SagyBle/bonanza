import React, { useState, useEffect } from "react";
import ringSound from "../../assets/sounds/ring.mp3";
import clockTickingSound from "../../assets/sounds/clockticking.mp3";

const CountdownModal = ({ isVisible, onClose, selectedPlayer }) => {
  const numOfSeconds = 30; // Timer duration in seconds
  const [timeLeft, setTimeLeft] = useState(numOfSeconds);
  const [showTimeOver, setShowTimeOver] = useState(false);

  // Create audio elements
  const ringAudio = new Audio(ringSound);
  const tickingAudio = new Audio(clockTickingSound);

  useEffect(() => {
    if (!isVisible) {
      setTimeLeft(numOfSeconds);
      setShowTimeOver(false);
      // Stop ticking sound when modal closes
      tickingAudio.pause();
      tickingAudio.currentTime = 0;
      return;
    }

    // Start playing ticking sound when countdown begins
    tickingAudio.loop = true; // Loop the ticking sound
    tickingAudio.play().catch((e) => {
      console.warn("Ticking audio play failed:", e);
    });

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Stop ticking sound
          tickingAudio.pause();
          tickingAudio.currentTime = 0;

          // Play ring sound when countdown reaches 0
          ringAudio.play().catch((e) => {
            console.warn("Ring audio play failed:", e);
          });

          // Show "Time Over!" message
          setShowTimeOver(true);

          // Close modal after 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);

          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      // Clean up ticking sound
      tickingAudio.pause();
      tickingAudio.currentTime = 0;
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-80">
      <div className="w-[70%] h-[70%] bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl border-4 border-yellow-500 flex flex-col items-center justify-center relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
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

        {/* Timer Display */}
        <div className="text-center">
          {showTimeOver ? (
            /* Time Over Display */
            <div className="flex flex-col items-center justify-center animate-pulse">
              <h1 className="text-8xl md:text-9xl font-bold text-red-500 mb-8 animate-bounce">
                TIME OVER!
              </h1>
              {selectedPlayer ? (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-red-500 shadow-2xl mb-6 animate-pulse">
                    <img
                      src={selectedPlayer.avatarUrl}
                      alt={selectedPlayer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">
                    {selectedPlayer.name}
                  </h2>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-8 border-red-500 shadow-2xl mb-6 animate-pulse flex items-center justify-center">
                    <span className="text-6xl">⏰</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">
                    General Timer
                  </h2>
                </div>
              )}
            </div>
          ) : (
            /* Normal Countdown Display */
            <>
              <h1 className="text-6xl md:text-8xl font-bold text-yellow-500 mb-8">
                COUNT DOWN
              </h1>

              {/* Player and Timer in Row */}
              <div className="flex items-center justify-center gap-12">
                {/* Selected Player Display */}
                {selectedPlayer && (
                  <div className="flex flex-col items-center">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-yellow-500 shadow-2xl mb-4">
                      <img
                        src={selectedPlayer.avatarUrl}
                        alt={selectedPlayer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                      {selectedPlayer.name}
                    </h2>
                  </div>
                )}

                {/* Large circular timer */}
                <div
                  className={`relative ${
                    selectedPlayer ? "w-80 h-80" : "w-96 h-96"
                  }`}
                >
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#374151"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#EAB308"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 45}`,
                        strokeDashoffset: `${
                          2 * Math.PI * 45 * (1 - timeLeft / numOfSeconds)
                        }`,
                        transition: "stroke-dashoffset 1s linear",
                      }}
                    />
                  </svg>

                  {/* Timer number in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl md:text-9xl font-bold text-white">
                      {timeLeft}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountdownModal;
