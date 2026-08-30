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
      message: "Auto deployment disabled"
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Cron berjalan",
    chain: "robinhood"
  });
}
