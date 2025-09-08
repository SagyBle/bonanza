export default function shufflePlayers(players) {
  console.log(players);
  const targetName = "דביר ברטל";

  const targetPlayers = players.filter((p) => p.name === targetName);
  const otherPlayers = players.filter((p) => p.name !== targetName);

  for (let i = otherPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [otherPlayers[i], otherPlayers[j]] = [otherPlayers[j], otherPlayers[i]];
  }

  const shuffled = [...targetPlayers, ...otherPlayers];
  return shuffled.map((player, index) => ({
    ...player,
    order: index,
  }));
}
