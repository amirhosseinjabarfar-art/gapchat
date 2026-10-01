export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const TOKEN = process.env.BASEROW_TOKEN;

  const CUSTOMERS_TABLE = "1234157";
  const MESSAGES_TABLE = "1234183";

  if (!TOKEN) {
    return res.status(500).json({
      error: "BASEROW_TOKEN is not configured"
    });
  }

  try {
    // دریافت پیام‌های یک مشتری
    if (req.method === "GET") {
      const customerId = req.query.customerId;

      if (!customerId) {
        return res.status(400).json({
          error: "customerId is required"
        });
      }

      const url =
        `https://api.baserow.io/api/database/rows/table/${MESSAGES_TABLE}/` +
        `?user_field_names=true&filter__Customer%20ID__equal=${encodeURIComponent(customerId)}` +
        `&order_by=Created%20At`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${TOKEN}`
        }
      });

      const data = await response.json();

      return res.status(response.status).json(data);
    }

    // ایجاد پیام جدید
    if (req.method === "POST") {
      const {
        customerId,
        sender,
        message,
        messageType = "Text",
        fileUrl = "",
        fileName = ""
      } = req.body || {};

      if (!customerId || !sender || !message) {
        return res.status(400).json({
          error: "customerId, sender and message are required"
        });
      }

      const url =
        `https://api.baserow.io/api/database/rows/table/${MESSAGES_TABLE}/` +
        `?user_field_names=true`;

      const body = {
        "Message ID": crypto.randomUUID(),
        "Customer ID": customerId,
        "Sender": sender,
        "Message": message,
        "Message Type": messageType,
        "File URL": fileUrl || "",
        "File Name": fileName || "",
        "Is Read": false,
        "Created At": new Date().toISOString()
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      return res.status(response.status).json(data);
    }

    return res.status(405).json({
      error: "Method not allowed"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
}
