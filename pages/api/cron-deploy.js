export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;

  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (process.env.AUTO_DEPLOY_ENABLED !== "true") {
    return res.status(200).json({
      ok: true,
      message: "Auto deployment disabled",
    });
  }

  const apiKey = process.env.BANKR_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "BANKR_API_KEY belum dipasang",
    });
  }

  try {
    const newsResponse = await fetch(
      "https://news.google.com/rss/search?q=crypto%20OR%20bitcoin%20OR%20ethereum&hl=en-US&gl=US&ceid=US:en"
    );

    const xml = await newsResponse.text();

    const titles = [...xml.matchAll(/<title>(.*?)<\/title>/g)]
      .map((x) =>
        x[1]
          .replace(/<!\[CDATA\[/g, "")
          .replace(/\]\]>/g, "")
          .trim()
      )
      .filter((x) => x && x !== "Google News");

    if (!titles.length) {
      throw new Error("Tidak menemukan berita");
    }

    const news = titles[Math.floor(Math.random() * titles.length)];

    const words = news
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((x) => x.length >= 3)
      .slice(0, 3);

    const random = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

    const tokenName = `${words.join(" ") || "Crypto News"} ${random}`
      .substring(0, 100);

    const tokenSymbol = `N${random}`.substring(0, 10);

    const deploy = await fetch(
      "https://api.bankr.bot/token-launches/deploy",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": apiKey
        },
        body: JSON.stringify({
          tokenName,
          tokenSymbol,
          description: `Token inspired by current crypto news: ${news}`,
          chain: "robinhood",
          simulateOnly: false
        })
      }
    );

    const result = await deploy.json();

    return res.status(deploy.ok ? 200 : deploy.status).json({
      ok: deploy.ok,
      tokenName,
      tokenSymbol,
      chain: "robinhood",
      news,
      result
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
