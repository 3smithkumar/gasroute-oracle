const { Hono } = require("hono");
const app = new Hono();
const gasData = {
  ethereum: { gweiPrice: 15, usdPrice: 0.85, congestion: "low", native: "ETH", usdRate: 3200 },
  base: { gweiPrice: 1.2, usdPrice: 0.04, congestion: "low", native: "ETH", usdRate: 3200 },
  solana: { gweiPrice: 0.0005, usdPrice: 0.002, congestion: "low", native: "SOL", usdRate: 145 },
  polygon: { gweiPrice: 85, usdPrice: 0.12, congestion: "medium", native: "MATIC", usdRate: 0.72 },
  arbitrum: { gweiPrice: 2.5, usdPrice: 0.08, congestion: "low", native: "ETH", usdRate: 3200 },
  optimism: { gweiPrice: 1.8, usdPrice: 0.06, congestion: "low", native: "ETH", usdRate: 3200 }
};
app.get("/health", (c) => c.json({ status: "ok", agent: "gasroute-oracle" }));
app.post("/best-route", async (c) => {
  try {
    const body = await c.req.json();
    const results = {};
    let bestChain = "", bestFee = Infinity;
    for (const chain of (body.chain_set || [])) {
      const g = gasData[chain.toLowerCase()];
      if (!g) continue;
      const fee = (g.gweiPrice * (body.gas_units_est || 21000) * g.usdRate) / 1e9;
      results[chain] = { fee_usd: Math.round(fee * 100) / 100, native: g.native, congestion: g.congestion };
      if (fee < bestFee) { bestChain = chain; bestFee = fee; }
    }
    return c.json({ recommended_chain: bestChain, all_routes: results, timestamp: new Date().toISOString() });
  } catch (e) { return c.json({ error: e.message }, 400); }
});
module.exports = app;
