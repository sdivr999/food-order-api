export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const events = req.body.events || [];
  for (const event of events) {
    const groupId = event.source && event.source.groupId;
    if (groupId) {
      // 回傳群組 ID 到群組
      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.LINE_CHANNEL_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [{ type: "text", text: "群組ID：" + groupId }],
        }),
      });
    }
  }
  res.status(200).end();
}
