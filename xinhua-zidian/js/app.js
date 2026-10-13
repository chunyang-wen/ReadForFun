/**
 * 新华字典 (Xinhua Dictionary) - 核心应用交互引擎
 */

(function() {
  'use strict';

  // 全局应用状态
  const state = {
    currentChar: '永',
    coreDict: {},
    indexDict: {},
    writer: null,
    charData: null,
    animSpeed: 1,
    gridType: 'mi-zi-ge',
    isQuizMode: false,
    selectedRadical: '艹',
    selectedExtraStroke: 'all',
    selectedShengmu: 'b',
    selectedYunmu: 'all',
    renderId: 0,
    findHomophones: () => []
  };

  // 字符矢量数据缓存池（内存 + LocalStorage 双层持久缓存）
  const charDataCache = new Map();

  function validCharData(data) {
    return Array.isArray(data?.strokes) && data.strokes.length > 0 &&
      data.strokes.every(path => typeof path === 'string' && /^[Mm]/.test(path)) &&
      Array.isArray(data.medians) && data.medians.length === data.strokes.length &&
      data.medians.every(points => Array.isArray(points) && points.length >= 2 && points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)));
  }

  async function getCharData(char) {
    if (!char) return null;
    // 1. 检查内存缓存 (0ms)
    if (charDataCache.has(char)) {
      return charDataCache.get(char);
    }
    // 2. 检查本地内置精选预载库 (preload-hanzi.js, 0ms)
    if (window.PRELOADED_HANZI && window.PRELOADED_HANZI[char]) {
      charDataCache.set(char, window.PRELOADED_HANZI[char]);
      return window.PRELOADED_HANZI[char];
    }
    // 3. 检查浏览器 LocalStorage 离线缓存 (1~2ms)
    try {
      const cached = localStorage.getItem('hz_data_20261014v3_' + char);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (validCharData(parsed)) { charDataCache.set(char, parsed); return parsed; }
      }
    } catch (e) {}

    // 4. 从 CDN 动态抓取（支持快速多镜像重试）
    const encoded = encodeURIComponent(char);
    const urls = [
      ...(['龠'].includes(char) ? [`data/strokes/${encoded}.json?v=20261014v2`] : []),
      `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encoded}.json`,
      `https://unpkg.com/hanzi-writer-data@2.0.1/${encoded}.json`
    ];

    let data = null;
    for (const u of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(u, { cache: 'force-cache', signal: controller.signal });
          if (res.ok) {
            const parsed = await res.json();
            if (validCharData(parsed)) { data = parsed; break; }
          }
        } finally { clearTimeout(timeout); }
      } catch (err) {}
    }

    if (data) {
      charDataCache.set(char, data);
      try {
        localStorage.setItem('hz_data_20261014v3_' + char, JSON.stringify(data));
      } catch (e) {}
      return data;
    }

    throw new Error('未获取到该字矢量数据: ' + char);
  }

  // 预测性后台静默预载相关同音字与词语的矢量数据
  function prefetchRelatedChars(entry) {
    if (!entry) return;
    const candidates = [];
    if (entry.homophones) candidates.push(...entry.homophones.slice(0, 4));
    if (entry.words) {
      entry.words.slice(0, 4).forEach(w => {
        for (const ch of w) {
          if (ch !== entry.char && !candidates.includes(ch)) candidates.push(ch);
        }
      });
    }

    setTimeout(() => {
      candidates.slice(0, 5).forEach(c => {
        if (!charDataCache.has(c)) {
          getCharData(c).catch(() => {});
        }
      });
    }, 350);
  }

  // DOM 元素缓存
  const el = {
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),
    searchDropdown: document.getElementById('search-dropdown'),
    
    // 字符详情区
    mainChar: document.getElementById('main-char'),
    mainPinyin: document.getElementById('main-pinyin'),
    audioBtn: document.getElementById('audio-btn'),
    polyphoneTags: document.getElementById('polyphone-tags'),
    
    metaRadical: document.getElementById('meta-radical'),
    metaStrokes: document.getElementById('meta-strokes'),
    metaExtraStrokes: document.getElementById('meta-extra-strokes'),
    metaStructure: document.getElementById('meta-structure'),
    metaWubi: document.getElementById('meta-wubi'),
    
    homophonesList: document.getElementById('homophones-list'),
    wordsList: document.getElementById('words-list'),
    explanationBody: document.getElementById('explanation-body'),
    
    // HanziWriter 动图区
    writerContainer: document.getElementById('hanzi-writer-target'),
    gridLines: document.getElementById('grid-lines'),
    btnPlay: document.getElementById('btn-play'),
    btnReplay: document.getElementById('btn-replay'),
    btnQuiz: document.getElementById('btn-quiz'),
    btnGridToggle: document.getElementById('btn-grid-toggle'),
    speedSelect: document.getElementById('speed-select'),
    quizFeedback: document.getElementById('quiz-feedback'),
    
    // 逐笔拆解网格
    strokeStepsGrid: document.getElementById('stroke-steps-grid'),
    strokeCountBadge: document.getElementById('stroke-count-badge'),
    
    // 模态框
    radicalModal: document.getElementById('radical-modal'),
    pinyinModal: document.getElementById('pinyin-modal'),
    btnRadicalOpen: document.getElementById('btn-radical-open'),
    btnPinyinOpen: document.getElementById('btn-pinyin-open'),
    btnRandomChar: document.getElementById('btn-random-char'),
    modalCloseBtns: document.querySelectorAll('.modal-close-btn')
  };

  // 1. 初始化数据加载
  async function initApp() {
    bindEvents();
    
    // 优先从全局 window 注入的数据中读取（兼容 file:// 离线协议），其次尝试 fetch
    if (window.DICT_CORE && window.DICT_INDEX) {
      state.coreDict = window.DICT_CORE;
      state.indexDict = window.DICT_INDEX;
      console.log('字典核心数据已就绪:', Object.keys(state.coreDict).length, '字');
    } else {
      try {
        const [coreRes, indexRes] = await Promise.all([
          fetch('data/dict-core.json'),
          fetch('data/dict-index.json')
        ]);
        state.coreDict = await coreRes.json();
        state.indexDict = await indexRes.json();
        console.log('字典数据 fetch 加载成功:', Object.keys(state.coreDict).length, '字');
      } catch (e) {
        console.warn('本地 JSON 异步加载异常，尝试使用备用默认字库:', e);
      }
    }

    state.findHomophones = window.DictionaryReadings.createLookup(state.indexDict, state.coreDict);

    // 默认展示“永”字（汉字书法与笔顺集大成者）
    const initialChar = getUrlParam('char') || '永';
    loadCharacter(initialChar);
  }

  // 2. 汉字加载与展示
  async function loadCharacter(char) {
    if (!char) return;
    char = Array.from(char.trim())[0]; // 确保单个汉字
    state.currentChar = char;
    setUrlParam('char', char);

    let entry = state.coreDict[char];
    if (!entry && state.indexDict[char]) {
      const idx = state.indexDict[char];
      entry = {
        char: char,
        pinyin: idx.p,
        radical: idx.r,
        strokes: idx.s,
        extra_strokes: idx.es,
        structure: '通用汉字',
        wubi: '-',
        stroke_code: '',
        explanation: `${char} ${idx.p}\n部首：${idx.r}，总笔画：${idx.s} 画。\n[详细释义请参考《新华字典》印刷版]`,
        words: idx.w || [],
        homophones: []
      };
    } else if (!entry) {
      entry = {
        char: char,
        pinyin: '',
        radical: '-',
        strokes: 0,
        extra_strokes: 0,
        structure: '汉字',
        wubi: '-',
        stroke_code: '',
        explanation: `${char}\n暂无收录详细释义。`,
        words: [],
        homophones: []
      };
    }

    // 渲染右侧字典详细信息
    renderCharacterDetails(entry);

    // 渲染左侧 HanziWriter 动图与下方逐笔拆解
    await renderHanziVisuals(char, entry);
  }

  // 3. 渲染字典详细文本
  function renderCharacterDetails(entry) {
    el.mainChar.textContent = entry.char;
    const readings = window.DictionaryReadings.readings(state.indexDict[entry.char] || entry);
    el.mainPinyin.textContent = readings.filter(py => window.DictionaryReadings.parse(py)).join(' / ') || '读音暂未核实';
    
    el.metaRadical.textContent = entry.radical || '-';
    el.metaStrokes.textContent = `${entry.strokes || '-'} 画`;
    el.metaExtraStrokes.textContent = `${entry.extra_strokes ?? '-'} 画`;
    el.metaStructure.textContent = entry.structure || '独体字';
    el.metaWubi.textContent = entry.wubi || '-';
    
    // 释义
    el.explanationBody.textContent = entry.explanation || '暂无释义';

    // 常用组词
    el.wordsList.innerHTML = '';
    if (entry.words && entry.words.length > 0) {
      entry.words.forEach(w => {
        const chip = document.createElement('span');
        chip.className = 'word-chip';
        chip.textContent = w;
        chip.addEventListener('click', () => {
          // 如果点击词语中的其它汉字，可以切换查看
          const otherChar = Array.from(w).find(c => c !== entry.char && state.coreDict[c]);
          if (otherChar) loadCharacter(otherChar);
        });
        el.wordsList.appendChild(chip);
      });
    } else {
      el.wordsList.innerHTML = '<span style="color:var(--ink-muted);font-size:0.85rem;">暂无收录组词</span>';
    }

    // Every reading must match both syllable and tone; no truncated stored lists.
    el.homophonesList.innerHTML = '';
    const homophones = state.findHomophones(entry.char);

    if (homophones && homophones.length > 0) {
      homophones.forEach(h => {
        const chip = document.createElement('span');
        chip.className = 'homophone-chip';
        chip.textContent = h;
        chip.title = `查看同音字：${h}`;
        chip.addEventListener('click', async () => {
          await loadCharacter(h);

          // On the single-column mobile layout, the newly loaded stroke view is
          // above the homophone list. Bring it into view after switching entries.
          if (window.matchMedia('(max-width: 880px)').matches) {
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({
              top: 0,
              behavior: reduceMotion ? 'auto' : 'smooth'
            });
          }
        });
        el.homophonesList.appendChild(chip);
      });
    } else {
      el.homophonesList.innerHTML = '<span style="color:var(--ink-muted);font-size:0.85rem;">暂无同音字</span>';
    }

    // 语音朗读设置
    el.audioBtn.onclick = () => speakWord(entry.char);
  }

  // 4. 渲染 HanziWriter 与下方逐笔拆解 (Step-by-Step Breakdown)
  async function renderHanziVisuals(char, entry) {
    const currentRequestId = ++state.renderId;

    if (typeof HanziWriter === 'undefined') {
      console.error('HanziWriter 未加载');
      return;
    }

    if (state.writer) { state.writer.cancelQuiz(); state.writer.pauseAnimation(); }
    state.writer = null;
    state.charData = null;
    el.writerContainer.replaceChildren();
    el.writerContainer.classList.remove('glyph-fallback');
    [el.btnPlay, el.btnReplay, el.btnQuiz].forEach(btn => btn.disabled = true);

    // 重置练字状态
    state.isQuizMode = false;
    el.btnQuiz.classList.remove('active');
    el.quizFeedback.style.display = 'none';
    el.quizFeedback.className = 'quiz-feedback-box';

    // 若数据尚未在内存/预载中，先展示优雅的轻量骨架屏占位，杜绝白屏闪烁
    const isCached = charDataCache.has(char) || (window.PRELOADED_HANZI && window.PRELOADED_HANZI[char]);
    if (!isCached) {
      el.strokeCountBadge.textContent = '加载中...';
      el.strokeStepsGrid.innerHTML = `
        <div class="stroke-step-card skeleton"><div class="mini-grid skeleton-box"></div><div class="skeleton-text"></div></div>
        <div class="stroke-step-card skeleton"><div class="mini-grid skeleton-box"></div><div class="skeleton-text"></div></div>
        <div class="stroke-step-card skeleton"><div class="mini-grid skeleton-box"></div><div class="skeleton-text"></div></div>
        <div class="stroke-step-card skeleton"><div class="mini-grid skeleton-box"></div><div class="skeleton-text"></div></div>
      `;
    }

    try {
      // 1. 毫秒级从内存/本地缓存或极速 CDN 提取矢量数据 (单次请求 + 自动写入缓存)
      let charData;
      try { charData = await getCharData(char); }
      catch (error) {
        if (state.renderId !== currentRequestId) return;
        charData = await window.StrokeComposer.compose(char, getCharData, entry, state.coreDict);
      }

      // 若用户在加载期间已快速切换至下一个汉字，丢弃已过期的请求结果，防止竞态冲突
      if (state.renderId !== currentRequestId) return;

      state.charData = charData;
      charDataCache.set(char, charData);
      el.writerContainer.innerHTML = '';

      // 2. 将字形数据直接同步注入 HanziWriter，彻底消灭二次冗余网络请求
      state.writer = HanziWriter.create('hanzi-writer-target', char, {
        width: 240,
        height: 240,
        padding: 14,
        strokeColor: '#2B2D2F',
        radicalColor: '#B83B2E',
        outlineColor: '#E2D9CD',
        drawingColor: '#B83B2E',
        strokeAnimationSpeed: state.animSpeed,
        delayBetweenStrokes: 120,
        showOutline: true,
        showCharacter: true,
        charDataLoader: function(c, onComplete) {
          onComplete(charData);
        }
      });

      [el.btnPlay, el.btnReplay].forEach(btn => btn.disabled = false);
      el.btnQuiz.disabled = charData.source === 'component-simulation';
      el.btnQuiz.title = el.btnQuiz.disabled ? '组合模拟字形不用于标准临摹评分' : '在格中手动临摹书写';
      const strokeCount = charData.strokes.length;
      el.strokeCountBadge.textContent = `共 ${strokeCount} 笔${charData.source === 'component-simulation' ? ' · 部件组合模拟' : ''}`;

      el.strokeCountBadge.title = charData.source === 'component-simulation' ? `复用部件：${charData.components.join('、')}。字形比例及部件书写顺序为组合模拟，未逐字审定。` : '';

      // 3. 渲染下方逐笔演变网格
      renderStrokeBreakdown(charData, entry.stroke_code);

      // 4. 自动流畅播放一次书写动画
      state.writer.animateCharacter();

      // 5. 后台静默预热该字的组词与同音字，实现点击相关汉字 0 延迟秒开
      prefetchRelatedChars(entry);

    } catch (err) {
      if (state.renderId !== currentRequestId) return;
      console.warn('字形矢量笔画数据加载异常:', err);
      el.writerContainer.textContent = char;
      el.writerContainer.classList.add('glyph-fallback');
      renderStrokeCodeFallback(entry);
      el.strokeCountBadge.textContent = `${entry.strokes || '-'} 笔`;
    }
  }

  function renderStrokeCodeFallback(entry) {
    el.strokeStepsGrid.replaceChildren();
    const code = entry.stroke_code || '';
    const valid = /^[1-5]+$/.test(code) && code.length === entry.strokes;
    const note = document.createElement('p');
    note.style.gridColumn = '1 / -1';
    note.textContent = valid ? '暂缺字形轨迹，以下为已收录的笔顺类别；折笔的具体形状暂未提供。' : '暂未收录可靠的笔顺轨迹，无法展示书写动画。';
    el.strokeStepsGrid.appendChild(note);
    if (!valid) return;
    const names = {1: '横 / 提', 2: '竖 / 竖钩', 3: '撇', 4: '点 / 捺', 5: '折笔'};
    for (const [i, digit] of [...code].entries()) {
      const card = document.createElement('div');
      card.className = 'stroke-step-card';
      card.textContent = `第 ${i + 1} 笔 · ${names[digit]}`;
      el.strokeStepsGrid.appendChild(card);
    }
  }

  // 5. 逐笔拆解网格渲染算法 (核心亮点：每一笔单独呈现，朱红高亮，带笔画名)
  function renderStrokeBreakdown(charData, strokeCode) {
    const strokes = charData.strokes;
    const medians = charData.medians;
    el.strokeStepsGrid.innerHTML = '';

    strokes.forEach((currentStrokePath, idx) => {
      const card = document.createElement('div');
      card.className = 'stroke-step-card';
      card.dataset.step = idx;

      // 1. 历史笔画渲染为深墨色
      let pastStrokesHtml = '';
      for (let i = 0; i < idx; i++) {
        pastStrokesHtml += `<path d="${strokes[i]}" fill="#3B3E42" opacity="0.9" />`;
      }

      // 2. 当前第 N 笔渲染为鲜明的朱砂红
      const activeStrokeHtml = `<path d="${currentStrokePath}" fill="#B83B2E" />`;

      // 3. 智能识别笔画名称
      // Numeric stroke codes identify basic classes, not the detailed shape of a hook.
      // Median heuristics can misclassify short horizontals as dots: never present those guesses as fact.
      const validCode = /^[1-5]+$/.test(strokeCode || '') && strokeCode.length === strokes.length;
      const codeChar = validCode ? strokeCode[idx] : null;
      const categories = {1: '横 / 提', 2: '竖 / 竖钩', 3: '撇', 4: '点 / 捺', 5: '折笔'};
      const strokeName = (charData.source === 'component-simulation' && validCode
        ? categories[codeChar] : charData.strokeNames?.[idx]) || categories[codeChar] || '笔画';

      card.innerHTML = `
        <div class="mini-grid">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 900) scale(1, -1)">
              ${pastStrokesHtml}
              ${activeStrokeHtml}
            </g>
          </svg>
        </div>
        <span class="step-num">第 ${idx + 1} 笔</span>
        <span class="step-name">${strokeName}</span>
      `;

      // 点击某一步：在上方大图定格高亮展示该笔画
      card.addEventListener('click', () => {
        document.querySelectorAll('.stroke-step-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (state.writer) {
          state.writer.pauseAnimation();
          state.writer.highlightStroke(idx);
        }
      });

      el.strokeStepsGrid.appendChild(card);
    });
  }

  // 6. 语音发音 (Web Speech API 零音频文件依赖)
  function speakWord(word) {
    if (!('speechSynthesis' in window)) {
      alert('您的浏览器不支持语音朗读功能');
      return;
    }
    window.speechSynthesis.cancel(); // 停止当前正在播放的发音
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; // 稍慢一点更清晰
    window.speechSynthesis.speak(utterance);
  }

  // 7. 搜索与自动联想
  function handleSearchInput(query) {
    query = query.trim().toLowerCase();
    if (!query) {
      el.searchClear.style.display = 'none';
      el.searchDropdown.style.display = 'none';
      return;
    }
    el.searchClear.style.display = 'block';

    const matches = [];
    // 1. 如果输入的是单个汉字
    if (query.length === 1 && /[\u4e00-\u9fff]/.test(query)) {
      if (state.coreDict[query] || state.indexDict[query]) {
        matches.push(query);
      }
    }

    // 2. 拼音匹配与词语匹配
    for (const [char, idx] of Object.entries(state.indexDict)) {
      if (matches.length >= 15) break;
      if (matches.includes(char)) continue;

      const py = (idx.p || '').toLowerCase();
      // 拼音前缀或全拼匹配
      if (py.startsWith(query) || window.DictionaryReadings.readings(idx).some(p => {
        const candidate = window.DictionaryReadings.parse(p);
        const input = window.DictionaryReadings.parse(query);
        return candidate && input && candidate.raw.startsWith(input.raw) && (!/[1-5āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(query) || candidate.tone === input.tone);
      })) {
        matches.push(char);
      }
    }

    renderSearchDropdown(matches);
  }

  function renderSearchDropdown(matches) {
    if (matches.length === 0) {
      el.searchDropdown.innerHTML = '<div style="padding:0.75rem 1rem;color:var(--ink-muted);font-size:0.85rem;">未找到匹配汉字</div>';
      el.searchDropdown.style.display = 'block';
      return;
    }

    el.searchDropdown.innerHTML = '';
    matches.forEach(ch => {
      const entry = state.coreDict[ch] || state.indexDict[ch] || {};
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <div style="display:flex;align-items:center;">
          <span class="search-item-char">${ch}</span>
          <span class="search-item-pinyin">${entry.pinyin || entry.p || ''}</span>
        </div>
        <span class="search-item-meta">部首：${entry.radical || entry.r || '-'} · ${entry.strokes || entry.s || '-'}画</span>
      `;
      item.addEventListener('click', () => {
        el.searchInput.value = '';
        el.searchDropdown.style.display = 'none';
        el.searchClear.style.display = 'none';
        loadCharacter(ch);
      });
      el.searchDropdown.appendChild(item);
    });
    el.searchDropdown.style.display = 'block';
  }

  // 8. 部首检字弹窗逻辑（每次只呈现当前一步）
  let radCurrentStep = 0;
  function initRadicalDrawer() {
    try {
      const track = document.getElementById('rad-drawer-track');
      const backBtn = document.getElementById('rad-drawer-back-btn');
      const drawerTitle = document.getElementById('rad-drawer-title');
      const breadcrumbs = document.getElementById('rad-breadcrumbs');
      const strokeSelector = document.getElementById('radical-stroke-selector');
      const radSelectTitle = document.getElementById('radical-select-title');
      const radButtonsBox = document.getElementById('radical-buttons-container');
      const radResultsTitle = document.getElementById('selected-radical-title');
      const extraFilterBar = document.getElementById('extra-stroke-filter-bar');
      const resultContainer = document.getElementById('radical-results-list');

      if (!track || !strokeSelector || !radButtonsBox || !resultContainer || !window.RADICAL_GROUPS) return;

      // 切换视图 Step (0: 选笔画, 1: 选部首, 2: 查汉字)
      function goToRadicalStep(stepIndex) {
        radCurrentStep = Math.max(0, Math.min(2, stepIndex));
        track.style.transform = `translateX(-${radCurrentStep * 33.333333}%)`;

        // 更新返回按钮状态与标题
        if (radCurrentStep === 0) {
          backBtn.classList.add('hidden');
          drawerTitle.textContent = '部首查字';
        } else if (radCurrentStep === 1) {
          backBtn.classList.remove('hidden');
          const backText = backBtn.querySelector('.back-text');
          if (backText) backText.textContent = '返回部首笔画';
          drawerTitle.textContent = '部首查字';
        } else if (radCurrentStep === 2) {
          backBtn.classList.remove('hidden');
          const backText = backBtn.querySelector('.back-text');
          if (backText) backText.textContent = '返回选择部首';
          drawerTitle.textContent = '部首查字';
        }

        // 更新面包屑指示器
        if (breadcrumbs) {
          const crumbs = breadcrumbs.querySelectorAll('.crumb');
          crumbs.forEach((c, idx) => {
            c.classList.toggle('active', idx === radCurrentStep);
            c.classList.toggle('complete', idx < radCurrentStep);
            c.setAttribute('aria-current', idx === radCurrentStep ? 'step' : 'false');
          });
        }
      }

      // 绑定返回按钮
      backBtn.onclick = () => {
        goToRadicalStep(radCurrentStep - 1);
      };

      // 绑定面包屑跳转
      if (breadcrumbs) {
        breadcrumbs.querySelectorAll('.crumb').forEach(c => {
          c.onclick = () => {
            const targetStep = parseInt(c.dataset.step, 10);
            if (targetStep <= radCurrentStep) {
              goToRadicalStep(targetStep);
            }
          };
        });
      }

      // 1. 渲染 Pane 1：1~17 笔画卡片网格
      strokeSelector.innerHTML = '';
      window.RADICAL_GROUPS.forEach(g => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'stroke-drill-card';
        card.innerHTML = `
          <div class="stroke-main">
            <span class="stroke-number">${g.stroke} 画</span>
            <span class="stroke-count-sub">${g.radicals.length} 个部首</span>
          </div>
          <span class="drill-chevron">›</span>
        `;
        card.addEventListener('click', () => {
          state.selectedRadicalStroke = g.stroke;
          populateRadicals(g);
          goToRadicalStep(1); // Push to Step 2
        });
        strokeSelector.appendChild(card);
      });

      // 2. 渲染 Pane 2：该笔画下的所有部首卡片
      function populateRadicals(g) {
        if (radSelectTitle) {
          radSelectTitle.textContent = `请选择【 ${g.stroke} 画 】部首（共 ${g.radicals.length} 个）`;
        }
        radButtonsBox.innerHTML = '';
        g.radicals.forEach(rItem => {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'radical-drill-card';
          card.innerHTML = `
            <div class="rad-left">
              <span class="rad-char">${rItem.radical}</span>
              <span class="rad-sub">${rItem.count}字</span>
            </div>
            <span class="drill-chevron">›</span>
          `;
          card.title = `部首：${rItem.radical}（共 ${rItem.count} 字）`;
          card.addEventListener('click', () => {
            state.selectedRadical = rItem.radical;
            state.selectedExtraStroke = 'all';
            populateResults(rItem, g.stroke);
            goToRadicalStep(2); // Push to Step 3
          });
          radButtonsBox.appendChild(card);
        });
      }

      // 3. 渲染 Pane 3：按剩余笔画分类与汉字检字结果
      function populateResults(rItem, strokeNum) {
        if (radResultsTitle) {
          radResultsTitle.textContent = `部首【 ${rItem.radical} 】（${strokeNum}画 · 共${rItem.count}字）剩余笔画检字`;
        }

        // 渲染剩余笔画快速筛选胶囊
        if (extraFilterBar) {
          extraFilterBar.innerHTML = '';
          const allPill = document.createElement('button');
          allPill.className = 'subfilter-pill-btn active';
          allPill.textContent = `全部 (共${rItem.count}字)`;
          allPill.addEventListener('click', () => {
            extraFilterBar.querySelectorAll('.subfilter-pill-btn').forEach(p => p.classList.remove('active'));
            allPill.classList.add('active');
            renderExtraStrokeChars(rItem, 'all');
          });
          extraFilterBar.appendChild(allPill);

          if (rItem.extra_groups && rItem.extra_groups.length > 0) {
            rItem.extra_groups.forEach(eg => {
              const pill = document.createElement('button');
              pill.className = 'subfilter-pill-btn';
              pill.textContent = `剩 ${eg.extra} 画 (${eg.count}字)`;
              pill.addEventListener('click', () => {
                extraFilterBar.querySelectorAll('.subfilter-pill-btn').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                renderExtraStrokeChars(rItem, eg.extra);
              });
              extraFilterBar.appendChild(pill);
            });
          }
        }

        renderExtraStrokeChars(rItem, 'all');
      }

      // 渲染汉字
      function renderExtraStrokeChars(rItem, filterExtra) {
        resultContainer.innerHTML = '';
        if (!rItem.extra_groups || rItem.extra_groups.length === 0) {
          const grid = document.createElement('div');
          grid.className = 'char-chips-grid';
          (rItem.chars || []).forEach(ch => {
            grid.appendChild(createRadicalCharChip(ch));
          });
          resultContainer.appendChild(grid);
          return;
        }

        const groupsToShow = filterExtra === 'all'
          ? rItem.extra_groups
          : rItem.extra_groups.filter(eg => eg.extra === filterExtra);

        groupsToShow.forEach(eg => {
          const sec = document.createElement('div');
          sec.className = 'group-section';

          const titleRow = document.createElement('div');
          titleRow.className = 'group-section-title';
          titleRow.innerHTML = `
            <span>【 除去部首还剩 ${eg.extra} 画 】</span>
            <span class="group-section-count">共 ${eg.count} 字</span>
          `;
          sec.appendChild(titleRow);

          const grid = document.createElement('div');
          grid.className = 'char-chips-grid';
          eg.chars.forEach(ch => {
            grid.appendChild(createRadicalCharChip(ch));
          });
          sec.appendChild(grid);
          resultContainer.appendChild(sec);
        });
      }

      function createRadicalCharChip(ch) {
        const chip = document.createElement('span');
        chip.className = 'char-chip';
        chip.textContent = ch;
        const idxEnt = state.indexDict[ch] || state.coreDict[ch];
        if (idxEnt) {
          chip.title = `${ch} [${idxEnt.p || idxEnt.pinyin || ''}] · 总${idxEnt.s || idxEnt.strokes || ''}画 (部外${idxEnt.es ?? idxEnt.extra_strokes ?? ''}画)`;
        } else {
          chip.title = ch;
        }
        chip.addEventListener('click', () => {
          closeLookupModal(el.radicalModal);
          loadCharacter(ch);
        });
        return chip;
      }

      // 打开时默认重置为第一步
      goToRadicalStep(0);
    } catch (e) {
      console.error('initRadicalDrawer 异常:', e);
    }
  }

  // 9. 拼音检字弹窗逻辑（声母 -> 韵母 -> 按声调检字）
  let pyCurrentStep = 0;
  function initPinyinDrawer() {
    try {
      const track = document.getElementById('py-drawer-track');
      const backBtn = document.getElementById('py-drawer-back-btn');
      const drawerTitle = document.getElementById('py-drawer-title');
      const breadcrumbs = document.getElementById('py-breadcrumbs');
      const shengmuNav = document.getElementById('pinyin-shengmu-nav');
      const selectedPinyinTitle = document.getElementById('selected-pinyin-title');
      const yunmuCardsBox = document.getElementById('yunmu-cards-container');
      const pyResultsTitle = document.getElementById('py-results-title');
      const resultContainer = document.getElementById('pinyin-results-list');

      if (!track || !shengmuNav || !yunmuCardsBox || !resultContainer || !window.PINYIN_GROUPS) return;

      // 切换视图 Step (0: 选声母, 1: 选韵母, 2: 查汉字)
      function goToPinyinStep(stepIndex) {
        pyCurrentStep = Math.max(0, Math.min(2, stepIndex));
        track.style.transform = `translateX(-${pyCurrentStep * 33.333333}%)`;

        // 更新返回按钮状态与标题
        if (pyCurrentStep === 0) {
          backBtn.classList.add('hidden');
          drawerTitle.textContent = '拼音查字';
        } else if (pyCurrentStep === 1) {
          backBtn.classList.remove('hidden');
          const backText = backBtn.querySelector('.back-text');
          if (backText) backText.textContent = '返回选择声母';
          drawerTitle.textContent = '拼音查字';
        } else if (pyCurrentStep === 2) {
          backBtn.classList.remove('hidden');
          const backText = backBtn.querySelector('.back-text');
          if (backText) backText.textContent = '返回选择韵母';
          drawerTitle.textContent = '拼音查字';
        }

        // 更新面包屑指示器
        if (breadcrumbs) {
          const crumbs = breadcrumbs.querySelectorAll('.crumb');
          crumbs.forEach((c, idx) => {
            c.classList.toggle('active', idx === pyCurrentStep);
            c.classList.toggle('complete', idx < pyCurrentStep);
            c.setAttribute('aria-current', idx === pyCurrentStep ? 'step' : 'false');
          });
        }
      }

      // 绑定返回按钮
      backBtn.onclick = () => {
        goToPinyinStep(pyCurrentStep - 1);
      };

      // 绑定面包屑跳转
      if (breadcrumbs) {
        breadcrumbs.querySelectorAll('.crumb').forEach(c => {
          c.onclick = () => {
            const targetStep = parseInt(c.dataset.step, 10);
            if (targetStep <= pyCurrentStep) {
              goToPinyinStep(targetStep);
            }
          };
        });
      }

      // 1. 渲染 Pane 1：23 个标准声母 + 零声母卡片网格
      shengmuNav.innerHTML = '';
      window.PINYIN_GROUPS.forEach(g => {
        const smName = g.shengmu || g.initial || 'b';
        const smCount = g.count || (g.syllables ? g.syllables.reduce((acc, s) => acc + (s.count || 0), 0) : 0);

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'shengmu-drill-card';
        card.innerHTML = `
          <div>
            <div class="sm-letter">${smName}</div>
            <div class="sm-sub">${smCount} 字</div>
          </div>
          <span class="drill-chevron">›</span>
        `;
        card.title = `声母：${smName}（共 ${smCount} 字）`;
        card.addEventListener('click', () => {
          state.selectedShengmu = smName;
          populateYunmus(g);
          goToPinyinStep(1); // Push to Step 2
        });
        shengmuNav.appendChild(card);
      });

      // 2. 渲染 Pane 2：该声母下的所有韵母卡片
      function populateYunmus(g) {
        const smName = g.shengmu || g.initial || 'b';
        const smCount = g.count || 0;
        if (selectedPinyinTitle) {
          selectedPinyinTitle.textContent = `声母【 ${smName} 】所含韵母（共 ${smCount} 字）`;
        }
        yunmuCardsBox.innerHTML = '';

        if (g.syllables) {
          g.syllables.forEach(syl => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'yunmu-drill-card';
            const ymDisplay = syl.yunmu && syl.yunmu !== syl.syllable ? `-${syl.yunmu} (${syl.syllable})` : syl.syllable;
            card.innerHTML = `
              <div>
                <div class="ym-name">${ymDisplay}</div>
                <div class="ym-sub">${syl.count || 0} 字</div>
              </div>
              <span class="drill-chevron">›</span>
            `;
            card.title = `韵母：${ymDisplay}（共 ${syl.count || 0} 字）`;
            card.addEventListener('click', () => {
              state.selectedYunmu = syl.syllable;
              populatePinyinChars(g, syl.syllable);
              goToPinyinStep(2); // Push to Step 3
            });
            yunmuCardsBox.appendChild(card);
          });
        }
      }

      // 3. 渲染 Pane 3：四声汉字结果
      function populatePinyinChars(g, syllable) {
        if (pyResultsTitle) {
          pyResultsTitle.textContent = `音节【 ${syllable} 】查得汉字（按四声分列）`;
        }
        resultContainer.innerHTML = '';
        if (!g.syllables) return;

        const syl = g.syllables.find(s => s.syllable === syllable);
        if (!syl) return;

        const toneNames = { 
          1: '一声（阴平）', 
          2: '二声（阳平）', 
          3: '三声（上声）', 
          4: '四声（去声）', 
          5: '轻声' 
        };

        const sec = document.createElement('div');
        sec.className = 'group-section';

        const ymTitle = syl.yunmu && syl.yunmu !== syl.syllable ? `-${syl.yunmu}` : syl.syllable;
        const titleRow = document.createElement('div');
        titleRow.className = 'group-section-title';
        titleRow.innerHTML = `
          <span>【 韵母 ${ymTitle} · 音节 ${syl.syllable} 】</span>
          <span class="group-section-count">共 ${syl.count} 字</span>
        `;
        sec.appendChild(titleRow);

        if (syl.tones) {
          for (const [t, chars] of Object.entries(syl.tones)) {
            if (!chars || chars.length === 0) continue;
            const toneBlock = document.createElement('div');
            toneBlock.className = 'tone-subblock';
            toneBlock.innerHTML = `<div class="tone-subblock-title">${toneNames[t] || '其他'} · ${chars.length}字</div>`;

            const grid = document.createElement('div');
            grid.className = 'char-chips-grid';
            chars.forEach(ch => {
              const chip = document.createElement('span');
              chip.className = 'char-chip';
              chip.textContent = ch;
              const idxEnt = state.indexDict[ch] || state.coreDict[ch];
              chip.title = `${ch} [${idxEnt?.p || idxEnt?.pinyin || syl.syllable}]`;
              chip.addEventListener('click', () => {
                closeLookupModal(el.pinyinModal);
                loadCharacter(ch);
              });
              grid.appendChild(chip);
            });

            toneBlock.appendChild(grid);
            sec.appendChild(toneBlock);
          }
        }

        resultContainer.appendChild(sec);
      }

      // 打开时默认重置为第一步
      goToPinyinStep(0);
    } catch (e) {
      console.error('initPinyinDrawer 异常:', e);
    }
  }

  let lookupTrigger = null;

  function openLookupModal(modal, dialog) {
    lookupTrigger = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lookup-modal-open');
    requestAnimationFrame(() => dialog?.focus());
  }

  function closeLookupModal(modal) {
    if (!modal?.classList.contains('active')) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lookup-modal-open');
    if (lookupTrigger && typeof lookupTrigger.focus === 'function') lookupTrigger.focus();
    lookupTrigger = null;
  }

  // 10. 事件绑定
  function bindEvents() {
    // 播放与重播
    el.btnPlay.addEventListener('click', () => {
      if (state.writer) state.writer.animateCharacter();
    });

    el.btnReplay.addEventListener('click', () => {
      if (state.writer) {
        state.writer.cancelQuiz();
        state.isQuizMode = false;
        el.btnQuiz.classList.remove('active');
        el.quizFeedback.style.display = 'none';
        state.writer.animateCharacter();
      }
    });

    // 描红交互练字模式 (Quiz mode)
    el.btnQuiz.addEventListener('click', () => {
      if (!state.writer) return;
      state.isQuizMode = !state.isQuizMode;

      if (state.isQuizMode) {
        el.btnQuiz.classList.add('active');
        el.quizFeedback.style.display = 'block';
        el.quizFeedback.className = 'quiz-feedback-box';
        el.quizFeedback.textContent = '请在格子里按照正确笔顺临摹书写';

        state.writer.quiz({
          onMistake: function(strokeData) {
            el.quizFeedback.className = 'quiz-feedback-box mistake';
            el.quizFeedback.textContent = `第 ${strokeData.strokeNum + 1} 笔书写有误，再试一次`;
          },
          onCorrectStroke: function(strokeData) {
            el.quizFeedback.className = 'quiz-feedback-box success';
            el.quizFeedback.textContent = `第 ${strokeData.strokeNum + 1} 笔书写正确！`;
          },
          onComplete: function(summary) {
            el.quizFeedback.className = 'quiz-feedback-box success';
            el.quizFeedback.textContent = `太棒了！书写完成，共失误 ${summary.totalMistakes} 次！`;
          }
        });
      } else {
        el.btnQuiz.classList.remove('active');
        state.writer.cancelQuiz();
        el.quizFeedback.style.display = 'none';
        state.writer.showCharacter();
      }
    });

    // 网格切换 (米字格 -> 田字格 -> 无网格)
    el.btnGridToggle.addEventListener('click', () => {
      if (state.gridType === 'mi-zi-ge') {
        state.gridType = 'tian-zi-ge';
        el.btnGridToggle.textContent = '田字格';
      } else if (state.gridType === 'tian-zi-ge') {
        state.gridType = 'none';
        el.btnGridToggle.textContent = '纯白格';
      } else {
        state.gridType = 'mi-zi-ge';
        el.btnGridToggle.textContent = '米字格';
      }
      el.gridLines.className = `grid-lines ${state.gridType}`;
    });

    // 速度切换
    el.speedSelect.addEventListener('change', (e) => {
      state.animSpeed = parseFloat(e.target.value);
      if (state.writer) {
        state.writer.update({ strokeAnimationSpeed: state.animSpeed });
      }
    });

    // 搜索框事件
    let debounceTimer = null;
    el.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => handleSearchInput(e.target.value), 200);
    });

    el.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = el.searchInput.value.trim();
        if (val) {
          el.searchDropdown.style.display = 'none';
          loadCharacter(val[0]);
        }
      }
    });

    el.searchClear.addEventListener('click', () => {
      el.searchInput.value = '';
      el.searchClear.style.display = 'none';
      el.searchDropdown.style.display = 'none';
    });

    // 点击外部隐藏搜索下拉框
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        el.searchDropdown.style.display = 'none';
      }
    });

    // 部首检字弹窗开闭
    el.btnRadicalOpen.addEventListener('click', () => {
      initRadicalDrawer();
      openLookupModal(el.radicalModal, document.getElementById('radical-drawer'));
    });

    // 拼音检字弹窗开闭
    el.btnPinyinOpen.addEventListener('click', () => {
      initPinyinDrawer();
      openLookupModal(el.pinyinModal, document.getElementById('pinyin-drawer'));
    });

    // 随机一字探索
    el.btnRandomChar.addEventListener('click', () => {
      const keys = Object.keys(state.coreDict);
      if (keys.length > 0) {
        const randomChar = keys[Math.floor(Math.random() * keys.length)];
        loadCharacter(randomChar);
      }
    });

    // 模态框关闭按钮
    el.modalCloseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeLookupModal(btn.closest('.drawer-overlay'));
      });
    });

    // 点击遮罩外部关闭模态框
    [el.radicalModal, el.pinyinModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLookupModal(modal);
      });
    });

    document.addEventListener('keydown', (e) => {
      const activeModal = document.querySelector('.drawer-overlay.active');
      if (!activeModal) return;

      if (e.key === 'Escape') {
        closeLookupModal(activeModal);
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(activeModal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(node => node.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === activeModal.querySelector('[role="dialog"]'))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // 工具函数：URL 参数
  function getUrlParam(key) {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(key);
    } catch (e) {
      return null;
    }
  }

  function setUrlParam(key, val) {
    try {
      if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        const url = new URL(window.location);
        url.searchParams.set(key, val);
        window.history.replaceState({}, '', url);
      }
    } catch (e) {
      // 忽略本地 file:// 协议或受限环境下的 History 异常
    }
  }

  // 启动：兼顾已加载完毕或正在加载状态
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
