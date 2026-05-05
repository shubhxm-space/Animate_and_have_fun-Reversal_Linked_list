/* ═══════════════════════════════════════════════════════════
   LinkedList Reversal Visual Explorer  —  app.js
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── STATE ── */
const state = {
  values: [],          // original node values
  steps: [],           // computed animation steps
  stepIdx: -1,
  autoTimer: null,
  isPlaying: false,
  lang: 'python',
  soundOn: true,
  darkMode: false,
};

/* ── ELEMENTS ── */
const $ = id => document.getElementById(id);
const listInput = $('listInput');
const generateBtn = $('generateBtn');
const vizStage = $('vizStage');
const listCanvas = $('listCanvas');
const emptyState = $('emptyState');
const startBtn = $('startBtn');
const resetBtn = $('resetBtn');
const prevStepBtn = $('prevStepBtn');
const nextStepBtn = $('nextStepBtn');
const autoBtn = $('autoBtn');
const speedSlider = $('speedSlider');
const speedValue = $('speedValue');
const stepCounter = $('stepCounter');
const progressBar = $('progressBar');
const prevVal = $('prevVal');
const currVal = $('currVal');
const nextVal = $('nextVal');
const varPrev = $('varPrev');
const varCurr = $('varCurr');
const varNext = $('varNext');
const explanationText = $('explanationText');
const originalList = $('originalList');
const reversedList = $('reversedList');
const codeBlock = $('codeBlock');
const algoSteps = $('algoSteps');
const darkModeBtn = $('darkModeBtn');
const soundBtn = $('soundBtn');

/* ══════════════════════════════════════════════
   CODE DEFINITIONS
══════════════════════════════════════════════ */
const CODE = {
  python: [
    { text: "def reverse(head):", phase: -1 },
    { text: "    prev = None", phase: 0 },
    { text: "    curr = head", phase: 0 },
    { text: "    while curr:", phase: 1 },
    { text: "        nxt = curr.next", phase: 1 },
    { text: "        curr.next = prev", phase: 2 },
    { text: "        prev = curr", phase: 3 },
    { text: "        curr = nxt", phase: 4 },
    { text: "    head = prev", phase: 6 },
    { text: "    return head", phase: 6 },
  ],
  java: [
    { text: "Node reverse(Node head) {", phase: -1 },
    { text: "    Node prev = null;", phase: 0 },
    { text: "    Node curr = head;", phase: 0 },
    { text: "    while (curr != null) {", phase: 1 },
    { text: "        Node nxt = curr.next;", phase: 1 },
    { text: "        curr.next = prev;", phase: 2 },
    { text: "        prev = curr;", phase: 3 },
    { text: "        curr = nxt;", phase: 4 },
    { text: "    }", phase: 5 },
    { text: "    return prev;", phase: 6 },
    { text: "}", phase: -1 },
  ],
  c: [
    { text: "Node* reverse(Node* head) {", phase: -1 },
    { text: "    Node *prev = NULL;", phase: 0 },
    { text: "    Node *curr = head;", phase: 0 },
    { text: "    Node *nxt  = NULL;", phase: 0 },
    { text: "    while (curr != NULL) {", phase: 1 },
    { text: "        nxt = curr->next;", phase: 1 },
    { text: "        curr->next = prev;", phase: 2 },
    { text: "        prev = curr;", phase: 3 },
    { text: "        curr = nxt;", phase: 4 },
    { text: "    }", phase: 5 },
    { text: "    return prev;", phase: 6 },
    { text: "}", phase: -1 },
  ],
};

/* ══════════════════════════════════════════════
   STEP GENERATOR
   Each step: { phase, prev, curr, next, reversed[], explanation, algoIdx }
══════════════════════════════════════════════ */
function buildSteps(values) {
  const steps = [];
  const n = values.length;
  if (n === 0) return steps;

  // Build a logical linked list (indices)
  let nextPtr = values.map((_, i) => i + 1);  // nextPtr[i] = index of next node, n = NULL
  let headIdx = 0;

  const NULL_LABEL = 'NULL';

  const snap = (phase, prev, curr, next, reversed, explanation, algoIdx) =>
    steps.push({ phase, prev, curr, next, reversed: [...reversed], explanation, algoIdx });

  // Step 0: Init — prev=NULL, curr=head(0), next=unknown yet
  snap(0, null, 0, null, [],
    `Initialize: prev = NULL, curr = head (node ${values[0]}). Next is unknown until we enter the loop.`,
    0);

  let prev = null;  // null = NULL
  let curr = 0;     // index
  const reversed = []; // indices already reversed

  while (curr !== n) {
    const nxt = nextPtr[curr]; // may be n (NULL)

    // Step 1: save next — prev unchanged, curr unchanged, next = nxt
    snap(1, prev, curr, nxt, reversed,
      `Save next = curr.next → next now points to ${nxt < n ? 'node ' + values[nxt] : 'NULL'}.`,
      1);

    // Step 2: reverse the link — prev unchanged, curr unchanged, next unchanged
    snap(2, prev, curr, nxt, reversed,
      `Reverse link: curr.next = prev → node ${values[curr]}'s pointer now points back to ${prev !== null ? 'node ' + values[prev] : 'NULL'}.`,
      2);
    nextPtr[curr] = prev === null ? n : prev; // mutate logical list

    // Step 3: move prev = curr (prev advances, curr stays, next unchanged)
    const oldPrev = prev;
    prev = curr;
    snap(3, prev, curr, nxt, reversed,
      `Move prev forward: prev = curr → prev is now node ${values[prev]}.`,
      3);

    // Step 4: move curr = next (prev unchanged, curr becomes nxt, next cleared)
    const newCurr = nxt;
    reversed.push(curr);
    curr = newCurr;
    snap(4, prev, curr === n ? null : curr, null, reversed,
      `Move curr forward: curr = next → curr is now ${curr < n ? 'node ' + values[curr] : 'NULL'}.`,
      4);
  }

  // Done — curr is NULL, prev is new head
  snap(6, prev, null, null, values.map((_, i) => i),
    `Done! Set head = prev = node ${values[prev]}. The list is fully reversed. 🎉`,
    6);

  return steps;
}

/* ══════════════════════════════════════════════
   RENDER HELPERS
══════════════════════════════════════════════ */
function renderListCanvas(step) {
  const { values } = state;
  const { prev, curr, next, reversed } = step;
  const n = values.length;

  listCanvas.innerHTML = '';
  listCanvas.classList.remove('hidden');
  emptyState.classList.add('hidden');

  // HEAD label
  const headWrap = document.createElement('div');
  headWrap.className = 'head-label';
  headWrap.innerHTML = `<div class="head-badge">HEAD</div><div class="head-arrow"></div>`;
  listCanvas.appendChild(headWrap);

  for (let i = 0; i < n; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'node-wrap';
    wrap.style.animationDelay = (i * 0.06) + 's';

    const node = document.createElement('div');
    node.className = 'node';
    node.id = 'node-' + i;

    // Label row
    const label = document.createElement('div');
    label.className = 'node-label';
    label.textContent = 'Node';
    node.appendChild(label);

    // Data
    const data = document.createElement('div');
    data.className = 'node-data';
    data.textContent = values[i];
    node.appendChild(data);

    // Next pointer display
    const ptr = document.createElement('div');
    ptr.className = 'node-ptr';
    ptr.textContent = 'next → ' + (i < n - 1 ? values[i + 1] : 'NULL');
    node.appendChild(ptr);

    // Tooltip
    node.title = `Node[${i}] = ${values[i]}`;

    // Badges
    const badges = [];
    if (prev === i) badges.push({ label: 'prev', color: '#f97316' });
    if (curr === i) badges.push({ label: 'curr', color: '#6366f1' });
    if (next === i) badges.push({ label: 'next', color: '#10b981' });
    if (badges.length) {
      const b = document.createElement('div');
      b.className = 'node-badge';
      b.style.background = badges[0].color;
      b.textContent = badges.map(x => x.label).join('/');
      node.appendChild(b);
    }

    // Highlight class
    if (prev === i && curr === i) node.classList.add('hl-curr');
    else if (curr === i) node.classList.add('hl-curr');
    else if (prev === i) node.classList.add('hl-prev');
    else if (next === i) node.classList.add('hl-next');
    else if (reversed.includes(i)) node.classList.add('hl-done');

    wrap.appendChild(node);

    // Arrow
    if (i < n - 1) {
      const arrowWrap = document.createElement('div');
      arrowWrap.className = 'arrow-wrap';
      const line = document.createElement('div');
      line.className = 'arrow-line';
      // Reversed arrows
      if (reversed.includes(i) && step.phase >= 2) line.classList.add('reversed');
      arrowWrap.appendChild(line);
      wrap.appendChild(arrowWrap);
    }

    listCanvas.appendChild(wrap);
  }

  // NULL terminus
  const nullNode = document.createElement('div');
  nullNode.className = 'null-node';
  nullNode.innerHTML = '<div style="font-size:0.55rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;opacity:0.6">ptr</div>NULL';
  // small arrow before NULL
  const arrowWrap = document.createElement('div');
  arrowWrap.className = 'arrow-wrap';
  const line2 = document.createElement('div');
  line2.className = 'arrow-line';
  arrowWrap.appendChild(line2);
  listCanvas.appendChild(arrowWrap);
  listCanvas.appendChild(nullNode);
}

function renderInitialList(values) {
  listCanvas.innerHTML = '';
  listCanvas.classList.remove('hidden');
  emptyState.classList.add('hidden');

  const headWrap = document.createElement('div');
  headWrap.className = 'head-label';
  headWrap.innerHTML = `<div class="head-badge">HEAD</div><div class="head-arrow"></div>`;
  listCanvas.appendChild(headWrap);

  values.forEach((v, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'node-wrap';
    wrap.style.animationDelay = (i * 0.07) + 's';

    const node = document.createElement('div');
    node.className = 'node';
    const label = document.createElement('div');
    label.className = 'node-label'; label.textContent = 'Node';
    const data = document.createElement('div');
    data.className = 'node-data'; data.textContent = v;
    const ptr = document.createElement('div');
    ptr.className = 'node-ptr'; ptr.textContent = 'next → ' + (i < values.length - 1 ? values[i + 1] : 'NULL');
    node.appendChild(label); node.appendChild(data); node.appendChild(ptr);
    wrap.appendChild(node);

    if (i < values.length - 1) {
      const aw = document.createElement('div'); aw.className = 'arrow-wrap';
      const ln = document.createElement('div'); ln.className = 'arrow-line';
      aw.appendChild(ln); wrap.appendChild(aw);
    }
    listCanvas.appendChild(wrap);
  });
  const aw2 = document.createElement('div'); aw2.className = 'arrow-wrap';
  const ln2 = document.createElement('div'); ln2.className = 'arrow-line'; aw2.appendChild(ln2);
  const nullNode = document.createElement('div');
  nullNode.className = 'null-node';
  nullNode.innerHTML = '<div style="font-size:0.55rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;opacity:0.6">ptr</div>NULL';
  listCanvas.appendChild(aw2);
  listCanvas.appendChild(nullNode);
}

/* ══════════════════════════════════════════════
   VAR TRACKER  +  CODE  +  ALGO
══════════════════════════════════════════════ */
function updateVarPanel(step) {
  const { values } = state;
  const { prev, curr, next, phase } = step;

  // Format: index → value string, null/undefined/out-of-bounds → 'NULL', -1 → '—' (only for unset)
  const fmt = idx => (idx === null || idx === undefined || idx >= values.length) ? 'NULL' : values[idx];

  const newPrev = fmt(prev);
  const newCurr = curr === null || curr === undefined || curr >= values.length ? 'NULL' : values[curr];
  const newNext = (next === null || next === undefined || next >= values.length) ? 'NULL' : values[next];

  // Only pulse boxes whose value actually changed
  const oldPrev = prevVal.textContent;
  const oldCurr = currVal.textContent;
  const oldNext = nextVal.textContent;

  const pulse = (el, valEl, newVal) => {
    valEl.textContent = newVal;
    if (newVal !== el._lastVal) {
      el.classList.remove('active');
      void el.offsetWidth;
      el.classList.add('active');
      el._lastVal = newVal;
    }
  };

  pulse(varPrev, prevVal, newPrev);
  pulse(varCurr, currVal, newCurr);
  pulse(varNext, nextVal, newNext);

  explanationText.textContent = step.explanation;
}

function renderCode(highlightPhase) {
  const lines = CODE[state.lang];
  codeBlock.innerHTML = '';
  lines.forEach(({ text, phase }) => {
    const span = document.createElement('span');
    span.className = 'code-line' + (phase === highlightPhase ? ' hl' : '');
    // Simple syntax coloring
    span.innerHTML = colorize(text, state.lang);
    codeBlock.appendChild(span);
  });
}

function colorize(text, lang) {
  const kws = lang === 'python'
    ? ['def', 'while', 'return', 'None']
    : ['Node', 'void', 'while', 'return', 'null', 'NULL'];
  let out = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Comments
  out = out.replace(/(#.*)$/, '<span class="cm">$1</span>');
  out = out.replace(/(\/\/.*)$/, '<span class="cm">$1</span>');
  // Keywords
  kws.forEach(kw => {
    const re = new RegExp('\\b(' + kw + ')\\b', 'g');
    out = out.replace(re, '<span class="kw">$1</span>');
  });
  return out;
}

function updateAlgoPanel(phase) {
  document.querySelectorAll('.algo-step').forEach(el => {
    const p = parseInt(el.dataset.phase);
    el.classList.remove('active', 'done');
    if (p === phase) el.classList.add('active');
    else if (p < phase) el.classList.add('done');
  });
}

/* ══════════════════════════════════════════════
   COMPARE PANEL
══════════════════════════════════════════════ */
function renderCompare(values) {
  originalList.innerHTML = '';
  reversedList.innerHTML = '';
  if (!values.length) { originalList.textContent = '—'; reversedList.textContent = '—'; return; }

  values.forEach((v, i) => {
    const nd = document.createElement('div');
    nd.className = 'cmp-node'; nd.textContent = v;
    nd.style.animationDelay = (i * 0.05) + 's';
    originalList.appendChild(nd);
    if (i < values.length - 1) {
      const ar = document.createElement('span'); ar.className = 'cmp-arrow'; ar.textContent = '→';
      originalList.appendChild(ar);
    }
  });

  const rev = [...values].reverse();
  rev.forEach((v, i) => {
    const nd = document.createElement('div');
    nd.className = 'cmp-node reversed-node'; nd.textContent = v;
    nd.style.animationDelay = (i * 0.05) + 's';
    reversedList.appendChild(nd);
    if (i < rev.length - 1) {
      const ar = document.createElement('span'); ar.className = 'cmp-arrow'; ar.textContent = '→';
      reversedList.appendChild(ar);
    }
  });
}

/* ══════════════════════════════════════════════
   PROGRESS & STEP COUNTER
══════════════════════════════════════════════ */
function updateProgress() {
  const total = state.steps.length;
  const idx = state.stepIdx;
  const pct = total > 0 ? ((idx + 1) / total * 100) : 0;
  progressBar.style.width = pct + '%';
  stepCounter.textContent = `Step ${Math.max(0, idx + 1)} / ${total}`;
}

/* ══════════════════════════════════════════════
   APPLY STEP
══════════════════════════════════════════════ */
function applyStep(idx) {
  if (idx < 0 || idx >= state.steps.length) return;
  state.stepIdx = idx;
  const step = state.steps[idx];

  renderListCanvas(step);
  updateVarPanel(step);
  renderCode(step.phase);
  updateAlgoPanel(step.phase);
  updateProgress();
  playTick();
}

/* ══════════════════════════════════════════════
   AUDIO  (Web Audio API synth tones)
══════════════════════════════════════════════ */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTick() {
  if (!state.soundOn) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 + state.stepIdx * 30, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(); osc.stop(ctx.currentTime + 0.18);
  } catch (e) { }
}
function playSuccess() {
  if (!state.soundOn) return;
  const notes = [523, 659, 784, 1047];
  const ctx = getAudioCtx();
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.25);
  });
}

/* ══════════════════════════════════════════════
   AUTO PLAY
══════════════════════════════════════════════ */
const SPEED_LABELS = ['Slowest', 'Slow', 'Normal', 'Fast', 'Fastest'];
const SPEED_MS = [1400, 950, 600, 350, 170];

function getDelay() { return SPEED_MS[parseInt(speedSlider.value) - 1]; }

function startAuto() {
  stopAuto();
  state.isPlaying = true;
  startBtn.textContent = '⏸ Pause';
  autoBtn.classList.add('hidden');

  function tick() {
    if (state.stepIdx >= state.steps.length - 1) {
      stopAuto();
      playSuccess();
      toast('🎉 Reversal complete!');
      return;
    }
    applyStep(state.stepIdx + 1);
    state.autoTimer = setTimeout(tick, getDelay());
  }
  tick();
}

function stopAuto() {
  if (state.autoTimer) clearTimeout(state.autoTimer);
  state.autoTimer = null;
  state.isPlaying = false;
  startBtn.textContent = '▶ Start';
  autoBtn.classList.remove('hidden');
}

/* ══════════════════════════════════════════════
   GENERATE
══════════════════════════════════════════════ */
function generate() {
  stopAuto();
  const raw = listInput.value.trim();
  if (!raw) { toast('⚠️ Please enter values!'); return; }
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  const nums = parts.map(Number);
  if (nums.some(isNaN)) { toast('⚠️ Use numbers only, separated by commas.'); return; }
  if (nums.length < 2) { toast('⚠️ Enter at least 2 values.'); return; }
  if (nums.length > 8) { toast('⚠️ Maximum 8 nodes allowed.'); return; }

  state.values = nums;
  state.steps = buildSteps(nums);
  state.stepIdx = -1;

  renderInitialList(nums);
  renderCompare(nums);
  renderCode(-1);
  updateAlgoPanel(-1);
  updateProgress();

  // Reset vars
  prevVal.textContent = 'NULL';
  currVal.textContent = 'NULL';
  nextVal.textContent = 'NULL';
  varPrev._lastVal = null; varCurr._lastVal = null; varNext._lastVal = null;
  explanationText.textContent = 'Press ▶ Start or Next ▶ to begin the reversal.';

  toast(`✅ List created with ${nums.length} nodes`);
}

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('toastContainer').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2500);
}

/* ══════════════════════════════════════════════
   EVENT LISTENERS
══════════════════════════════════════════════ */
generateBtn.addEventListener('click', generate);
listInput.addEventListener('keydown', e => { if (e.key === 'Enter') generate(); });

startBtn.addEventListener('click', () => {
  if (!state.steps.length) { toast('Generate a list first!'); return; }
  if (state.isPlaying) { stopAuto(); return; }
  if (state.stepIdx >= state.steps.length - 1) {
    toast('Already at the end. Press Reset.'); return;
  }
  if (state.stepIdx === -1) applyStep(0);
  else startAuto();
  if (!state.isPlaying) startAuto();
});

nextStepBtn.addEventListener('click', () => {
  stopAuto();
  if (!state.steps.length) { toast('Generate a list first!'); return; }
  if (state.stepIdx >= state.steps.length - 1) { toast('No more steps. Press Reset.'); return; }
  applyStep(state.stepIdx + 1);
});

prevStepBtn.addEventListener('click', () => {
  stopAuto();
  if (state.stepIdx <= 0) { toast('Already at the beginning.'); return; }
  applyStep(state.stepIdx - 1);
});

resetBtn.addEventListener('click', () => {
  stopAuto();
  if (!state.values.length) return;
  state.stepIdx = -1;
  renderInitialList(state.values);
  renderCompare(state.values);
  renderCode(-1);
  updateAlgoPanel(-1);
  updateProgress();
  prevVal.textContent = 'NULL';
  currVal.textContent = 'NULL';
  nextVal.textContent = 'NULL';
  varPrev._lastVal = null; varCurr._lastVal = null; varNext._lastVal = null;
  explanationText.textContent = 'Press ▶ Start or Next ▶ to begin the reversal.';
  toast('🔄 Reset to original list');
});

autoBtn.addEventListener('click', () => {
  if (!state.steps.length) { toast('Generate a list first!'); return; }
  if (state.stepIdx >= state.steps.length - 1) {
    state.stepIdx = -1; renderInitialList(state.values);
  }
  if (state.stepIdx === -1) applyStep(0);
  startAuto();
});

speedSlider.addEventListener('input', () => {
  const v = parseInt(speedSlider.value);
  speedValue.textContent = SPEED_LABELS[v - 1];
});

// Language tabs
document.querySelectorAll('.lang-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.lang = tab.dataset.lang;
    const phase = state.stepIdx >= 0 ? state.steps[state.stepIdx].phase : -1;
    renderCode(phase);
  });
});

// Presets — event delegation so all chips (inc. dynamically added) work
document.querySelector('.preset-section')?.addEventListener('click', e => {
  const chip = e.target.closest('.preset-chip');
  if (!chip) return;
  listInput.value = chip.dataset.val;
  // Flash animation
  chip.classList.remove('flash');
  void chip.offsetWidth;
  chip.classList.add('flash');
  generate();
});

// ── SURPRISE ME ──
const SURPRISE_POOL = [
  // Ascending
  [1, 2, 3], [1, 2, 3, 4, 5], [2, 4, 6, 8, 10], [5, 10, 15, 20], [1, 2, 3, 4, 5, 6, 7],
  // Descending
  [5, 4, 3, 2, 1], [9, 7, 5, 3, 1], [8, 6, 4, 2], [10, 8, 6, 4, 2], [7, 6, 5, 4, 3],
  // Fibonacci
  [1, 1, 2, 3, 5], [1, 1, 2, 3, 5, 8], [1, 2, 3, 5, 8, 13, 21], [3, 5, 8, 13, 21],
  // Primes
  [2, 3, 5, 7], [2, 3, 5, 7, 11], [2, 3, 5, 7, 11, 13], [11, 13, 17, 19, 23],
  // Powers of 2
  [1, 2, 4, 8, 16], [2, 4, 8, 16, 32], [1, 2, 4, 8],
  // Squares / cubes
  [1, 4, 9, 16, 25], [1, 8, 27, 64], [4, 9, 16, 25],
  // Palindromes
  [1, 2, 1], [1, 2, 3, 2, 1], [3, 5, 7, 5, 3], [9, 1, 5, 1, 9], [2, 4, 6, 4, 2],
  // Mixed / wild
  [7, 3, 9, 1, 5, 2], [42, 7, 13, 99, 3], [8, 1, 6, 3, 7, 2, 4], [0, 5, 3, 8, 1],
  [6, 6, 6], [1, 9, 2, 8, 3, 7], [5, 1, 4, 1, 5], [99, 1, 50], [17, 4, 22, 8],
  // Multiples
  [3, 6, 9, 12, 15, 18], [4, 8, 12, 16, 20], [7, 14, 21, 28], [6, 12, 18, 24],
  // Edge
  [4, 7], [1, 5, 9], [2, 4, 6, 8], [1, 3, 5, 7, 9, 11, 13, 15],
];
let _lastSurprise = -1;
$('surpriseBtn')?.addEventListener('click', () => {
  let idx;
  do { idx = Math.floor(Math.random() * SURPRISE_POOL.length); } while (idx === _lastSurprise);
  _lastSurprise = idx;
  const chosen = SURPRISE_POOL[idx];
  listInput.value = chosen.join(',');
  // Flash the button
  const btn = $('surpriseBtn');
  btn.textContent = '✨ Loaded!';
  setTimeout(() => { btn.textContent = '🎲 Surprise Me!'; }, 900);
  generate();
});

// Dark mode
darkModeBtn.addEventListener('click', () => {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark', state.darkMode);
  darkModeBtn.textContent = state.darkMode ? '☀️' : '🌙';
});

// Sound
soundBtn.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundBtn.textContent = state.soundOn ? '🔊' : '🔇';
  toast(state.soundOn ? '🔊 Sound on' : '🔇 Sound off');
});

/* ── INIT ── */
renderCode(-1);
speedValue.textContent = SPEED_LABELS[parseInt(speedSlider.value) - 1];
