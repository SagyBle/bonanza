export function minimalSettlement(playersData) {
  /**
   * playersData = [
   *   { user: "marko",   buy_ins: 3, final_value: 0   },
   *   { user: "yuval",   buy_ins: 4, final_value: 0   },
   *   ...
   * ]
   *
   * - "buy_ins" is how many times they joined; each costs 50.
   *   So total money invested = buy_ins * 50.
   * - "final_value" is how much they ended up with.
   *
   * Returns an array of transactions:
   *   [ [debtorName, creditorName, amount], ... ]
   *
   * Guaranteed minimal # of pairwise transactions (Optimal Account Balancing).
   */

  // Build arrays from the data

  const players = playersData.map((d) => d.user);
  const buyIns = playersData.map((d) => d.buy_ins * 100);
  const finals = playersData.map((d) => d.final_value);

  // 1) Compute net for each player: net[i] = finals[i] - buyIns[i]
  const net = players.map((_, i) => finals[i] - buyIns[i]);

  console.log({ net });

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

    // If we've gone past the last index, everything is settled
    if (start >= amts.length) {
      const res = [0, []];
      memo.set(key, res);
      return res;
    }

    // If there's exactly one leftover
    if (start === amts.length - 1) {
      // if non-zero => can't settle => no solution
      if (amts[start] !== 0) {
        const res = [Infinity, []];
        memo.set(key, res);
        return res;
      } else {
        // It's zero => no more transactions needed
        const res = [0, []];
        memo.set(key, res);
        return res;
      }
    }

    let bestCount = Infinity;
    let bestPath = [];

    // Try pairing amts[start] with each subsequent amts[j] if they have opposite signs
    for (let j = start + 1; j < amts.length; j++) {
      // only pair if opposite signs
      if (amts[start] * amts[j] < 0) {
        const origI = amts[start];
        const origJ = amts[j];
        const payment = Math.min(Math.abs(origI), Math.abs(origJ));

        // The sum after paying each other
        const sum = origI + origJ;

        // CASE 1: |origI| > |origJ| => j is fully settled, i has leftover
        // CASE 2: |origI| < |origJ| => i is fully settled, j has leftover
        // CASE 3: equal => both zero
        if (Math.abs(origI) > Math.abs(origJ)) {
          amts[start] = sum; // leftover
          amts[j] = 0; // fully settled
        } else if (Math.abs(origI) < Math.abs(origJ)) {
          amts[start] = 0;
          amts[j] = sum; // leftover
        } else {
          // same absolute value => both zero
          amts[start] = 0;
          amts[j] = 0;
        }

        const [subCount, subPath] = dfs(amts);

        // Build the transaction record
        const thisTx = buildTransaction(idxMap, start, j, origI, payment);
        const candidateCount = 1 + subCount;
        const candidatePath = [thisTx, ...subPath];

        if (candidateCount < bestCount) {
          bestCount = candidateCount;
          bestPath = candidatePath;
        }

        // revert
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
    /*
        If amtI < 0 => the player at 'i' is the debtor
        If amtI > 0 => the player at 'j' is the debtor
      */
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
    // No valid solution => likely mismatch in total buy-ins vs. final sums
    return [];
  }

  // Filter out any zero-amount edges
  return path.filter((tx) => tx[2] !== 0);
}

function validateTransactions(playersData, transactions) {
  /*
   * We'll compute the net array: net[i] = final_value - (buy_ins * 50).
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
  const net = playersData.map((d) => d.final_value - d.buy_ins * 50);

  // Apply transactions
  transactions.forEach(([debtor, creditor, amt]) => {
    const dIdx = nameToIndex[debtor];
    const cIdx = nameToIndex[creditor];
    net[dIdx] += amt;
    net[cIdx] -= amt;
  });

  // Check if all zero
  return net.every((n) => n === 0);
}

// const testCases = [
//   {
//     description: "Case 1 - Example from question",
//     data: [
//       { user: "marko", buy_ins: 3, final_value: 0 }, // invests 3*50=150
//       { user: "yuval", buy_ins: 4, final_value: 0 }, // invests 200
//       { user: "yahalom", buy_ins: 2, final_value: 100 }, // invests 100
//       { user: "sasson", buy_ins: 3, final_value: 150 }, // invests 150
//       { user: "bachar", buy_ins: 2, final_value: 0 }, // invests 100
//       { user: "tayeb", buy_ins: 4, final_value: 50 }, // invests 200
//       { user: "bartal", buy_ins: 3, final_value: 175 }, // invests 150
//       { user: "bitton", buy_ins: 2, final_value: 325 }, // invests 100
//       { user: "blecher", buy_ins: 1, final_value: 500 }, // invests 50
//       { user: "koren", buy_ins: 2, final_value: 0 }, // invests 100
//     ],
//   },
//   {
//     description: "Case 2 - Simple 3-player test",
//     data: [
//       // invests 50, ends 0 => net -50
//       { user: "Alice", buy_ins: 1, final_value: 0 },
//       // invests 50, ends 25 => net -25
//       { user: "Bob", buy_ins: 1, final_value: 25 },
//       // invests 50, ends 75 => net +25
//       { user: "Charlie", buy_ins: 1, final_value: 125 },
//     ],
//   },
//   {
//     description: "Case 3 - Everyone zero net",
//     data: [
//       // invests 100, ends 100 => net 0
//       { user: "Foo", buy_ins: 2, final_value: 100 },
//       // invests 150, ends 150 => net 0
//       { user: "Bar", buy_ins: 3, final_value: 150 },
//     ],
//   },
//   {
//     description: "Case 4 - 4 players (2 owe, 2 are owed)",
//     data: [
//       // invests 50, ends 0 => net -50
//       { user: "A", buy_ins: 1, final_value: 0 },

//       // invests 50, ends 25 => net -25
//       { user: "B", buy_ins: 1, final_value: 25 },

//       // invests 50, ends 50 => net 0
//       { user: "C", buy_ins: 1, final_value: 75 },

//       // invests 50, ends 100 => net +50
//       { user: "D", buy_ins: 1, final_value: 100 },
//     ],
//   },
// ];

// function runAllTests() {
//   testCases.forEach(({ description, data }, idx) => {
//     console.log("=============================================");
//     console.log(`Test #${idx + 1}: ${description}\n`);

//     const txs = minimalSettlement(data);
//     txs.forEach(([debtor, creditor, amt]) => {
//       console.log(`  ${debtor} pays ${creditor} => ${amt}`);
//     });

//     const valid = validateTransactions(data, txs);
//     console.log(`\nNumber of transactions: ${txs.length}`);
//     console.log(`Valid Settlement?  ${valid}\n`);
//   });
// }

// runAllTests();
