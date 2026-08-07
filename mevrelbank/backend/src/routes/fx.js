// ─── GET /api/fx/rates ────────────────────────────────────────────────────────
// Returns the bank's daily buy/sell rates for supported currencies relative to USD.
// Rates are deterministically generated from today's date (no external API needed).
// A small spread is applied: sell > mid > buy (bank sells foreign currency more
// expensive, buys it cheaper — standard FX desk convention).

const express = require('express');
const router = express.Router();

// Approximate mid-market bases (USD as home currency)
// e.g. EUR/USD mid ≈ 1.08, meaning 1 EUR costs $1.08
const BASE_RATES = {
  USD: 1.0000,
  EUR: 1.0820,
  GBP: 1.2710,
  CAD: 0.7380,
  CHF: 1.1250,
  JPY: 0.006620,
  AUD: 0.6510,
};

const SPREAD_PCT = 0.018; // 1.8% spread — typical retail FX spread

// Generate a small daily drift so rates change day-to-day but stay stable within a day.
// Drift is seeded by the calendar date so two requests on the same day return identical rates.
function dailyDrift(currency, today) {
  // Simple hash: sum of date digits * currency char codes
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  let seed = 0;
  for (const ch of dateStr + currency) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  // Produce a drift between -1.2% and +1.2%
  const drift = ((seed % 2400) - 1200) / 100000; // [-0.012, +0.012]
  return drift;
}

router.get('/rates', (req, res) => {
  const today = new Date();

  const rates = {};
  for (const [code, base] of Object.entries(BASE_RATES)) {
    if (code === 'USD') continue;
    const mid = base * (1 + dailyDrift(code, today));
    rates[code] = {
      code,
      mid: parseFloat(mid.toFixed(6)),
      // Bank sell: customer pays more to buy foreign currency
      sell: parseFloat((mid * (1 + SPREAD_PCT / 2)).toFixed(6)),
      // Bank buy: customer receives less when selling foreign currency
      buy: parseFloat((mid * (1 - SPREAD_PCT / 2)).toFixed(6)),
    };
  }

  return res.json({
    base: 'USD',
    date: today.toISOString().slice(0, 10),
    rates,
  });
});

module.exports = router;
