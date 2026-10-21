export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) return res.status(500).json({ error: "Telegram 環境變數未設定" });

  // 避免客人輸入的文字破壞 HTML 格式
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    const { items = [], total = 0, note = "", orderId = "", phone = "", pickup = "", preorder = false } = req.body || {};
    if (!items.length) return res.status(400).json({ error: "訂單沒有品項" });

    const lines = [];
    lines.push(preorder ? `📅 <b>預訂訂單 #${esc(orderId)}</b>` : `🆕 <b>新訂單 #${esc(orderId)}</b>`);
    lines.push(`🕒 取餐：<b>${esc(pickup)}</b>`);
    lines.push(`📞 電話：${esc(phone)}`);
    lines.push("──────────");
    for (const it of items) {
      const unit = (it.price || 0) + (it.addonPrice || 0);
      lines.push(`• ${esc(it.name)} x${it.qty}　$${unit * it.qty}`);
      if (it.sauce) lines.push(`　醬料：${esc(it.sauce)}`);
      if (it.addons) lines.push(`　加購：${esc(it.addons)}`);
    }
    lines.push("──────────");
    lines.push(`💰 合計：<b>$${total}</b>`);
    if (note && note.trim()) lines.push(`📝 備註：${esc(note.trim())}`);

    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: lines.join("\n"), parse_mode: "HTML" })
    });
    const d = await r.json();
    // 傳送失敗要回錯誤，網頁才會提醒客人重送
    if (!r.ok || !d.ok) return res.status(502).json({ error: d.description || "Telegram 傳送失敗" });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
