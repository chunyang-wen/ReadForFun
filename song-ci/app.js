/**
 * 《宋词之境 · 词画合集》
 * Interactive Engine: Sentence-Level Scene Navigation, Redesigned Keyboard-Lyric Dynamics, Stanza Tabs & Ruby Pinyin
 */

(function () {
  "use strict";

  // State
  let allCi = [];
  let visibleCi = [];
  let currentCiIndex = 0;
  let currentSentenceIndex = 0; // Index in currentCi.sentences
  let selectedAuthor = "all";
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
  const randomCiBtn = document.getElementById("randomCiBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  const authorChipsContainer = document.getElementById("authorChipsContainer");

  const ciTitle = document.getElementById("ciTitle");
  const authorName = document.getElementById("authorName");
  const authorSeal = document.getElementById("authorSeal");
  const ciFormBadge = document.getElementById("ciFormBadge");
  const ciTagsList = document.getElementById("ciTagsList");
  const ciPreface = document.getElementById("ciPreface");
  const ciPrefaceText = document.getElementById("ciPrefaceText");

  const stanzaTabsBar = document.getElementById("stanzaTabsBar");
  const ciTextContainer = document.getElementById("ciTextContainer");
  const stanzasStepperBox = document.getElementById("stanzasStepperBox");
  const ciAppreciationBody = document.getElementById("ciAppreciationBody");

  const prevCiBtn = document.getElementById("prevCiBtn");
  const nextCiBtn = document.getElementById("nextCiBtn");
  const prevCiTitle = document.getElementById("prevCiTitle");
  const nextCiTitle = document.getElementById("nextCiTitle");
  const ciCounter = document.getElementById("ciCounter");

  const sentenceIllustrationImg = document.getElementById("sentenceIllustrationImg");
  const artworkSentenceBadge = document.getElementById("artworkSentenceBadge");
  const artworkPoeticFocus = document.getElementById("artworkPoeticFocus");
  const expSentenceText = document.getElementById("expSentenceText");
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
      if (window.__SONG_CI_DATA__ && Array.isArray(window.__SONG_CI_DATA__)) {
        allCi = window.__SONG_CI_DATA__;
      } else {
        const res = await fetch("data/ci.json");
        allCi = await res.json();
      }
      visibleCi = [...allCi];

      // Init Theme & Preferences from localStorage
      if (localStorage.getItem("song_ci_theme") === "night") {
        setNightTheme(true);
      }
      if (localStorage.getItem("song_ci_pinyin") === "false") {
        setPinyinEnabled(false);
      }

      setupAuthorFilterChips();
      setupCatalogDrawer();
      setupEventListeners();

      // Check URL Hash for deep-link: #ci-id or #ci-id:sentence
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const [targetId, sentenceNum] = hash.split(":");
        const cIndex = allCi.findIndex(c => c.id === targetId);
        if (cIndex !== -1) {
          currentCiIndex = cIndex;
          if (sentenceNum && !isNaN(parseInt(sentenceNum, 10))) {
            currentSentenceIndex = Math.max(0, parseInt(sentenceNum, 10) - 1);
          }
        }
      }

      renderCurrentCi();
    } catch (err) {
      console.error("Failed to load Song Ci data:", err);
      ciTextContainer.innerHTML = `<div style="padding:20px;color:var(--cinnabar)">加载宋词数据失败，请检查网络或刷新页面。</div>`;
    }
  }

  /**
   * Render Current Ci Work
   */
  function renderCurrentCi() {
    if (!visibleCi.length) return;
    if (currentCiIndex >= visibleCi.length) currentCiIndex = 0;
    if (currentCiIndex < 0) currentCiIndex = visibleCi.length - 1;

    const ci = visibleCi[currentCiIndex];

    // Ensure sentence index is in bounds
    if (currentSentenceIndex >= ci.sentences.length) currentSentenceIndex = 0;
    if (currentSentenceIndex < 0) currentSentenceIndex = ci.sentences.length - 1;

    // Header
    ciTitle.innerHTML = renderRuby(ci.title, ci.title_pinyin);
    authorName.textContent = ci.author;
    authorSeal.textContent = ci.author.slice(0, 1);
    ciFormBadge.textContent = ci.form || "宋词名篇";

    // Tags
    ciTagsList.innerHTML = (ci.tags || [])
      .map(tag => `<span class="ci-tag">${escapeHtml(tag)}</span>`)
      .join("");

    // Preface (小序)
    if (ci.preface && ci.preface.trim()) {
      ciPreface.hidden = false;
      ciPrefaceText.innerHTML = renderRuby(ci.preface, ci.preface_pinyin);
    } else {
      ciPreface.hidden = true;
    }

    // Stanza Tabs (e.g. 上阕 / 下阕)
    renderStanzaTabs(ci);

    // Stanzas and Sentences in Text Container
    renderStanzasAndSentences(ci);

    // Stanzas Stepper Box
    renderStanzasStepper(ci);

    // Whole Ci Appreciation
    ciAppreciationBody.textContent = ci.appreciation || "暂无全词赏析。";

    // Pager controls
    ciCounter.textContent = `${currentCiIndex + 1} / ${visibleCi.length}`;
    const prevIdx = (currentCiIndex - 1 + visibleCi.length) % visibleCi.length;
    const nextIdx = (currentCiIndex + 1) % visibleCi.length;
    prevCiTitle.textContent = visibleCi[prevIdx].title;
    nextCiTitle.textContent = visibleCi[nextIdx].title;

    // Synchronize current sentence state & explanation
    syncSentenceState();

    // Update URL hash without jumping
    history.replaceState(null, "", `#${ci.id}:${currentSentenceIndex + 1}`);
  }

  /**
   * Render Stanza Tabs (上阕 / 下阕 Pills)
   */
  function renderStanzaTabs(ci) {
    if (!ci.stanzas || ci.stanzas.length <= 1) {
      stanzaTabsBar.innerHTML = "";
      stanzaTabsBar.style.display = "none";
      return;
    }

    stanzaTabsBar.style.display = "flex";
    const currentSent = ci.sentences[currentSentenceIndex];
    const currentStanzaNo = currentSent ? currentSent.stanza_no : 1;

    stanzaTabsBar.innerHTML = ci.stanzas
      .map(st => {
        const activeClass = st.stanza_no === currentStanzaNo ? "active" : "";
        return `
          <button type="button" class="stanza-tab-pill ${activeClass}" data-stanza-no="${st.stanza_no}" title="跳转至${escapeHtml(st.name)}起句">
            <span>${escapeHtml(st.name)}</span>
            <span class="chip-count">(${st.sentences.length}句)</span>
          </button>
        `;
      })
      .join("");
  }

  /**
   * Render Stanzas and Sentences (Grouped by Stanza)
   */
  function renderStanzasAndSentences(ci) {
    let html = "";

    ci.stanzas.forEach(st => {
      html += `
        <div class="stanza-block" data-stanza-no="${st.stanza_no}">
          <div class="stanza-header">
            <span class="stanza-header-title">【${escapeHtml(st.name)}】</span>
            <span class="stanza-header-line"></span>
          </div>
          <div class="stanza-sentences-group">
      `;

      st.sentences.forEach(sent => {
        const activeClass = sent.global_index === currentSentenceIndex ? "active" : "";
        const rubyHtml = renderRuby(sent.text, sent.pinyin);
        const stampLabel = `${st.name.slice(0, 1)}·${sent.sentence_no}`;

        html += `
          <div class="sentence-unit ${activeClass}" data-sentence-index="${sent.global_index}" role="button" tabindex="0">
            <span class="sentence-num-stamp" title="${escapeHtml(st.name)} 第 ${sent.sentence_no} 句">${stampLabel}</span>
            <div class="sentence-body-wrap">${rubyHtml}</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    ciTextContainer.innerHTML = html;
  }

  /**
   * Render Stepper Progress Box Grouped by Stanzas
   */
  function renderStanzasStepper(ci) {
    let html = "";

    ci.stanzas.forEach(st => {
      html += `
        <div class="stanza-step-group">
          <span class="stanza-step-label">${escapeHtml(st.name)}:</span>
          <div class="stanza-dots-row">
      `;

      st.sentences.forEach(sent => {
        const activeClass = sent.global_index === currentSentenceIndex ? "active" : "";
        html += `
          <div class="step-dot ${activeClass}" data-sentence-index="${sent.global_index}" title="${escapeHtml(st.name)} 第 ${sent.sentence_no} 句：${escapeHtml(sent.text)}"></div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    stanzasStepperBox.innerHTML = html;
  }

  /**
   * Synchronize Active Sentence, Visual Focus, Auto-Scroll, Artwork and Explanation
   */
  function syncSentenceState() {
    const ci = visibleCi[currentCiIndex];
    if (!ci) return;
    const sent = ci.sentences[currentSentenceIndex];
    if (!sent) return;

    // 1. Update active highlight in DOM
    const sentenceElements = ciTextContainer.querySelectorAll(".sentence-unit");
    let activeSentenceElement = null;
    sentenceElements.forEach(el => {
      const idx = parseInt(el.getAttribute("data-sentence-index"), 10);
      const isActive = idx === currentSentenceIndex;
      el.classList.toggle("active", isActive);
      if (isActive) activeSentenceElement = el;
    });

    // 2. Smooth auto-scroll the active sentence into center view
    if (activeSentenceElement) {
      activeSentenceElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }

    // 3. Update Stanza Block current state
    const stanzaBlocks = ciTextContainer.querySelectorAll(".stanza-block");
    stanzaBlocks.forEach(sb => {
      const sNo = parseInt(sb.getAttribute("data-stanza-no"), 10);
      sb.classList.toggle("current-stanza", sNo === sent.stanza_no);
    });

    // 4. Update Stanza Tabs
    const stanzaPills = stanzaTabsBar.querySelectorAll(".stanza-tab-pill");
    stanzaPills.forEach(p => {
      const sNo = parseInt(p.getAttribute("data-stanza-no"), 10);
      p.classList.toggle("active", sNo === sent.stanza_no);
    });

    // 5. Update Stepper dots
    const stepDots = stanzasStepperBox.querySelectorAll(".step-dot");
    stepDots.forEach(dot => {
      const idx = parseInt(dot.getAttribute("data-sentence-index"), 10);
      dot.classList.toggle("active", idx === currentSentenceIndex);
    });

    // Keep upper/lower artwork synchronized with the active sentence.
    const stanzaImage = sent.stanza_no === 2 ? (ci.image_lower || ci.image) : (ci.image_upper || ci.image);
    const stanzaKey = `${ci.id}:${sent.stanza_no}`;
    if (stanzaImage && sentenceIllustrationImg.getAttribute("data-current-ci-id") !== stanzaKey) {
      sentenceIllustrationImg.classList.add("fade-out");
      sentenceIllustrationImg.setAttribute("data-current-ci-id", stanzaKey);
      setTimeout(() => {
        sentenceIllustrationImg.src = stanzaImage;
        sentenceIllustrationImg.alt = `《${ci.title}》· ${ci.author} - 宋词意境图`;
        sentenceIllustrationImg.onerror = () => { sentenceIllustrationImg.onerror = null; sentenceIllustrationImg.src = DEFAULT_IMAGE; };
        sentenceIllustrationImg.classList.remove("fade-out");
      }, 120);
    }

    // 6. Update Artwork overlay focus
    const stObj = ci.stanzas.find(s => s.stanza_no === sent.stanza_no);
    const totalInStanza = stObj ? stObj.sentences.length : ci.sentences.length;
    artworkSentenceBadge.textContent = `${sent.stanza_name} · 第 ${sent.sentence_no} / ${totalInStanza} 句`;
    artworkPoeticFocus.textContent = sent.text;

    // 7. Sentence Explanation Update
    expSentenceText.textContent = sent.text;
    expTranslation.textContent = sent.translation || "暂无白话译文。";

    if (sent.explanation) {
      const parts = sent.explanation.split(/(?=【)/).filter(Boolean);
      if (parts.length > 1) {
        expWords.innerHTML = parts.map(p => `<p>${escapeHtml(p.trim())}</p>`).join("");
      } else {
        expWords.innerHTML = `<p>${escapeHtml(sent.explanation)}</p>`;
      }
    } else {
      expWords.innerHTML = "<p>字义清晓，意境直畅。</p>";
    }

    // 8. Update URL hash
    history.replaceState(null, "", `#${ci.id}:${currentSentenceIndex + 1}`);
  }

  /**
   * Sentence Switching Controls (Key Up / Down / Space)
   */
  function nextSentence() {
    const ci = visibleCi[currentCiIndex];
    if (!ci) return;
    if (currentSentenceIndex < ci.sentences.length - 1) {
      currentSentenceIndex++;
      syncSentenceState();
    } else {
      // Loop to beginning of current Ci
      currentSentenceIndex = 0;
      syncSentenceState();
    }
  }

  function prevSentence() {
    const ci = visibleCi[currentCiIndex];
    if (!ci) return;
    if (currentSentenceIndex > 0) {
      currentSentenceIndex--;
      syncSentenceState();
    } else {
      currentSentenceIndex = ci.sentences.length - 1;
      syncSentenceState();
    }
  }

  function goToSentence(index) {
    const ci = visibleCi[currentCiIndex];
    if (!ci) return;
    if (index >= 0 && index < ci.sentences.length) {
      currentSentenceIndex = index;
      syncSentenceState();
    }
  }

  /**
   * Stanza Jump Controls (Key Tab or 1 / 2)
   */
  function toggleStanza() {
    const ci = visibleCi[currentCiIndex];
    if (!ci || !ci.stanzas || ci.stanzas.length <= 1) return;
    const currentSent = ci.sentences[currentSentenceIndex];
    const currentStanzaNo = currentSent ? currentSent.stanza_no : 1;

    // If currently in stanza 1 (上阕), jump to stanza 2 (下阕)
    // If in stanza 2 (下阕), jump to stanza 1 (上阕)
    const targetStanzaNo = currentStanzaNo === 1 ? 2 : 1;
    jumpToStanza(targetStanzaNo);
  }

  function jumpToStanza(stanzaNo) {
    const ci = visibleCi[currentCiIndex];
    if (!ci) return;
    const targetSent = ci.sentences.find(s => s.stanza_no === stanzaNo);
    if (targetSent) {
      currentSentenceIndex = targetSent.global_index;
      syncSentenceState();
    }
  }

  /**
   * Ci Switching Controls (Key Left / Right)
   */
  function nextCi() {
    currentCiIndex = (currentCiIndex + 1) % visibleCi.length;
    currentSentenceIndex = 0;
    renderCurrentCi();
  }

  function prevCi() {
    currentCiIndex = (currentCiIndex - 1 + visibleCi.length) % visibleCi.length;
    currentSentenceIndex = 0;
    renderCurrentCi();
  }

  function randomCi() {
    if (visibleCi.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * visibleCi.length);
    if (nextIdx === currentCiIndex) {
      nextIdx = (nextIdx + 1) % visibleCi.length;
    }
    currentCiIndex = nextIdx;
    currentSentenceIndex = 0;
    renderCurrentCi();
  }

  /**
   * Author Filter Chips
   */
  function setupAuthorFilterChips() {
    const authorCounts = {};
    allCi.forEach(c => {
      authorCounts[c.author] = (authorCounts[c.author] || 0) + 1;
    });

    const sortedAuthors = Object.keys(authorCounts).sort((a, b) => authorCounts[b] - authorCounts[a]);

    let html = `
      <button type="button" class="author-chip active" data-author="all">
        全部 <span class="chip-count">(${allCi.length})</span>
      </button>
    `;

    sortedAuthors.forEach(author => {
      html += `
        <button type="button" class="author-chip" data-author="${escapeHtml(author)}">
          ${escapeHtml(author)} <span class="chip-count">(${authorCounts[author]})</span>
        </button>
      `;
    });

    authorChipsContainer.innerHTML = html;

    authorChipsContainer.addEventListener("click", e => {
      const chip = e.target.closest(".author-chip");
      if (!chip) return;
      const author = chip.getAttribute("data-author");
      filterByAuthor(author);
    });
  }

  function filterByAuthor(author) {
    selectedAuthor = author;
    const chips = authorChipsContainer.querySelectorAll(".author-chip");
    chips.forEach(c => {
      c.classList.toggle("active", c.getAttribute("data-author") === author);
    });

    if (author === "all") {
      visibleCi = [...allCi];
    } else {
      visibleCi = allCi.filter(c => c.author === author);
    }

    currentCiIndex = 0;
    currentSentenceIndex = 0;
    renderCurrentCi();
  }

  /**
   * Multi-dimensional Live Search Engine
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

    const results = [];

    allCi.forEach(ci => {
      let matchType = null;
      let matchSnippet = "";
      let matchedSentenceIndex = 0;

      // 1. Match Title or Cipai
      if (ci.title.toLowerCase().includes(q) || ci.cipai.toLowerCase().includes(q) || (ci.title_pinyin && ci.title_pinyin.toLowerCase().includes(q))) {
        matchType = "title";
        matchSnippet = `《${highlightText(ci.title, rawQuery)}》`;
      }
      // 2. Match Author
      else if (ci.author.toLowerCase().includes(q) || (ci.author_pinyin && ci.author_pinyin.toLowerCase().includes(q))) {
        matchType = "author";
        matchSnippet = `词人：${highlightText(ci.author, rawQuery)}`;
      }
      // 3. Match Sentences
      else {
        for (let i = 0; i < ci.sentences.length; i++) {
          const s = ci.sentences[i];
          if (s.text.toLowerCase().includes(q) || (s.pinyin && s.pinyin.toLowerCase().includes(q))) {
            matchType = "sentence";
            matchSnippet = highlightText(s.text, rawQuery);
            matchedSentenceIndex = i;
            break;
          }
        }
      }

      if (matchType) {
        results.push({
          ci,
          matchType,
          matchSnippet,
          matchedSentenceIndex,
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
    searchResultCount.textContent = `找到 ${results.length} 首匹配词作`;

    if (results.length === 0) {
      searchResultsList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--ink-muted); font-size: 0.88rem;">
          未找到与“${escapeHtml(query)}”相关的宋词或词句
        </div>
      `;
      return;
    }

    searchResultsList.innerHTML = results
      .slice(0, 10)
      .map(r => `
        <div class="search-result-item" data-ci-id="${r.ci.id}" data-sentence-index="${r.matchedSentenceIndex}">
          <div class="search-result-title">${escapeHtml(r.ci.title)}</div>
          <div class="search-result-meta">${escapeHtml(r.ci.author)} · ${escapeHtml(r.ci.form || "宋词")}</div>
          <div class="search-result-match">${r.matchSnippet}</div>
        </div>
      `)
      .join("");
  }

  /**
   * Catalog Drawer Modal
   */
  function setupCatalogDrawer() {
    renderCatalogGrid("all");

    drawerFilterPills.addEventListener("click", e => {
      const pill = e.target.closest(".drawer-pill");
      if (!pill) return;
      const filter = pill.getAttribute("data-filter");

      drawerFilterPills.querySelectorAll(".drawer-pill").forEach(p => {
        p.classList.toggle("active", p === pill);
      });

      renderCatalogGrid(filter);
    });

    catalogGrid.addEventListener("click", e => {
      const card = e.target.closest(".catalog-item-card");
      if (!card) return;
      const cid = card.getAttribute("data-ci-id");
      const idx = visibleCi.findIndex(c => c.id === cid);
      if (idx !== -1) {
        currentCiIndex = idx;
        currentSentenceIndex = 0;
        renderCurrentCi();
      } else {
        filterByAuthor("all");
        const allIdx = visibleCi.findIndex(c => c.id === cid);
        if (allIdx !== -1) {
          currentCiIndex = allIdx;
          currentSentenceIndex = 0;
          renderCurrentCi();
        }
      }
      closeCatalogDrawer();
    });
  }

  function renderCatalogGrid(filter) {
    let filtered = allCi;
    if (filter === "豪放") {
      filtered = allCi.filter(c => (c.tags || []).includes("豪放"));
    } else if (filter === "婉约") {
      filtered = allCi.filter(c => (c.tags || []).includes("婉约"));
    } else if (filter === "小令") {
      filtered = allCi.filter(c => (c.tags || []).includes("小令"));
    } else if (filter === "中调") {
      filtered = allCi.filter(c => (c.tags || []).includes("中调"));
    } else if (filter === "长调") {
      filtered = allCi.filter(c => (c.tags || []).includes("长调"));
    }

    const currentCiId = visibleCi[currentCiIndex]?.id;

    catalogGrid.innerHTML = filtered
      .map(ci => {
        const isCurrent = ci.id === currentCiId ? "current" : "";
        const firstSentence = ci.sentences[0]?.text || "";
        return `
          <div class="catalog-item-card ${isCurrent}" data-ci-id="${ci.id}">
            <div class="catalog-item-title">《${escapeHtml(ci.title)}》</div>
            <div class="catalog-item-author">${escapeHtml(ci.author)} · ${escapeHtml(ci.form || "宋词")}</div>
            <div class="catalog-item-snippet">${escapeHtml(firstSentence)}</div>
          </div>
        `;
      })
      .join("");
  }

  function openCatalogDrawer() {
    catalogDrawer.hidden = false;
    catalogDrawer.setAttribute("aria-hidden", "false");
    renderCatalogGrid("all");
    document.body.style.overflow = "hidden";
  }

  function closeCatalogDrawer() {
    catalogDrawer.hidden = true;
    catalogDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /**
   * Theme & Preferences
   */
  function setNightTheme(night) {
    isNightTheme = night;
    document.body.classList.toggle("theme-night", isNightTheme);
    themeToggleBtn.querySelector(".theme-icon").textContent = isNightTheme ? "☀️" : "🌙";
    localStorage.setItem("song_ci_theme", isNightTheme ? "night" : "paper");
  }

  function setPinyinEnabled(enabled) {
    isPinyinEnabled = enabled;
    document.body.classList.toggle("pinyin-enabled", isPinyinEnabled);
    pinyinToggleBtn.setAttribute("aria-pressed", isPinyinEnabled ? "true" : "false");
    localStorage.setItem("song_ci_pinyin", isPinyinEnabled ? "true" : "false");
  }

  /**
   * Event Listeners & Keyboard Handler
   */
  function setupEventListeners() {
    // Click on Sentence to select
    ciTextContainer.addEventListener("click", e => {
      const sentUnit = e.target.closest(".sentence-unit");
      if (sentUnit) {
        const idx = parseInt(sentUnit.getAttribute("data-sentence-index"), 10);
        goToSentence(idx);
      }
    });

    // Click on Stanza Tab Pill
    stanzaTabsBar.addEventListener("click", e => {
      const tab = e.target.closest(".stanza-tab-pill");
      if (tab) {
        const sNo = parseInt(tab.getAttribute("data-stanza-no"), 10);
        jumpToStanza(sNo);
      }
    });

    // Click on Stepper Dot
    stanzasStepperBox.addEventListener("click", e => {
      const dot = e.target.closest(".step-dot");
      if (dot) {
        const idx = parseInt(dot.getAttribute("data-sentence-index"), 10);
        goToSentence(idx);
      }
    });

    // Prev / Next Ci Buttons
    prevCiBtn.addEventListener("click", prevCi);
    nextCiBtn.addEventListener("click", nextCi);
    randomCiBtn.addEventListener("click", randomCi);

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
      const cid = item.getAttribute("data-ci-id");
      const sentIdx = parseInt(item.getAttribute("data-sentence-index"), 10) || 0;

      let idx = visibleCi.findIndex(c => c.id === cid);
      if (idx === -1) {
        filterByAuthor("all");
        idx = visibleCi.findIndex(c => c.id === cid);
      }

      if (idx !== -1) {
        currentCiIndex = idx;
        currentSentenceIndex = sentIdx;
        renderCurrentCi();
      }

      searchResultsPanel.hidden = true;
    });

    // Close search panel when clicking outside
    document.addEventListener("click", e => {
      if (!searchInput.contains(e.target) && !searchResultsPanel.contains(e.target)) {
        searchResultsPanel.hidden = true;
      }
    });

    // Global Keyboard Navigation (Redesigned Key & Lyric Dynamics)
    document.addEventListener("keydown", e => {
      if (document.activeElement === searchInput) {
        if (e.key === "Escape") {
          searchInput.blur();
          searchResultsPanel.hidden = true;
        }
        return;
      }

      if (e.key === "Escape") {
        if (!catalogDrawer.hidden) {
          closeCatalogDrawer();
          return;
        }
        searchResultsPanel.hidden = true;
        return;
      }

      switch (e.key) {
        // Sentence Level: Next Sentence
        case "ArrowDown":
        case "j":
        case "J":
        case "PageDown":
        case " ":
          e.preventDefault();
          nextSentence();
          break;

        // Sentence Level: Previous Sentence
        case "ArrowUp":
        case "k":
        case "K":
        case "PageUp":
          e.preventDefault();
          prevSentence();
          break;

        // Stanza Level: Jump between 上阕 and 下阕
        case "Tab":
          e.preventDefault();
          toggleStanza();
          break;

        case "1":
          e.preventDefault();
          jumpToStanza(1);
          break;

        case "2":
          e.preventDefault();
          jumpToStanza(2);
          break;

        // Ci Work Level: Next Ci
        case "ArrowRight":
        case "]":
          e.preventDefault();
          nextCi();
          break;

        // Ci Work Level: Previous Ci
        case "ArrowLeft":
        case "[":
          e.preventDefault();
          prevCi();
          break;

        // Focus Search
        case "/":
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
          break;

        // Toggle Pinyin
        case "p":
        case "P":
          e.preventDefault();
          setPinyinEnabled(!isPinyinEnabled);
          break;

        // Catalog Drawer
        case "m":
        case "M":
          e.preventDefault();
          if (catalogDrawer.hidden) {
            openCatalogDrawer();
          } else {
            closeCatalogDrawer();
          }
          break;

        // Random Ci
        case "r":
        case "R":
          e.preventDefault();
          randomCi();
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
