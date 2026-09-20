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
    selectedRadical: null,
    selectedAlpha: 'Y',
    selectedSyllable: null
  };

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

    // 同音字
    el.homophonesList.innerHTML = '';
    if (entry.homophones && entry.homophones.length > 0) {
      entry.homophones.forEach(h => {
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
    // 清空旧的主画布与练字提示
    el.writerContainer.innerHTML = '';
    el.quizFeedback.style.display = 'none';
    el.quizFeedback.className = 'quiz-feedback-box';
    state.isQuizMode = false;
    el.btnQuiz.classList.remove('active');

    if (typeof HanziWriter === 'undefined') {
      console.error('HanziWriter 未加载');
      return;
    }

    // 初始化 HanziWriter 主演示画布
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
      charDataLoader: function(c, onComplete, onFail) {
        if (window.PRELOADED_HANZI && window.PRELOADED_HANZI[c]) {
          onComplete(window.PRELOADED_HANZI[c]);
          return;
        }
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(c)}.json`)
          .then(res => res.json())
          .then(data => onComplete(data))
          .catch(err => {
            if (onFail) onFail(err);
          });
      }
    });

    // 异步加载单字矢量骨架数据以实现下方逐笔拆解
    try {
      let charData = null;
      if (window.PRELOADED_HANZI && window.PRELOADED_HANZI[char]) {
        charData = window.PRELOADED_HANZI[char];
      } else {
        charData = await HanziWriter.loadCharacterData(char);
      }
      state.charData = charData;
      
      const strokeCount = charData.strokes.length;
      el.strokeCountBadge.textContent = `共 ${strokeCount} 笔`;

      // 渲染下方逐笔网格 (位于动图下面)
      renderStrokeBreakdown(charData, entry.stroke_code);

      // 主动播放一次书写动画
      state.writer.animateCharacter();
    } catch (err) {
      console.warn('该字暂无在线矢量笔顺数据:', err);
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

  // 8. 部首检字抽屉逻辑
  function initRadicalDrawer() {
    const listContainer = document.getElementById('radical-groups-list');
    const resultContainer = document.getElementById('radical-results-list');
    const radTitle = document.getElementById('selected-radical-title');
    if (!listContainer || !window.RADICAL_GROUPS) return;

    listContainer.innerHTML = '';
    window.RADICAL_GROUPS.forEach(group => {
      const gBox = document.createElement('div');
      gBox.className = 'radical-stroke-group';
      gBox.innerHTML = `<div class="radical-stroke-title">${group.stroke} 画</div>`;
      
      const rList = document.createElement('div');
      rList.className = 'radical-list';

      group.radicals.forEach(rItem => {
        const btn = document.createElement('button');
        btn.className = 'radical-btn';
        btn.textContent = rItem.radical;
        btn.title = `${rItem.radical} (${rItem.count}字)`;
        
        btn.addEventListener('click', () => {
          document.querySelectorAll('.radical-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.selectedRadical = rItem.radical;
          
          radTitle.textContent = `部首【${rItem.radical}】（共 ${rItem.count} 字）`;
          resultContainer.innerHTML = '';
          
          // 列出该部首下的汉字
          rItem.chars.forEach(ch => {
            const chip = document.createElement('span');
            chip.className = 'char-chip';
            chip.textContent = ch;
            chip.addEventListener('click', () => {
              el.radicalModal.classList.remove('active');
              loadCharacter(ch);
            });
            resultContainer.appendChild(chip);
          });
        });

        rList.appendChild(btn);
      });

      gBox.appendChild(rList);
      listContainer.appendChild(gBox);
    });
  }

  // 9. 拼音检字抽屉逻辑
  function initPinyinDrawer() {
    const alphaNav = document.getElementById('pinyin-alpha-nav');
    const sylList = document.getElementById('pinyin-syllables-list');
    const resultContainer = document.getElementById('pinyin-results-list');
    const pinyinTitle = document.getElementById('selected-pinyin-title');
    if (!alphaNav || !window.PINYIN_GROUPS) return;

    alphaNav.innerHTML = '';
    window.PINYIN_GROUPS.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'alpha-btn';
      btn.textContent = g.initial;
      if (g.initial === state.selectedAlpha) btn.classList.add('active');

      btn.addEventListener('click', () => {
        document.querySelectorAll('.alpha-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedAlpha = g.initial;
        renderSyllables(g);
      });

      alphaNav.appendChild(btn);
    });

    function renderSyllables(group) {
      sylList.innerHTML = '';
      resultContainer.innerHTML = '';
      pinyinTitle.textContent = `请选择音节 (${group.initial})`;

      group.syllables.forEach((syl, idx) => {
        const chip = document.createElement('span');
        chip.className = 'syllable-chip';
        chip.textContent = `${syl.syllable} (${syl.count})`;

        chip.addEventListener('click', () => {
          document.querySelectorAll('.syllable-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          renderPinyinChars(syl);
        });

        sylList.appendChild(chip);
        if (idx === 0) chip.click();
      });
    }

    function renderPinyinChars(syl) {
      pinyinTitle.textContent = `音节【${syl.syllable}】（共 ${syl.count} 字）`;
      resultContainer.innerHTML = '';

      const toneNames = { 1: '一声（阴平）', 2: '二声（阳平）', 3: '三声（上声）', 4: '四声（去声）', 5: '轻声' };
      
      for (const [t, chars] of Object.entries(syl.tones)) {
        if (!chars || chars.length === 0) continue;
        const toneGroup = document.createElement('div');
        toneGroup.style.marginBottom = '0.75rem';
        toneGroup.innerHTML = `<div style="font-size:0.8rem;font-weight:700;color:var(--ink-muted);margin-bottom:0.3rem;">${toneNames[t] || '其他'}</div>`;
        
        const grid = document.createElement('div');
        grid.className = 'char-chips-grid';
        chars.forEach(ch => {
          const chip = document.createElement('span');
          chip.className = 'char-chip';
          chip.textContent = ch;
          chip.addEventListener('click', () => {
            el.pinyinModal.classList.remove('active');
            loadCharacter(ch);
          });
          grid.appendChild(chip);
        });
        toneGroup.appendChild(grid);
        resultContainer.appendChild(toneGroup);
      }
    }

    // 默认展示首个字母
    const initialGroup = window.PINYIN_GROUPS.find(g => g.initial === state.selectedAlpha) || window.PINYIN_GROUPS[0];
    if (initialGroup) renderSyllables(initialGroup);
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
