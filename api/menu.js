export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = "sdivr999/food-order-api";
  const FILE = "data/menu.json";
  const API = "https://api.github.com/repos/"+REPO+"/contents/"+FILE;

  if (req.method === "GET") {
    const r = await fetch(API, { headers: { Authorization: "Bearer "+GITHUB_TOKEN, "User-Agent": "food-order-app" }});
    const d = await r.json();
    const content = JSON.parse(Buffer.from(d.content, "base64").toString("utf8"));
    return res.status(200).json({ menu: content, sha: d.sha });
  }

  if (req.method === "PUT") {
    const { menu, sha } = req.body;
    const content = Buffer.from(JSON.stringify(menu, null, 2)).toString("base64");
    const r = await fetch(API, {
      method: "PUT",
      headers: { Authorization: "Bearer "+GITHUB_TOKEN, "Content-Type": "application/json", "User-Agent": "food-order-app" },
      body: JSON.stringify({ message: "Update menu", content, sha })
    });
    const d = await r.json();
    return res.status(200).json({ success: true, sha: d.content.sha });
  }

  res.status(405).json({ error: "Method not allowed" });
}
