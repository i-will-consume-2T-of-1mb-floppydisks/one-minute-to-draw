const home = document.getElementById("home");
const game = document.getElementById("game");
const finished = document.getElementById("finished");

const startBtn = document.getElementById("startBtn");
const againBtn = document.getElementById("againBtn");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const timer = document.getElementById("timer");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");
const clearBtn = document.getElementById("clearBtn");

const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");

let drawing = false;
let timeLeft = 60;
let timerInterval = null;
let musicEnabled = true;

/* -------------------------
   SCREEN SWITCHING
------------------------- */

function showScreen(screen) {
  home.classList.add("hidden");
  game.classList.add("hidden");
  finished.classList.add("hidden");

  screen.classList.remove("hidden");
}

/* -------------------------
   CANVAS
------------------------- */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  const oldCanvas = document.createElement("canvas");
  oldCanvas.width = canvas.width;
  oldCanvas.height = canvas.height;

  if (canvas.width && canvas.height) {
    oldCanvas.getContext("2d").drawImage(canvas, 0, 0);
  }

  canvas.width = rect.width;
  canvas.height = rect.height;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (oldCanvas.width && oldCanvas.height) {
    ctx.drawImage(
      oldCanvas,
      0,
      0,
      oldCanvas.width,
      oldCanvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
}

function getPosition(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

canvas.addEventListener("pointerdown", (event) => {
  drawing = true;

  const pos = getPosition(event);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);

  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!drawing) return;

  const pos = getPosition(event);

  ctx.lineWidth = Number(sizePicker.value);
  ctx.strokeStyle = colorPicker.value;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener("pointerup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("pointercancel", () => {
  drawing = false;
  ctx.beginPath();
});

/* -------------------------
   CLEAR BUTTON
------------------------- */

clearBtn.addEventListener("click", () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

/* -------------------------
   MUSIC
------------------------- */

musicBtn.addEventListener("click", () => {
  musicEnabled = !musicEnabled;

  if (musicEnabled) {
    musicBtn.textContent = "🎵 MUSIC: ON";

    if (timeLeft > 0) {
      bgMusic.play().catch(() => {});
    }
  } else {
    musicBtn.textContent = "🔇 MUSIC: OFF";
    bgMusic.pause();
  }
});

/* -------------------------
   TIMER
------------------------- */

function updateTimer() {
  const seconds = String(timeLeft).padStart(2, "0");
  timer.textContent = `00:${seconds}`;
}

function startTimer() {
  clearInterval(timerInterval);

  timeLeft = 60;
  updateTimer();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      finishDrawing();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/* -------------------------
   START GAME
------------------------- */

function startGame() {
  showScreen(game);

  resizeCanvas();

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  timeLeft = 60;
  updateTimer();

  startTimer();

  /*
    Browsers allow music to start here because
    this function is triggered by the START button.
  */
  if (musicEnabled) {
    bgMusic.currentTime = 0;
    bgMusic.loop = true;

    bgMusic.play().catch(() => {});
  }
}

/* -------------------------
   FINISH GAME
------------------------- */

function finishDrawing() {
  stopTimer();

  drawing = false;

  bgMusic.pause();
  bgMusic.currentTime = 0;

  showScreen(finished);
}

/* -------------------------
   BUTTONS
------------------------- */

startBtn.addEventListener("click", startGame);

againBtn.addEventListener("click", () => {
  startGame();
});

/* -------------------------
   INITIALIZE
------------------------- */

showScreen(home);
updateTimer();

window.addEventListener("resize", () => {
  if (!game.classList.contains("hidden")) {
    resizeCanvas();
  }
});
