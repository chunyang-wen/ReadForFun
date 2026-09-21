(() => {
  "use strict";

  const SIZE = 4;
  const WIN_VALUE = 2048;
  const STORAGE_KEYS = {
    best: "readforfun-2048-best",
    state: "readforfun-2048-state"
  };

  const boardElement = document.getElementById("gameBoard");
  const tileLayer = document.getElementById("tileLayer");
  const scoreElement = document.getElementById("score");
  const bestElement = document.getElementById("bestScore");
  const scoreGainElement = document.getElementById("scoreGain");
  const statusElement = document.getElementById("gameStatus");
  const messageElement = document.getElementById("gameMessage");
  const messageTitle = document.getElementById("messageTitle");
  const messageText = document.getElementById("messageText");
  const keepGoingButton = document.getElementById("keepGoing");
  const undoButton = document.getElementById("undoButton");
  const redoButton = document.getElementById("redoButton");

  let grid = emptyGrid();
  let score = 0;
  let bestScore = readNumber(STORAGE_KEYS.best);
  let gameOver = false;
  let won = false;
  let keepPlaying = false;
  let mergedCells = new Set();
  let touchStart = null;
  let undoStack = [];
  let redoStack = [];

  function emptyGrid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function readNumber(key) {
    try { return Number(localStorage.getItem(key)) || 0; } catch (_) { return 0; }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.best, String(bestScore));
      localStorage.setItem(STORAGE_KEYS.state, JSON.stringify({ grid, score, won, keepPlaying, gameOver, undoStack, redoStack }));
    } catch (_) {}
  }

  function isValidSnapshot(snapshot) {
    return Array.isArray(snapshot?.grid) && snapshot.grid.length === SIZE && snapshot.grid.every((row) =>
      Array.isArray(row) && row.length === SIZE && row.every((value) => Number.isInteger(value) && value >= 0)
    ) && Number.isFinite(snapshot.score);
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.state));
      if (!isValidSnapshot(saved)) return false;
      grid = saved.grid;
      score = saved.score;
      won = Boolean(saved.won);
      keepPlaying = Boolean(saved.keepPlaying);
      gameOver = Boolean(saved.gameOver) || !canMove();
      undoStack = Array.isArray(saved.undoStack) ? saved.undoStack.filter(isValidSnapshot).slice(-100) : [];
      redoStack = Array.isArray(saved.redoStack) ? saved.redoStack.filter(isValidSnapshot).slice(-100) : [];
      return true;
    } catch (_) {
      return false;
    }
  }

  function availableCells() {
    const cells = [];
    grid.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
      if (value === 0) cells.push([rowIndex, columnIndex]);
    }));
    return cells;
  }

  function addRandomTile() {
    const cells = availableCells();
    if (!cells.length) return;
    const [row, column] = cells[Math.floor(Math.random() * cells.length)];
    grid[row][column] = Math.random() < .9 ? 2 : 4;
  }

  function startGame() {
    grid = emptyGrid();
    score = 0;
    gameOver = false;
    won = false;
    keepPlaying = false;
    mergedCells = new Set();
    undoStack = [];
    redoStack = [];
    addRandomTile();
    addRandomTile();
    hideMessage();
    render();
    saveState();
    statusElement.textContent = "新游戏已开始。棋盘上有 2 个数字方块。";
    boardElement.focus({ preventScroll: true });
  }

  function snapshot() {
    return {
      grid: grid.map((row) => [...row]),
      score,
      won,
      keepPlaying,
      gameOver
    };
  }

  function restoreSnapshot(saved, action) {
    grid = saved.grid.map((row) => [...row]);
    score = saved.score;
    won = Boolean(saved.won);
    keepPlaying = Boolean(saved.keepPlaying);
    gameOver = Boolean(saved.gameOver);
    mergedCells = new Set();
    if (gameOver) showMessage("游戏结束", "棋盘已经填满，可以撤销一步继续尝试。", false);
    else if (won && !keepPlaying) showMessage("你做到了！", "2048 已经诞生。要不要继续向上？", true);
    else hideMessage();
    render();
    saveState();
    statusElement.textContent = `${action}成功。当前得分 ${score}。`;
    boardElement.focus({ preventScroll: true });
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restoreSnapshot(undoStack.pop(), "撤销");
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restoreSnapshot(redoStack.pop(), "重做");
  }

  function slideLine(line) {
    const values = line.filter(Boolean);
    const output = [];
    const mergedIndexes = [];
    let gained = 0;

    for (let index = 0; index < values.length; index += 1) {
      if (values[index] === values[index + 1]) {
        const mergedValue = values[index] * 2;
        output.push(mergedValue);
        mergedIndexes.push(output.length - 1);
        gained += mergedValue;
        index += 1;
      } else {
        output.push(values[index]);
      }
    }

    while (output.length < SIZE) output.push(0);
    return { line: output, gained, mergedIndexes };
  }

  function move(direction) {
    if (gameOver || (won && !keepPlaying)) return;

    const previous = grid.map((row) => [...row]);
    const next = emptyGrid();
    const newMergedCells = new Set();
    let gained = 0;

    for (let index = 0; index < SIZE; index += 1) {
      let line;
      if (direction === "left" || direction === "right") line = [...grid[index]];
      else line = grid.map((row) => row[index]);

      const reverse = direction === "right" || direction === "down";
      if (reverse) line.reverse();
      const result = slideLine(line);
      gained += result.gained;
      if (reverse) result.line.reverse();

      result.line.forEach((value, offset) => {
        const row = direction === "left" || direction === "right" ? index : offset;
        const column = direction === "left" || direction === "right" ? offset : index;
        next[row][column] = value;
      });

      result.mergedIndexes.forEach((mergedIndex) => {
        const offset = reverse ? SIZE - 1 - mergedIndex : mergedIndex;
        const row = direction === "left" || direction === "right" ? index : offset;
        const column = direction === "left" || direction === "right" ? offset : index;
        newMergedCells.add(`${row}-${column}`);
      });
    }

    if (sameGrid(previous, next)) return;

    undoStack.push(snapshot());
    if (undoStack.length > 100) undoStack.shift();
    redoStack = [];
    grid = next;
    score += gained;
    bestScore = Math.max(bestScore, score);
    mergedCells = newMergedCells;
    addRandomTile();

    if (!won && grid.some((row) => row.includes(WIN_VALUE))) {
      won = true;
      showMessage("你做到了！", "2048 已经诞生。要不要继续向上？", true);
      statusElement.textContent = "恭喜！你合成了 2048。";
    } else if (!canMove()) {
      gameOver = true;
      showMessage("游戏结束", "棋盘已经填满，再试一次吧。", false);
      statusElement.textContent = `游戏结束，最终得分 ${score}。`;
    } else {
      const action = { left: "向左", right: "向右", up: "向上", down: "向下" }[direction];
      statusElement.textContent = `${action}移动${gained ? `，合并获得 ${gained} 分` : ""}。当前得分 ${score}。`;
    }

    render(gained);
    saveState();
  }

  function sameGrid(first, second) {
    return first.every((row, rowIndex) => row.every((value, columnIndex) => value === second[rowIndex][columnIndex]));
  }

  function canMove() {
    if (availableCells().length) return true;
    for (let row = 0; row < SIZE; row += 1) {
      for (let column = 0; column < SIZE; column += 1) {
        if (column < SIZE - 1 && grid[row][column] === grid[row][column + 1]) return true;
        if (row < SIZE - 1 && grid[row][column] === grid[row + 1][column]) return true;
      }
    }
    return false;
  }

  function render(gained = 0) {
    tileLayer.replaceChildren();
    grid.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
      if (!value) return;
      const tile = document.createElement("span");
      tile.className = "tile";
      tile.textContent = value;
      tile.dataset.value = String(value);
      tile.dataset.large = String(value > WIN_VALUE);
      tile.dataset.merged = String(mergedCells.has(`${rowIndex}-${columnIndex}`));
      tile.style.gridRow = String(rowIndex + 1);
      tile.style.gridColumn = String(columnIndex + 1);
      tileLayer.append(tile);
    }));

    scoreElement.textContent = score;
    bestElement.textContent = bestScore;
    undoButton.disabled = undoStack.length === 0;
    redoButton.disabled = redoStack.length === 0;
    if (gained) {
      scoreGainElement.textContent = `+${gained}`;
      scoreGainElement.classList.remove("is-visible");
      void scoreGainElement.offsetWidth;
      scoreGainElement.classList.add("is-visible");
    }
  }

  function showMessage(title, text, canContinue) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    keepGoingButton.hidden = !canContinue;
    messageElement.hidden = false;
  }

  function hideMessage() {
    messageElement.hidden = true;
  }

  const keyDirections = {
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down"
  };

  document.addEventListener("keydown", (event) => {
    const isUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !event.shiftKey;
    const isRedo = (event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey));
    if (isUndo || isRedo) {
      event.preventDefault();
      isUndo ? undo() : redo();
      return;
    }
    const direction = keyDirections[event.key];
    const isInteractive = /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if (!direction || (isInteractive && document.activeElement !== boardElement)) return;
    event.preventDefault();
    move(direction);
  });

  boardElement.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  boardElement.addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;
    move(Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? "right" : "left") : (deltaY > 0 ? "down" : "up"));
  }, { passive: true });

  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => move(button.dataset.direction));
  });
  document.getElementById("newGame").addEventListener("click", startGame);
  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);
  document.getElementById("tryAgain").addEventListener("click", startGame);
  keepGoingButton.addEventListener("click", () => {
    keepPlaying = true;
    hideMessage();
    saveState();
    statusElement.textContent = "继续挑战，看看你能合成多大的数字。";
    boardElement.focus({ preventScroll: true });
  });

  bestElement.textContent = bestScore;
  if (loadState()) {
    bestScore = Math.max(bestScore, score);
    render();
    if (gameOver) showMessage("游戏结束", "棋盘已经填满，再试一次吧。", false);
    else if (won && !keepPlaying) showMessage("你做到了！", "2048 已经诞生。要不要继续向上？", true);
    else statusElement.textContent = `已继续上次游戏。当前得分 ${score}。`;
  } else {
    startGame();
  }
})();
