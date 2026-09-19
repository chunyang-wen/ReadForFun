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
  const imagePreloadCache = new Map();
  let imageSwapToken = 0;

  // Game & Quiz State
  let appMode = "reading"; // "reading" | "quiz"
  let quizSubMode = "title_only"; // "title_only" | "context_mask"
  let maskRule = "stanza"; // "stanza" | "half" | "next_line"
  let isRevealed = false;
  let maskedSentenceIndices = new Set();
  let revealedSentenceIndices = new Set();
  let hintLevel = 0;
  let ciMastery = {};

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
  const randomCiBtn = document.getElementById("randomCiBtn");
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  // Audio state
  const BGM_SRC = "https://readforfun-img.chunyangwen.com/audio/bgm-reading.mp3";
  const SFX_SRC = "https://readforfun-img.chunyangwen.com/audio/sfx-pageturn.mp3";
  const TARGET_BGM_VOL = 0.22;
  let isAudioEnabled = localStorage.getItem("rff_bgm_enabled") !== "false";
  let bgm = null, sfx = null, audioStarted = false, bgmFadeTimer = null;
  let lastRenderedCiId = null;

  function initAudio() {
    if (!bgm) {
      bgm = new Audio(BGM_SRC);
      bgm.loop = true;
      bgm.preload = "auto";
    }
    if (!sfx) {
      sfx = new Audio(SFX_SRC);
      sfx.preload = "auto";
    }
  }

  function fadeBgm(target, duration = 1200) {
    if (!bgm) return;
    clearInterval(bgmFadeTimer);
    const start = bgm.volume;
    const steps = 20;
    const stepTime = duration / steps;
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
    if (!audioToggleBtn) return;
    audioToggleBtn.setAttribute("aria-pressed", String(isAudioEnabled));
    const icon = audioToggleBtn.querySelector(".btn-icon");
    const label = audioToggleBtn.querySelector(".btn-label");
    if (isAudioEnabled) {
      audioToggleBtn.classList.remove("is-muted");
      if (icon) icon.textContent = "🎵";
      if (label) label.textContent = "音乐";
    } else {
      audioToggleBtn.classList.add("is-muted");
      if (icon) icon.textContent = "🔇";
      if (label) label.textContent = "静音";
    }
  }

  function tryStartBgm() {
    if (!isAudioEnabled || audioStarted) return;
    initAudio();
    bgm.volume = 0;
    const p = bgm.play();
    if (p) {
      p.then(() => {
        audioStarted = true;
        fadeBgm(TARGET_BGM_VOL, 1400);
        updateAudioBtnUI();
      }).catch(() => {});
    }
  }

  function playTurnSound() {
    if (!isAudioEnabled) return;
    try {
      initAudio();
      const clone = sfx.cloneNode();
      clone.volume = 0.35;
      clone.play().catch(() => {});
    } catch (e) {}
  }

  function toggleAudio() {
    initAudio();
    isAudioEnabled = !isAudioEnabled;
    localStorage.setItem("rff_bgm_enabled", String(isAudioEnabled));
    updateAudioBtnUI();
    if (isAudioEnabled) {
      if (bgm.paused) {
        bgm.volume = 0;
        bgm.play().then(() => {
          audioStarted = true;
          fadeBgm(TARGET_BGM_VOL, 800);
        }).catch(() => {});
      } else {
        fadeBgm(TARGET_BGM_VOL, 600);
      }
    } else {
      fadeBgm(0, 500);
    }
  }

  const onFirstInteract = () => {
    tryStartBgm();
    ["pointerdown", "keydown"].forEach(evt => window.removeEventListener(evt, onFirstInteract));
  };
  ["pointerdown", "keydown"].forEach(evt => window.addEventListener(evt, onFirstInteract, { once: true }));

  const authorChipsContainer = document.getElementById("authorChipsContainer");

  const ciTitle = document.getElementById("ciTitle");
  const authorName = document.getElementById("authorName");
  const authorSeal = document.getElementById("authorSeal");
  const ciFormBadge = document.getElementById("ciFormBadge");
  const poemMasteryBadge = document.getElementById("poemMasteryBadge");
  const ciTagsList = document.getElementById("ciTagsList");
  const ciPreface = document.getElementById("ciPreface");
  const ciPrefaceText = document.getElementById("ciPrefaceText");

  // Quiz DOM Elements
  const quizControlBar = document.getElementById("quizControlBar");
  const quizSubOptions = document.getElementById("quizSubOptions");
  const quizHintBtn = document.getElementById("quizHintBtn");
  const quizRevealBtn = document.getElementById("quizRevealBtn");
  const quizRevealBtnText = document.getElementById("quizRevealBtnText");
  const quizRerollBtn = document.getElementById("quizRerollBtn");
  const quizMasteryBar = document.getElementById("quizMasteryBar");

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
  const artworkLoading = document.getElementById("artworkLoading");
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
  const DEFAULT_IMAGE = "https://readforfun-img.chunyangwen.com/tang-shi/assets/default-classical.svg";
  // Clearing src alone can leave the previous decoded bitmap visible in some browsers.
  const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

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
      ciMastery = JSON.parse(localStorage.getItem("song_ci_mastery") || "{}");
    } catch (e) {
      ciMastery = {};
    }
  }

  function saveMastery(ciId, level) {
    ciMastery[ciId] = { level, updatedAt: Date.now() };
    try {
      localStorage.setItem("song_ci_mastery", JSON.stringify(ciMastery));
    } catch (e) {}
    updateMasteryBadge();
    updateMasteryButtonsUI(level);
  }

  function updateMasteryBadge() {
    if (!visibleCi.length) return;
    const ci = visibleCi[currentCiIndex];
    if (!ci || !poemMasteryBadge) return;
    const record = ciMastery[ci.id];
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
    const ci = visibleCi[currentCiIndex];
    if (!ci) return;
    saveMastery(ci.id, level);
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
      maskedSentenceIndices.clear();
      revealedSentenceIndices.clear();
      hintLevel = 0;
      if (sentenceIllustrationImg) {
        sentenceIllustrationImg.classList.remove("is-artwork-masked");
      }
    }

    renderCurrentCi();
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
    renderCurrentCi();
  }

  function setMaskRule(rule) {
    if (maskRule === rule) return;
    maskRule = rule;
    if (quizSubOptions) {
      const pills = quizSubOptions.querySelectorAll(".subopt-pill");
      pills.forEach(p => p.classList.toggle("active", p.getAttribute("data-rule") === rule));
    }
    generateQuizMask();
    renderCurrentCi();
  }

  function generateQuizMask() {
    const ci = visibleCi[currentCiIndex];
    if (!ci || !ci.sentences || !ci.sentences.length) return;

    maskedSentenceIndices.clear();
    revealedSentenceIndices.clear();
    hintLevel = 0;
    isRevealed = false;
    currentSentenceIndex = -1;

    if (quizRevealBtnText) quizRevealBtnText.textContent = "翻开核验";
    if (quizRevealBtn) quizRevealBtn.classList.remove("is-active-reveal");
    if (quizMasteryBar) quizMasteryBar.hidden = true;

    const N = ci.sentences.length;

    if (quizSubMode === "title_only") {
      for (let i = 0; i < N; i++) {
        maskedSentenceIndices.add(i);
      }
    } else {
      // Context Mask Mode
      if (maskRule === "stanza" && ci.stanzas && ci.stanzas.length >= 2) {
        const hideSecondStanza = Math.random() > 0.5;
        const targetStanzaNo = hideSecondStanza ? 2 : 1;
        ci.sentences.forEach(s => {
          if (s.stanza_no === targetStanzaNo) {
            maskedSentenceIndices.add(s.global_index);
          }
        });
      } else if (maskRule === "half") {
        const hideSecondHalf = Math.random() > 0.5;
        const half = Math.floor(N / 2);
        const start = hideSecondHalf ? half : 0;
        const end = hideSecondHalf ? N : half;
        for (let i = start; i < end; i++) maskedSentenceIndices.add(i);
      } else if (maskRule === "next_line") {
        for (let i = 1; i < N; i += 2) {
          maskedSentenceIndices.add(i);
        }
      }

      if (maskedSentenceIndices.size === 0) {
        maskedSentenceIndices.add(Math.floor(N / 2));
      }
    }

    const record = ciMastery[ci.id];
    updateMasteryButtonsUI(record ? record.level : null);
  }

  function toggleQuizReveal() {
    if (appMode !== "quiz") return;
    if (!isRevealed) {
      revealQuiz();
    } else {
      generateQuizMask();
      renderCurrentCi();
    }
  }

  function revealQuiz() {
    isRevealed = true;
    for (const idx of maskedSentenceIndices) {
      revealedSentenceIndices.add(idx);
    }
    if (currentSentenceIndex < 0) {
      currentSentenceIndex = 0;
    }
    if (quizRevealBtnText) quizRevealBtnText.textContent = "隐藏重背";
    if (quizRevealBtn) quizRevealBtn.classList.add("is-active-reveal");
    if (quizMasteryBar) quizMasteryBar.hidden = false;
    renderCurrentCi();
  }

  function triggerQuizHint() {
    if (appMode !== "quiz" || isRevealed) return;
    hintLevel++;
    if (hintLevel === 1) {
      renderCurrentCi();
    } else if (hintLevel === 2) {
      for (const idx of maskedSentenceIndices) {
        if (!revealedSentenceIndices.has(idx)) {
          revealedSentenceIndices.add(idx);
          if (currentSentenceIndex === -1) {
            currentSentenceIndex = idx;
          }
          break;
        }
      }
      renderCurrentCi();
    } else {
      revealQuiz();
    }
  }

  function revealSingleSentence(sentenceIdx) {
    if (appMode !== "quiz" || isRevealed) return;
    if (maskedSentenceIndices.has(sentenceIdx)) {
      currentSentenceIndex = sentenceIdx;
      revealedSentenceIndices.add(sentenceIdx);
      let allDone = true;
      for (const idx of maskedSentenceIndices) {
        if (!revealedSentenceIndices.has(idx)) {
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
      renderCurrentCi();
    }
  }

  /**
   * Initialize Application
   */
  async function init() {
    try {
      loadMastery();
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
  /**
   * Render Current Ci Work
   */
  function renderCurrentCi() {
    if (!visibleCi.length) return;
    if (currentCiIndex >= visibleCi.length) currentCiIndex = 0;
    if (currentCiIndex < 0) currentCiIndex = visibleCi.length - 1;

    const ci = visibleCi[currentCiIndex];

    if (lastRenderedCiId !== null && lastRenderedCiId !== ci.id) {
      playTurnSound();
    }
    lastRenderedCiId = ci.id;

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

    // Mastery & Badge
    updateMasteryBadge();

    // Ensure quiz mask if in quiz mode
    if (appMode === "quiz" && maskedSentenceIndices.size === 0) {
      generateQuizMask();
    }

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
    if (currentSentenceIndex >= 0) {
      history.replaceState(null, "", `#${ci.id}:${currentSentenceIndex + 1}`);
    } else {
      history.replaceState(null, "", `#${ci.id}`);
    }
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
        const stampLabel = `${st.name.slice(0, 1)}·${sent.sentence_no}`;
        const isSentMasked = appMode === "quiz" && maskedSentenceIndices.has(sent.global_index) && !revealedSentenceIndices.has(sent.global_index) && !isRevealed;

        if (isSentMasked) {
          let maskedTextHtml = "";
          const chars = Array.from(sent.text);
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

          html += `
            <div class="sentence-unit is-masked ${activeClass}" data-sentence-index="${sent.global_index}" role="button" tabindex="0" title="按上下键移至此处或点击自动揭晓">
              <span class="sentence-num-stamp" title="${escapeHtml(st.name)} 第 ${sent.sentence_no} 句">${stampLabel}</span>
              <div class="sentence-body-wrap">${maskedTextHtml}</div>
              <span class="masked-line-badge">↓ 揭晓</span>
            </div>
          `;
        } else {
          const wasMaskedAndRevealed = appMode === "quiz" && maskedSentenceIndices.has(sent.global_index) && (revealedSentenceIndices.has(sent.global_index) || isRevealed);
          const justClass = wasMaskedAndRevealed ? "just-revealed" : "";
          const rubyHtml = renderRuby(sent.text, sent.pinyin);

          html += `
            <div class="sentence-unit ${activeClass} ${justClass}" data-sentence-index="${sent.global_index}" role="button" tabindex="0">
              <span class="sentence-num-stamp" title="${escapeHtml(st.name)} 第 ${sent.sentence_no} 句">${stampLabel}</span>
              <div class="sentence-body-wrap">${rubyHtml}</div>
            </div>
          `;
        }
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

    const currentSent = currentSentenceIndex >= 0 ? ci.sentences[currentSentenceIndex] : null;

    // 3. Update Stanza Block current state
    const stanzaBlocks = ciTextContainer.querySelectorAll(".stanza-block");
    stanzaBlocks.forEach(sb => {
      const sNo = parseInt(sb.getAttribute("data-stanza-no"), 10);
      sb.classList.toggle("current-stanza", currentSent ? sNo === currentSent.stanza_no : false);
    });

    // 4. Update Stanza Tabs
    const stanzaPills = stanzaTabsBar.querySelectorAll(".stanza-tab-pill");
    stanzaPills.forEach(p => {
      const sNo = parseInt(p.getAttribute("data-stanza-no"), 10);
      p.classList.toggle("active", currentSent ? sNo === currentSent.stanza_no : false);
    });

    // 5. Update Stepper dots
    const stepDots = stanzasStepperBox.querySelectorAll(".step-dot");
    stepDots.forEach(dot => {
      const idx = parseInt(dot.getAttribute("data-sentence-index"), 10);
      dot.classList.toggle("active", idx === currentSentenceIndex);
    });

    // Quiz Mode Artwork & Explanation Masking
    const isArtworkMasked = appMode === "quiz" && !isRevealed;
    sentenceIllustrationImg.classList.toggle("is-artwork-masked", isArtworkMasked);

    let quizOverlay = document.getElementById("artworkQuizOverlay");
    if (isArtworkMasked) {
      if (!quizOverlay) {
        quizOverlay = document.createElement("div");
        quizOverlay.id = "artworkQuizOverlay";
        quizOverlay.className = "artwork-quiz-overlay";
        quizOverlay.innerHTML = `<span>🎴</span> <span>背诵挑战中 · 词意暂隐</span>`;
        const frame = document.querySelector(".artwork-frame");
        if (frame) frame.appendChild(quizOverlay);
      }
      artworkSentenceBadge.textContent = currentSentenceIndex >= 0 ? `第 ${currentSentenceIndex + 1} / ${ci.sentences.length} 句` : `挑战中 · 共 ${ci.sentences.length} 句`;
      artworkPoeticFocus.textContent = "心中默诵 · 移动解锁";

      if (currentSent && (revealedSentenceIndices.has(currentSentenceIndex) || !maskedSentenceIndices.has(currentSentenceIndex))) {
        expSentenceText.textContent = currentSent.text;
        expTranslation.textContent = currentSent.translation || "暂无译文。";
        if (currentSent.explanation) {
          const parts = currentSent.explanation.split(/(?=【)/).filter(Boolean);
          if (parts.length > 1) {
            expWords.innerHTML = parts.map(p => `<p>${escapeHtml(p.trim())}</p>`).join("");
          } else {
            expWords.innerHTML = `<p>${escapeHtml(currentSent.explanation)}</p>`;
          }
        } else {
          expWords.innerHTML = "<p>字义清晓，意境直畅。</p>";
        }
      } else {
        expSentenceText.textContent = "背诵自测中";
        expTranslation.textContent = "按键盘上下键 (↓ / ↑) 移动至对应句即可自动解锁核对，或按空格键翻开全篇。";
        expWords.innerHTML = "<p>💡 快捷操作：按 ↓ / ↑ 移动自动解锁 · 按 H 锦囊提示 · 按 1-3 自评掌握度 · 按 R 换题</p>";
      }
      return;
    } else {
      if (quizOverlay) quizOverlay.remove();
    }

    const sent = currentSent || ci.sentences[0];
    if (!sent) return;

    // Keep upper/lower artwork synchronized with the active sentence.
    // Use the high-resolution poem artwork as the primary image. The old
    // upper/lower SVGs are lightweight placeholder cards, not the main art.
    const stanzaImage = ci.image || (sent.stanza_no === 2 ? ci.image_lower : ci.image_upper) || DEFAULT_IMAGE;
    const artworkSources = [...new Set([stanzaImage, ci.image_upper, ci.image_lower, DEFAULT_IMAGE].filter(Boolean))];
    const artworkKey = artworkSources[0];
    if (artworkKey && sentenceIllustrationImg.getAttribute("data-current-image-url") !== artworkKey) {
      const swapToken = ++imageSwapToken;
      // Hide the old bitmap immediately. Do not rely on removeAttribute("src"):
      // browsers may keep painting the previously decoded image until the next
      // source finishes loading.
      sentenceIllustrationImg.src = EMPTY_IMAGE;
      sentenceIllustrationImg.classList.add("fade-out");
      sentenceIllustrationImg.classList.add("is-loading");
      artworkLoading.classList.add("is-visible");
      artworkLoading.querySelector(".artwork-loading-label").textContent = "正在加载配图…";

      const loadArtwork = (sourceIndex) => {
        if (swapToken !== imageSwapToken) return;
        const source = artworkSources[sourceIndex];
        let preload = imagePreloadCache.get(source);
        if (!preload) {
          const image = new Image();
          preload = new Promise(resolve => {
            image.onload = () => resolve(true);
            image.onerror = () => resolve(false);
          });
          imagePreloadCache.set(source, preload);
          image.src = source;
        }
        preload.then(loaded => {
          if (swapToken !== imageSwapToken) return;
          if (loaded) {
            // The image is decoded and ready, so the visible swap is immediate.
            sentenceIllustrationImg.src = source;
            sentenceIllustrationImg.alt = `《${ci.title}》· ${ci.author} - 宋词意境图`;
            sentenceIllustrationImg.setAttribute("data-current-image-url", source);
            artworkLoading.classList.remove("is-visible");
            sentenceIllustrationImg.classList.remove("is-loading", "fade-out");
          } else if (sourceIndex + 1 < artworkSources.length) {
            loadArtwork(sourceIndex + 1);
          } else {
            artworkLoading.querySelector(".artwork-loading-label").textContent = "配图加载失败";
            artworkLoading.classList.remove("is-visible");
            sentenceIllustrationImg.classList.remove("is-loading", "fade-out");
          }
        });
      };
      loadArtwork(0);
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
    if (currentSentenceIndex >= 0) {
      history.replaceState(null, "", `#${ci.id}:${currentSentenceIndex + 1}`);
    } else {
      history.replaceState(null, "", `#${ci.id}`);
    }
  }

  /**
   * Sentence Switching Controls (Key Up / Down / Space)
   */
  function nextSentence() {
    const ci = visibleCi[currentCiIndex];
    if (!ci || !ci.sentences.length) return;
    let targetIndex;
    if (currentSentenceIndex === -1) {
      targetIndex = 0;
    } else if (currentSentenceIndex < ci.sentences.length - 1) {
      targetIndex = currentSentenceIndex + 1;
    } else {
      targetIndex = 0;
    }
    goToSentence(targetIndex);
  }

  function prevSentence() {
    const ci = visibleCi[currentCiIndex];
    if (!ci || !ci.sentences.length) return;
    let targetIndex;
    if (currentSentenceIndex === -1 || currentSentenceIndex <= 0) {
      targetIndex = ci.sentences.length - 1;
    } else {
      targetIndex = currentSentenceIndex - 1;
    }
    goToSentence(targetIndex);
  }

  function goToSentence(index) {
    const ci = visibleCi[currentCiIndex];
    if (!ci || !ci.sentences.length) return;
    if (index >= 0 && index < ci.sentences.length) {
      currentSentenceIndex = index;
      if (appMode === "quiz" && !isRevealed && maskedSentenceIndices.has(currentSentenceIndex)) {
        revealSingleSentence(currentSentenceIndex);
      } else {
        syncSentenceState();
      }
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
      goToSentence(targetSent.global_index);
    }
  }

  /**
   * Ci Switching Controls (Key Left / Right)
   */
  function nextCi() {
    currentCiIndex = (currentCiIndex + 1) % visibleCi.length;
    currentSentenceIndex = 0;
    if (appMode === "quiz") {
      generateQuizMask();
    }
    renderCurrentCi();
  }

  function prevCi() {
    currentCiIndex = (currentCiIndex - 1 + visibleCi.length) % visibleCi.length;
    currentSentenceIndex = 0;
    if (appMode === "quiz") {
      generateQuizMask();
    }
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
    if (appMode === "quiz") {
      generateQuizMask();
    }
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
    // Click on Sentence to select or reveal in quiz mode
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
        renderCurrentCi();
      });
    }

    // Prev / Next Ci Buttons
    prevCiBtn.addEventListener("click", prevCi);
    nextCiBtn.addEventListener("click", nextCi);
    randomCiBtn.addEventListener("click", randomCi);
    if (audioToggleBtn) audioToggleBtn.addEventListener("click", toggleAudio);

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
        if (appMode === "quiz") {
          generateQuizMask();
        }
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
        case "g":
        case "G":
          e.preventDefault();
          toggleGameMode();
          break;

        case "h":
        case "H":
          if (appMode === "quiz") {
            e.preventDefault();
            triggerQuizHint();
          }
          break;

        // Space: in quiz mode, toggle reveal/hide. In reading mode, next sentence.
        case " ":
          e.preventDefault();
          if (appMode === "quiz") {
            toggleQuizReveal();
          } else {
            nextSentence();
          }
          break;

        // Sentence Level: Next Sentence
        case "ArrowDown":
        case "j":
        case "J":
        case "PageDown":
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

        // Stanza Level / Mastery Level:
        case "Tab":
          e.preventDefault();
          toggleStanza();
          break;

        case "1":
          e.preventDefault();
          if (appMode === "quiz" && isRevealed) {
            setMastery("forgot");
          } else if (appMode !== "quiz") {
            jumpToStanza(1);
          }
          break;

        case "2":
          e.preventDefault();
          if (appMode === "quiz" && isRevealed) {
            setMastery("vague");
          } else if (appMode !== "quiz") {
            jumpToStanza(2);
          }
          break;

        case "3":
          if (appMode === "quiz" && isRevealed) {
            e.preventDefault();
            setMastery("mastered");
          }
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

        // Audio Toggle
        case "b":
        case "B":
          e.preventDefault();
          toggleAudio();
          break;
      }
    });

    updateAudioBtnUI();
  }

  // Start app on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
