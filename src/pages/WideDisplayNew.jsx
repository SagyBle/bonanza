import React from "react";
import tableHoriz from "../assets/images/tableHoriz.png";
import matzriAvatar from "../assets/avatars/matzri.png";
import koreAvatar from "../assets/avatars/koren.png";
import blecherAvatar from "../assets/avatars/blecher.png";

const getPlayerPositions = (numPlayers) => {
  // Positions are shown from 12 oclock in the clock direction.
  const positions = {
    1: [{ top: -45, left: 0 }], // Single player at top
    2: [
      // Two players opposite each other
      { top: -45, left: 0 },
      { top: 45, left: 0 },
    ],
    3: [
      // Triangle formation
      { top: -45, left: 0 },
      { top: 25, left: 42 },
      { top: 25, left: -42 },
    ],
    4: [
      // Square formation
      { top: -45, left: 0 },
      { top: 0, left: 52 },
      { top: 45, left: 0 },
      { top: 0, left: -52 },
    ],
    5: [
      // Pentagon formation - evenly distributed
      { top: -45, left: 0 }, // Position: top=-45, left=0 (Center top)
      { top: -15, left: 45 }, // Position: top=-15, left=45 (Right top)
      { top: 44, left: 25 }, // Position: top=44, left=25 (Right bottom)
      { top: 44, left: -25 }, // Position: top=44, left=-25 (Left bottom)
      { top: -15, left: -45 }, // Position: top=-15, left=-45 (Left top)
    ],
    6: [
      // Hexagon formation
      { top: -45, left: 0 }, // Position: top=-45, left=0 (Center top)
      { top: -32, left: 40 }, // Position: top=-25, left=52 (Right top)
      { top: 32, left: 40 }, // Position: top=25, left=52 (Right bottom)
      { top: 45, left: 0 }, // Position: top=45, left=0 (Center bottom)
      { top: 32, left: -40 }, // Position: top=25, left=-52 (Left bottom)
      { top: -32, left: -40 }, // Position: top=-25, left=-52 (Left top)
    ],
    7: [
      // Heptagon formation
      { top: -50, left: 0 }, // Position: top=-45, left=0 (Center top)
      { top: -40, left: 30 }, // Position: top=-30, left=52 (Right top)
      { top: 0, left: 38 }, // Position: top=15, left=52 (Right middle)
      { top: 45, left: 20 }, // Position: top=45, left=0 (Center bottom)
      { top: 45, left: -20 }, // Position: top=45, left=0 (Center bottom)
      { top: 0, left: -38 }, // Position: top=15, left=-52 (Left middle)
      { top: -40, left: -30 }, // Position: top=-30, left=-52 (Left top)
    ],
    8: [
      // Octagon formation
      { top: -47, left: 0 }, // Position: top=-45, left=0 (Center top)
      { top: -40, left: 30 }, // Position: top=-35, left=52 (Right top)
      { top: 0, left: 40 }, // Position: top=0, left=52 (Right middle)
      { top: 40, left: 30 }, // Position: top=35, left=52 (Right bottom)
      { top: 47, left: 0 }, // Position: top=45, left=0 (Center bottom)
      { top: 40, left: -30 }, // Position: top=35, left=-52 (Left bottom)
      { top: 0, left: -40 }, // Position: top=0, left=-52 (Left middle)
      { top: -40, left: -30 }, // Position: top=-35, left=-52 (Left top)
    ],
    9: [
      // 9 players - 2 left side (9 o'clock), 3 top, 2 right side, 2 bottom
      { top: -52, left: 0 }, // Position: top=-47, left=0 (Top center)
      { top: -47, left: 23 }, // Position: top=-47, left=15 (Top right)
      { top: -20, left: 40 }, // Position: top=-10, left=49 (Right upper)
      { top: 20, left: 40 }, // Position: top=20, left=49 (Right lower)
      { top: 47, left: 18 }, // Position: top=47, left=15 (Bottom right)
      { top: 47, left: -18 }, // Position: top=47, left=-15 (Bottom left)
      { top: 20, left: -40 }, // Position: top=20, left=-49 (Left lower)
      { top: -20, left: -40 }, // Position: top=-10, left=-49 (Left upper)
      { top: -47, left: -23 }, // Position: top=-47, left=-15 (Top left)
    ],
    10: [
      // 10 players
      { top: -52, left: 0 }, // 12 o'clock (Top center)
      { top: -47, left: 23 }, // 1:30 o'clock
      { top: -20, left: 40 }, // 3 o'clock
      { top: 20, left: 40 }, // 4:30 o'clock
      { top: 45, left: 23 }, // 6 o'clock (Bottom right)
      { top: 50, left: 0 }, // 6:30 o'clock (Bottom center)
      { top: 45, left: -23 }, // 7:30 o'clock (Bottom left)
      { top: 20, left: -40 }, // 9 o'clock
      { top: -20, left: -40 }, // 10:30 o'clock
      { top: -47, left: -23 }, // 11:30 o'clock
    ],
    11: [
      // 11 players - 4 on top symmetrically
      { top: -47, left: 12 }, // 1 o'clock (Top center right)
      { top: -42, left: 32 }, // 2 o'clock (Top far right)
      { top: -20, left: 40 }, // 3 o'clock (Right upper)
      { top: 20, left: 40 }, // 4 o'clock (Right lower)
      { top: 45, left: 23 }, // 5 o'clock (Bottom right)
      { top: 45, left: 0 }, // 6 o'clock (Bottom center)
      { top: 45, left: -23 }, // 7 o'clock (Bottom left)
      { top: 18, left: -40 }, // 8 o'clock (Left lower)
      { top: -18, left: -40 }, // 9 o'clock (Left upper)
      { top: -42, left: -32 }, // 10:30 o'clock (Top far left)
      { top: -47, left: -12 }, // 11 o'clock (Top center)
    ],
    12: [
      // 12 players - 4 on top and 4 on bottom symmetrically
      { top: -47, left: 12 }, // 1:00 o'clock (Top center right)
      { top: -42, left: 35 }, // 2:00 o'clock (Top far right)
      { top: -20, left: 45 }, // 3:00 o'clock (Right upper)
      { top: 20, left: 45 }, // 4:30 o'clock (Right lower)
      { top: 42, left: 35 }, // 5:30 o'clock (Bottom far right)
      { top: 47, left: 12 }, // 6:00 o'clock (Bottom center right)
      { top: 47, left: -12 }, // 6:30 o'clock (Bottom center left)
      { top: 42, left: -35 }, // 7:30 o'clock (Bottom far left)
      { top: 20, left: -45 }, // 9:00 o'clock (Left lower)
      { top: -20, left: -45 }, // 10:30 o'clock (Left upper)
      { top: -42, left: -35 }, // 11:00 o'clock (Top far left)
      { top: -47, left: -12 }, // 12:00 o'clock (Top center)
    ],
  };

  return positions[numPlayers] || [];
};

const WideDisplayNewPage = () => {
  // Example players array - replace with your actual data
  const players = [
    { id: 1, name: "player 1" },
    { id: 2, name: "Player 2" },
    { id: 3, name: "Player 3" },
    { id: 4, name: "Player 4" },
    { id: 5, name: "Player 5" },
    { id: 6, name: "Player 6" },
    { id: 7, name: "Player 7" },
    { id: 8, name: "Player 8" },
    { id: 9, name: "Player 9" },
    { id: 10, name: "Player 10" },
    { id: 11, name: "Player 11" },
    { id: 12, name: "Player 12" },
    // ... add more players as needed
  ];

  const positions = getPlayerPositions(players.length);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[70vw] h-[60vh] relative">
        {/* Table Image in the center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
          <img
            src={tableHoriz}
            alt="Table"
            className="w-full h-full object-contain"
          />

          {/* Players */}
          {players.map((player, index) => {
            const position = positions[index];
            return (
              <div
                key={player.id}
                className="absolute w-28 h-28 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
                style={{
                  top: `calc(50% + ${position.top}%)`,
                  left: `calc(50% + ${position.left}%)`,
                }}
              >
                {/* Calculate number position based on player position */}
                <div
                  className={`absolute ${
                    // Top players (position.top < -20)
                    position.top < -20
                      ? "-top-12 left-1/2 -translate-x-1/2"
                      : // Bottom players (position.top > 20)
                      position.top > 20
                      ? "top-full left-1/2 -translate-x-1/2 mt-8"
                      : // Left side players (position.left < -20)
                      position.left < -20
                      ? "top-1/2 -left-12 -translate-y-1/2"
                      : // Right side players (position.left > 20)
                        "top-1/2 left-full translate-x-2 -translate-y-1/2"
                  }`}
                >
                  <div className="relative w-10 h-10">
                    {/* Outer ring */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-xl border-2 border-yellow-300"></div>
                    {/* Inner circle */}
                    <div className="absolute inset-0.5 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                      <span
                        className="text-2xl font-bold text-yellow-300 font-casino"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                      >
                        4
                      </span>
                    </div>
                  </div>
                </div>
                <img
                  src={
                    "https://res.cloudinary.com/dmvedaa06/image/upload/v1753293773/kejtl1qhyqsbreqymohp.png"
                  }
                  alt={player.name}
                  className="w-28 h-28 object-contain"
                />
                <div className="mt-2 px-3 py-1 bg-white/90 rounded-lg shadow-lg backdrop-blur-sm">
                  <span
                    className="text-lg font-heebo font-bold text-slate-800"
                    style={{ fontFamily: "Rubik, sans-serif" }}
                  >
                    שגיא בלכר
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WideDisplayNewPage;
