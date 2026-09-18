/**
 * 《中华歇后语·俗语大全》 Core Application Controller
 * High-performance interactive reader with riddle guessing, ruby pinyin, search & catalog.
 */

(function () {
  "use strict";

  // Configuration & Constants
  const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/;
  const R2_DEFAULT_IMAGE = "https://readforfun-img.chunyangwen.com/tang-shi/assets/default-classical.svg";
  const LOCAL_DEFAULT_IMAGE = "assets/default-classical.svg";

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
        case "/":
          e.preventDefault();
          dom.searchInput.focus();
          break;
      }
    });

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
