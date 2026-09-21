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
    renderId: 0
  };

  // 字符矢量数据缓存池（内存 + LocalStorage 双层持久缓存）
  const charDataCache = new Map();

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
      const cached = localStorage.getItem('hz_data_' + char);
      if (cached) {
        const parsed = JSON.parse(cached);
        charDataCache.set(char, parsed);
        return parsed;
      }
    } catch (e) {}

    // 4. 从 CDN 动态抓取（支持快速多镜像重试）
    const encoded = encodeURIComponent(char);
    const urls = [
      `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encoded}.json`,
      `https://unpkg.com/hanzi-writer-data@2.0/${encoded}.json`
    ];

    let data = null;
    for (const u of urls) {
      try {
        const res = await fetch(u, { cache: 'force-cache' });
        if (res.ok) {
          data = await res.json();
          break;
        }
      } catch (err) {}
    }

    if (data) {
      charDataCache.set(char, data);
      try {
        localStorage.setItem('hz_data_' + char, JSON.stringify(data));
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

    // 默认展示“永”字（汉字书法与笔顺集大成者）
    const initialChar = getUrlParam('char') || '永';
    loadCharacter(initialChar);
  }

  // 2. 汉字加载与展示
  async function loadCharacter(char) {
    if (!char) return;
    char = char.trim()[0]; // 确保单个汉字
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
        explanation: `${char}\n暂无收录详细释义，已为您展示动态笔画与逐笔拆解。`,
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
    el.mainPinyin.textContent = entry.pinyin || '';
    
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

  const TONE_SYMBOLS = {
    'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
    'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
    'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
    'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
    'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
    'ǖ': ['v', 1], 'ǘ': ['v', 2], 'ǚ': ['v', 3], 'ǜ': ['v', 4], 'ü': ['v', 5],
    'ń': ['n', 2], 'ň': ['n', 3], 'ǹ': ['n', 4]
  };

  function findHomophonesByPinyin(char, py) {
    if (!py || !window.PINYIN_GROUPS) return [];
    py = py.replace('ɡ', 'g').split(',')[0].trim();
    let raw = '';
    let tone = 5;
    for (const c of py) {
      if (TONE_SYMBOLS[c]) {
        raw += TONE_SYMBOLS[c][0];
        tone = TONE_SYMBOLS[c][1];
      } else {
        raw += c;
      }
    }
    raw = raw.toLowerCase();
    if (!raw) return [];
    const initial = raw[0].toUpperCase();
    const group = window.PINYIN_GROUPS.find(g => g.initial === initial);
    if (!group) return [];
    const syl = group.syllables.find(s => s.syllable === raw);
    if (!syl || !syl.tones || !syl.tones[tone]) return [];
    return syl.tones[tone].filter(c => c !== char).slice(0, 14);
  }

    // 同音字（确保 100% 双向完全对称）
    el.homophonesList.innerHTML = '';
    let homophones = (entry.homophones && entry.homophones.length > 0)
      ? entry.homophones
      : findHomophonesByPinyin(entry.char, entry.pinyin);

    // 双向安全保证：如果当前列表里缺少同音字或为空，补全动态同音字
    if (!homophones || homophones.length === 0) {
      homophones = findHomophonesByPinyin(entry.char, entry.pinyin);
    }

    if (homophones && homophones.length > 0) {
      homophones.forEach(h => {
        const chip = document.createElement('span');
        chip.className = 'homophone-chip';
        chip.textContent = h;
        chip.title = `查看同音字：${h}`;
        chip.addEventListener('click', () => loadCharacter(h));
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
      const charData = await getCharData(char);

      // 若用户在加载期间已快速切换至下一个汉字，丢弃已过期的请求结果，防止竞态冲突
      if (state.renderId !== currentRequestId) return;

      state.charData = charData;
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

      const strokeCount = charData.strokes.length;
      el.strokeCountBadge.textContent = `共 ${strokeCount} 笔`;

      // 3. 渲染下方逐笔演变网格
      renderStrokeBreakdown(charData, entry.stroke_code);

      // 4. 自动流畅播放一次书写动画
      state.writer.animateCharacter();

      // 5. 后台静默预热该字的组词与同音字，实现点击相关汉字 0 延迟秒开
      prefetchRelatedChars(entry);

    } catch (err) {
      if (state.renderId !== currentRequestId) return;
      console.warn('字形矢量笔画数据加载异常:', err);
      el.strokeStepsGrid.innerHTML = '<div style="grid-column:1/-1;color:var(--ink-muted);font-size:0.85rem;padding:0.5rem 0;">该字矢量笔画数据加载中或暂无数据</div>';
      el.strokeCountBadge.textContent = `${entry.strokes || '-'} 笔`;
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
      const codeChar = (strokeCode && strokeCode[idx]) ? strokeCode[idx] : null;
      const strokeName = window.StrokeIdentifier 
        ? window.StrokeIdentifier.identifyStrokeName(medians[idx], codeChar)
        : '笔';

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
      if (py.startsWith(query) || py.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, '').startsWith(query)) {
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

  // 8. 部首检字抽屉逻辑 (模拟新华字典真实规范：1.定部首笔画 -> 2.选定部首 -> 3.数剩余笔画查字)
  function initRadicalDrawer() {
    try {
      const strokeSelector = document.getElementById('radical-stroke-selector');
      const strokeLabel = document.getElementById('current-stroke-label');
      const radSelectTitle = document.getElementById('radical-select-title');
      const radSelectedBadge = document.getElementById('current-rad-selected-badge');
      const radButtonsBox = document.getElementById('radical-buttons-container');
      const radTitle = document.getElementById('selected-radical-title');
      const radBadge = document.getElementById('selected-radical-badge');
      const extraFilterBar = document.getElementById('extra-stroke-filter-bar');
      const resultContainer = document.getElementById('radical-results-list');

      if (!strokeSelector || !radButtonsBox || !resultContainer || !window.RADICAL_GROUPS) return;

      // 1. 生成步骤 ①：部首笔画数筛选条 (1画 ~ 17画)
      strokeSelector.innerHTML = '';
      window.RADICAL_GROUPS.forEach(g => {
        const btn = document.createElement('button');
        btn.className = 'stroke-pill-btn';
        if (g.stroke === state.selectedRadicalStroke) btn.classList.add('active');
        btn.textContent = `${g.stroke} 画 (${g.radicals.length}部)`;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.stroke-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.selectedRadicalStroke = g.stroke;
          selectStrokeCount(g.stroke);
        });
        strokeSelector.appendChild(btn);
      });

      // 切换笔画数
      function selectStrokeCount(strokeNum) {
        if (strokeLabel) strokeLabel.textContent = `当前选择：${strokeNum} 画`;
        const group = window.RADICAL_GROUPS.find(g => g.stroke === strokeNum) || window.RADICAL_GROUPS[0];
        if (radSelectTitle) {
          radSelectTitle.textContent = `步骤 ② · 请点击选择部首（${group.stroke}画部首，共 ${group.radicals.length} 个）`;
        }

        // 渲染该笔画下的所有部首 (步骤 ②)
        radButtonsBox.innerHTML = '';
        group.radicals.forEach(rItem => {
          const rBtn = document.createElement('button');
          rBtn.className = 'radical-card-btn';
          if (state.selectedRadical === rItem.radical) rBtn.classList.add('active');
          
          rBtn.innerHTML = `
            <span>${rItem.radical}</span>
            <span class="rad-count">${rItem.count}</span>
          `;
          rBtn.title = `部首：${rItem.radical} (${group.stroke}画 · 共${rItem.count}字)`;

          rBtn.addEventListener('click', () => {
            document.querySelectorAll('.radical-card-btn').forEach(b => b.classList.remove('active'));
            rBtn.classList.add('active');
            state.selectedRadical = rItem.radical;
            state.selectedExtraStroke = 'all';
            selectRadical(rItem, group.stroke);
          });

          radButtonsBox.appendChild(rBtn);
        });

        // 如果已选部首不在当前笔画组内，则默认选择当前组的第一个部首
        let currentRad = group.radicals.find(r => r.radical === state.selectedRadical);
        if (!currentRad) {
          currentRad = group.radicals[0];
          state.selectedRadical = currentRad.radical;
          const firstBtn = radButtonsBox.querySelector('.radical-card-btn');
          if (firstBtn) firstBtn.classList.add('active');
        }

        selectRadical(currentRad, group.stroke);
      }

      // 选定部首，展开步骤 ③ (剩余笔画筛选与检字表)
      function selectRadical(rItem, strokeNum) {
        if (radSelectedBadge) {
          radSelectedBadge.textContent = `已选部首：${rItem.radical}（${strokeNum}画 · 共${rItem.count}字）`;
        }
        if (radTitle) {
          radTitle.textContent = `步骤 ③ · 数汉字除去部首【 ${rItem.radical} 】后剩下的笔画数`;
        }
        if (radBadge) {
          radBadge.textContent = `共 ${rItem.count} 字`;
        }

        // 渲染剩余笔画快速筛选胶囊行
        if (extraFilterBar) {
          extraFilterBar.innerHTML = '';
          const allPill = document.createElement('button');
          allPill.className = 'subfilter-pill-btn active';
          allPill.textContent = `全部 (共${rItem.count}字)`;
          allPill.addEventListener('click', () => {
            document.querySelectorAll('.subfilter-pill-btn').forEach(p => p.classList.remove('active'));
            allPill.classList.add('active');
            state.selectedExtraStroke = 'all';
            renderExtraStrokeChars(rItem, 'all');
          });
          extraFilterBar.appendChild(allPill);

          if (rItem.extra_groups && rItem.extra_groups.length > 0) {
            rItem.extra_groups.forEach(eg => {
              const pill = document.createElement('button');
              pill.className = 'subfilter-pill-btn';
              pill.textContent = `剩 ${eg.extra} 画 (${eg.count}字)`;
              pill.addEventListener('click', () => {
                document.querySelectorAll('.subfilter-pill-btn').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.selectedExtraStroke = eg.extra;
                renderExtraStrokeChars(rItem, eg.extra);
              });
              extraFilterBar.appendChild(pill);
            });
          }
        }

        renderExtraStrokeChars(rItem, 'all');
      }

      // 渲染汉字列表
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
          el.radicalModal.classList.remove('active');
          loadCharacter(ch);
        });
        return chip;
      }

      // 初始化：默认选择 3 画（草字头 艹 所在笔画组）
      selectStrokeCount(state.selectedRadicalStroke || 3);
    } catch (e) {
      console.error('initRadicalDrawer 异常:', e);
    }
  }

  // 9. 拼音检字抽屉逻辑 (模拟新华字典真实规范：1.定声母 -> 2.选韵母 -> 3.按四声查看汉字)
  function initPinyinDrawer() {
    try {
      const shengmuNav = document.getElementById('pinyin-shengmu-nav');
      const smBadge = document.getElementById('current-sm-selected-badge');
      const pinyinTitle = document.getElementById('selected-pinyin-title');
      const pinyinBadge = document.getElementById('selected-pinyin-badge');
      const yunmuFilterBar = document.getElementById('yunmu-filter-bar');
      const resultContainer = document.getElementById('pinyin-results-list');

      if (!shengmuNav || !resultContainer || !window.PINYIN_GROUPS) return;

      // 1. 渲染步骤 ①：23 个标准声母 + 零声母网格
      shengmuNav.innerHTML = '';
      window.PINYIN_GROUPS.forEach(g => {
        const smName = g.shengmu || g.initial || 'b';
        const smCount = g.count || (g.syllables ? g.syllables.reduce((acc, s) => acc + (s.count || 0), 0) : 0);

        const btn = document.createElement('button');
        btn.className = 'shengmu-card-btn';
        if (smName === '零声母') btn.classList.add('special-btn');
        if (smName === state.selectedShengmu) btn.classList.add('active');

        btn.innerHTML = `
          <span class="sm-name">${smName}</span>
          <span class="sm-count">${smCount}字</span>
        `;
        btn.title = `声母：${smName} (共${smCount}字)`;

        btn.addEventListener('click', () => {
          document.querySelectorAll('.shengmu-card-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.selectedShengmu = smName;
          state.selectedYunmu = 'all';
          selectShengmu(g);
        });

        shengmuNav.appendChild(btn);
      });

      // 2. 选定声母，展开步骤 ② (韵母筛选)
      function selectShengmu(g) {
        const smName = g.shengmu || g.initial || 'b';
        const smCount = g.count || (g.syllables ? g.syllables.reduce((acc, s) => acc + (s.count || 0), 0) : 0);
        const yunmus = g.yunmu_list || (g.syllables ? g.syllables.map(s => s.syllable) : []);

        if (smBadge) {
          smBadge.textContent = `已选声母：${smName}`;
        }
        if (pinyinTitle) {
          pinyinTitle.textContent = `第二步 · 声母【 ${smName} 】所含韵母，请点击选择韵母`;
        }
        if (pinyinBadge) {
          pinyinBadge.textContent = `共 ${smCount} 字 · ${yunmus.length} 个韵母`;
        }

        // 生成韵母筛选胶囊条
        if (yunmuFilterBar) {
          yunmuFilterBar.innerHTML = '';
          const allPill = document.createElement('button');
          allPill.className = 'subfilter-pill-btn active';
          allPill.textContent = `全部韵母 (${smCount}字)`;
          allPill.addEventListener('click', () => {
            document.querySelectorAll('#yunmu-filter-bar .subfilter-pill-btn').forEach(p => p.classList.remove('active'));
            allPill.classList.add('active');
            state.selectedYunmu = 'all';
            renderPinyinChars(g, 'all');
          });
          yunmuFilterBar.appendChild(allPill);

          if (g.syllables) {
            g.syllables.forEach(syl => {
              const pill = document.createElement('button');
              pill.className = 'subfilter-pill-btn';
              const ymDisplay = syl.yunmu && syl.yunmu !== syl.syllable ? `-${syl.yunmu} (${syl.syllable})` : syl.syllable;
              pill.textContent = `${ymDisplay} [${syl.count || 0}]`;
              pill.addEventListener('click', () => {
                document.querySelectorAll('#yunmu-filter-bar .subfilter-pill-btn').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.selectedYunmu = syl.syllable;
                renderPinyinChars(g, syl.syllable);
              });
              yunmuFilterBar.appendChild(pill);
            });
          }
        }

        renderPinyinChars(g, 'all');
      }

      // 3. 渲染步骤 ③：汉字检字结果 (按韵母与四声分块)
      function renderPinyinChars(g, filterSyllable) {
        resultContainer.innerHTML = '';
        if (!g.syllables) return;

        const syllablesToShow = filterSyllable === 'all'
          ? g.syllables
          : g.syllables.filter(s => s.syllable === filterSyllable);

        const toneNames = { 
          1: '一声（阴平）', 
          2: '二声（阳平）', 
          3: '三声（上声）', 
          4: '四声（去声）', 
          5: '轻声' 
        };

        syllablesToShow.forEach(syl => {
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
                  el.pinyinModal.classList.remove('active');
                  loadCharacter(ch);
                });
                grid.appendChild(chip);
              });

              toneBlock.appendChild(grid);
              sec.appendChild(toneBlock);
            }
          }

          resultContainer.appendChild(sec);
        });
      }

      // 默认展示“b”声母
      const defaultGroup = window.PINYIN_GROUPS.find(g => (g.shengmu || g.initial) === state.selectedShengmu) || window.PINYIN_GROUPS[0];
      if (defaultGroup) {
        selectShengmu(defaultGroup);
      }
    } catch (e) {
      console.error('initPinyinDrawer 异常:', e);
    }
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

    // 部首检字抽屉开闭
    el.btnRadicalOpen.addEventListener('click', () => {
      initRadicalDrawer();
      el.radicalModal.classList.add('active');
    });

    // 拼音检字抽屉开闭
    el.btnPinyinOpen.addEventListener('click', () => {
      initPinyinDrawer();
      el.pinyinModal.classList.add('active');
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
        el.radicalModal.classList.remove('active');
        el.pinyinModal.classList.remove('active');
      });
    });

    // 点击遮罩外部关闭模态框
    [el.radicalModal, el.pinyinModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
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
