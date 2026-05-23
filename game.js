"use strict";

const COLS = 8;
const ROWS = 13;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STARTING_LETTERS = 3;
const SCORE_PER_LEVEL = 4;
const SCORE_PER_UNLOCK = 3;
const MIN_FALL_INTERVAL = 320;
const START_FALL_INTERVAL = 1050;

const elements = {
  board: document.querySelector("#game-board"),
  confettiLayer: document.querySelector("#confetti-layer"),
  score: document.querySelector("#score"),
  level: document.querySelector("#level"),
  bestScore: document.querySelector("#best-score"),
  nextLetter: document.querySelector("#next-letter"),
  levelNote: document.querySelector("#level-note"),
  message: document.querySelector("#message"),
  overlay: document.querySelector("#overlay"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayText: document.querySelector("#overlay-text"),
  startButton: document.querySelector("#start-button"),
  pauseButton: document.querySelector('[data-action="pause"]')
};

const state = {
  grid: createGrid(),
  active: null,
  next: null,
  score: 0,
  best: loadBestScore(),
  level: 1,
  running: false,
  paused: false,
  gameOver: false,
  lastFall: 0
};

state.next = makeBlock(getUnlockedLetterCount());
render();
requestAnimationFrame(gameLoop);

elements.startButton.addEventListener("click", () => {
  if (state.running && state.paused && !state.gameOver) {
    resumeGame();
    return;
  }

  resetGame();
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    handleAction(button.dataset.action);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.target.closest("button")) {
    return;
  }

  const key = event.key.toLowerCase();

  if (["arrowleft", "arrowright", "arrowdown", " ", "a", "d", "s", "p"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowleft" || key === "a") {
    moveActive(-1);
  } else if (key === "arrowright" || key === "d") {
    moveActive(1);
  } else if (key === "arrowdown" || key === "s") {
    stepDown();
  } else if (key === " ") {
    hardDrop();
  } else if (key === "p") {
    togglePause();
  }
});

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem("letterLagoonBest")) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem("letterLagoonBest", String(state.best));
  } catch (error) {
    // Local storage can be unavailable in private or restricted browser modes.
  }
}

function resetGame() {
  state.grid = createGrid();
  state.score = 0;
  state.level = 1;
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.lastFall = performance.now();
  state.active = null;
  state.next = makeBlock(getUnlockedLetterCount());
  spawnBlock();
  setMessage("Match uppercase and lowercase letter friends.");
  render();
}

function resumeGame() {
  state.paused = false;
  state.lastFall = performance.now();
  setMessage("Back to the reef. Keep matching letters!");
  render();
}

function gameLoop(timestamp) {
  if (state.running && !state.paused && !state.gameOver && state.active) {
    if (timestamp - state.lastFall >= getFallInterval()) {
      stepDown();
      state.lastFall = timestamp;
    }
  }

  requestAnimationFrame(gameLoop);
}

function getFallInterval() {
  return Math.max(MIN_FALL_INTERVAL, START_FALL_INTERVAL - (state.level - 1) * 85);
}

function getUnlockedLetterCount() {
  return Math.min(LETTERS.length, STARTING_LETTERS + Math.floor(state.score / SCORE_PER_UNLOCK));
}

function makeBlock(unlockedCount) {
  const letter = LETTERS[randomInt(0, unlockedCount - 1)];
  const isUppercase = Math.random() > 0.5;

  return {
    letter: isUppercase ? letter : letter.toLowerCase(),
    x: 0,
    y: 0
  };
}

function spawnBlock() {
  const block = state.next || makeBlock(getUnlockedLetterCount());
  const openColumns = [];

  for (let col = 0; col < COLS; col += 1) {
    if (!state.grid[0][col]) {
      openColumns.push(col);
    }
  }

  if (openColumns.length === 0) {
    endGame();
    return;
  }

  const center = Math.floor(COLS / 2);
  openColumns.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  const bestChoices = openColumns.slice(0, Math.min(4, openColumns.length));

  block.x = bestChoices[randomInt(0, bestChoices.length - 1)];
  block.y = 0;
  state.active = block;
  state.next = makeBlock(getUnlockedLetterCount());
}

function handleAction(action) {
  if (action === "pause") {
    togglePause();
    return;
  }

  if (!state.running || state.gameOver) {
    setMessage("Press Start game to begin.");
    return;
  }

  if (action === "left") {
    moveActive(-1);
  } else if (action === "right") {
    moveActive(1);
  } else if (action === "down") {
    stepDown();
  } else if (action === "drop") {
    hardDrop();
  }
}

function moveActive(direction) {
  if (!canPlay() || !state.active) {
    return;
  }

  const nextX = state.active.x + direction;

  if (canOccupy(nextX, state.active.y)) {
    state.active.x = nextX;
    render();
  }
}

function stepDown() {
  if (!canPlay() || !state.active) {
    return;
  }

  const nextY = state.active.y + 1;

  if (canOccupy(state.active.x, nextY)) {
    state.active.y = nextY;
    render();
    return;
  }

  const below = getSettledBlock(state.active.x, nextY);

  if (below && isCorrectMatch(state.active.letter, below.letter)) {
    clearMatchedPair(below);
    return;
  }

  settleActiveBlock();
}

function hardDrop() {
  if (!canPlay() || !state.active) {
    return;
  }

  while (canOccupy(state.active.x, state.active.y + 1)) {
    state.active.y += 1;
  }

  stepDown();
  state.lastFall = performance.now();
}

function canPlay() {
  return state.running && !state.paused && !state.gameOver;
}

function canOccupy(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS && !state.grid[y][x];
}

function getSettledBlock(x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
    return null;
  }

  const block = state.grid[y][x];
  return block ? { ...block, x, y } : null;
}

function isCorrectMatch(first, second) {
  return first.toLowerCase() === second.toLowerCase() && first !== second;
}

function clearMatchedPair(settledBlock) {
  const activeBlock = state.active;
  const oldUnlockedCount = getUnlockedLetterCount();

  state.grid[settledBlock.y][settledBlock.x] = null;
  state.active = null;
  state.score += 1;
  state.level = 1 + Math.floor(state.score / SCORE_PER_LEVEL);

  if (state.score > state.best) {
    state.best = state.score;
    saveBestScore();
  }

  const matchedLetter = activeBlock.letter.toUpperCase();
  const newUnlockedCount = getUnlockedLetterCount();
  const matchRow = (activeBlock.y + settledBlock.y) / 2;
  createConfetti(activeBlock.x, matchRow);

  if (newUnlockedCount > oldUnlockedCount) {
    const unlockedLetter = LETTERS[newUnlockedCount - 1];
    setMessage(`Great match! ${unlockedLetter} joined the lagoon.`);
  } else {
    setMessage(`Splash! ${matchedLetter} matched for 1 point.`);
  }

  spawnBlock();
  render();
}

function settleActiveBlock() {
  const block = state.active;

  state.grid[block.y][block.x] = {
    letter: block.letter
  };
  state.active = null;

  if (block.y === 0) {
    endGame();
    return;
  }

  spawnBlock();
  render();
}

function endGame() {
  state.running = false;
  state.paused = false;
  state.gameOver = true;
  state.active = null;
  setMessage(`Game over. You matched ${state.score} letter pairs.`);
  render();
}

function togglePause() {
  if (!state.running || state.gameOver) {
    return;
  }

  state.paused = !state.paused;

  if (!state.paused) {
    state.lastFall = performance.now();
  }

  setMessage(state.paused ? "Paused. Press Resume when you are ready." : "Back to the reef!");
  render();
}

function render() {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = document.createElement("div");
      cell.className = row === 0 ? "cell top-danger" : "cell";

      const block = getRenderableBlock(row, col);

      if (block) {
        cell.appendChild(createBlockElement(block.letter, block.active));
      }

      fragment.appendChild(cell);
    }
  }

  elements.board.replaceChildren(fragment);
  elements.score.textContent = state.score;
  elements.level.textContent = state.level;
  elements.bestScore.textContent = state.best;
  elements.nextLetter.textContent = state.next ? state.next.letter : "?";
  elements.nextLetter.classList.toggle("uppercase", Boolean(state.next && isUppercase(state.next.letter)));
  elements.nextLetter.classList.toggle("lowercase", Boolean(state.next && !isUppercase(state.next.letter)));
  elements.levelNote.textContent = getLevelNote();
  elements.pauseButton.textContent = state.paused ? "Resume" : "Pause";
  renderOverlay();
}

function getRenderableBlock(row, col) {
  if (state.active && state.active.y === row && state.active.x === col) {
    return {
      letter: state.active.letter,
      active: true
    };
  }

  const settled = state.grid[row][col];

  if (!settled) {
    return null;
  }

  return {
    letter: settled.letter,
    active: false
  };
}

function createBlockElement(letter, isActive) {
  const block = document.createElement("div");
  block.className = `letter-block ${isUppercase(letter) ? "uppercase" : "lowercase"}`;
  block.classList.toggle("active", isActive);
  block.textContent = letter;
  block.setAttribute("aria-label", `${isUppercase(letter) ? "uppercase" : "lowercase"} ${letter.toUpperCase()}`);

  return block;
}

function renderOverlay() {
  if (state.running && !state.paused && !state.gameOver) {
    elements.overlay.classList.add("hidden");
    return;
  }

  elements.overlay.classList.remove("hidden");

  if (state.paused) {
    elements.overlayTitle.textContent = "Paused";
    elements.overlayText.textContent = "Take a breath with the fish, then jump back in.";
    elements.startButton.textContent = "Resume";
  } else if (state.gameOver) {
    elements.overlayTitle.textContent = "The reef is full!";
    elements.overlayText.textContent = `You matched ${state.score} letter pairs. Try again and beat your best score.`;
    elements.startButton.textContent = "Play again";
  } else {
    elements.overlayTitle.textContent = "Ready to play?";
    elements.overlayText.textContent = "Use the arrow buttons or keyboard to guide falling letters. Match uppercase with lowercase to make a splash.";
    elements.startButton.textContent = "Start game";
  }
}

function getLevelNote() {
  const unlockedCount = getUnlockedLetterCount();
  const lastLetter = LETTERS[unlockedCount - 1];

  return `Practicing A-${lastLetter}. Match opposite cases before blocks reach the top.`;
}

function createConfetti(col, row) {
  const boardRect = elements.board.getBoundingClientRect();
  const x = ((col + 0.5) / COLS) * boardRect.width;
  const y = ((row + 0.5) / ROWS) * boardRect.height;
  const colors = ["#ffe66d", "#ff7f8f", "#8bf0b0", "#6ee7ff", "#b79cff", "#ffffff"];

  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = randomInt(42, 102);

    piece.className = "confetti-piece";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    piece.style.setProperty("--confetti-color", colors[randomInt(0, colors.length - 1)]);
    piece.style.animationDelay = `${randomInt(0, 90)}ms`;

    elements.confettiLayer.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove(), { once: true });
  }
}

function setMessage(text) {
  elements.message.textContent = text;
}

function isUppercase(letter) {
  return letter === letter.toUpperCase();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
