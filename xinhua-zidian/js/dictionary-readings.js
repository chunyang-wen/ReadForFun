/* Tone-aware matching shared by search and homophones. No dependencies. */
(function () {
  'use strict';
  function parse(value) {
    const input = (value || '').normalize('NFC').trim().toLowerCase().replace(/ɡ/g, 'g').replace(/u:/g, 'ü');
    if (!input || input === 'uu') return null;
    let tone = Number(input.match(/[1-5]$/)?.[0]) || 5;
    const accents = {'\u0304': 1, '\u0301': 2, '\u030c': 3, '\u0300': 4};
    const raw = input.replace(/[1-5]$/, '').normalize('NFD').replace(/u\u0308/g, 'v')
      .replace(/[\u0304\u0301\u030c\u0300]/g, c => { tone = accents[c]; return ''; })
      .normalize('NFC');
    if (!/^[a-zvê]+$/.test(raw)) return null;
    return { raw, tone, key: raw + tone };
  }
  function readings(entry) {
    return entry.ps || (entry.p || entry.pinyin || '').split(/[,;，；\s]+/).filter(Boolean);
  }
  function createLookup(index, core) {
    const bySound = new Map();
    for (const [char, entry] of Object.entries(index)) {
      for (const py of readings(entry)) {
        const sound = parse(py);
        if (!sound) continue;
        if (!bySound.has(sound.key)) bySound.set(sound.key, new Set());
        bySound.get(sound.key).add(char);
      }
    }
    return function (char) {
      const candidates = new Set();
      for (const py of readings(index[char] || core[char] || {})) {
        const sound = parse(py);
        for (const c of bySound.get(sound?.key) || []) if (c !== char) candidates.add(c);
      }
      return [...candidates].sort((a, b) => Number(!!core[b]) - Number(!!core[a]));
    };
  }
  window.DictionaryReadings = { parse, readings, createLookup };
})();
