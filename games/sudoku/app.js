(() => {
  "use strict";

  const LEVELS = {
    easy: { label: "简单", blanks: 38 },
    medium: { label: "中等", blanks: 48 },
    hard: { label: "困难", blanks: 54 }
  };
  const boardElement = document.getElementById("sudokuBoard");
  const statusElement = document.getElementById("gameStatus");
  const timerElement = document.getElementById("timer");
  const mistakesElement = document.getElementById("mistakes");
  const bestTimeElement = document.getElementById("bestTime");
  const notesButton = document.getElementById("notesButton");
  const hintCountElement = document.getElementById("hintCount");
  const overlay = document.getElementById("gameOverlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");

  let level = "easy";
  let solution = [];
  let puzzle = [];
  let values = [];
  let notes = [];
  let selected = -1;
  let noteMode = false;
  let mistakes = 0;
  let hints = 3;
  let elapsed = 0;
  let timerId = 0;
  let playing = false;

  const shuffled = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  };

  function generateSolution() {
    const base = 3;
    const side = 9;
    const pattern = (row, column) => (base * (row % base) + Math.floor(row / base) + column) % side;
    const rowGroups = shuffled([0, 1, 2]);
    const columnGroups = shuffled([0, 1, 2]);
    const rows = rowGroups.flatMap((group) => shuffled([0, 1, 2]).map((row) => group * base + row));
    const columns = columnGroups.flatMap((group) => shuffled([0, 1, 2]).map((column) => group * base + column));
    const numbers = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    return rows.flatMap((row) => columns.map((column) => numbers[pattern(row, column)]));
  }

  function countSolutions(board, limit = 2) {
    let bestIndex = -1;
    let bestCandidates = null;
    for (let index = 0; index < 81; index += 1) {
      if (board[index]) continue;
      const candidates = validCandidates(board, index);
      if (!candidates.length) return 0;
      if (!bestCandidates || candidates.length < bestCandidates.length) {
        bestIndex = index;
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }
    if (bestIndex === -1) return 1;
    let count = 0;
    for (const number of bestCandidates) {
      board[bestIndex] = number;
      count += countSolutions(board, limit - count);
      board[bestIndex] = 0;
      if (count >= limit) return count;
    }
    return count;
  }

  function validCandidates(board, index) {
    const row = Math.floor(index / 9);
    const column = index % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxColumn = Math.floor(column / 3) * 3;
    const used = new Set();
    for (let offset = 0; offset < 9; offset += 1) {
      used.add(board[row * 9 + offset]);
      used.add(board[offset * 9 + column]);
      used.add(board[(boxRow + Math.floor(offset / 3)) * 9 + boxColumn + (offset % 3)]);
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((number) => !used.has(number));
  }

  function createPuzzle(full, blanks) {
    const result = [...full];
    let removed = 0;
    for (const index of shuffled(Array.from({ length: 81 }, (_, item) => item))) {
      if (removed >= blanks) break;
      const previous = result[index];
      result[index] = 0;
      if (countSolutions([...result]) !== 1) result[index] = previous;
      else removed += 1;
    }
    return result;
  }

  function newGame() {
    playing = false;
    clearInterval(timerId);
    overlay.hidden = true;
    statusElement.textContent = `${LEVELS[level].label}数独生成中…`;
    solution = generateSolution();
    puzzle = createPuzzle(solution, LEVELS[level].blanks);
    values = [...puzzle];
    notes = Array.from({ length: 81 }, () => new Set());
    selected = puzzle.findIndex((value) => !value);
    noteMode = false;
    mistakes = 0;
    hints = 3;
    elapsed = 0;
    mistakesElement.textContent = "0";
    hintCountElement.textContent = "3";
    notesButton.setAttribute("aria-pressed", "false");
    updateTimer();
    updateBest();
    renderBoard();
    playing = true;
    timerId = window.setInterval(() => { elapsed += 1; updateTimer(); }, 1000);
    statusElement.textContent = `${LEVELS[level].label}数独已生成。选择空格并填入数字。`;
  }

  function renderBoard() {
    boardElement.replaceChildren();
    const selectedValue = selected >= 0 ? values[selected] : 0;
    for (let index = 0; index < 81; index += 1) {
      const cell = document.createElement("button");
      const row = Math.floor(index / 9);
      const column = index % 9;
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(index);
      cell.dataset.row = String(row);
      cell.dataset.column = String(column);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `第 ${row + 1} 行第 ${column + 1} 列${values[index] ? `，数字 ${values[index]}` : "，空格"}`);
      if (puzzle[index]) cell.classList.add("given");
      if (index === selected) cell.classList.add("selected");
      else if (selected >= 0 && isPeer(index, selected)) cell.classList.add("peer");
      if (selectedValue && values[index] === selectedValue) cell.classList.add("match");
      if (values[index]) cell.textContent = String(values[index]);
      else if (notes[index].size) {
        const noteGrid = document.createElement("span");
        noteGrid.className = "notes";
        for (let number = 1; number <= 9; number += 1) {
          const note = document.createElement("i");
          note.textContent = notes[index].has(number) ? String(number) : "";
          noteGrid.append(note);
        }
        cell.append(noteGrid);
      }
      cell.addEventListener("click", () => selectCell(index));
      boardElement.append(cell);
    }
    updateNumberPad();
  }

  function isPeer(first, second) {
    const firstRow = Math.floor(first / 9);
    const firstColumn = first % 9;
    const secondRow = Math.floor(second / 9);
    const secondColumn = second % 9;
    return firstRow === secondRow || firstColumn === secondColumn || (Math.floor(firstRow / 3) === Math.floor(secondRow / 3) && Math.floor(firstColumn / 3) === Math.floor(secondColumn / 3));
  }

  function selectCell(index) {
    selected = index;
    renderBoard();
  }

  function enterNumber(number) {
    if (!playing || selected < 0 || puzzle[selected]) return;
    if (noteMode) {
      if (values[selected]) return;
      notes[selected].has(number) ? notes[selected].delete(number) : notes[selected].add(number);
      statusElement.textContent = `已${notes[selected].has(number) ? "添加" : "移除"}候选数字 ${number}。`;
      renderBoard();
      return;
    }
    if (solution[selected] !== number) {
      mistakes += 1;
      mistakesElement.textContent = String(mistakes);
      const wrongCell = boardElement.querySelector(`[data-index="${selected}"]`);
      wrongCell?.classList.add("error");
      statusElement.textContent = `数字 ${number} 不适合这个位置。错误 ${mistakes} / 3。`;
      if (mistakes >= 3) finish(false);
      return;
    }
    values[selected] = number;
    notes[selected].clear();
    notes.forEach((set, index) => { if (isPeer(index, selected)) set.delete(number); });
    statusElement.textContent = `已填入数字 ${number}。`;
    renderBoard();
    if (values.every(Boolean)) finish(true);
  }

  function erase() {
    if (!playing || selected < 0 || puzzle[selected]) return;
    values[selected] = 0;
    notes[selected].clear();
    renderBoard();
    statusElement.textContent = "已擦除当前格。";
  }

  function giveHint() {
    if (!playing || hints <= 0) return;
    let index = selected;
    if (index < 0 || puzzle[index] || values[index]) index = values.findIndex((value, item) => !value && !puzzle[item]);
    if (index < 0) return;
    values[index] = solution[index];
    notes[index].clear();
    selected = index;
    hints -= 1;
    hintCountElement.textContent = String(hints);
    renderBoard();
    statusElement.textContent = `提示已填入数字 ${values[index]}，还剩 ${hints} 次。`;
    if (values.every(Boolean)) finish(true);
  }

  function finish(won) {
    playing = false;
    clearInterval(timerId);
    if (won) {
      const key = `readforfun-sudoku-best-${level}`;
      const previous = readStoredNumber(key);
      if (!previous || elapsed < previous) {
        try { localStorage.setItem(key, String(elapsed)); } catch (_) {}
      }
      overlayTitle.textContent = "完成！";
      overlayText.textContent = `${LEVELS[level].label} · ${formatTime(elapsed)} · ${mistakes} 个错误`;
      statusElement.textContent = `恭喜完成${LEVELS[level].label}数独，用时 ${formatTime(elapsed)}。`;
    } else {
      overlayTitle.textContent = "先歇一会儿";
      overlayText.textContent = "已经出现 3 个错误，换一盘再试试。";
      statusElement.textContent = "本局结束，错误达到 3 次。";
    }
    overlay.hidden = false;
    updateBest();
  }

  function updateNumberPad() {
    const counts = Array(10).fill(0);
    values.forEach((value) => { if (value) counts[value] += 1; });
    document.querySelectorAll("[data-number]").forEach((button) => {
      const number = Number(button.dataset.number);
      button.disabled = counts[number] >= 9;
      button.querySelector("small").textContent = counts[number] >= 9 ? "✓" : "";
    });
  }

  function readStoredNumber(key) {
    try { return Number(localStorage.getItem(key)) || 0; } catch (_) { return 0; }
  }

  function updateBest() {
    const best = readStoredNumber(`readforfun-sudoku-best-${level}`);
    bestTimeElement.textContent = best ? formatTime(best) : "—";
  }

  function updateTimer() { timerElement.textContent = formatTime(elapsed); }
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => {
      level = button.dataset.level;
      document.querySelectorAll("[data-level]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      newGame();
    });
  });
  document.querySelectorAll("[data-number]").forEach((button) => button.addEventListener("click", () => enterNumber(Number(button.dataset.number))));
  notesButton.addEventListener("click", () => {
    noteMode = !noteMode;
    notesButton.setAttribute("aria-pressed", String(noteMode));
    statusElement.textContent = noteMode ? "笔记模式已开启。" : "笔记模式已关闭。";
  });
  document.getElementById("eraseButton").addEventListener("click", erase);
  document.getElementById("hintButton").addEventListener("click", giveHint);
  document.getElementById("newGame").addEventListener("click", newGame);
  document.getElementById("overlayAction").addEventListener("click", newGame);
  document.addEventListener("keydown", (event) => {
    if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key));
    else if (["Backspace", "Delete", "0"].includes(event.key)) erase();
    else if (event.key.toLowerCase() === "n") notesButton.click();
    else if (selected >= 0 && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const row = Math.floor(selected / 9);
      const column = selected % 9;
      if (event.key === "ArrowUp") selected = ((row + 8) % 9) * 9 + column;
      if (event.key === "ArrowDown") selected = ((row + 1) % 9) * 9 + column;
      if (event.key === "ArrowLeft") selected = row * 9 + ((column + 8) % 9);
      if (event.key === "ArrowRight") selected = row * 9 + ((column + 1) % 9);
      renderBoard();
    }
  });

  newGame();
})();
