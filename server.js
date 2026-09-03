const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname)));

app.post("/api/submit", upload.single("drawing"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No drawing uploaded." });

    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) return res.status(500).json({ error: "Discord webhook is not configured." });

    const name = String(req.body.name || "Anonymous").slice(0, 20);

    const form = new FormData();
    form.append("payload_json", JSON.stringify({
      content:
        `🎨 **New 1 Minute Drawing!**\n` +
        `👤 **Artist:** ${name}\n` +
        `⏱️ Challenge completed in 60 seconds.`
    }));
    form.append("file", req.file.buffer, {
      filename: "one-minute-drawing.png",
      contentType: req.file.mimetype || "image/png"
    });

    const response = await fetch(webhook, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Discord rejected the drawing." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`1 Minute to Draw running on port ${PORT}`));
