(() => {
  "use strict";

  const boardElement = document.getElementById("mineBoard");
  const viewport = document.getElementById("boardViewport");
  const rowsInput = document.getElementById("rowsInput");
  const columnsInput = document.getElementById("columnsInput");
  const minesInput = document.getElementById("minesInput");
  const mineCounter = document.getElementById("mineCounter");
  const timerElement = document.getElementById("timer");
  const statusElement = document.getElementById("gameStatus");
  const restartButton = document.getElementById("restartButton");
  const message = document.getElementById("gameMessage");
  const messageTitle = document.getElementById("messageTitle");
  const messageText = document.getElementById("messageText");

  let rows = 16;
  let columns = 16;
  let mineTotal = 40;
  let cells = [];
  let started = false;
  let playing = false;
  let mode = "reveal";
  let flags = 0;
  let revealed = 0;
  let elapsed = 0;
  let timerId = 0;
  let longPressTimer = 0;
  let longPressed = false;

  function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, Number(value) || minimum)); }

  function configure(nextRows, nextColumns, nextMines) {
    rows = clamp(nextRows, 5, 50);
    columns = clamp(nextColumns, 5, 50);
    mineTotal = clamp(nextMines, 1, Math.max(1, rows * columns - 9));
    rowsInput.value = String(rows);
    columnsInput.value = String(columns);
    minesInput.max = String(rows * columns - 9);
    minesInput.value = String(mineTotal);
    document.querySelectorAll("[data-preset]").forEach((button) => {
      const preset = button.dataset.preset.split(",").map(Number);
      button.setAttribute("aria-pressed", String(preset[0] === rows && preset[1] === columns && preset[2] === mineTotal));
    });
    newGame();
  }

  function newGame() {
    clearInterval(timerId);
    cells = Array.from({ length: rows * columns }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false }));
    started = false;
    playing = true;
    flags = 0;
    revealed = 0;
    elapsed = 0;
    message.hidden = true;
    restartButton.textContent = "◉";
    timerElement.textContent = "000";
    boardElement.style.setProperty("--columns", String(columns));
    boardElement.setAttribute("aria-label", `${rows} 行 ${columns} 列扫雷棋盘`);
    buildBoard();
    updateCounter();
    viewport.scrollTo({ top: 0, left: 0 });
    statusElement.textContent = `${rows} × ${columns} 棋盘已准备好，共 ${mineTotal} 颗雷。第一次挖开一定安全。`;
  }

  function buildBoard() {
    const fragment = document.createDocumentFragment();
    cells.forEach((_, index) => {
      const cell = document.createElement("button");
      const row = Math.floor(index / columns);
      const column = index % columns;
      cell.type = "button";
      cell.className = "mine-cell";
      cell.dataset.index = String(index);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `第 ${row + 1} 行第 ${column + 1} 列，未挖开`);
      fragment.append(cell);
    });
    boardElement.replaceChildren(fragment);
  }

  function placeMines(safeIndex) {
    const forbidden = new Set([safeIndex, ...neighbors(safeIndex)]);
    const candidates = [];
    for (let index = 0; index < cells.length; index += 1) if (!forbidden.has(index)) candidates.push(index);
    for (let index = candidates.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
    }
    candidates.slice(0, mineTotal).forEach((index) => { cells[index].mine = true; });
    cells.forEach((cell, index) => { cell.adjacent = neighbors(index).filter((item) => cells[item].mine).length; });
    started = true;
    timerId = window.setInterval(() => {
      elapsed = Math.min(999, elapsed + 1);
      timerElement.textContent = String(elapsed).padStart(3, "0");
    }, 1000);
  }

  function neighbors(index) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const result = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (!rowOffset && !columnOffset) continue;
        const nextRow = row + rowOffset;
        const nextColumn = column + columnOffset;
        if (nextRow >= 0 && nextRow < rows && nextColumn >= 0 && nextColumn < columns) result.push(nextRow * columns + nextColumn);
      }
    }
    return result;
  }

  function interact(index) {
    if (!playing) return;
    if (mode === "flag") toggleFlag(index);
    else reveal(index);
  }

  function reveal(index) {
    const cell = cells[index];
    if (!cell || cell.flagged) return;
    if (cell.revealed) {
      chord(index);
      return;
    }
    if (!started) placeMines(index);
    if (cell.mine) {
      cell.revealed = true;
      renderCell(index, true);
      finish(false, index);
      return;
    }
    floodReveal(index);
    if (revealed === cells.length - mineTotal) finish(true);
  }

  function floodReveal(startIndex) {
    const queue = [startIndex];
    const seen = new Set();
    while (queue.length) {
      const index = queue.shift();
      if (seen.has(index)) continue;
      seen.add(index);
      const cell = cells[index];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      revealed += 1;
      renderCell(index);
      if (cell.adjacent === 0) neighbors(index).forEach((neighbor) => queue.push(neighbor));
    }
    statusElement.textContent = `已安全挖开 ${revealed} 格，还剩 ${cells.length - mineTotal - revealed} 个安全格。`;
  }

  function chord(index) {
    const cell = cells[index];
    if (!cell.revealed || !cell.adjacent) return;
    const around = neighbors(index);
    if (around.filter((item) => cells[item].flagged).length !== cell.adjacent) return;
    for (const neighbor of around) {
      if (!cells[neighbor].flagged && !cells[neighbor].revealed) {
        if (cells[neighbor].mine) {
          cells[neighbor].revealed = true;
          renderCell(neighbor, true);
          finish(false, neighbor);
          return;
        }
        floodReveal(neighbor);
      }
    }
    if (revealed === cells.length - mineTotal) finish(true);
  }

  function toggleFlag(index) {
    const cell = cells[index];
    if (!playing || cell.revealed) return;
    if (!cell.flagged && flags >= mineTotal) {
      statusElement.textContent = "旗子已经用完了。";
      return;
    }
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    renderCell(index);
    updateCounter();
    statusElement.textContent = cell.flagged ? "已插上一面旗。" : "已移除旗子。";
  }

  function renderCell(index, exploded = false) {
    const cell = cells[index];
    const element = boardElement.children[index];
    element.className = "mine-cell";
    element.textContent = "";
    if (cell.revealed) {
      element.classList.add("revealed");
      if (cell.mine) {
        element.classList.add("mine");
        if (exploded) element.classList.add("exploded");
        element.textContent = "✹";
        element.setAttribute("aria-label", "地雷");
      } else {
        if (cell.adjacent) {
          element.textContent = String(cell.adjacent);
          element.classList.add(`n${cell.adjacent}`);
        }
        element.setAttribute("aria-label", cell.adjacent ? `安全，周围有 ${cell.adjacent} 颗雷` : "安全，周围没有雷");
      }
    } else if (cell.flagged) {
      element.classList.add("flagged");
      element.textContent = "⚑";
      element.setAttribute("aria-label", "已插旗");
    } else {
      element.setAttribute("aria-label", "未挖开");
    }
  }

  function finish(won, explodedIndex = -1) {
    playing = false;
    clearInterval(timerId);
    restartButton.textContent = won ? "✓" : "×";
    cells.forEach((cell, index) => {
      if (cell.mine && !cell.flagged) {
        cell.revealed = true;
        renderCell(index, index === explodedIndex);
      } else if (cell.flagged && !cell.mine) {
        const element = boardElement.children[index];
        element.className = "mine-cell wrong-flag";
        element.textContent = "×";
      }
    });
    if (won) {
      const key = `readforfun-mines-best-${rows}x${columns}-${mineTotal}`;
      const best = readStoredNumber(key);
      if (!best || elapsed < best) {
        try { localStorage.setItem(key, String(elapsed)); } catch (_) {}
      }
      messageTitle.textContent = "排雷成功";
      messageText.textContent = `${rows} × ${columns} · ${mineTotal} 颗雷 · 用时 ${elapsed} 秒`;
      statusElement.textContent = `排雷成功，用时 ${elapsed} 秒。`;
    } else {
      messageTitle.textContent = "踩到雷了";
      messageText.textContent = "线索还在，重新勘察一次吧。";
      statusElement.textContent = "踩到地雷，本局结束。";
    }
    message.hidden = false;
  }

  function readStoredNumber(key) {
    try { return Number(localStorage.getItem(key)) || 0; } catch (_) { return 0; }
  }

  function updateCounter() { mineCounter.textContent = String(Math.max(0, mineTotal - flags)).padStart(3, "0"); }

  boardElement.addEventListener("click", (event) => {
    const target = event.target.closest(".mine-cell");
    if (!target || longPressed) { longPressed = false; return; }
    interact(Number(target.dataset.index));
  });
  boardElement.addEventListener("contextmenu", (event) => {
    const target = event.target.closest(".mine-cell");
    if (!target) return;
    event.preventDefault();
    toggleFlag(Number(target.dataset.index));
  });
  boardElement.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(".mine-cell");
    if (!target || event.pointerType === "mouse") return;
    longPressed = false;
    longPressTimer = window.setTimeout(() => {
      longPressed = true;
      toggleFlag(Number(target.dataset.index));
      if (navigator.vibrate) navigator.vibrate(25);
    }, 480);
  });
  ["pointerup", "pointercancel"].forEach((type) => boardElement.addEventListener(type, () => clearTimeout(longPressTimer)));

  document.getElementById("applyCustom").addEventListener("click", () => configure(rowsInput.value, columnsInput.value, minesInput.value));
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => configure(...button.dataset.preset.split(",").map(Number)));
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      statusElement.textContent = mode === "flag" ? "插旗模式：轻点格子标记地雷。" : "挖开模式：轻点格子查看线索。";
    });
  });
  document.getElementById("cellSize").addEventListener("change", (event) => {
    boardElement.style.setProperty("--cell-size", `${event.target.value}px`);
  });
  restartButton.addEventListener("click", newGame);
  document.getElementById("messageAction").addEventListener("click", newGame);

  configure(16, 16, 40);
})();
