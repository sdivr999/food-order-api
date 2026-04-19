export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { items, total, note, orderId, phone, pickup } = req.body;
  const itemList = items.map(i => {
    var line = "• " + i.name;
    if (i.sauce) line += "（" + i.sauce + "）";
    if (i.addons) line += "（加購：" + i.addons + "）";
    line += " × " + i.qty + "（$" + ((i.price + (i.addonPrice||0)) * i.qty) + "）";
    return line;
  }).join("\n");
  const message = `🔔 新訂單通知！\n\n📋 訂單編號：#${orderId}\n📞 聯絡電話：${phone || "未填寫"}\n⏰ 取餐時間：${pickup || "未選擇"}\n${"─".repeat(20)}\n${itemList}\n${"─".repeat(20)}\n💰 合計：$${total}${note ? `\n📝 備註：${note}` : ""}\n\n請盡快確認！`;

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: process.env.LINE_USER_ID,
        messages: [{ type: "text", text: message }],
      }),
    });
    if (!response.ok) throw new Error("LINE push failed");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "傳送失敗" });
  }
}