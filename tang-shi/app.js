/**
 * 《唐诗之境 · 诗画合集》
 * Interactive Engine: Keyboard Line-by-Line Switching, Live Search, Poet Filtering & Ruby Pinyin
 */

(function () {
  "use strict";

  // State
  let allPoems = [];
  let visiblePoems = [];
  let currentPoemIndex = 0;
  let currentLineIndex = 0;
  let selectedPoet = "all";
  let isPinyinEnabled = true;
  let isNightTheme = false;

  // Game & Quiz State
  let appMode = "reading"; // "reading" | "quiz"
  let quizSubMode = "title_only"; // "title_only" | "context_mask"
  let maskRule = "half"; // "half" | "next_line" | "prev_line"
  let isRevealed = false;
  let maskedLineIndices = new Set();
  let revealedLineIndices = new Set();
  let hintLevel = 0;
  let poemMastery = {};

  // DOM Elements
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchResultsPanel = document.getElementById("searchResultsPanel");
  const searchResultsList = document.getElementById("searchResultsList");
  const searchResultCount = document.getElementById("searchResultCount");

  const gameModeToggleBtn = document.getElementById("gameModeToggleBtn");
  const gameModeBtnLabel = document.getElementById("gameModeBtnLabel");
  const pinyinToggleBtn = document.getElementById("pinyinToggleBtn");
  const catalogBtn = document.getElementById("catalogBtn");
  const randomPoemBtn = document.getElementById("randomPoemBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  const poetChipsContainer = document.getElementById("poetChipsContainer");

  const poemTitle = document.getElementById("poemTitle");
  const poetName = document.getElementById("poetName");
  const poetSeal = document.getElementById("poetSeal");
  const poemFormBadge = document.getElementById("poemFormBadge");
  const poemMasteryBadge = document.getElementById("poemMasteryBadge");
  const poemTagsList = document.getElementById("poemTagsList");
  const versesList = document.getElementById("versesList");
  const lineStepper = document.getElementById("lineStepper");
  const poemAppreciationBody = document.getElementById("poemAppreciationBody");

  // Quiz DOM Elements
  const quizControlBar = document.getElementById("quizControlBar");
  const quizSubOptions = document.getElementById("quizSubOptions");
  const quizHintBtn = document.getElementById("quizHintBtn");
  const quizRevealBtn = document.getElementById("quizRevealBtn");
  const quizRevealBtnText = document.getElementById("quizRevealBtnText");
  const quizRerollBtn = document.getElementById("quizRerollBtn");
  const quizMasteryBar = document.getElementById("quizMasteryBar");

  const prevPoemBtn = document.getElementById("prevPoemBtn");
  const nextPoemBtn = document.getElementById("nextPoemBtn");
  const prevPoemTitle = document.getElementById("prevPoemTitle");
  const nextPoemTitle = document.getElementById("nextPoemTitle");
  const poemCounter = document.getElementById("poemCounter");

  const lineIllustrationImg = document.getElementById("lineIllustrationImg");
  const artworkLoading = document.getElementById("artworkLoading");
  const imagePreloadCache = new Map();
  let imageSwapToken = 0;
  const artworkLineBadge = document.getElementById("artworkLineBadge");
  const artworkPoeticFocus = document.getElementById("artworkPoeticFocus");
  const expLineText = document.getElementById("expLineText");
  const expTranslation = document.getElementById("expTranslation");
  const expWords = document.getElementById("expWords");

  const catalogDrawer = document.getElementById("catalogDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");
  const catalogGrid = document.getElementById("catalogGrid");
  const drawerFilterPills = document.getElementById("drawerFilterPills");

  const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/;
  const DEFAULT_IMAGE = "assets/default-classical.svg";

  /**
   * Render text with ruby pinyin
   */
  function renderRuby(text, pinyinStr) {
    if (!text) return "";
    const pinyinTokens = (pinyinStr || "").trim().split(/\s+/).filter(Boolean);
    let tokenIndex = 0;
    let html = "";

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (CJK_RE.test(ch)) {
        const py = pinyinTokens[tokenIndex] || "";
        tokenIndex++;
        html += `<ruby><span>${escapeHtml(ch)}</span><rt>${escapeHtml(py)}</rt></ruby>`;
      } else {
        html += escapeHtml(ch);
      }
    }
    return html;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Mastery Persistence (Local Storage)
   */
  function loadMastery() {
    try {
      poemMastery = JSON.parse(localStorage.getItem("tang_poem_mastery") || "{}");
    } catch (e) {
      poemMastery = {};
    }
  }

  function saveMastery(poemId, level) {
    poemMastery[poemId] = { level, updatedAt: Date.now() };
    try {
      localStorage.setItem("tang_poem_mastery", JSON.stringify(poemMastery));
    } catch (e) {}
    updateMasteryBadge();
    updateMasteryButtonsUI(level);
  }

  function updateMasteryBadge() {
    if (!visiblePoems.length) return;
    const poem = visiblePoems[currentPoemIndex];
    if (!poem || !poemMasteryBadge) return;
    const record = poemMastery[poem.id];
    if (record && record.level) {
      poemMasteryBadge.hidden = false;
      poemMasteryBadge.className = `poem-mastery-badge ${record.level}`;
      if (record.level === "mastered") {
        poemMasteryBadge.textContent = "熟 · 已掌握";
      } else if (record.level === "vague") {
        poemMasteryBadge.textContent = "疑 · 偶有卡顿";
      } else if (record.level === "forgot") {
        poemMasteryBadge.textContent = "生 · 需温习";
      }
    } else {
      poemMasteryBadge.hidden = true;
    }
  }

  function updateMasteryButtonsUI(level) {
    if (!quizMasteryBar) return;
    const btns = quizMasteryBar.querySelectorAll(".mastery-btn");
    btns.forEach(b => {
      b.classList.toggle("is-selected", b.getAttribute("data-mastery") === level);
    });
  }

  function setMastery(level) {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem) return;
    saveMastery(poem.id, level);
  }

  /**
   * Quiz Mode Management
   */
  function toggleGameMode(explicitState) {
    const nextMode = explicitState !== undefined ? explicitState : (appMode === "reading" ? "quiz" : "reading");
    appMode = nextMode;
    const isQuiz = appMode === "quiz";

    if (gameModeToggleBtn) {
      gameModeToggleBtn.setAttribute("aria-pressed", isQuiz ? "true" : "false");
      gameModeToggleBtn.classList.toggle("is-active", isQuiz);
      if (gameModeBtnLabel) {
        gameModeBtnLabel.textContent = isQuiz ? "品读模式" : "背诵挑战";
      }
    }

    const readerStage = document.getElementById("readerStage");
    if (readerStage) {
      readerStage.classList.toggle("quiz-mode-active", isQuiz);
    }

    if (quizControlBar) {
      quizControlBar.hidden = !isQuiz;
    }

    if (isQuiz) {
      generateQuizMask();
    } else {
      isRevealed = false;
      maskedLineIndices.clear();
      revealedLineIndices.clear();
      hintLevel = 0;
      if (lineIllustrationImg) {
        lineIllustrationImg.classList.remove("is-artwork-masked");
      }
    }

    renderCurrentPoem();
  }

  function setQuizSubMode(mode) {
    if (quizSubMode === mode) return;
    quizSubMode = mode;
    if (quizControlBar) {
      const tabs = quizControlBar.querySelectorAll(".quiz-tab-btn");
      tabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-quiz-mode") === mode));
    }
    if (quizSubOptions) {
      quizSubOptions.hidden = (mode !== "context_mask");
    }
    generateQuizMask();
    renderCurrentPoem();
  }

  function setMaskRule(rule) {
    if (maskRule === rule) return;
    maskRule = rule;
    if (quizSubOptions) {
      const pills = quizSubOptions.querySelectorAll(".subopt-pill");
      pills.forEach(p => p.classList.toggle("active", p.getAttribute("data-rule") === rule));
    }
    generateQuizMask();
    renderCurrentPoem();
  }

  function generateQuizMask() {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem || !poem.lines || !poem.lines.length) return;

    maskedLineIndices.clear();
    revealedLineIndices.clear();
    hintLevel = 0;
    isRevealed = false;
    currentLineIndex = -1;

    if (quizRevealBtnText) quizRevealBtnText.textContent = "翻开核验";
    if (quizRevealBtn) quizRevealBtn.classList.remove("is-active-reveal");
    if (quizMasteryBar) quizMasteryBar.hidden = true;

    const N = poem.lines.length;

    if (quizSubMode === "title_only") {
      for (let i = 0; i < N; i++) {
        maskedLineIndices.add(i);
      }
    } else {
      // Context Mask Mode
      if (maskRule === "half") {
        if (N <= 4) {
          const hideSecondHalf = Math.random() > 0.5;
          const start = hideSecondHalf ? 2 : 0;
          const end = hideSecondHalf ? N : Math.min(2, N);
          for (let i = start; i < end; i++) maskedLineIndices.add(i);
        } else {
          const choice = Math.floor(Math.random() * 3);
          if (choice === 0) {
            for (let i = 0; i < 4; i++) maskedLineIndices.add(i);
          } else if (choice === 1) {
            for (let i = 4; i < Math.min(8, N); i++) maskedLineIndices.add(i);
          } else {
            for (let i = 2; i < Math.min(6, N); i++) maskedLineIndices.add(i);
          }
        }
      } else if (maskRule === "next_line") {
        for (let i = 1; i < N; i += 2) {
          maskedLineIndices.add(i);
        }
      } else if (maskRule === "prev_line") {
        for (let i = 0; i < N; i += 2) {
          maskedLineIndices.add(i);
        }
      }

      if (maskedLineIndices.size === 0) {
        maskedLineIndices.add(Math.floor(N / 2));
      }
    }

    const record = poemMastery[poem.id];
    updateMasteryButtonsUI(record ? record.level : null);
  }

  function toggleQuizReveal() {
    if (appMode !== "quiz") return;
    if (!isRevealed) {
      revealQuiz();
    } else {
      generateQuizMask();
      renderCurrentPoem();
    }
  }

  function revealQuiz() {
    isRevealed = true;
    for (const idx of maskedLineIndices) {
      revealedLineIndices.add(idx);
    }
    if (currentLineIndex < 0) {
      currentLineIndex = 0;
    }
    if (quizRevealBtnText) quizRevealBtnText.textContent = "隐藏重背";
    if (quizRevealBtn) quizRevealBtn.classList.add("is-active-reveal");
    if (quizMasteryBar) quizMasteryBar.hidden = false;
    renderCurrentPoem();
  }

  function triggerQuizHint() {
    if (appMode !== "quiz" || isRevealed) return;
    hintLevel++;
    if (hintLevel === 1) {
      renderCurrentPoem();
    } else if (hintLevel === 2) {
      for (const idx of maskedLineIndices) {
        if (!revealedLineIndices.has(idx)) {
          revealedLineIndices.add(idx);
          if (currentLineIndex === -1) {
            currentLineIndex = idx;
          }
          break;
        }
      }
      renderCurrentPoem();
    } else {
      revealQuiz();
    }
  }

  function revealSingleLine(lineIdx) {
    if (appMode !== "quiz" || isRevealed) return;
    if (maskedLineIndices.has(lineIdx)) {
      currentLineIndex = lineIdx;
      revealedLineIndices.add(lineIdx);
      let allDone = true;
      for (const idx of maskedLineIndices) {
        if (!revealedLineIndices.has(idx)) {
          allDone = false;
          break;
        }
      }
      if (allDone) {
        isRevealed = true;
        if (quizRevealBtnText) quizRevealBtnText.textContent = "隐藏重背";
        if (quizRevealBtn) quizRevealBtn.classList.add("is-active-reveal");
        if (quizMasteryBar) quizMasteryBar.hidden = false;
      }
      renderCurrentPoem();
    }
  }

  /**
   * Initialize Application
   */
  async function init() {
    try {
      loadMastery();
      if (window.__TANG_POEMS_DATA__ && Array.isArray(window.__TANG_POEMS_DATA__)) {
        allPoems = window.__TANG_POEMS_DATA__;
      } else {
        const res = await fetch("data/poems.json");
        allPoems = await res.json();
      }
      visiblePoems = [...allPoems];

      // Init Theme & Preferences from localStorage
      if (localStorage.getItem("tang_theme") === "night") {
        setNightTheme(true);
      }
      if (localStorage.getItem("tang_pinyin") === "false") {
        setPinyinEnabled(false);
      }

      setupPoetFilterChips();
      setupCatalogDrawer();
      setupEventListeners();

      // Check URL Hash for deep-link: #poem-id or #poem-id:line
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const [targetId, lineNum] = hash.split(":");
        const pIndex = allPoems.findIndex(p => p.id === targetId);
        if (pIndex !== -1) {
          currentPoemIndex = pIndex;
          if (lineNum && !isNaN(parseInt(lineNum))) {
            currentLineIndex = Math.max(0, parseInt(lineNum) - 1);
          }
        }
      }

      renderCurrentPoem();
    } catch (err) {
      console.error("Failed to load poems:", err);
      versesList.innerHTML = `<div style="padding:20px;color:var(--cinnabar)">加载唐诗数据失败，请检查网络或刷新页面。</div>`;
    }
  }

  /**
   * Render Current Poem and Synchronize Line
   */
  function renderCurrentPoem() {
    if (!visiblePoems.length) return;
    if (currentPoemIndex >= visiblePoems.length) currentPoemIndex = 0;
    if (currentPoemIndex < 0) currentPoemIndex = visiblePoems.length - 1;

    const poem = visiblePoems[currentPoemIndex];

    // Ensure line index is in bounds
    if (currentLineIndex >= poem.lines.length) currentLineIndex = 0;
    if (currentLineIndex < 0) currentLineIndex = poem.lines.length - 1;

    // Update Header
    poemTitle.innerHTML = renderRuby(poem.title, poem.title_pinyin);
    poetName.textContent = poem.poet;
    poetSeal.textContent = poem.poet.slice(0, 1);
    poemFormBadge.textContent = poem.form || "唐诗名篇";

    // Tags
    poemTagsList.innerHTML = (poem.tags || [])
      .map(tag => `<span class="poem-tag">${escapeHtml(tag)}</span>`)
      .join("");

    // Mastery & Badge
    updateMasteryBadge();

    // Ensure quiz mask if in quiz mode
    if (appMode === "quiz" && maskedLineIndices.size === 0) {
      generateQuizMask();
    }

    // Lines list
    versesList.innerHTML = poem.lines
      .map((line, idx) => {
        const activeClass = idx === currentLineIndex ? "active" : "";
        const isLineMasked = appMode === "quiz" && maskedLineIndices.has(idx) && !revealedLineIndices.has(idx) && !isRevealed;

        if (isLineMasked) {
          let maskedTextHtml = "";
          const chars = Array.from(line.text);
          chars.forEach((ch, charIdx) => {
            if (CJK_RE.test(ch)) {
              if (charIdx === 0 && hintLevel >= 1) {
                maskedTextHtml += `<span class="masked-char-slot is-hinted" title="首字提示">${escapeHtml(ch)}</span>`;
              } else {
                maskedTextHtml += `<span class="masked-char-slot">〇</span>`;
              }
            } else {
              maskedTextHtml += `<span class="masked-punct">${escapeHtml(ch)}</span>`;
            }
          });

          return `
            <div class="verse-line is-masked ${activeClass}" data-line-index="${idx}" role="button" tabindex="0" title="按上下键移至此处或点击自动揭晓">
              <span class="line-num-stamp">${idx + 1}</span>
              <div class="line-text-wrap">${maskedTextHtml}</div>
              <span class="masked-line-badge">↓ 揭晓</span>
            </div>
          `;
        }

        const wasMaskedAndRevealed = appMode === "quiz" && maskedLineIndices.has(idx) && (revealedLineIndices.has(idx) || isRevealed);
        const justClass = wasMaskedAndRevealed ? "just-revealed" : "";
        const rubyHtml = renderRuby(line.text, line.pinyin);

        return `
          <div class="verse-line ${activeClass} ${justClass}" data-line-index="${idx}" role="button" tabindex="0">
            <span class="line-num-stamp">${idx + 1}</span>
            <div class="line-text-wrap">${rubyHtml}</div>
          </div>
        `;
      })
      .join("");

    // Stepper dots
    lineStepper.innerHTML = poem.lines
      .map((_, idx) => {
        const activeClass = idx === currentLineIndex ? "active" : "";
        return `<div class="step-dot ${activeClass}" data-line-index="${idx}" title="切换到第 ${idx + 1} 句"></div>`;
      })
      .join("");

    // Whole Poem Appreciation
    poemAppreciationBody.textContent = poem.appreciation || "暂无全诗赏析。";

    // Pager controls
    poemCounter.textContent = `${currentPoemIndex + 1} / ${visiblePoems.length}`;
    const prevIdx = (currentPoemIndex - 1 + visiblePoems.length) % visiblePoems.length;
    const nextIdx = (currentPoemIndex + 1) % visiblePoems.length;
    prevPoemTitle.textContent = visiblePoems[prevIdx].title;
    nextPoemTitle.textContent = visiblePoems[nextIdx].title;

    // Synchronize current line artwork & explanation
    syncLineState();

    // Update URL hash without jumping
    if (currentLineIndex >= 0) {
      history.replaceState(null, "", `#${poem.id}:${currentLineIndex + 1}`);
    } else {
      history.replaceState(null, "", `#${poem.id}`);
    }
  }

  /**
   * Synchronize Active Line, Illustration, and Line Explanation
   */
  function syncLineState() {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem) return;

    // Update active highlight in DOM
    const lineElements = versesList.querySelectorAll(".verse-line");
    lineElements.forEach((el, idx) => {
      el.classList.toggle("active", idx === currentLineIndex);
    });

    const stepDots = lineStepper.querySelectorAll(".step-dot");
    stepDots.forEach((el, idx) => {
      el.classList.toggle("active", idx === currentLineIndex);
    });

    // Quiz Mode Artwork & Explanation Masking
    const isArtworkMasked = appMode === "quiz" && !isRevealed;
    lineIllustrationImg.classList.toggle("is-artwork-masked", isArtworkMasked);

    let quizOverlay = document.getElementById("artworkQuizOverlay");
    if (isArtworkMasked) {
      if (!quizOverlay) {
        quizOverlay = document.createElement("div");
        quizOverlay.id = "artworkQuizOverlay";
        quizOverlay.className = "artwork-quiz-overlay";
        quizOverlay.innerHTML = `<span>🎴</span> <span>背诵挑战中 · 诗意暂隐</span>`;
        const frame = document.querySelector(".artwork-frame");
        if (frame) frame.appendChild(quizOverlay);
      }
      artworkLineBadge.textContent = currentLineIndex >= 0 ? `第 ${currentLineIndex + 1} / ${poem.lines.length} 句` : `挑战中 · 共 ${poem.lines.length} 句`;
      artworkPoeticFocus.textContent = "心中默背 · 移动解锁";

      const currentLine = currentLineIndex >= 0 ? poem.lines[currentLineIndex] : null;
      if (currentLine && (revealedLineIndices.has(currentLineIndex) || !maskedLineIndices.has(currentLineIndex))) {
        expLineText.textContent = currentLine.text;
        expTranslation.textContent = currentLine.translation || "暂无译文。";
        if (currentLine.explanation) {
          const parts = currentLine.explanation.split(/(?=【)/).filter(Boolean);
          if (parts.length > 1) {
            expWords.innerHTML = parts.map(p => `<p>${escapeHtml(p.trim())}</p>`).join("");
          } else {
            expWords.innerHTML = `<p>${escapeHtml(currentLine.explanation)}</p>`;
          }
        } else {
          expWords.innerHTML = "<p>字义清晓，意境直畅。</p>";
        }
      } else {
        expLineText.textContent = "背诵自测中";
        expTranslation.textContent = "按键盘上下键 (↓ / ↑) 移动至诗句自动解锁核对，或按空格键翻开全篇。";
        expWords.innerHTML = "<p>💡 快捷操作：按 ↓ / ↑ 移动自动解锁 · 按 H 锦囊提示 · 按 1-3 自评掌握度 · 按 R 换题</p>";
      }
      return;
    } else {
      if (quizOverlay) quizOverlay.remove();
    }

    const line = currentLineIndex >= 0 ? poem.lines[currentLineIndex] : poem.lines[0];
    if (!line) return;
    if (lineIllustrationImg.getAttribute("data-current-img") === imageUrl) {
      // Current image is already active; do not reload or flash
      artworkLineBadge.textContent = `第 ${currentLineIndex + 1} / ${poem.lines.length} 句`;
      artworkPoeticFocus.textContent = line.text;
      expLineText.textContent = line.text;
      expTranslation.textContent = line.translation || "暂无译文。";
      if (line.explanation) {
        const parts = line.explanation.split(/(?=【)/).filter(Boolean);
        if (parts.length > 1) {
          expWords.innerHTML = parts.map(p => `<p>${escapeHtml(p.trim())}</p>`).join("");
        } else {
          expWords.innerHTML = `<p>${escapeHtml(line.explanation)}</p>`;
        }
      } else {
        expWords.innerHTML = "<p>字义清晓，意境直畅。</p>";
      }
      return;
    }

    const swapToken = ++imageSwapToken;
    artworkLoading.classList.add("is-visible");
    artworkLoading.classList.remove("has-error");
    artworkLoading.querySelector(".artwork-loading-label").textContent = "正在加载配图…";
    lineIllustrationImg.classList.add("is-loading");
    const applyImage = () => {
      if (swapToken !== imageSwapToken) return;
      artworkLoading.classList.remove("is-visible");
      lineIllustrationImg.classList.remove("is-loading");
      lineIllustrationImg.classList.add("fade-out");
      requestAnimationFrame(() => {
        if (swapToken !== imageSwapToken) return;
        lineIllustrationImg.src = imageUrl;
        lineIllustrationImg.setAttribute("data-current-img", imageUrl);
        lineIllustrationImg.alt = `${poem.title} - ${poem.poet}`;
        requestAnimationFrame(() => lineIllustrationImg.classList.remove("fade-out"));
      });
    };
    let preload = imagePreloadCache.get(imageUrl);
    if (!preload) {
      preload = new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = imageUrl;
      });
      imagePreloadCache.set(imageUrl, preload);
    }
    preload.then(loaded => {
      if (swapToken !== imageSwapToken) return;
      if (!loaded && imageUrl !== DEFAULT_IMAGE) {
        lineIllustrationImg.src = DEFAULT_IMAGE;
        lineIllustrationImg.setAttribute("data-current-img", DEFAULT_IMAGE);
        lineIllustrationImg.alt = `${poem.title} - 默认意境图`;
        artworkLoading.classList.remove("is-visible");
        lineIllustrationImg.classList.remove("is-loading");
        return;
      }
      applyImage();
    });

    artworkLineBadge.textContent = `第 ${currentLineIndex + 1} / ${poem.lines.length} 句`;
    artworkPoeticFocus.textContent = line.text;

    // Line Explanation Update
    expLineText.textContent = line.text;
    expTranslation.textContent = line.translation || "暂无译文。";

    // Word glosses parsing (e.g. split by 【 or format nicely)
    if (line.explanation) {
      const parts = line.explanation.split(/(?=【)/).filter(Boolean);
      if (parts.length > 1) {
        expWords.innerHTML = parts.map(p => `<p>${escapeHtml(p.trim())}</p>`).join("");
      } else {
        expWords.innerHTML = `<p>${escapeHtml(line.explanation)}</p>`;
      }
    } else {
      expWords.innerHTML = "<p>字义清晓，意境直畅。</p>";
    }
  }

  /**
   * Line Switching Controls (Key Up / Down)
   */
  function nextLine() {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem || !poem.lines.length) return;
    let targetIndex;
    if (currentLineIndex === -1) {
      targetIndex = 0;
    } else if (currentLineIndex < poem.lines.length - 1) {
      targetIndex = currentLineIndex + 1;
    } else {
      targetIndex = 0;
    }
    goToLine(targetIndex);
  }

  function prevLine() {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem || !poem.lines.length) return;
    let targetIndex;
    if (currentLineIndex === -1 || currentLineIndex <= 0) {
      targetIndex = poem.lines.length - 1;
    } else {
      targetIndex = currentLineIndex - 1;
    }
    goToLine(targetIndex);
  }

  function goToLine(index) {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem || !poem.lines.length) return;
    if (index >= 0 && index < poem.lines.length) {
      currentLineIndex = index;
      if (appMode === "quiz" && !isRevealed && maskedLineIndices.has(currentLineIndex)) {
        revealSingleLine(currentLineIndex);
      } else {
        syncLineState();
      }
    }
  }

  /**
   * Poem Switching Controls (Key Left / Right)
   */
  function nextPoem() {
    currentPoemIndex = (currentPoemIndex + 1) % visiblePoems.length;
    currentLineIndex = 0;
    if (appMode === "quiz") {
      generateQuizMask();
    }
    renderCurrentPoem();
  }

  function prevPoem() {
    currentPoemIndex = (currentPoemIndex - 1 + visiblePoems.length) % visiblePoems.length;
    currentLineIndex = 0;
    if (appMode === "quiz") {
      generateQuizMask();
    }
    renderCurrentPoem();
  }

  function randomPoem() {
    if (visiblePoems.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * visiblePoems.length);
    if (nextIdx === currentPoemIndex) {
      nextIdx = (nextIdx + 1) % visiblePoems.length;
    }
    currentPoemIndex = nextIdx;
    currentLineIndex = 0;
    if (appMode === "quiz") {
      generateQuizMask();
    }
    renderCurrentPoem();
  }

  /**
   * Poet Filter Chips
   */
  function setupPoetFilterChips() {
    // Count poems per poet
    const poetCounts = {};
    allPoems.forEach(p => {
      poetCounts[p.poet] = (poetCounts[p.poet] || 0) + 1;
    });

    // Sort poets by count descending
    const sortedPoets = Object.keys(poetCounts).sort((a, b) => poetCounts[b] - poetCounts[a]);

    let html = `
      <button type="button" class="poet-chip active" data-poet="all">
        全部 <span class="chip-count">(${allPoems.length})</span>
      </button>
    `;

    sortedPoets.forEach(poet => {
      html += `
        <button type="button" class="poet-chip" data-poet="${escapeHtml(poet)}">
          ${escapeHtml(poet)} <span class="chip-count">(${poetCounts[poet]})</span>
        </button>
      `;
    });

    poetChipsContainer.innerHTML = html;

    poetChipsContainer.addEventListener("click", e => {
      const chip = e.target.closest(".poet-chip");
      if (!chip) return;
      const poet = chip.getAttribute("data-poet");
      filterByPoet(poet);
    });
  }

  function filterByPoet(poet) {
    selectedPoet = poet;
    // Update active chip
    const chips = poetChipsContainer.querySelectorAll(".poet-chip");
    chips.forEach(c => {
      c.classList.toggle("active", c.getAttribute("data-poet") === poet);
    });

    if (poet === "all") {
      visiblePoems = [...allPoems];
    } else {
      visiblePoems = allPoems.filter(p => p.poet === poet);
    }

    currentPoemIndex = 0;
    currentLineIndex = 0;
    renderCurrentPoem();
  }

  /**
   * Search Engine (Poet, Title, Content, Pinyin)
   */
  function handleSearchInput() {
    const rawQuery = searchInput.value.trim();
    if (!rawQuery) {
      clearSearchBtn.classList.remove("visible");
      searchResultsPanel.hidden = true;
      return;
    }

    clearSearchBtn.classList.add("visible");
    const q = rawQuery.toLowerCase();

    // Match candidate poems
    const results = [];

    allPoems.forEach(poem => {
      let matchType = null;
      let matchSnippet = "";
      let matchedLineIndex = 0;

      // Match Title
      if (poem.title.toLowerCase().includes(q) || (poem.title_pinyin && poem.title_pinyin.toLowerCase().includes(q))) {
        matchType = "title";
        matchSnippet = `《${highlightText(poem.title, rawQuery)}》`;
      }
      // Match Poet
      else if (poem.poet.toLowerCase().includes(q) || (poem.poet_pinyin && poem.poet_pinyin.toLowerCase().includes(q))) {
        matchType = "poet";
        matchSnippet = `诗人：${highlightText(poem.poet, rawQuery)}`;
      }
      // Match Lines
      else {
        for (let i = 0; i < poem.lines.length; i++) {
          const l = poem.lines[i];
          if (l.text.toLowerCase().includes(q) || (l.pinyin && l.pinyin.toLowerCase().includes(q))) {
            matchType = "line";
            matchSnippet = highlightText(l.text, rawQuery);
            matchedLineIndex = i;
            break;
          }
        }
      }

      if (matchType) {
        results.push({
          poem,
          matchType,
          matchSnippet,
          matchedLineIndex,
        });
      }
    });

    renderSearchResults(results, rawQuery);
  }

  function highlightText(text, term) {
    if (!term) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    return escaped.replace(regex, "<mark>$1</mark>");
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function renderSearchResults(results, query) {
    searchResultsPanel.hidden = false;
    searchResultCount.textContent = `找到 ${results.length} 首匹配诗作`;

    if (results.length === 0) {
      searchResultsList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--ink-muted); font-size: 0.88rem;">
          未找到与“${escapeHtml(query)}”相关的唐诗或诗句
        </div>
      `;
      return;
    }

    searchResultsList.innerHTML = results
      .slice(0, 20)
      .map((item, idx) => {
        return `
          <div class="search-result-item" data-poem-id="${item.poem.id}" data-line-index="${item.matchedLineIndex}" role="option">
            <div class="sr-top">
              <span class="sr-title">${escapeHtml(item.poem.title)}</span>
              <span class="sr-poet">${escapeHtml(item.poem.poet)}</span>
              <span class="sr-form">${escapeHtml(item.poem.form)}</span>
            </div>
            <div class="sr-match-line">${item.matchSnippet}</div>
          </div>
        `;
      })
      .join("");
  }

  /**
   * Catalog Drawer
   */
  function setupCatalogDrawer() {
    renderCatalogGrid("all");

    drawerFilterPills.addEventListener("click", e => {
      const pill = e.target.closest(".drawer-pill");
      if (!pill) return;
      drawerFilterPills.querySelectorAll(".drawer-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const form = pill.getAttribute("data-filter");
      renderCatalogGrid(form);
    });

    catalogGrid.addEventListener("click", e => {
      const card = e.target.closest(".catalog-item-card");
      if (!card) return;
      const pid = card.getAttribute("data-poem-id");
      const idx = visiblePoems.findIndex(p => p.id === pid);
      if (idx !== -1) {
        currentPoemIndex = idx;
        currentLineIndex = 0;
        renderCurrentPoem();
        closeCatalogDrawer();
      } else {
        // If poet filter hid it, reset poet filter
        filterByPoet("all");
        const newIdx = visiblePoems.findIndex(p => p.id === pid);
        if (newIdx !== -1) {
          currentPoemIndex = newIdx;
          currentLineIndex = 0;
          renderCurrentPoem();
          closeCatalogDrawer();
        }
      }
    });
  }

  function renderCatalogGrid(formFilter) {
    const list = formFilter === "all" ? allPoems : allPoems.filter(p => p.form === formFilter);

    catalogGrid.innerHTML = list
      .map(p => {
        const isActive = visiblePoems[currentPoemIndex]?.id === p.id ? "active" : "";
        return `
          <div class="catalog-item-card ${isActive}" data-poem-id="${p.id}">
            <div class="cat-item-title">《${escapeHtml(p.title)}》</div>
            <div class="cat-item-meta">
              <span class="cat-item-poet">${escapeHtml(p.poet)}</span>
              <span>${p.lines.length} 句 · ${escapeHtml(p.form)}</span>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function openCatalogDrawer() {
    catalogDrawer.hidden = false;
    catalogDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderCatalogGrid("all");
  }

  function closeCatalogDrawer() {
    catalogDrawer.hidden = true;
    catalogDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /**
   * Theme & Pinyin Toggles
   */
  function setNightTheme(night) {
    isNightTheme = night;
    document.body.classList.toggle("theme-night", isNightTheme);
    themeToggleBtn.querySelector(".theme-icon").textContent = isNightTheme ? "☀️" : "🌙";
    localStorage.setItem("tang_theme", isNightTheme ? "night" : "day");
  }

  function setPinyinEnabled(enabled) {
    isPinyinEnabled = enabled;
    document.body.classList.toggle("pinyin-enabled", isPinyinEnabled);
    pinyinToggleBtn.setAttribute("aria-pressed", isPinyinEnabled ? "true" : "false");
    localStorage.setItem("tang_pinyin", isPinyinEnabled ? "true" : "false");
  }

  /**
   * Event Listeners & Keyboard Handler
   */
  function setupEventListeners() {
    // Click on Line to select or reveal in quiz mode
    versesList.addEventListener("click", e => {
      const lineItem = e.target.closest(".verse-line");
      if (lineItem) {
        const idx = parseInt(lineItem.getAttribute("data-line-index"), 10);
        goToLine(idx);
      }
    });

    // Click on Stepper Dot
    lineStepper.addEventListener("click", e => {
      const dot = e.target.closest(".step-dot");
      if (dot) {
        const idx = parseInt(dot.getAttribute("data-line-index"), 10);
        goToLine(idx);
      }
    });

    // Mode Toggle Button
    if (gameModeToggleBtn) {
      gameModeToggleBtn.addEventListener("click", () => toggleGameMode());
    }

    // Quiz Controls
    if (quizControlBar) {
      quizControlBar.addEventListener("click", e => {
        const tab = e.target.closest(".quiz-tab-btn");
        if (tab) {
          const mode = tab.getAttribute("data-quiz-mode");
          setQuizSubMode(mode);
          return;
        }

        const pill = e.target.closest(".subopt-pill");
        if (pill) {
          const rule = pill.getAttribute("data-rule");
          setMaskRule(rule);
          return;
        }

        const mBtn = e.target.closest(".mastery-btn");
        if (mBtn) {
          const m = mBtn.getAttribute("data-mastery");
          setMastery(m);
          return;
        }
      });
    }

    if (quizHintBtn) quizHintBtn.addEventListener("click", triggerQuizHint);
    if (quizRevealBtn) quizRevealBtn.addEventListener("click", toggleQuizReveal);
    if (quizRerollBtn) {
      quizRerollBtn.addEventListener("click", () => {
        generateQuizMask();
        renderCurrentPoem();
      });
    }

    // Prev / Next Poem Buttons
    prevPoemBtn.addEventListener("click", prevPoem);
    nextPoemBtn.addEventListener("click", nextPoem);
    randomPoemBtn.addEventListener("click", randomPoem);

    // Toggle Buttons
    pinyinToggleBtn.addEventListener("click", () => setPinyinEnabled(!isPinyinEnabled));
    themeToggleBtn.addEventListener("click", () => setNightTheme(!isNightTheme));

    // Drawer Buttons
    catalogBtn.addEventListener("click", openCatalogDrawer);
    closeDrawerBtn.addEventListener("click", closeCatalogDrawer);
    drawerBackdrop.addEventListener("click", closeCatalogDrawer);

    // Search input
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) searchResultsPanel.hidden = false;
    });

    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearSearchBtn.classList.remove("visible");
      searchResultsPanel.hidden = true;
      searchInput.focus();
    });

    searchResultsList.addEventListener("click", e => {
      const item = e.target.closest(".search-result-item");
      if (!item) return;
      const pid = item.getAttribute("data-poem-id");
      const lineIdx = parseInt(item.getAttribute("data-line-index"), 10) || 0;

      // Locate poem
      let idx = visiblePoems.findIndex(p => p.id === pid);
      if (idx === -1) {
        filterByPoet("all");
        idx = visiblePoems.findIndex(p => p.id === pid);
      }

      if (idx !== -1) {
        currentPoemIndex = idx;
        currentLineIndex = lineIdx;
        if (appMode === "quiz") {
          generateQuizMask();
        }
        renderCurrentPoem();
      }

      searchResultsPanel.hidden = true;
    });

    // Close search panel when clicking outside
    document.addEventListener("click", e => {
      if (!searchInput.contains(e.target) && !searchResultsPanel.contains(e.target)) {
        searchResultsPanel.hidden = true;
      }
    });

    // Global Keyboard Navigation
    document.addEventListener("keydown", e => {
      // Ignore when user is typing in search input
      if (document.activeElement === searchInput) {
        if (e.key === "Escape") {
          searchInput.blur();
          searchResultsPanel.hidden = true;
        }
        return;
      }

      // Close drawer on Escape
      if (e.key === "Escape") {
        if (!catalogDrawer.hidden) {
          closeCatalogDrawer();
          return;
        }
        searchResultsPanel.hidden = true;
        return;
      }

      switch (e.key) {
        case "g":
        case "G":
          e.preventDefault();
          toggleGameMode();
          break;

        case " ":
          if (appMode === "quiz") {
            e.preventDefault();
            toggleQuizReveal();
          }
          break;

        case "h":
        case "H":
          if (appMode === "quiz") {
            e.preventDefault();
            triggerQuizHint();
          }
          break;

        case "1":
          if (appMode === "quiz" && isRevealed) {
            e.preventDefault();
            setMastery("forgot");
          }
          break;

        case "2":
          if (appMode === "quiz" && isRevealed) {
            e.preventDefault();
            setMastery("vague");
          }
          break;

        case "3":
          if (appMode === "quiz" && isRevealed) {
            e.preventDefault();
            setMastery("mastered");
          }
          break;

        case "ArrowDown":
        case "j":
        case "J":
        case "PageDown":
          e.preventDefault();
          nextLine();
          break;

        case "ArrowUp":
        case "k":
        case "K":
        case "PageUp":
          e.preventDefault();
          prevLine();
          break;

        case "ArrowRight":
        case "]":
          e.preventDefault();
          nextPoem();
          break;

        case "ArrowLeft":
        case "[":
          e.preventDefault();
          prevPoem();
          break;

        case "/":
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
          break;

        case "p":
        case "P":
          e.preventDefault();
          setPinyinEnabled(!isPinyinEnabled);
          break;

        case "m":
        case "M":
          e.preventDefault();
          if (catalogDrawer.hidden) {
            openCatalogDrawer();
          } else {
            closeCatalogDrawer();
          }
          break;

        case "r":
        case "R":
          e.preventDefault();
          randomPoem();
          break;
      }
    });
  }

  // Start app on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
