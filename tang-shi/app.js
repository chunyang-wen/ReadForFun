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

  // DOM Elements
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchResultsPanel = document.getElementById("searchResultsPanel");
  const searchResultsList = document.getElementById("searchResultsList");
  const searchResultCount = document.getElementById("searchResultCount");

  const pinyinToggleBtn = document.getElementById("pinyinToggleBtn");
  const catalogBtn = document.getElementById("catalogBtn");
  const randomPoemBtn = document.getElementById("randomPoemBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  const poetChipsContainer = document.getElementById("poetChipsContainer");

  const poemTitle = document.getElementById("poemTitle");
  const poetName = document.getElementById("poetName");
  const poetSeal = document.getElementById("poetSeal");
  const poemFormBadge = document.getElementById("poemFormBadge");
  const poemTagsList = document.getElementById("poemTagsList");
  const versesList = document.getElementById("versesList");
  const lineStepper = document.getElementById("lineStepper");
  const poemAppreciationBody = document.getElementById("poemAppreciationBody");

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
   * Initialize Application
   */
  async function init() {
    try {
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

    // Lines list
    versesList.innerHTML = poem.lines
      .map((line, idx) => {
        const activeClass = idx === currentLineIndex ? "active" : "";
        const rubyHtml = renderRuby(line.text, line.pinyin);
        return `
          <div class="verse-line ${activeClass}" data-line-index="${idx}" role="button" tabindex="0">
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
    history.replaceState(null, "", `#${poem.id}:${currentLineIndex + 1}`);
  }

  /**
   * Synchronize Active Line, Illustration, and Line Explanation
   */
  function syncLineState() {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem) return;
    const line = poem.lines[currentLineIndex];
    if (!line) return;

    // Update active highlight in DOM
    const lineElements = versesList.querySelectorAll(".verse-line");
    lineElements.forEach((el, idx) => {
      el.classList.toggle("active", idx === currentLineIndex);
    });

    const stepDots = lineStepper.querySelectorAll(".step-dot");
    stepDots.forEach((el, idx) => {
      el.classList.toggle("active", idx === currentLineIndex);
    });

    // Preload before swapping so keyboard navigation never waits on the network.
    const imageUrl = poem.image || line.image || DEFAULT_IMAGE;
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
    if (!poem) return;
    if (currentLineIndex < poem.lines.length - 1) {
      currentLineIndex++;
      syncLineState();
    } else {
      // Loop to line 0 or pulse indicator
      currentLineIndex = 0;
      syncLineState();
    }
  }

  function prevLine() {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem) return;
    if (currentLineIndex > 0) {
      currentLineIndex--;
      syncLineState();
    } else {
      currentLineIndex = poem.lines.length - 1;
      syncLineState();
    }
  }

  function goToLine(index) {
    const poem = visiblePoems[currentPoemIndex];
    if (!poem) return;
    if (index >= 0 && index < poem.lines.length) {
      currentLineIndex = index;
      syncLineState();
    }
  }

  /**
   * Poem Switching Controls (Key Left / Right)
   */
  function nextPoem() {
    currentPoemIndex = (currentPoemIndex + 1) % visiblePoems.length;
    currentLineIndex = 0;
    renderCurrentPoem();
  }

  function prevPoem() {
    currentPoemIndex = (currentPoemIndex - 1 + visiblePoems.length) % visiblePoems.length;
    currentLineIndex = 0;
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
    // Click on Line to select
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
