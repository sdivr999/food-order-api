export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const events = req.body.events || [];
  for (const event of events) {
    if (event.source && event.source.groupId) {
      console.log("GROUP ID:", event.source.groupId);
    }
  }
  res.status(200).end();
}
