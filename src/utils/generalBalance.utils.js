export function generalMinimalSettlement(playersData) {
  /**
   * playersData = [
   *   { user: "marko",   amountPaid: 3, amountDue: 0   },
   *   { user: "yuval",   amountPaid: 4, amountDue: 0   },
   *   ...
   * ]
   *
   * - "amountPaid" is the total money they invested.
   * - "amountDue" is how much they ended up with.
   *
   * Returns an array of transactions:
   *   [ [debtorName, creditorName, amount], ... ]
   *
   * Guaranteed minimal # of pairwise transactions (Optimal Account Balancing).
   */

  // Build arrays from the data
  const players = playersData.map((d) => d.user);
  const amountPaid = playersData.map((d) => d.amountPaid);
  const amountDue = playersData.map((d) => d.amountDue);

  // 1) Compute net for each player: net[i] = amountDue[i] - amountPaid[i]
  const net = players.map((_, i) => amountDue[i] - amountPaid[i]);

  // 2) Build a list of (index, amount), ignoring zeros
  const balances = [];
  net.forEach((val, i) => {
    if (val !== 0) {
      balances.push([i, val]);
    }
  });

  // If no debts/credits, nothing to do
  if (balances.length === 0) {
    return [];
  }

  // We'll store these for reference in the DFS
  const idxMap = balances.map((b) => b[0]); // original player index
  const amounts = balances.map((b) => b[1]); // net amounts (+ or -)

  // A memo (cache) for our DFS
  const memo = new Map();

  // DFS function that returns [minCount, transactions[]]
  function dfs(state) {
    const key = JSON.stringify(state);
    if (memo.has(key)) {
      return memo.get(key);
    }

    // Copy state to manipulate
    const amts = state.slice();

    // Skip leading zeros
    let start = 0;
    while (start < amts.length && amts[start] === 0) {
      start++;
    }

    // If everything is settled
    if (start >= amts.length) {
      const res = [0, []];
      memo.set(key, res);
      return res;
    }

    let bestCount = Infinity;
    let bestPath = [];

    // Try pairing amts[start] with each subsequent amts[j] if they have opposite signs
    for (let j = start + 1; j < amts.length; j++) {
      if (amts[start] * amts[j] < 0) {
        const origI = amts[start];
        const origJ = amts[j];
        const payment = Math.min(Math.abs(origI), Math.abs(origJ));

        const sum = origI + origJ;
        if (Math.abs(origI) > Math.abs(origJ)) {
          amts[start] = sum; // leftover
          amts[j] = 0; // fully settled
        } else if (Math.abs(origI) < Math.abs(origJ)) {
          amts[start] = 0;
          amts[j] = sum; // leftover
        } else {
          amts[start] = 0;
          amts[j] = 0;
        }

        const [subCount, subPath] = dfs(amts);
        const thisTx = buildTransaction(idxMap, start, j, origI, payment);
        const candidateCount = 1 + subCount;
        const candidatePath = [thisTx, ...subPath];

        if (candidateCount < bestCount) {
          bestCount = candidateCount;
          bestPath = candidatePath;
        }

        amts[start] = origI;
        amts[j] = origJ;
      }
    }

    const result = [bestCount, bestPath];
    memo.set(key, result);
    return result;
  }

  // Helper to build a transaction (debtor, creditor, amount)
  function buildTransaction(idxMap, i, j, amtI, payment) {
    let debtorIndex, creditorIndex;
    if (amtI < 0) {
      debtorIndex = idxMap[i];
      creditorIndex = idxMap[j];
    } else {
      debtorIndex = idxMap[j];
      creditorIndex = idxMap[i];
    }

    return [players[debtorIndex], players[creditorIndex], payment];
  }

  // Run DFS on the initial amounts
  const [bestCount, path] = dfs(amounts);

  if (bestCount === Infinity) {
    return [];
  }

  return path.filter((tx) => tx[2] !== 0);
}

// ---------------------------------------------------------
// 2) A checker function to validate correctness
// ---------------------------------------------------------
function validateTransactions(playersData, transactions) {
  /*
   * We'll compute the net array: net[i] = amountDue[i] - amountPaid[i].
   * Then for each transaction (debtor, creditor, amount):
   *   net[debtorIndex]   += amount
   *   net[creditorIndex] -= amount
   * If at the end all net[i] == 0, it's valid.
   */

  // Build name->index map
  const nameToIndex = {};
  playersData.forEach((d, i) => {
    nameToIndex[d.user] = i;
  });

  // net[i]
  const net = playersData.map((d) => d.amountDue - d.amountPaid);

  // Apply transactions
  transactions.forEach(([debtor, creditor, amt]) => {
    const dIdx = nameToIndex[debtor];
    const cIdx = nameToIndex[creditor];
    net[dIdx] += amt;
    net[cIdx] -= amt;
  });

  return net.every((n) => n === 0);
}

// ---------------------------------------------------------
// 3) Example test cases
// ---------------------------------------------------------
const testCases = [
  {
    description: "Simple 3-player test",
    data: [
      { user: "Alice", amountPaid: 100, amountDue: 0 },
      { user: "Bob", amountPaid: 0, amountDue: 100 },
      { user: "Charlie", amountPaid: 0, amountDue: 0 },
    ],
  },
  {
    description: "4 players (2 owe, 2 are owed)",
    data: [
      { user: "A", amountPaid: 900, amountDue: 0 },
      { user: "B", amountPaid: 0, amountDue: 150 },
      { user: "C", amountPaid: 0, amountDue: 600 },
      { user: "D", amountPaid: 0, amountDue: 150 },
    ],
  },
];
