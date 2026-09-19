/**
 * 《中华歇后语·俗语大全》 Core Application Controller
 * High-performance interactive reader with riddle guessing, ruby pinyin, search & catalog.
 */

(function () {
  "use strict";

  // Configuration & Constants
  const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/;
  const R2_DEFAULT_IMAGE = "https://readforfun-img.chunyangwen.com/tang-shi/assets/default-classical.svg";
  const LOCAL_DEFAULT_IMAGE = R2_DEFAULT_IMAGE;

  // App State
  let items = [];
  let filteredItems = [];
  let currentIndex = 0;
  let activeCategory = "all";
  let isRiddleMode = true;
  let isPinyinEnabled = true;
  let isNightMode = false;
  let isAnswerRevealed = false;
  let imageSwapToken = 0;

  // DOM Element Selectors
  const dom = {
    body: document.body,
    searchInput: document.getElementById("searchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    searchResultsPanel: document.getElementById("searchResultsPanel"),
    searchResultCount: document.getElementById("searchResultCount"),
    searchResultsList: document.getElementById("searchResultsList"),
    modeToggleBtn: document.getElementById("modeToggleBtn"),
    modeLabel: document.getElementById("modeLabel"),
    pinyinToggleBtn: document.getElementById("pinyinToggleBtn"),
    catalogBtn: document.getElementById("catalogBtn"),
    randomBtn: document.getElementById("randomBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    audioToggleBtn: document.getElementById("audioToggleBtn"),
    categoryChips: document.getElementById("categoryChipsContainer"),

    // Reader Stage
    cardCategoryBadge: document.getElementById("cardCategoryBadge"),
    cardIndexBadge: document.getElementById("cardIndexBadge"),
    cardTagsGroup: document.getElementById("cardTagsGroup"),
    riddleText: document.getElementById("riddleText"),
    answerContainer: document.getElementById("answerContainer"),
    revealBtn: document.getElementById("revealBtn"),
    answerContent: document.getElementById("answerContent"),
    answerText: document.getElementById("answerText"),
    homophoneBox: document.getElementById("homophoneBox"),
    homophoneDetail: document.getElementById("homophoneDetail"),

    expMeaning: document.getElementById("expMeaning"),
    expStory: document.getElementById("expStory"),
    expUsage: document.getElementById("expUsage"),
    expExample: document.getElementById("expExample"),

    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    prevTitle: document.getElementById("prevTitle"),
    nextTitle: document.getElementById("nextTitle"),
    counterDisplay: document.getElementById("counterDisplay"),

    // Artwork Column
    artworkImg: document.getElementById("artworkImg"),
    artworkLoading: document.getElementById("artworkLoading"),
    artworkBadge: document.getElementById("artworkBadge"),
    artworkCaption: document.getElementById("artworkCaption"),
    copyShareBtn: document.getElementById("copyShareBtn"),
    quickRandomBtn: document.getElementById("quickRandomBtn"),
    quickDrawerBtn: document.getElementById("quickDrawerBtn"),

    // Drawer
    catalogDrawer: document.getElementById("catalogDrawer"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    closeDrawerBtn: document.getElementById("closeDrawerBtn"),
    drawerSearchInput: document.getElementById("drawerSearchInput"),
    drawerFilterPills: document.getElementById("drawerFilterPills"),
    catalogGrid: document.getElementById("catalogGrid"),

    toastMessage: document.getElementById("toastMessage")
  };

  // Audio state
  const BGM_SRC = "https://readforfun-img.chunyangwen.com/audio/bgm-reading.mp3?v=3";
  const BGM_FALLBACK = "../audio/bgm-reading.mp3";
  const SFX_DATA = "data:audio/mp3;base64,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";
  const TARGET_BGM_VOL = 0.22;
  let isAudioEnabled = localStorage.getItem("rff_bgm_enabled") !== "false";
  let bgm = null, audioStarted = false, bgmFadeTimer = null;
  let sfxPool = [], sfxIdx = 0, lastSfxTime = 0;
  let lastRenderedItemId = null;

  function initAudio() {
    if (!bgm) {
      bgm = new Audio(BGM_SRC);
      bgm.loop = true;
      bgm.preload = "auto";
      bgm.addEventListener("error", () => {
        if (bgm.src !== BGM_FALLBACK && !bgm.src.endsWith(BGM_FALLBACK)) {
          bgm.src = BGM_FALLBACK;
          bgm.load();
        }
      }, { once: true });
      bgm.load();
    }
    if (!sfxPool.length) {
      sfxPool = [new Audio(SFX_DATA), new Audio(SFX_DATA), new Audio(SFX_DATA)];
      sfxPool.forEach(a => { a.preload = "auto"; a.load(); });
    }
  }

  function fadeBgm(target, duration = 800) {
    if (!bgm) return;
    clearInterval(bgmFadeTimer);
    const start = bgm.volume;
    const steps = 16;
    const stepTime = Math.max(16, duration / steps);
    let step = 0;
    bgmFadeTimer = setInterval(() => {
      step++;
      const v = start + (target - start) * (step / steps);
      bgm.volume = Math.max(0, Math.min(1, v));
      if (step >= steps) {
        clearInterval(bgmFadeTimer);
        if (target === 0) bgm.pause();
      }
    }, stepTime);
  }

  function updateAudioBtnUI() {
    if (!dom.audioToggleBtn) return;
    dom.audioToggleBtn.setAttribute("aria-pressed", String(isAudioEnabled));
    const icon = dom.audioToggleBtn.querySelector(".btn-icon");
    const label = dom.audioToggleBtn.querySelector(".btn-label");
    if (isAudioEnabled) {
      dom.audioToggleBtn.classList.remove("is-muted");
      if (icon) icon.textContent = "🎵";
      if (label) label.textContent = "音乐";
    } else {
      dom.audioToggleBtn.classList.add("is-muted");
      if (icon) icon.textContent = "🔇";
      if (label) label.textContent = "静音";
    }
  }

  function tryStartBgm() {
    if (!isAudioEnabled || audioStarted) return;
    initAudio();
    bgm.volume = 0.16;
    const p = bgm.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        audioStarted = true;
        fadeBgm(TARGET_BGM_VOL, 800);
        updateAudioBtnUI();
      }).catch(() => {});
    }
  }

  function playTurnSound() {
    if (!isAudioEnabled) return;
    const now = Date.now();
    if (now - lastSfxTime < 180) return;
    lastSfxTime = now;
    try {
      initAudio();
      const a = sfxPool[sfxIdx];
      sfxIdx = (sfxIdx + 1) % sfxPool.length;
      a.currentTime = 0;
      a.volume = 0.45;
      a.play().catch(() => {});
    } catch (e) {}
  }

  function toggleAudio() {
    initAudio();
    isAudioEnabled = !isAudioEnabled;
    localStorage.setItem("rff_bgm_enabled", String(isAudioEnabled));
    updateAudioBtnUI();
    if (isAudioEnabled) {
      if (bgm.paused) {
        bgm.volume = 0.16;
        bgm.play().then(() => {
          audioStarted = true;
          fadeBgm(TARGET_BGM_VOL, 600);
        }).catch(() => {});
      } else {
        fadeBgm(TARGET_BGM_VOL, 500);
      }
    } else {
      fadeBgm(0, 400);
    }
  }

  // Preload audio immediately on script load
  initAudio();

  // Attempt eager autoplay on load (if allowed by browser policy)
  tryStartBgm();

  const onFirstInteract = () => {
    tryStartBgm();
    ["pointerdown", "touchstart", "mousedown", "keydown", "click"].forEach(evt =>
      window.removeEventListener(evt, onFirstInteract, true)
    );
  };
  ["pointerdown", "touchstart", "mousedown", "keydown", "click"].forEach(evt =>
    window.addEventListener(evt, onFirstInteract, { once: true, capture: true })
  );

  /**
   * Escape HTML utility
   */
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Render text with ruby pinyin tags
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

  /**
   * Initialize App and Load Data
   */
  async function init() {
    // 1. Restore persistent user preferences
    isPinyinEnabled = localStorage.getItem("readforfun_xiehouyu_pinyin") !== "false";
    isRiddleMode = localStorage.getItem("readforfun_xiehouyu_riddle") !== "false";
    isNightMode = localStorage.getItem("readforfun_xiehouyu_night") === "true";

    applyPreferences();

    // 2. Load dataset
    if (window.__XIEHOUYU_DATA__ && Array.isArray(window.__XIEHOUYU_DATA__)) {
      items = window.__XIEHOUYU_DATA__;
    } else {
      try {
        const resp = await fetch("data/xiehouyu.json");
        items = await resp.json();
      } catch (err) {
        console.error("Failed to load dataset:", err);
        showToast("数据加载失败，请刷新重试");
        return;
      }
    }

    filteredItems = [...items];

    // 3. Resolve initial index from URL Hash or default to 0
    parseUrlHash();

    // 4. Bind UI Events
    bindEvents();

    // 5. Initial Render
    renderCurrentCard();
    renderCatalogGrid();
  }

  /**
   * Apply user preferences to DOM classes
   */
  function applyPreferences() {
    dom.body.classList.toggle("pinyin-enabled", isPinyinEnabled);
    dom.pinyinToggleBtn.setAttribute("aria-pressed", String(isPinyinEnabled));

    dom.body.classList.toggle("riddle-mode", isRiddleMode);
    dom.modeLabel.textContent = isRiddleMode ? "猜谜模式" : "畅读模式";

    dom.body.classList.toggle("theme-night", isNightMode);
    const themeIcon = dom.themeToggleBtn.querySelector(".theme-icon");
    if (themeIcon) {
      themeIcon.textContent = isNightMode ? "☀️" : "🌙";
    }
  }

  /**
   * Parse URL Hash to restore position
   */
  function parseUrlHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      currentIndex = 0;
      return;
    }

    const matchedIdx = items.findIndex(it => it.id === hash || `item-${it.index}` === hash);
    if (matchedIdx !== -1) {
      currentIndex = matchedIdx;
    } else {
      currentIndex = 0;
    }
  }

  /**
   * Render Current Xiehouyu Card
   */
  function renderCurrentCard() {
    const item = filteredItems[currentIndex];
    if (!item) return;

    if (lastRenderedItemId !== null && lastRenderedItemId !== item.id) {
      playTurnSound();
    }
    lastRenderedItemId = item.id;

    // Reset riddle reveal state for new card
    isAnswerRevealed = false;
    dom.answerContainer.classList.remove("is-revealed");

    // Update URL hash without scroll jumps
    if (history.replaceState) {
      history.replaceState(null, "", `#${item.id}`);
    }

    // Top Meta
    dom.cardCategoryBadge.textContent = item.category || "经典歇后语";
    dom.cardIndexBadge.textContent = `第 ${String(item.index).padStart(3, "0")} / ${items.length} 条`;

    // Tags
    if (Array.isArray(item.tags) && item.tags.length > 0) {
      dom.cardTagsGroup.innerHTML = item.tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join("");
    } else {
      dom.cardTagsGroup.innerHTML = "";
    }

    // Core Phrase
    dom.riddleText.innerHTML = renderRuby(item.riddle, item.riddle_pinyin);
    dom.answerText.innerHTML = renderRuby(item.answer, item.answer_pinyin);

    // Homophone Box
    if (item.homophone) {
      dom.homophoneBox.hidden = false;
      dom.homophoneDetail.textContent = item.homophone;
    } else {
      dom.homophoneBox.hidden = true;
      dom.homophoneDetail.textContent = "";
    }

    // Explanations
    dom.expMeaning.textContent = item.meaning || "暂无释义。";
    dom.expStory.textContent = item.story || "民间流传已久，源远流长。";
    dom.expUsage.textContent = item.usage || "生动风趣，常用于日常口语谈笑。";
    dom.expExample.textContent = item.example ? `“${item.example}”` : `“面对这种情况，正如${item.riddle}——${item.answer}！”`;

    // Pager & Counter
    dom.counterDisplay.textContent = `${currentIndex + 1} / ${filteredItems.length}`;

    const prevItem = filteredItems[currentIndex - 1];
    const nextItem = filteredItems[currentIndex + 1];

    dom.prevBtn.disabled = !prevItem;
    dom.nextBtn.disabled = !nextItem;

    dom.prevTitle.textContent = prevItem ? prevItem.riddle : "已是第一条";
    dom.nextTitle.textContent = nextItem ? nextItem.riddle : "已是最后一条";

    // Artwork Illustration
    updateArtwork(item);
  }

  /**
   * Update Artwork Image with fallback resilience
   */
  function updateArtwork(item) {
    const swapToken = ++imageSwapToken;
    dom.artworkLoading.classList.add("is-visible");
    dom.artworkBadge.textContent = item.category || "歇后语";
    dom.artworkCaption.textContent = item.riddle;

    const targetUrl = item.image || R2_DEFAULT_IMAGE;
    const img = new Image();
    let isLoaded = false;

    img.onload = () => {
      if (swapToken !== imageSwapToken) return;
      isLoaded = true;
      dom.artworkLoading.classList.remove("is-visible");
      dom.artworkImg.src = targetUrl;
    };

    img.onerror = () => {
      if (swapToken !== imageSwapToken) return;
      // If specific item webp failed, fallback to Cloudflare R2 default-classical.svg
      if (targetUrl !== R2_DEFAULT_IMAGE) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          if (swapToken !== imageSwapToken) return;
          dom.artworkLoading.classList.remove("is-visible");
          dom.artworkImg.src = R2_DEFAULT_IMAGE;
        };
        fallbackImg.onerror = () => {
          // Offline fallback
          if (swapToken !== imageSwapToken) return;
          dom.artworkLoading.classList.remove("is-visible");
          dom.artworkImg.src = LOCAL_DEFAULT_IMAGE;
        };
        fallbackImg.src = R2_DEFAULT_IMAGE;
      } else {
        dom.artworkLoading.classList.remove("is-visible");
        dom.artworkImg.src = LOCAL_DEFAULT_IMAGE;
      }
    };

    img.src = targetUrl;
  }

  /**
   * Reveal Punchline in Riddle Mode
   */
  function revealAnswer() {
    if (isAnswerRevealed) return;
    isAnswerRevealed = true;
    dom.answerContainer.classList.add("is-revealed");
  }

  /**
   * Navigate to target index
   */
  function goToIndex(idx) {
    if (idx < 0 || idx >= filteredItems.length) return;
    currentIndex = idx;
    renderCurrentCard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Go to next item
   */
  function nextItem() {
    if (currentIndex < filteredItems.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      showToast("已到达本辑最后一条");
    }
  }

  /**
   * Go to previous item
   */
  function prevItem() {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    } else {
      showToast("已是第一条");
    }
  }

  /**
   * Go to a random item
   */
  function randomItem() {
    if (filteredItems.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * filteredItems.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % filteredItems.length;
    }
    goToIndex(nextIdx);
    showToast(`🎲 漫游至第 ${nextIdx + 1} 条`);
  }

  /**
   * Filter items by Category
   */
  function filterByCategory(cat) {
    activeCategory = cat;

    // Update category chips in header
    dom.categoryChips.querySelectorAll(".category-chip").forEach(chip => {
      chip.classList.toggle("active", chip.getAttribute("data-cat") === cat);
    });

    // Update drawer pills
    dom.drawerFilterPills.querySelectorAll(".drawer-pill").forEach(pill => {
      pill.classList.toggle("active", pill.getAttribute("data-filter") === cat);
    });

    if (cat === "all") {
      filteredItems = [...items];
    } else {
      filteredItems = items.filter(it => it.category === cat);
    }

    currentIndex = 0;
    renderCurrentCard();
    renderCatalogGrid();
  }

  /**
   * Render 500-Item Catalog Drawer Grid
   */
  function renderCatalogGrid() {
    const searchTerm = (dom.drawerSearchInput.value || "").trim().toLowerCase();
    let displayList = filteredItems;

    if (searchTerm) {
      displayList = displayList.filter(it => 
        it.riddle.toLowerCase().includes(searchTerm) ||
        it.answer.toLowerCase().includes(searchTerm) ||
        it.meaning.toLowerCase().includes(searchTerm) ||
        (it.riddle_pinyin && it.riddle_pinyin.toLowerCase().includes(searchTerm)) ||
        (it.answer_pinyin && it.answer_pinyin.toLowerCase().includes(searchTerm))
      );
    }

    if (displayList.length === 0) {
      dom.catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--ink-muted);">
          未找到匹配的歇后语或俗语条目
        </div>
      `;
      return;
    }

    dom.catalogGrid.innerHTML = displayList.map(it => {
      const isSelected = filteredItems[currentIndex] && filteredItems[currentIndex].id === it.id;
      return `
        <article class="catalog-card ${isSelected ? 'active' : ''}" data-id="${it.id}">
          <div class="catalog-card-header">
            <span class="catalog-card-index">#${String(it.index).padStart(3, "0")}</span>
            <span class="catalog-card-cat">${escapeHtml(it.category)}</span>
          </div>
          <div class="catalog-card-riddle">${escapeHtml(it.riddle)}</div>
          <div class="catalog-card-answer">—— ${escapeHtml(it.answer)}</div>
        </article>
      `;
    }).join("");
  }

  /**
   * Search Live Autocomplete & Dropdown
   */
  function handleLiveSearch() {
    const q = dom.searchInput.value.trim().toLowerCase();
    dom.clearSearchBtn.classList.toggle("is-visible", Boolean(q));

    if (!q) {
      dom.searchResultsPanel.hidden = true;
      return;
    }

    const matches = items.filter(it => 
      it.riddle.toLowerCase().includes(q) ||
      it.answer.toLowerCase().includes(q) ||
      it.meaning.toLowerCase().includes(q) ||
      it.story.toLowerCase().includes(q) ||
      (it.riddle_pinyin && it.riddle_pinyin.toLowerCase().includes(q)) ||
      (it.answer_pinyin && it.answer_pinyin.toLowerCase().includes(q)) ||
      (Array.isArray(it.tags) && it.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 10);

    dom.searchResultCount.textContent = `找到 ${matches.length} 条相关结果`;
    dom.searchResultsPanel.hidden = false;

    if (matches.length === 0) {
      dom.searchResultsList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--ink-muted); font-size: 0.85rem;">
          未检索到与“${escapeHtml(q)}”匹配的内容
        </div>
      `;
      return;
    }

    dom.searchResultsList.innerHTML = matches.map(it => {
      const highlightedPhrase = escapeHtml(`${it.riddle}——${it.answer}`)
        .replace(new RegExp(escapeHtml(q), "gi"), match => `<mark>${match}</mark>`);
      return `
        <div class="search-result-item" data-id="${it.id}">
          <div class="res-phrase">${highlightedPhrase}</div>
          <div class="res-desc">${escapeHtml(it.meaning)}</div>
        </div>
      `;
    }).join("");
  }

  /**
   * Copy current entry text to clipboard
   */
  function copyCurrentEntry() {
    const it = filteredItems[currentIndex];
    if (!it) return;

    const copyText = `【${it.riddle} —— ${it.answer}】\n【拼音】${it.riddle_pinyin} —— ${it.answer_pinyin}\n【分类】${it.category}\n【释义】${it.meaning}\n【典故】${it.story}\n【例句】${it.example}\n（来源：ReadForFun 中华歇后语·俗语大全）`;

    navigator.clipboard.writeText(copyText).then(() => {
      showToast("✓ 已复制当前歇后语与典故至剪贴板");
    }).catch(() => {
      showToast("复制失败，请手动选取");
    });
  }

  /**
   * Toast notification helper
   */
  let toastTimer = null;
  function showToast(msg) {
    dom.toastMessage.textContent = msg;
    dom.toastMessage.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toastMessage.hidden = true;
    }, 2400);
  }

  /**
   * Bind All UI and Keyboard Events
   */
  function bindEvents() {
    // Reveal Punchline Button
    dom.revealBtn.addEventListener("click", revealAnswer);

    // Mode Toggle (Riddle vs Reading)
    dom.modeToggleBtn.addEventListener("click", () => {
      isRiddleMode = !isRiddleMode;
      localStorage.setItem("readforfun_xiehouyu_riddle", String(isRiddleMode));
      applyPreferences();
      showToast(isRiddleMode ? "🎭 已切换为猜谜揭晓模式" : "📖 已切换为畅读全览模式");
    });

    // Pinyin Toggle
    dom.pinyinToggleBtn.addEventListener("click", () => {
      isPinyinEnabled = !isPinyinEnabled;
      localStorage.setItem("readforfun_xiehouyu_pinyin", String(isPinyinEnabled));
      applyPreferences();
      showToast(isPinyinEnabled ? "拼音标注已开启" : "拼音标注已隐藏");
    });

    // Theme Toggle
    dom.themeToggleBtn.addEventListener("click", () => {
      isNightMode = !isNightMode;
      localStorage.setItem("readforfun_xiehouyu_night", String(isNightMode));
      applyPreferences();
      showToast(isNightMode ? "已切换为幽夜墨色模式" : "已切换为宣纸白昼模式");
    });

    // Pagers
    dom.prevBtn.addEventListener("click", prevItem);
    dom.nextBtn.addEventListener("click", nextItem);
    dom.randomBtn.addEventListener("click", randomItem);
    dom.quickRandomBtn.addEventListener("click", randomItem);
    if (dom.audioToggleBtn) dom.audioToggleBtn.addEventListener("click", toggleAudio);
    dom.copyShareBtn.addEventListener("click", copyCurrentEntry);

    // Header Category Chips
    dom.categoryChips.addEventListener("click", e => {
      const chip = e.target.closest(".category-chip");
      if (!chip) return;
      filterByCategory(chip.getAttribute("data-cat"));
    });

    // Drawer Open / Close
    const openDrawer = () => {
      dom.catalogDrawer.hidden = false;
      dom.drawerSearchInput.focus();
    };
    const closeDrawer = () => {
      dom.catalogDrawer.hidden = true;
    };

    dom.catalogBtn.addEventListener("click", openDrawer);
    dom.quickDrawerBtn.addEventListener("click", openDrawer);
    dom.closeDrawerBtn.addEventListener("click", closeDrawer);
    dom.drawerBackdrop.addEventListener("click", closeDrawer);

    // Drawer Category Filter Pills
    dom.drawerFilterPills.addEventListener("click", e => {
      const pill = e.target.closest(".drawer-pill");
      if (!pill) return;
      filterByCategory(pill.getAttribute("data-filter"));
    });

    // Drawer Search
    dom.drawerSearchInput.addEventListener("input", renderCatalogGrid);

    // Drawer Grid Click Navigation
    dom.catalogGrid.addEventListener("click", e => {
      const card = e.target.closest(".catalog-card");
      if (!card) return;
      const targetId = card.getAttribute("data-id");
      const idx = filteredItems.findIndex(it => it.id === targetId);
      if (idx !== -1) {
        closeDrawer();
        goToIndex(idx);
      }
    });

    // Top Search Bar
    dom.searchInput.addEventListener("input", handleLiveSearch);
    dom.clearSearchBtn.addEventListener("click", () => {
      dom.searchInput.value = "";
      handleLiveSearch();
      dom.searchInput.focus();
    });

    dom.searchResultsList.addEventListener("click", e => {
      const itemEl = e.target.closest(".search-result-item");
      if (!itemEl) return;
      const targetId = itemEl.getAttribute("data-id");
      const idx = filteredItems.findIndex(it => it.id === targetId);
      if (idx !== -1) {
        dom.searchResultsPanel.hidden = true;
        goToIndex(idx);
      }
    });

    // Close Search Panel on Outside Click
    document.addEventListener("click", e => {
      if (!e.target.closest(".search-section")) {
        dom.searchResultsPanel.hidden = true;
      }
    });

    // Keyboard Shortcuts Navigation
    document.addEventListener("keydown", e => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");

      // ESC always closes modals/dropdowns
      if (e.key === "Escape") {
        if (!dom.catalogDrawer.hidden) {
          closeDrawer();
          return;
        }
        if (!dom.searchResultsPanel.hidden) {
          dom.searchResultsPanel.hidden = true;
          return;
        }
        if (isInput) activeEl.blur();
        return;
      }

      // If user is actively typing in a search box, don't hijack keys
      if (isInput) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextItem();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          prevItem();
          break;
        case " ":
          e.preventDefault();
          if (isRiddleMode && !isAnswerRevealed) {
            revealAnswer();
          } else {
            nextItem();
          }
          break;
        case "s":
        case "S":
          e.preventDefault();
          dom.modeToggleBtn.click();
          break;
        case "p":
        case "P":
          e.preventDefault();
          dom.pinyinToggleBtn.click();
          break;
        case "m":
        case "M":
          e.preventDefault();
          if (dom.catalogDrawer.hidden) openDrawer();
          else closeDrawer();
          break;
        case "r":
        case "R":
          e.preventDefault();
          randomItem();
          break;
        case "d":
        case "D":
          e.preventDefault();
          dom.themeToggleBtn.click();
          break;
        case "b":
        case "B":
          e.preventDefault();
          toggleAudio();
          break;
        case "/":
          e.preventDefault();
          dom.searchInput.focus();
          break;
      }
    });

    updateAudioBtnUI();

    // Popstate support
    window.addEventListener("popstate", () => {
      parseUrlHash();
      renderCurrentCard();
    });
  }

  // Start app on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
