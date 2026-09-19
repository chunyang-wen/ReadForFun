/**
 * 《甲骨文之美 · 殷商刻辞千字典》 App Logic
 * - 1,203 Characters Dataset Management
 * - Explanation-based Semantic Search Engine
 * - Book Page-by-page Reading Engine
 * - Complete Character Catalog with Category Filtering
 * - Visual Ink Style Switcher
 */

(function () {
  'use strict';

  let characters = [];
  let currentPage = 0; // 0 is cover, 1..1203 are character pages
  let currentCategoryFilter = 'all';

  // DOM Elements
  const coverSheet = document.getElementById('coverSheet');
  const pageSheet = document.getElementById('pageSheet');
  const startReadingBtn = document.getElementById('startReadingBtn');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageInput = document.getElementById('pageInput');
  const pageSlider = document.getElementById('pageSlider');

  // Page Content Elements
  const glyphFrame = document.getElementById('glyphFrame');
  const glyphImage = document.getElementById('glyphImage');
  const charCategory = document.getElementById('charCategory');
  const charOriginType = document.getElementById('charOriginType');
  const charFolio = document.getElementById('charFolio');
  const charModern = document.getElementById('charModern');
  const charPinyin = document.getElementById('charPinyin');
  const charUnicode = document.getElementById('charUnicode');
  const glyphDescText = document.getElementById('glyphDescText');
  const charExplanationText = document.getElementById('charExplanationText');
  const charShuowenText = document.getElementById('charShuowenText');
  const charTags = document.getElementById('charTags');

  // Search Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchResultsPanel = document.getElementById('searchResultsPanel');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchResultCount = document.getElementById('searchResultCount');

  // Catalog Modal Elements
  const catalogModal = document.getElementById('catalogModal');
  const openCatalogBtn = document.getElementById('openCatalogBtn');
  const closeCatalogBtn = document.getElementById('closeCatalogBtn');
  const catalogFilters = document.getElementById('catalogFilters');
  const catalogGrid = document.getElementById('catalogGrid');

  // Top Actions
  const randomCharBtn = document.getElementById('randomCharBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themePillBtns = document.querySelectorAll('.theme-pill-btn');

  // Load Data
  async function init() {
    try {
      if (window.__JIAGUWEN_DATA__ && Array.isArray(window.__JIAGUWEN_DATA__)) {
        characters = window.__JIAGUWEN_DATA__;
      } else {
        const res = await fetch('data/characters.json');
        characters = await res.json();
      }
      console.log(`Loaded ${characters.length} characters.`);
      
      setupEventListeners();
      parseUrlHash();
      renderCatalog();
    } catch (err) {
      console.error('Failed to load characters database:', err);
    }
  }

  // Handle URL Hash navigation (e.g. #p=42 or #char=日)
  function parseUrlHash() {
    const hash = window.location.hash;
    if (!hash) {
      goToPage(0, false);
      return;
    }
    if (hash.startsWith('#p=')) {
      const p = parseInt(hash.replace('#p=', ''), 10);
      if (!isNaN(p) && p >= 0 && p <= characters.length) {
        goToPage(p, false);
        return;
      }
    }
    if (hash.startsWith('#char=')) {
      const charStr = decodeURIComponent(hash.replace('#char=', '')).trim();
      const idx = characters.findIndex(c => c.simplified === charStr || c.traditional === charStr || c.modern_char.includes(charStr));
      if (idx !== -1) {
        goToPage(idx + 1, false);
        return;
      }
    }
    goToPage(0, false);
  }

  // Page Turn Machine
  function goToPage(pageNum, updateHash = true) {
    if (pageNum < 0) pageNum = 0;
    if (pageNum > characters.length) pageNum = characters.length;
    currentPage = pageNum;

    if (currentPage === 0) {
      coverSheet.classList.add('active');
      pageSheet.classList.remove('active');
      pageInput.value = 0;
      pageSlider.value = 0;
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = false;
      if (updateHash) history.replaceState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Single Character Page View
    coverSheet.classList.remove('active');
    pageSheet.classList.add('active');

    const item = characters[currentPage - 1];
    renderCharacter(item);

    pageInput.value = currentPage;
    pageSlider.value = currentPage;
    prevPageBtn.disabled = currentPage === 1 ? false : false;
    nextPageBtn.disabled = currentPage === characters.length;

    if (updateHash) {
      const targetChar = item.simplified || item.modern_char;
      history.replaceState(null, '', `#p=${currentPage}&char=${encodeURIComponent(targetChar)}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderCharacter(item) {
    if (glyphImage) {
      glyphImage.src = item.svg;
      glyphImage.alt = `甲骨文 ${item.modern_char}`;
    }
    
    charCategory.textContent = item.category;
    charOriginType.textContent = item.origin_type;
    charFolio.textContent = `第 ${item.page} 页 · 共 ${characters.length} 页 (编号 ${String(item.glyph_id).padStart(4, '0')})`;
    
    charModern.textContent = item.modern_char;
    charPinyin.textContent = item.pinyin;
    charUnicode.textContent = item.unicode ? `U+${item.unicode}` : '';

    glyphDescText.textContent = item.glyph_desc;
    charExplanationText.textContent = item.explanation;
    charShuowenText.textContent = item.shuowen;

    // Tags
    charTags.innerHTML = '';
    (item.tags || []).slice(0, 10).forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag-chip';
      span.textContent = `# ${t}`;
      charTags.appendChild(span);
    });
  }

  // =========================================================
  // Explanation-based Semantic Search
  // =========================================================
  function performExplanationSearch(query) {
    if (!query || query.trim().length === 0) {
      searchResultsPanel.classList.remove('open');
      clearSearchBtn.style.display = 'none';
      return;
    }

    clearSearchBtn.style.display = 'block';
    const q = query.trim().toLowerCase();
    const matches = [];

    for (let i = 0; i < characters.length; i++) {
      const item = characters[i];
      // Search primarily across explanation, glyph_desc, shuowen, and semantic tags
      const explanationText = item.explanation || '';
      const glyphDescText = item.glyph_desc || '';
      const shuowenText = item.shuowen || '';
      const tagsText = (item.tags || []).join(' ');

      const combinedExplanationCorpus = `${explanationText} ${glyphDescText} ${shuowenText} ${tagsText}`.toLowerCase();

      if (combinedExplanationCorpus.includes(q)) {
        // Extract relevant highlighted excerpt
        let excerpt = '';
        if (explanationText.toLowerCase().includes(q)) {
          excerpt = highlightText(explanationText, q);
        } else if (glyphDescText.toLowerCase().includes(q)) {
          excerpt = highlightText(glyphDescText, q);
        } else if (shuowenText.toLowerCase().includes(q)) {
          excerpt = highlightText(shuowenText, q);
        } else {
          excerpt = highlightText(`${item.category} · 包含相关标签: ${tagsText}`, q);
        }

        matches.push({
          item,
          excerpt
        });
      }
    }

    renderSearchResults(matches, q);
  }

  function highlightText(text, keyword) {
    if (!text || !keyword) return text;
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderSearchResults(matches, query) {
    searchResultsList.innerHTML = '';
    searchResultCount.textContent = `找到 ${matches.length} 个涉及“${query}”的字释说明`;

    if (matches.length === 0) {
      searchResultsList.innerHTML = `
        <div class="search-empty">
          <p>未找到释义中包含“<strong>${escapeHtml(query)}</strong>”的甲骨文。</p>
          <p style="font-size: 0.8rem; margin-top: 6px; color: var(--ink-faint);">建议尝试：太阳、河流、兵器、祭牲、婴儿、美玉、山峦、奔腾、头顶等自然或动作概念</p>
        </div>
      `;
      searchResultsPanel.classList.add('open');
      return;
    }

    const maxDisplay = 40;
    const listSlice = matches.slice(0, maxDisplay);

    listSlice.forEach(({ item, excerpt }) => {
      const el = document.createElement('div');
      el.className = 'search-item';
      el.setAttribute('tabindex', '0');
      el.innerHTML = `
        <div class="search-item-glyph">
          <img src="${item.svg}" alt="${item.modern_char}" loading="lazy">
        </div>
        <div class="search-item-info">
          <h4>
            <span>${item.modern_char}</span>
            <span class="search-item-pinyin">${item.pinyin}</span>
            <span class="search-item-cat">${item.category}</span>
          </h4>
          <div class="search-item-excerpt">${excerpt}</div>
        </div>
        <div class="search-item-page">第 ${item.page} 页 →</div>
      `;

      el.addEventListener('click', () => {
        goToPage(item.page);
        closeSearch();
      });

      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          goToPage(item.page);
          closeSearch();
        }
      });

      searchResultsList.appendChild(el);
    });

    if (matches.length > maxDisplay) {
      const more = document.createElement('div');
      more.style.padding = '10px 16px';
      more.style.textAlign = 'center';
      more.style.fontSize = '0.8rem';
      more.style.color = 'var(--ink-muted)';
      more.textContent = `已显示前 ${maxDisplay} 项，共 ${matches.length} 项结果`;
      searchResultsList.appendChild(more);
    }

    searchResultsPanel.classList.add('open');
  }

  function closeSearch() {
    searchResultsPanel.classList.remove('open');
  }

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // =========================================================
  // Complete 1,203 Characters Catalog
  // =========================================================
  function renderCatalog() {
    catalogGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    const filtered = currentCategoryFilter === 'all' 
      ? characters 
      : characters.filter(c => c.category === currentCategoryFilter);

    filtered.forEach(item => {
      const cell = document.createElement('div');
      cell.className = 'catalog-cell';
      cell.innerHTML = `
        <div class="catalog-cell-thumb">
          <img src="${item.svg}" alt="${item.modern_char}" loading="lazy">
        </div>
        <div class="catalog-cell-char">${item.modern_char}</div>
        <div class="catalog-cell-pinyin">${item.pinyin}</div>
      `;
      cell.addEventListener('click', () => {
        goToPage(item.page);
        closeCatalog();
      });
      fragment.appendChild(cell);
    });

    catalogGrid.appendChild(fragment);
  }

  function openCatalog() {
    catalogModal.classList.add('open');
  }

  function closeCatalog() {
    catalogModal.classList.remove('open');
  }

  // =========================================================
  // Event Listeners
  // =========================================================
  function setupEventListeners() {
    // Navigation
    startReadingBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));

    pageInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) goToPage(val);
    });

    pageSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      goToPage(val);
    });

    // Keyboard Arrow Keys
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === searchInput || document.activeElement === pageInput) {
        if (e.key === 'Escape') {
          closeSearch();
          document.activeElement.blur();
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight') {
        goToPage(currentPage + 1);
      } else if (e.key === 'Home') {
        goToPage(0);
      } else if (e.key === 'End') {
        goToPage(characters.length);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === 'Escape') {
        closeCatalog();
        closeSearch();
      }
    });

    // Search events
    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performExplanationSearch(e.target.value);
      }, 160);
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      closeSearch();
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        closeSearch();
      }
    });

    // Catalog modal events
    openCatalogBtn.addEventListener('click', openCatalog);
    closeCatalogBtn.addEventListener('click', closeCatalog);
    catalogModal.addEventListener('click', (e) => {
      if (e.target === catalogModal) closeCatalog();
    });

    // Category Filter Chips in Catalog
    catalogFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      catalogFilters.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryFilter = btn.dataset.cat;
      renderCatalog();
    });

    // Random Character
    randomCharBtn.addEventListener('click', () => {
      const rand = Math.floor(Math.random() * characters.length) + 1;
      goToPage(rand);
    });

    // Theme Switchers
    themeToggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('theme-rubbing')) {
        document.body.classList.remove('theme-rubbing');
        document.body.classList.add('theme-vermilion');
      } else if (document.body.classList.contains('theme-vermilion')) {
        document.body.classList.remove('theme-vermilion');
      } else {
        document.body.classList.add('theme-rubbing');
      }
    });

    themePillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        themePillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const style = btn.dataset.style;
        document.body.classList.remove('theme-rubbing', 'theme-vermilion');
        if (style === 'rubbing') {
          document.body.classList.add('theme-rubbing');
        } else if (style === 'vermilion') {
          document.body.classList.add('theme-vermilion');
        }
      });
    });

    // Popstate
    window.addEventListener('popstate', parseUrlHash);
  }

  // Start app
  init();
})();
