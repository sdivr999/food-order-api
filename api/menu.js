export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-password");
  if (req.method === "OPTIONS") return res.status(200).end();

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const REPO = "sdivr999/food-order-api";
  const FILE = "data/menu.json";
  const API = "https://api.github.com/repos/" + REPO + "/contents/" + FILE;
  const GH_HEADERS = { Authorization: "Bearer " + GITHUB_TOKEN, "User-Agent": "food-order-app" };

  try {
    // 管理密碼驗證（密碼只存在 Vercel 環境變數）
    if (req.method === "POST") {
      const { password } = req.body || {};
      return res.status(200).json({ ok: !!ADMIN_PASSWORD && password === ADMIN_PASSWORD });
    }

    if (req.method === "GET") {
      const r = await fetch(API, { headers: GH_HEADERS, cache: "no-store" });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d.message || "讀取失敗" });
      const content = JSON.parse(Buffer.from(d.content, "base64").toString("utf8"));
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ menu: content, sha: d.sha });
    }

    if (req.method === "PUT") {
      if (!ADMIN_PASSWORD || req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "密碼錯誤" });
      }
      const { menu, sha } = req.body || {};
      if (!menu) return res.status(400).json({ error: "缺少菜單資料" });
      const content = Buffer.from(JSON.stringify(menu, null, 2)).toString("base64");
      const r = await fetch(API, {
        method: "PUT",
        headers: { ...GH_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Update menu", content, sha })
      });
      const d = await r.json();
      // 409 = 菜單已被其他裝置改過，網頁會提示重新整理
      if (!r.ok) return res.status(r.status).json({ error: d.message || "儲存失敗" });
      return res.status(200).json({ success: true, sha: d.content.sha });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
