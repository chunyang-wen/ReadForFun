const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const file of ['data/dict-index.js','data/dict-core.js','js/pinyin-data.js','js/radical-data.js','js/dictionary-readings.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'), ctx);
}
const { DICT_INDEX: index, DICT_CORE: core, DictionaryReadings: helper, PINYIN_GROUPS: groups, RADICAL_GROUPS: radicals } = ctx.window;
const homophones = helper.createLookup(index,core);
assert.equal(index['毮'].p,'shā');
assert.equal(index['毮'].s,11);
assert.equal(index['籥'].p,'yuè');
assert.equal(index['籥'].s,23);
assert.equal(index['焗'].p,'jú');
assert.equal(index['積'].p,'jī');
for (const c of ['龠','籥']) {
  assert(homophones(c).includes('月'));
  assert(homophones('月').includes(c));
  assert(!homophones(c).includes('约')); // yuē is a different tone.
}
assert(homophones('行').includes('航')); // Preserve additional readings.
assert.equal(helper.parse('lü4').key,helper.parse('lǜ').key);
assert.equal(helper.parse('yue4').key,helper.parse('yuè').key);
assert.equal(helper.parse('uu'),null);
const lookupKeys = new Map();
for (const g of groups) for (const s of g.syllables) for (const [tone, chars] of Object.entries(s.tones)) {
  for (const c of chars) {
    const key=s.syllable+tone;
    assert(helper.readings(index[c]).some(p => helper.parse(p)?.key===key),`${c}: bad pinyin index`);
    if (!lookupKeys.has(c)) lookupKeys.set(c,new Set());
    lookupKeys.get(c).add(key);
  }
}
for (const [c,e] of Object.entries(index)) {
  for (const py of helper.readings(e)) {
    const sound=helper.parse(py);
    assert(sound,`${c}: invalid pinyin ${py}`);
    assert(lookupKeys.get(c)?.has(sound.key),`${c}: missing reading`);
  }
}
for (const [c,e] of Object.entries(core)) {
  assert.equal(e.pinyin,index[c].p);
  assert.equal(e.strokes,index[c].s);
  assert(!e.stroke_code || e.stroke_code.length===e.strokes,`${c}: stroke code mismatch`);
}
for (const group of radicals) for (const r of group.radicals) {
  assert.equal(r.count,r.chars.length);
  for (const eg of r.extra_groups) for (const c of eg.chars) {
    assert.equal(index[c].r,r.radical);
    assert.equal(index[c].es,eg.extra);
  }
}
for (const c of ['龠']) {
  const data=JSON.parse(fs.readFileSync(path.join(root,`data/strokes/${c}.json`)));
  assert.equal(data.strokes.length,index[c].s);
  assert.equal(data.medians.length,data.strokes.length);
}
console.log(`Validated ${Object.keys(index).length} entries, reading/tone indexes, radical groups, and local stroke assets.`);
