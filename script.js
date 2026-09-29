// ============================================
// Neon Tic Tac Toe — script.js
// Readable, commented, no frameworks.
// ============================================

// --- 1. Game state ---
// board: array of 9 strings: "", "X", or "O"
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X"; // X always starts
let gameActive = true;   // false when someone wins or draw

let scores = { X: 0, O: 0, Draw: 0 };

// "twoPlayer" or "vsComputer"
let gameMode = "twoPlayer";
let difficulty = "easy"; // "easy" = random, "hard" = unbeatable minimax

// All possible winning lines (indexes on the board)
const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

// --- 2. Get HTML elements ---
const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const overlay = document.getElementById("overlay");
const winnerText = document.getElementById("winnerText");

// --- 2b. Loud shout sounds (Web Audio, no files needed) ---
let soundOn = true;
let audioCtx = null;

// Create AudioContext on first user interaction (browser rule)
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Play one loud tone
function playTone(freq, delaySec, lengthSec, type = "sawtooth", volume = 0.4) {
  if (!soundOn) return;
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const start = ctx.currentTime + delaySec;
    osc.start(start);
    osc.stop(start + lengthSec);
  } catch (e) {
    // Audio not supported — ignore silently
  }
}

// Play loud crowd-like noise burst (sounds like shouting)
function playShoutNoise(delaySec, lengthSec, volume = 0.35) {
  if (!soundOn) return;
  try {
    const ctx = getAudio();
    const bufferSize = ctx.sampleRate * lengthSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // white noise
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime + delaySec);
  } catch (e) {
    // ignore
  }
}

// Short click on every move — DISABLED (only win/lose shouts now)
function playClick() {
  // intentionally silent
}

// MAXIMUM LOUD WIN SHOUT — airhorn spam, instantly mute-worthy
function playWinSound() {
  // 4x ultra-loud airhorn blasts
  for (let i = 0; i < 4; i++) {
    const t = i * 0.35;
    playTone(466, t, 0.32, "sawtooth", 0.9); // airhorn tone 1
    playTone(622, t, 0.32, "sawtooth", 0.9); // airhorn tone 2
    playTone(933, t, 0.32, "square", 0.7);   // harsh top layer
    playShoutNoise(t, 0.32, 0.8);
  }
  // Final long scream
  playTone(1000, 1.4, 0.6, "sawtooth", 0.9);
  playShoutNoise(1.4, 0.6, 0.8);
}

// MAXIMUM LOUD LOSE SHOUT — foghorn fail spam
function playLoseSound() {
  // 4x ultra-loud descending blasts
  for (let i = 0; i < 4; i++) {
    const t = i * 0.35;
    playTone(220, t, 0.32, "sawtooth", 0.9);
    playTone(110, t, 0.32, "sawtooth", 0.9);
    playTone(165, t, 0.32, "square", 0.7);
    playShoutNoise(t, 0.32, 0.8);
  }
  playTone(80, 1.4, 0.7, "sawtooth", 0.9);
  playShoutNoise(1.4, 0.7, 0.8);
}

const scoreX = document.getElementById("scoreX");
const scoreO = document.getElementById("scoreO");
const scoreDraw = document.getElementById("scoreDraw");

const btn2P = document.getElementById("btn2P");
const btnAI = document.getElementById("btnAI");
const difficultyRow = document.getElementById("difficultyRow");

// --- 3. Main click handler ---
cells.forEach((cell) => {
  cell.addEventListener("click", () => {
    const index = Number(cell.dataset.index);

    // Ignore clicks on filled cells or after game over
    if (board[index] !== "" || !gameActive) return;

    makeMove(index, currentPlayer);

    // If playing vs computer and it's O's turn, let AI play
    if (gameActive && gameMode === "vsComputer" && currentPlayer === "O") {
      // Small delay so it feels natural
      setTimeout(computerPlay, 400);
    }
  });
});

// --- 4. Core functions ---

// Place a mark on the board
function makeMove(index, player) {
  board[index] = player;

  const cell = document.querySelector(`[data-index="${index}"]`);
  cell.textContent = player;
  cell.classList.add(player.toLowerCase(), "pop");

  const winnerCombo = getWinnerCombo();

  if (winnerCombo) {
    endGame(player, winnerCombo);
  } else if (board.every((c) => c !== "")) {
    endGame("Draw", null);
  } else {
    // Switch turn: X -> O, O -> X
    currentPlayer = player === "X" ? "O" : "X";
    updateStatus();
  }
}

// Return the winning combo array, or null if no winner
function getWinnerCombo() {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] !== "" && board[a] === board[b] && board[a] === board[c]) {
      return combo;
    }
  }
  return null;
}

// Handle win or draw
// Sounds ONLY play on win/lose in vsComputer mode. No click, no draw, no 2P sound.
function endGame(result, winnerCombo) {
  gameActive = false;

  if (result === "Draw") {
    scores.Draw++;
    statusText.innerHTML = `It's a <strong>draw</strong>! 🤝`;
    showModal("Draw! 🤝");
    // no sound on draw
  } else {
    scores[result]++;
    // Highlight winning cells
    if (winnerCombo) {
      winnerCombo.forEach((i) => {
        document.querySelector(`[data-index="${i}"]`).classList.add("win");
      });
    }
    statusText.innerHTML = `Player <strong>${result}</strong> wins! 🎉`;
    showModal(`${result} Wins! 🎉`);

    // ONLY vs Computer: X = you win, O = you lose. Max loud.
    if (gameMode === "vsComputer") {
      if (result === "O") playLoseSound(); // you lost
      else playWinSound(); // you won
    }
    // 2 Players mode = silent
  }

  updateScores();
}

// --- 5. Computer (AI) ---

function computerPlay() {
  if (!gameActive) return;

  let move;
  if (difficulty === "easy") {
    move = getRandomMove();
  } else {
    move = getBestMove(); // unbeatable
  }

  if (move !== null) makeMove(move, "O");
}

// Easy mode: pick a random empty cell
function getRandomMove() {
  const empty = board
    .map((value, index) => (value === "" ? index : null))
    .filter((v) => v !== null);

  const randomIndex = Math.floor(Math.random() * empty.length);
  return empty[randomIndex];
}

// Hard mode: minimax algorithm (O is maximizing player)
function getBestMove() {
  let bestScore = -Infinity;
  let bestMove = null;

  for (let i = 0; i < 9; i++) {
    if (board[i] === "") {
      board[i] = "O";
      const score = minimax(board, 0, false);
      board[i] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

// Minimax: scores +10 for O win, -10 for X win, 0 for draw
function minimax(newBoard, depth, isMaximizing) {
  const winner = checkWinnerValue(newBoard);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (newBoard.every((c) => c !== "")) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "O";
        best = Math.max(best, minimax(newBoard, depth + 1, false));
        newBoard[i] = "";
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "X";
        best = Math.min(best, minimax(newBoard, depth + 1, true));
        newBoard[i] = "";
      }
    }
    return best;
  }
}

// Helper for minimax: returns "X", "O", or null
function checkWinnerValue(b) {
  for (const [a, c, d] of WINNING_COMBOS) {
    if (b[a] !== "" && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

// --- 6. UI helpers ---

function updateStatus() {
  statusText.innerHTML = `Player <strong>${currentPlayer}</strong>'s turn`;
}

function updateScores() {
  scoreX.textContent = scores.X;
  scoreO.textContent = scores.O;
  scoreDraw.textContent = scores.Draw;
}

function showModal(message) {
  winnerText.textContent = message;
  // Small delay so you see the winning line first
  setTimeout(() => overlay.classList.remove("hidden"), 600);
}

function hideModal() {
  overlay.classList.add("hidden");
}

// Start a new round, keep scores
function restartRound() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  hideModal();

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("x", "o", "pop", "win");
  });

  updateStatus();
}

// Reset scores to zero + new round
function resetScores() {
  scores = { X: 0, O: 0, Draw: 0 };
  updateScores();
  restartRound();
}

// --- 7. Buttons & settings ---

document.getElementById("btnRestart").addEventListener("click", restartRound);
document.getElementById("btnResetScore").addEventListener("click", resetScores);
document.getElementById("btnPlayAgain").addEventListener("click", restartRound);

// Sound on/off toggle
document.getElementById("btnSound").addEventListener("click", (e) => {
  soundOn = !soundOn;
  e.target.textContent = soundOn ? "🔊 Sound" : "🔇 Muted";
});

btn2P.addEventListener("click", () => {
  gameMode = "twoPlayer";
  btn2P.classList.add("active");
  btnAI.classList.remove("active");
  difficultyRow.classList.add("hidden");
  restartRound();
});

btnAI.addEventListener("click", () => {
  gameMode = "vsComputer";
  btnAI.classList.add("active");
  btn2P.classList.remove("active");
  difficultyRow.classList.remove("hidden");
  restartRound();
});

// Difficulty radio buttons
document.querySelectorAll('input[name="difficulty"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    difficulty = e.target.value;
    restartRound();
  });
});

// Close modal when clicking outside it
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) hideModal();
});
