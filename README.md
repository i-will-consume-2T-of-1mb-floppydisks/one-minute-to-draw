# 1 Minute to Draw!

A starter drawing game with a 60-second canvas and optional Discord bot integration.

## Run it

1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open http://localhost:3000

## Discord setup

Create a Discord bot in the Discord Developer Portal and invite it to your server with permission to send messages and attach files.

Set these environment variables before starting the server:

- `DISCORD_TOKEN` = your bot token
- `DISCORD_CHANNEL_ID` = the ID of your `#drawings` channel

Never put the bot token in `public/app.js` or any browser-side code.

If the variables aren't set, the website runs in demo mode and still lets you test the drawing game.
