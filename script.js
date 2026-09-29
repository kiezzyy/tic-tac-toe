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

// --- 2b. Fun sound effects (Web Audio, no files needed) ---
let soundOn = true;
let audioCtx = null;

// Create AudioContext on first user interaction (browser rule)
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Play one beep tone
function playTone(freq, delaySec, lengthSec, type = "sine", volume = 0.2) {
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

// Short click on every move
function playClick() {
  playTone(600, 0, 0.08, "square", 0.08);
}

// Happy ascending fanfare for WIN
function playWinSound() {
  playTone(523, 0, 0.15, "sine", 0.25);    // C5
  playTone(659, 0.15, 0.15, "sine", 0.25); // E5
  playTone(784, 0.3, 0.15, "sine", 0.25);  // G5
  playTone(1047, 0.45, 0.3, "sine", 0.3);  // C6
}

// Sad descending wah-wah for LOSE
function playLoseSound() {
  playTone(400, 0, 0.2, "sawtooth", 0.15);
  playTone(300, 0.2, 0.2, "sawtooth", 0.15);
  playTone(200, 0.4, 0.4, "sawtooth", 0.15);
}

// Neutral sound for DRAW
function playDrawSound() {
  playTone(440, 0, 0.15, "triangle", 0.2);
  playTone(440, 0.2, 0.15, "triangle", 0.2);
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
  playClick();

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
function endGame(result, winnerCombo) {
  gameActive = false;

  if (result === "Draw") {
    scores.Draw++;
    statusText.innerHTML = `It's a <strong>draw</strong>! 🤝`;
    showModal("Draw! 🤝");
    playDrawSound();
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

    // Fun sounds: vs Computer → win = cheer, lose = sad.
    // 2 Players → always cheer.
    if (gameMode === "vsComputer") {
      if (result === "O") playLoseSound(); // computer beat you
      else playWinSound(); // you beat computer
    } else {
      playWinSound();
    }
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
