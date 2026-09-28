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

  describe('Seeded Deterministic Trades Benchmark Test', () => {
    // Seeded fixture dataset of 10 trades
    const seededTrades = [
      { id: '1', symbol: 'EURUSD', net_profit: 300.0, gross_profit: 310.0, commission: -10.0, r_multiple: 2.0, holding_seconds: 3600, status: 'CLOSED', position_type: 'BUY' },
      { id: '2', symbol: 'GBPUSD', net_profit: -150.0, gross_profit: -140.0, commission: -10.0, r_multiple: -1.0, holding_seconds: 1800, status: 'CLOSED', position_type: 'SELL' },
      { id: '3', symbol: 'XAUUSD', net_profit: 450.0, gross_profit: 465.0, commission: -15.0, r_multiple: 3.0, holding_seconds: 7200, status: 'CLOSED', position_type: 'BUY' },
      { id: '4', symbol: 'USDJPY', net_profit: 150.0, gross_profit: 160.0, commission: -10.0, r_multiple: 1.0, holding_seconds: 2400, status: 'CLOSED', position_type: 'BUY' },
      { id: '5', symbol: 'EURUSD', net_profit: -150.0, gross_profit: -140.0, commission: -10.0, r_multiple: -1.0, holding_seconds: 900, status: 'CLOSED', position_type: 'SELL' },
      { id: '6', symbol: 'NAS100', net_profit: 600.0, gross_profit: 620.0, commission: -20.0, r_multiple: 4.0, holding_seconds: 5400, status: 'CLOSED', position_type: 'BUY' },
      { id: '7', symbol: 'US30',   net_profit: -300.0, gross_profit: -285.0, commission: -15.0, r_multiple: -2.0, holding_seconds: 3000, status: 'CLOSED', position_type: 'SELL' },
      { id: '8', symbol: 'XAUUSD', net_profit: 0.0,    gross_profit: 10.0,   commission: -10.0, r_multiple: 0.0,  holding_seconds: 1200, status: 'CLOSED', position_type: 'BUY' },
      { id: '9', symbol: 'GBPUSD', net_profit: 225.0, gross_profit: 235.0, commission: -10.0, r_multiple: 1.5, holding_seconds: 4000, status: 'CLOSED', position_type: 'BUY' },
      { id: '10', symbol: 'EURUSD', net_profit: -150.0, gross_profit: -140.0, commission: -10.0, r_multiple: -1.0, holding_seconds: 1500, status: 'CLOSED', position_type: 'SELL' },
    ];

    it('should compute exact seeded trade counts, win rate, and loss rate', () => {
      const totalTrades = seededTrades.length;
      const winning = seededTrades.filter(t => t.net_profit > 0).length;
      const losing = seededTrades.filter(t => t.net_profit < 0).length;
      const breakeven = seededTrades.filter(t => t.net_profit === 0).length;

      expect(totalTrades).toBe(10);
      expect(winning).toBe(5);
      expect(losing).toBe(4);
      expect(breakeven).toBe(1);

      const winRate = parseFloat(((winning / totalTrades) * 100).toFixed(2));
      const lossRate = parseFloat(((losing / totalTrades) * 100).toFixed(2));

      expect(winRate).toBe(50.00);
      expect(lossRate).toBe(40.00);
    });

    it('should compute exact gross profit, gross loss, net profit, and profit factor', () => {
      const grossProfit = seededTrades.filter(t => t.net_profit > 0).reduce((s, t) => s + t.gross_profit, 0);
      const grossLoss = Math.abs(seededTrades.filter(t => t.net_profit < 0).reduce((s, t) => s + t.gross_profit, 0));
      const netProfit = seededTrades.reduce((s, t) => s + t.net_profit, 0);

      // Gross profit = 310 + 465 + 160 + 620 + 235 = 1790
      expect(grossProfit).toBe(1790.0);
      // Gross loss = |-140 + -140 + -285 + -140| = 705
      expect(grossLoss).toBe(705.0);
      // Net profit = 300 - 150 + 450 + 150 - 150 + 600 - 300 + 0 + 225 - 150 = 975
      expect(netProfit).toBe(975.0);

      const profitFactor = parseFloat((grossProfit / grossLoss).toFixed(2));
      expect(profitFactor).toBe(2.54); // 1790 / 705 = 2.5390 -> 2.54
    });

    it('should compute exact average R-multiple and mathematical expectancy', () => {
      const totalR = seededTrades.reduce((s, t) => s + t.r_multiple, 0);
      const avgR = parseFloat((totalR / seededTrades.length).toFixed(2));
      // Total R: 2.0 - 1.0 + 3.0 + 1.0 - 1.0 + 4.0 - 2.0 + 0 + 1.5 - 1.0 = 6.5
      expect(totalR).toBe(6.5);
      expect(avgR).toBe(0.65); // 6.5 / 10 = 0.65

      // Average Win & Average Loss
      const winning = seededTrades.filter(t => t.net_profit > 0);
      const losing = seededTrades.filter(t => t.net_profit < 0);
      const avgWin = parseFloat((winning.reduce((s, t) => s + t.gross_profit, 0) / winning.length).toFixed(2));
      const avgLoss = parseFloat((Math.abs(losing.reduce((s, t) => s + t.gross_profit, 0)) / losing.length).toFixed(2));

      expect(avgWin).toBe(358.0); // 1790 / 5
      expect(avgLoss).toBe(176.25); // 705 / 4

      const winRate = winning.length / seededTrades.length;
      const lossRate = losing.length / seededTrades.length;
      const expectancy = parseFloat(((winRate * avgWin) - (lossRate * avgLoss)).toFixed(2));
      // (0.5 * 358) - (0.4 * 176.25) = 179 - 70.5 = 108.5
      expect(expectancy).toBe(108.5);
    });

    it('should calculate peak-to-trough drawdown accurately across the seeded equity sequence', () => {
      let balance = 10000;
      let peak = balance;
      let maxDd = 0;
      let maxDdPct = 0;

      for (const t of seededTrades) {
        balance += t.net_profit;
        if (balance > peak) peak = balance;
        const dd = peak - balance;
        const ddPct = (dd / peak) * 100;
        if (dd > maxDd) maxDd = dd;
        if (ddPct > maxDdPct) maxDdPct = ddPct;
      }

      // Final balance = 10000 + 975 = 10975
      expect(balance).toBe(10975);
      // Let's trace peak & DD:
      // Start: 10000
      // 1: +300 -> 10300 (peak 10300, dd 0)
      // 2: -150 -> 10150 (peak 10300, dd 150)
      // 3: +450 -> 10600 (peak 10600, dd 0)
      // 4: +150 -> 10750 (peak 10750, dd 0)
      // 5: -150 -> 10600 (peak 10750, dd 150)
      // 6: +600 -> 11200 (peak 11200, dd 0)
      // 7: -300 -> 10900 (peak 11200, dd 300)
      // 8: 0    -> 10900 (peak 11200, dd 300)
      // 9: +225 -> 11125 (peak 11200, dd 75)
      // 10: -150 -> 10975 (peak 11200, dd 225)
      expect(maxDd).toBe(300);
      expect(parseFloat(maxDdPct.toFixed(2))).toBe(2.68); // 300 / 11200 = 2.678%
    });
  });
});
