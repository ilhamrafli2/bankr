export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.BANKR_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "BANKR_API_KEY belum dipasang di Vercel.",
    });
  }

  const { tokens, simulateOnly = true } = req.body || {};

  if (!Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({
      error: "Tidak ada token yang dikirim.",
    });
  }

  if (tokens.length > 50) {
    return res.status(400).json({
      error: "Maksimal 50 token per batch.",
    });
  }

  const results = [];

  // Deploy satu per satu agar tidak membanjiri API Bankr.
  for (const token of tokens) {
    if (!token.name || !token.name.trim()) {
      results.push({
        name: token.name || "",
        success: false,
        error: "Token name wajib diisi.",
      });
      continue;
    }

    if (token.symbol && token.symbol.length > 10) {
      results.push({
        name: token.name,
        success: false,
        error: "Symbol maksimal 10 karakter.",
      });
      continue;
    }

    try {
      const body = {
        tokenName: token.name.trim(),
        tokenSymbol: token.symbol
          ? token.symbol.trim().toUpperCase()
          : undefined,
        chain: token.chain === "base" ? "base" : "robinhood",
        simulateOnly: Boolean(simulateOnly),
      };

      const response = await fetch(
        "https://api.bankr.bot/token-launches/deploy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json().catch(() => ({}));

      results.push({
        name: token.name,
        symbol: token.symbol,
        success: response.ok,
        status: response.status,
        ...data,
      });
    } catch (error) {
      results.push({
        name: token.name,
        symbol: token.symbol,
        success: false,
        error: error.message,
      });
    }
  }

  return res.status(200).json({
    simulateOnly: Boolean(simulateOnly),
    count: results.length,
    results,
  });
}
