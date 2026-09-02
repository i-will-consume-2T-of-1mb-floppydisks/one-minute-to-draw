# 1 Minute to Draw!

A simple 60-second drawing game with a terminal-style start screen, name entry, dark/light mode, looping background music, and Discord submission.

## Files
- `index.html` — screens and controls
- `style.css` — terminal UI and themes
- `app.js` — drawing, timer, music, theme, and submission logic
- `server.js` — Express upload endpoint and Discord bot posting
- `package.json` — Render/Node dependencies
- `music.mp3` — background music
- `smiley.jpeg` — hand-drawn smiley

## Render environment variables
Set these in Render, not in GitHub:
- `DISCORD_TOKEN`
- `DISCORD_CHANNEL_ID`

The Discord bot needs permission to view and send messages in the target channel and attach files.
