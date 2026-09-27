module.exports = function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(
    `window.SUPABASE_CONFIG=${JSON.stringify({ url, key })};`
  );
};
