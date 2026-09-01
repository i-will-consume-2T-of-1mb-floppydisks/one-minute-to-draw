import express from "express";
import multer from "multer";
import { Client, GatewayIntentBits, AttachmentBuilder } from "discord.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(express.static("."));

const PORT = process.env.PORT || 3000;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

let discordClient = null;

if (DISCORD_TOKEN && DISCORD_CHANNEL_ID) {
  discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
  discordClient.once("ready", () => console.log(`Discord bot logged in as ${discordClient.user.tag}`));
  discordClient.login(DISCORD_TOKEN).catch(err => {
    console.error("Discord login failed:", err.message);
    discordClient = null;
  });
} else {
  console.log("Discord is not configured yet. The site will still work in demo mode.");
}

app.post("/api/submit", upload.single("drawing"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No drawing received." });

  if (!discordClient || !DISCORD_CHANNEL_ID) {
    return res.json({ ok: true, demo: true, message: "Drawing received! Discord is not configured yet." });
  }

  try {
    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel?.isTextBased()) throw new Error("Discord channel was not found or is not text-based.");

    const attachment = new AttachmentBuilder(req.file.buffer, {
      name: "one-minute-drawing.png"
    });

    await channel.send({
      content: "🎨 **New 1 Minute Drawing!**\n⏱️ Challenge completed in 60 seconds.",
      files: [attachment]
    });

    res.json({ ok: true, demo: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not send the drawing to Discord." });
  }
});

app.listen(PORT, () => {
  console.log(`1 Minute to Draw is running at http://localhost:${PORT}`);
});