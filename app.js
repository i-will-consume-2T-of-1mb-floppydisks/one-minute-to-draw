const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const doneScreen = document.querySelector("#doneScreen");
const startBtn = document.querySelector("#startBtn");
const againBtn = document.querySelector("#againBtn");
const nameInput = document.querySelector("#nameInput");
const artistName = document.querySelector("#artistName");
const doneArtist = document.querySelector("#doneArtist");
const timerEl = document.querySelector("#timer");
const statusEl = document.querySelector("#status");
const submitStatus = document.querySelector("#submitStatus");
const canvas = document.querySelector("#drawingCanvas");
const flameCanvas = document.querySelector("#flameCanvas");
const colorInput = document.querySelector("#colorInput");
const sizeInput = document.querySelector("#sizeInput");
const eraserBtn = document.querySelector("#eraserBtn");
const clearBtn = document.querySelector("#clearBtn");
const musicBtn = document.querySelector("#musicBtn");
const bgMusic = document.querySelector("#bgMusic");

const ctx = canvas.getContext("2d");
const flameCtx = flameCanvas.getContext("2d");

let drawing = false;
let erasing = false;
let timeLeft = 60;
let timerId = null;
let submitted = false;
let playerName = "";
let musicEnabled = true;
let audioContext = null;
let analyser = null;
let audioSource = null;
let audioData = null;
let flameFrame = null;

function show(el) {
  [startScreen, gameScreen, doneScreen].forEach(x => x.classList.add("hidden"));
  el.classList.remove("hidden");
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const old = document.createElement("canvas");
  old.width = canvas.width;
  old.height = canvas.height;
  if (canvas.width && canvas.height) old.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (old.width && old.height) ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr, 0, 0, rect.width, rect.height);
}

function resizeFlames() {
  const rect = flameCanvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  flameCanvas.width = Math.floor(rect.width * dpr);
  flameCanvas.height = Math.floor(rect.height * dpr);
  flameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function pointerPos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: e.clientX - r.left,
    y: e.clientY - r.top
  };
}

function beginDraw(e) {
  drawing = true;
  canvas.setPointerCapture?.(e.pointerId);
  const p = pointerPos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  draw(e);
}

function draw(e) {
  if (!drawing) return;
  const p = pointerPos(e);
  ctx.strokeStyle = erasing ? "#ffffff" : colorInput.value;
  ctx.lineWidth = Number(sizeInput.value);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function endDraw() {
  drawing = false;
  ctx.beginPath();
}

canvas.addEventListener("pointerdown", beginDraw);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", endDraw);
canvas.addEventListener("pointercancel", endDraw);

eraserBtn.addEventListener("click", () => {
  erasing = !erasing;
  eraserBtn.textContent = erasing ? "PEN" : "ERASER";
});

clearBtn.addEventListener("click", () => {
  const r = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, r.width, r.height);
});

function updateTimer() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

function setupAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  audioData = new Uint8Array(analyser.frequencyBinCount);
  audioSource = audioContext.createMediaElementSource(bgMusic);
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);
}

function startFlames() {
  cancelAnimationFrame(flameFrame);
  resizeFlames();

  function animate() {
    const w = flameCanvas.clientWidth;
    const h = flameCanvas.clientHeight;
    flameCtx.clearRect(0, 0, w, h);

    let level = 0.15;
    if (analyser) {
      analyser.getByteFrequencyData(audioData);
      let sum = 0;
      for (let i = 0; i < Math.min(24, audioData.length); i++) sum += audioData[i];
      level = Math.min(1, (sum / Math.min(24, audioData.length)) / 255 * 2.1);
    }

    const bars = Math.max(20, Math.floor(w / 18));
    const bw = w / bars;
    const now = performance.now() / 120;

    for (let i = 0; i < bars; i++) {
      const wave = (Math.sin(now + i * 1.7) + 1) / 2;
      const randomPulse = (Math.sin(now * 1.8 + i * 3.1) + 1) / 2;
      const height = 18 + (level * 75 + wave * 18 + randomPulse * 12);
      const x = i * bw;
      const y = h - height;

      const grad = flameCtx.createLinearGradient(0, y, 0, h);
      grad.addColorStop(0, "#fff3a1");
      grad.addColorStop(.35, "#ffb12b");
      grad.addColorStop(1, "#e34b18");

      flameCtx.fillStyle = grad;
      flameCtx.beginPath();
      flameCtx.moveTo(x, h);
      flameCtx.lineTo(x + bw * .5, y);
      flameCtx.lineTo(x + bw, h);
      flameCtx.closePath();
      flameCtx.fill();
    }

    flameFrame = requestAnimationFrame(animate);
  }
  animate();
}

function stopFlames() {
  cancelAnimationFrame(flameFrame);
  flameCtx.clearRect(0, 0, flameCanvas.clientWidth, flameCanvas.clientHeight);
}

async function startMusic() {
  if (!musicEnabled) return;
  try {
    setupAudio();
    if (audioContext.state === "suspended") await audioContext.resume();
    bgMusic.currentTime = 0;
    await bgMusic.play();
  } catch {
    statusEl.textContent = "> TAP MUSIC IF AUDIO IS BLOCKED";
  }
}

musicBtn.addEventListener("click", async () => {
  musicEnabled = !musicEnabled;
  musicBtn.textContent = `MUSIC: ${musicEnabled ? "ON" : "OFF"}`;
  if (musicEnabled) await startMusic();
  else bgMusic.pause();
});

function startTimer() {
  clearInterval(timerId);
  timeLeft = 60;
  updateTimer();

  timerId = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timerId);
      finishGame();
    }
  }, 1000);
}

async function startGame() {
  playerName = nameInput.value.trim();
  if (!playerName) {
    nameInput.focus();
    nameInput.placeholder = "PLEASE ENTER YOUR NAME!";
    return;
  }

  artistName.textContent = playerName;
  submitted = false;
  show(gameScreen);

  requestAnimationFrame(() => {
    resizeCanvas();
    resizeFlames();
    const r = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, r.width, r.height);
    startFlames();
  });

  startTimer();
  await startMusic();
}

async function finishGame() {
  bgMusic.pause();
  stopFlames();
  doneArtist.textContent = playerName;
  show(doneScreen);
  await submitDrawing();
}

async function submitDrawing() {
  if (submitted) return;
  submitted = true;

  submitStatus.textContent = "> PREPARING DRAWING...";

  canvas.toBlob(async (blob) => {
    if (!blob) {
      submitStatus.textContent = "> COULD NOT CREATE DRAWING.";
      return;
    }

    const form = new FormData();
    form.append("drawing", blob, "one-minute-drawing.png");
    form.append("name", playerName);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: form
      });

      if (!response.ok) throw new Error("submit failed");
      submitStatus.textContent = "> DRAWING SENT TO DISCORD ✓";
    } catch {
      submitStatus.textContent = "> COULD NOT SEND DRAWING. CHECK SERVER.";
    }
  }, "image/png");
}

startBtn.addEventListener("click", startGame);
nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") startGame();
});
againBtn.addEventListener("click", () => {
  show(startScreen);
  nameInput.focus();
});

document.querySelector("#darkModeBtn").addEventListener("click", () => {
  document.body.classList.remove("light-mode");
  localStorage.setItem("theme", "dark");
});

document.querySelector("#lightModeBtn").addEventListener("click", () => {
  document.body.classList.add("light-mode");
  localStorage.setItem("theme", "light");
});

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
}

window.addEventListener("resize", () => {
  if (!gameScreen.classList.contains("hidden")) {
    resizeCanvas();
    resizeFlames();
  }
});
