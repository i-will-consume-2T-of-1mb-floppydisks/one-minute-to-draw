const home = document.querySelector("#home");
const game = document.querySelector("#game");
const done = document.querySelector("#done");
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const timer = document.querySelector("#timer");
const color = document.querySelector("#color");
const size = document.querySelector("#size");
const sizeValue = document.querySelector("#sizeValue");
const preview = document.querySelector("#preview");
const status = document.querySelector("#status");
const nameInput = document.querySelector("#nameInput");
let drawing = false;
let erasing = false;
let endTime = 0;
let timerId = null;
let submitted = false;
let musicEnabled = true;
const bgMusic = document.querySelector("#bgMusic");
const musicBtn = document.querySelector("#musicBtn");

musicBtn.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  musicBtn.textContent = musicEnabled ? "♫ Music: ON" : "♫ Music: OFF";
  if (!musicEnabled) bgMusic.pause();
  else if (game.classList.contains("active") && !submitted) bgMusic.play().catch(() => {});
});

function show(screen) {
  [home, game, done].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function setupCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function position(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startDraw(e) {
  if (submitted) return;
  drawing = true;
  const p = position(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  canvas.setPointerCapture?.(e.pointerId);
  draw(e);
}
function draw(e) {
  if (!drawing || submitted) return;
  const p = position(e);
  ctx.strokeStyle = erasing ? "#ffffff" : color.value;
  ctx.lineWidth = Number(size.value);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}
function stopDraw() { drawing = false; ctx.beginPath(); }

canvas.addEventListener("pointerdown", startDraw);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDraw);
canvas.addEventListener("pointercancel", stopDraw);
canvas.addEventListener("pointerleave", stopDraw);

size.addEventListener("input", () => sizeValue.textContent = `${size.value} px`);
document.querySelector("#eraserBtn").addEventListener("click", () => {
  erasing = !erasing;
  document.querySelector("#eraserBtn").textContent = erasing ? "Eraser: ON" : "Eraser";
});
document.querySelector("#clearBtn").addEventListener("click", () => {
  if (!submitted) setupCanvas();
});

document.querySelector("#startBtn").addEventListener("click", startGame);
document.querySelector("#againBtn").addEventListener("click", startGame);
document.querySelector("#backBtn").addEventListener("click", () => {
  stopTimer();
  bgMusic.pause();
  bgMusic.currentTime = 0;
  show(home);
});

function startGame() {
  const playerName = nameInput.value.trim();

  if (!playerName) {
    nameInput.focus();
    nameInput.placeholder = "Please enter your name!";
    return;
  }

  submitted = false;
  show(game);
  requestAnimationFrame(setupCanvas);
  startTimer();

  bgMusic.currentTime = 0;
  if (musicEnabled) bgMusic.play().catch(() => {});
}

function startTimer() {
  stopTimer();
  endTime = Date.now() + 60000;
  updateTimer();
  timerId = setInterval(updateTimer, 100);
}
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}
function updateTimer() {
  const remaining = Math.max(0, endTime - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  timer.textContent = `00:${String(seconds).padStart(2, "0")}`;
  if (remaining <= 0) {
    stopTimer();
    finishGame();
  }
}

async function finishGame() {
  submitted = true;
  bgMusic.pause();
  bgMusic.currentTime = 0;
  const image = canvas.toDataURL("image/png");
  preview.src = image;
  status.textContent = "Sending drawing...";
  show(done);

  const blob = await (await fetch(image)).blob();
  const form = new FormData();

form.append("drawing", blob, "one-minute-drawing.png");
form.append("name", nameInput.value.trim());

  try {
    const response = await fetch("/api/submit", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed");

    status.textContent = result.demo
      ? "✅ Drawing received! Connect Discord to post it to #drawings."
      : "✅ Drawing posted to Discord!";
  } catch (err) {
    console.error(err);
    status.textContent = "⚠️ Drawing finished, but it couldn't be sent to Discord.";
  }
}

window.addEventListener("resize", () => {
  // Don't resize while drawing because it would erase the canvas.
});
