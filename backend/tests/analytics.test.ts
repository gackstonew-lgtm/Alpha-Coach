describe('Quantitative Trading Performance Math & Analytics', () => {
  it('should accurately calculate Win Rate and Loss Rate', () => {
    const totalTrades = 100;
    const winningTrades = 65;
    const losingTrades = 35;

    const winRate = parseFloat(((winningTrades / totalTrades) * 100).toFixed(2));
    const lossRate = parseFloat(((losingTrades / totalTrades) * 100).toFixed(2));

    expect(winRate).toBe(65.00);
    expect(lossRate).toBe(35.00);
    expect(winRate + lossRate).toBe(100.00);
  });

  it('should accurately calculate Profit Factor (Gross Profit / Gross Loss)', () => {
    const grossProfit = 12500.50;
    const grossLoss = 6250.25;

    const profitFactor = parseFloat((grossProfit / grossLoss).toFixed(2));
    expect(profitFactor).toBe(2.00);
  });

  it('should accurately calculate Mathematical Expectancy', () => {
    const winRate = 0.60;
    const lossRate = 0.40;
    const avgWin = 250.0;
    const avgLoss = 150.0;

    // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
    const expectancy = parseFloat(((winRate * avgWin) - (lossRate * avgLoss)).toFixed(2));
    expect(expectancy).toBe(90.00);
  });

  it('should calculate Peak-to-Trough Drawdown on Equity Curve', () => {
    const equitySeries = [10000, 10500, 11000, 10200, 9800, 10800, 11500];
    let peak = equitySeries[0];
    let maxDdAmount = 0;
    let maxDdPct = 0;

    for (const eq of equitySeries) {
      if (eq > peak) peak = eq;
      const ddAmount = peak - eq;
      const ddPct = (ddAmount / peak) * 100;
      if (ddAmount > maxDdAmount) maxDdAmount = ddAmount;
      if (ddPct > maxDdPct) maxDdPct = ddPct;
    }

    expect(maxDdAmount).toBe(1200); // 11000 down to 9800
    expect(parseFloat(maxDdPct.toFixed(2))).toBe(10.91); // 1200 / 11000 * 100
  });

  it('should accurately calculate consecutive win/loss streaks', () => {
    const results = [1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1]; // 3 wins, 2 losses, 1 win, 4 losses, 1 win
    let maxWins = 0, currWins = 0;
    let maxLosses = 0, currLosses = 0;

    for (const res of results) {
      if (res > 0) {
        currWins++;
        currLosses = 0;
        if (currWins > maxWins) maxWins = currWins;
      } else {
        currLosses++;
        currWins = 0;
        if (currLosses > maxLosses) maxLosses = currLosses;
      }
    }

    expect(maxWins).toBe(3);
    expect(maxLosses).toBe(4);
  });
});
