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
/* ── fake memory addresses (stable per session) ── */
const ADDRS = Array.from({length: 12}, (_, i) =>
  '0x' + (0x1a00 + i * 0x10).toString(16).toUpperCase()
);

/* ── Phase → operation banner text ── */
const PHASE_OP = {
  '-1': { label: 'Ready',    code: 'Press ▶ Start or Next ▶ to begin' },
   0:   { label: 'Init',     code: 'prev = None   curr = head' },
   1:   { label: 'Step 1',   code: 'nxt = curr.next' },
   2:   { label: 'Step 2',   code: 'curr.next = prev   ← pointer reversed!' },
   3:   { label: 'Step 3',   code: 'prev = curr' },
   4:   { label: 'Step 4',   code: 'curr = nxt' },
   5:   { label: 'Loop',     code: 'while curr != NULL  →  repeat' },
   6:   { label: 'Done ✓',   code: 'head = prev   ← new head set! 🎉' },
};

/**
 * Compute scaled dimensions so the canvas always fits inside vizStage.
 * Reads the live clientWidth so it responds to any layout.
 */
function getScaledDims(n) {
  const BASE_NODE_W  = 96;
  const BASE_ARROW_W = 48;
  const BASE_HEAD_W  = 56;
  const BASE_NULL_W  = 72; // arrow + null-node combined
  const STAGE_PAD    = 32; // viz-stage left+right padding

  // Total natural width = head + n*node + (n-1)*arrow + 1*arrow + null
  const natural = BASE_HEAD_W + n * BASE_NODE_W + n * BASE_ARROW_W + BASE_NULL_W;

  // Available width inside the stage
  const available = (vizStage.clientWidth || 700) - STAGE_PAD;

  // Scale ≤ 1 (never zoom in, only shrink)
  const scale = Math.min(1, available / natural);

  return {
    NODE_W:   Math.floor(BASE_NODE_W  * scale),
    ARROW_W:  Math.floor(BASE_ARROW_W * scale),
    HEAD_W:   Math.floor(BASE_HEAD_W  * scale),
    NULL_W:   Math.floor(BASE_NULL_W  * scale),
    scale,
    // proportional font sizes
    dataFS:   Math.max(1.0, 2.0  * scale) + 'rem',
    labelFS:  Math.max(0.42, 0.58 * scale) + 'rem',
    ptrFS:    Math.max(0.42, 0.60 * scale) + 'rem',
    addrFS:   Math.max(0.38, 0.56 * scale) + 'rem',
    ptrBadgeFS: Math.max(0.48, 0.65 * scale) + 'rem',
    stemH:    Math.max(8, 16 * scale) + 'px',
    ptrRowH:  Math.max(32, 52 * scale) + 'px',
    addrRowH: Math.max(18, 28 * scale) + 'px',
  };
}


function updateOpBanner(phase) {
  const opCode = document.getElementById('opCode');
  const opDot  = document.getElementById('opDot');
  const banner = document.getElementById('opBanner');
  const op = PHASE_OP[phase] ?? PHASE_OP['-1'];

  // find & replace op-label span
  const oldLabel = banner.querySelector('.op-label');
  if (oldLabel) oldLabel.textContent = op.label;
  opCode.textContent = op.code;

  const isActive = phase >= 0 && phase < 6;
  opDot.style.display = isActive ? 'block' : 'none';

  // banner accent color per phase
  const colors = {
    0: 'rgba(99,102,241,0.12)',
    1: 'rgba(16,185,129,0.12)',
    2: 'rgba(249,115,22,0.14)',
    3: 'rgba(249,115,22,0.14)',
    4: 'rgba(99,102,241,0.12)',
    6: 'rgba(34,197,94,0.14)',
  };
  banner.style.background = `linear-gradient(135deg, ${colors[phase] ?? 'rgba(99,102,241,0.08)'}, rgba(168,85,247,0.08))`;
}

function renderListCanvas(step) {
  const { values } = state;
  const { prev, curr, next, reversed, phase } = step;
  const n = values.length;

  listCanvas.innerHTML = '';
  listCanvas.classList.remove('hidden');
  emptyState.classList.add('hidden');

  updateOpBanner(phase);

  const { NODE_W, ARROW_W, HEAD_W, NULL_W, scale,
          dataFS, labelFS, ptrFS, addrFS, ptrBadgeFS,
          stemH, ptrRowH, addrRowH } = getScaledDims(n);

  /* ── Build 3 rows ── */
  const ptrRow  = document.createElement('div');
  const nodeRow = document.createElement('div');
  const addrRow = document.createElement('div');
  ptrRow.className  = 'ptr-row';
  nodeRow.className = 'node-row';
  addrRow.className = 'addr-row';
  ptrRow.style.height  = ptrRowH;
  addrRow.style.height = addrRowH;

  /* ── HEAD column ── */
  // ptr-row: spacer
  const ptrHead = document.createElement('div');
  ptrHead.className = 'ptr-cell ptr-cell-head';
  ptrHead.style.width = HEAD_W + 'px';
  ptrRow.appendChild(ptrHead);

  // node-row: HEAD badge + arrow
  const headCol = document.createElement('div');
  headCol.className = 'head-col';
  headCol.style.width = HEAD_W + 'px';
  headCol.innerHTML = `
    <div class="head-label">
      <div class="head-badge">HEAD</div>
      <div class="head-arrow"></div>
    </div>`;
  nodeRow.appendChild(headCol);

  // addr-row: spacer
  const addrHead = document.createElement('div');
  addrHead.className = 'addr-cell';
  addrHead.style.width = HEAD_W + 'px';
  addrRow.appendChild(addrHead);

  /* ── Node columns ── */
  for (let i = 0; i < n; i++) {
    const addr = ADDRS[i] || ('0x' + (0x1a00 + i * 0x10).toString(16).toUpperCase());
    const nextAddr = i < n - 1 ? ADDRS[i + 1] : 'NULL';

    /* ----- PTR-ROW cell ----- */
    const ptrCell = document.createElement('div');
    ptrCell.className = 'ptr-cell';
    ptrCell.style.width = NODE_W + 'px';

    // Collect which pointer(s) land on node i
    const ptrs = [];
    if (prev === i) ptrs.push({ cls: 'ptr-prev', label: 'prev' });
    if (curr === i) ptrs.push({ cls: 'ptr-curr', label: 'curr' });
    if (next === i) ptrs.push({ cls: 'ptr-next', label: 'next' });

    ptrs.forEach(p => {
      const ind = document.createElement('div');
      ind.className = `ptr-indicator ${p.cls}`;
      ind.style.animationDelay = '0s';
      const badge = `<div class="ptr-badge" style="font-size:${ptrBadgeFS}">${p.label}</div>`;
      const stem  = `<div class="ptr-stem" style="height:${stemH}"></div>`;
      ind.innerHTML = badge + stem;
      ptrCell.appendChild(ind);
    });

    ptrRow.appendChild(ptrCell);

    /* ----- NODE-ROW cell ----- */
    const wrap = document.createElement('div');
    wrap.className = 'node-wrap';
    wrap.style.animationDelay = (i * 0.05) + 's';

    const node = document.createElement('div');
    node.className = 'node';
    node.id = 'node-' + i;

    // Highlight class
    const isPrev = prev === i, isCurr = curr === i, isNext = next === i;
    const isDone = reversed.includes(i);
    if (isPrev && isCurr) node.classList.add('hl-prevcurr');
    else if (isCurr)      node.classList.add('hl-curr');
    else if (isPrev)      node.classList.add('hl-prev');
    else if (isNext)      node.classList.add('hl-next');
    else if (isDone)      node.classList.add('hl-done');

    // Next pointer display value (what does node[i].next point to?)
    const ptrDisplayVal = i < n - 1 ? values[i + 1] : 'NULL';
    const ptrColor = isDone ? '#22c55e' : (isPrev && !isCurr ? '#f97316' : (isCurr ? '#6366f1' : (isNext ? '#10b981' : 'var(--primary)')));

    node.innerHTML = `
      <div class="node-label" style="font-size:${labelFS}">Node&nbsp;[${i}]</div>
      <div class="node-data"  style="font-size:${dataFS}">${values[i]}</div>
      <div class="node-ptr"   style="font-size:${ptrFS}">
        <span class="ptr-key">next</span>
        <span class="ptr-arrow-icon">→</span>
        <span class="ptr-val" style="color:${ptrColor}">${ptrDisplayVal}</span>
      </div>`;

    node.style.width = NODE_W + 'px';

    wrap.appendChild(node);

    // Arrow (between node i and node i+1)
    if (i < n - 1) {
      const arrowWrap = document.createElement('div');
      arrowWrap.className = 'arrow-wrap';
      arrowWrap.style.width = ARROW_W + 'px';
      const line = document.createElement('div');
      line.className = 'arrow-line';
      if (reversed.includes(i) && phase >= 2) line.classList.add('reversed');
      arrowWrap.appendChild(line);
      wrap.appendChild(arrowWrap);
    }
    nodeRow.appendChild(wrap);

    /* ----- ADDR-ROW cell ----- */
    const addrCell = document.createElement('div');
    addrCell.className = 'addr-cell';
    addrCell.style.width = NODE_W + 'px';
    addrCell.style.fontSize = addrFS;
    addrCell.textContent = addr;
    addrRow.appendChild(addrCell);

    // addr spacer for arrow
    if (i < n - 1) {
      const addrArrow = document.createElement('div');
      addrArrow.className = 'addr-cell addr-cell-arrow';
      addrArrow.style.width = ARROW_W + 'px';
      addrRow.appendChild(addrArrow);
    }
  }

  /* ── Arrow + NULL terminus ── */
  // ptr-row spacer for arrow + null
  const ptrArrow = document.createElement('div');
  ptrArrow.className = 'ptr-cell ptr-cell-arrow';
  ptrArrow.style.width = NULL_W + 'px';
  ptrRow.appendChild(ptrArrow);

  // null arrow + null node in node-row
  const nullWrap = document.createElement('div');
  nullWrap.className = 'node-wrap';
  const arrowToNull = document.createElement('div');
  arrowToNull.className = 'arrow-wrap';
  arrowToNull.style.width = ARROW_W + 'px';
  const lineToNull = document.createElement('div');
  lineToNull.className = 'arrow-line';
  arrowToNull.appendChild(lineToNull);
  const nullNode = document.createElement('div');
  nullNode.className = 'null-node';
  nullNode.style.fontSize = ptrFS;
  nullNode.innerHTML = `<div class="null-ptr-label" style="font-size:${addrFS}">PTR</div>NULL`;
  nullWrap.appendChild(arrowToNull);
  nullWrap.appendChild(nullNode);
  nodeRow.appendChild(nullWrap);

  // addr-row spacer for null
  const addrNull = document.createElement('div');
  addrNull.className = 'addr-cell addr-cell-arrow';
  addrNull.style.width = NULL_W + 'px';
  addrRow.appendChild(addrNull);

  listCanvas.appendChild(ptrRow);
  listCanvas.appendChild(nodeRow);
  listCanvas.appendChild(addrRow);
}

function renderInitialList(values) {
  // Build a synthetic "step 0 not yet started" view
  const n = values.length;
  listCanvas.innerHTML = '';
  listCanvas.classList.remove('hidden');
  emptyState.classList.add('hidden');

  updateOpBanner(-1);

  const { NODE_W, ARROW_W, HEAD_W, NULL_W, scale,
          dataFS, labelFS, ptrFS, addrFS, ptrBadgeFS,
          stemH, ptrRowH, addrRowH } = getScaledDims(n);

  const ptrRow  = document.createElement('div');
  const nodeRow = document.createElement('div');
  const addrRow = document.createElement('div');
  ptrRow.className  = 'ptr-row';
  nodeRow.className = 'node-row';
  addrRow.className = 'addr-row';
  ptrRow.style.height  = ptrRowH;
  addrRow.style.height = addrRowH;

  // HEAD col
  const ptrHead = document.createElement('div');
  ptrHead.className = 'ptr-cell ptr-cell-head';
  ptrHead.style.width = HEAD_W + 'px';
  ptrRow.appendChild(ptrHead);
  const headCol = document.createElement('div');
  headCol.className = 'head-col';
  headCol.style.width = HEAD_W + 'px';
  headCol.innerHTML = `<div class="head-label"><div class="head-badge">HEAD</div><div class="head-arrow"></div></div>`;
  nodeRow.appendChild(headCol);
  const addrHead = document.createElement('div');
  addrHead.className = 'addr-cell';
  addrHead.style.width = HEAD_W + 'px';
  addrRow.appendChild(addrHead);

  values.forEach((v, i) => {
    const addr = ADDRS[i] || ('0x' + (0x1a00 + i * 0x10).toString(16).toUpperCase());

    const ptrCell = document.createElement('div');
    ptrCell.className = 'ptr-cell';
    ptrCell.style.width = NODE_W + 'px';
    ptrRow.appendChild(ptrCell);

    const wrap = document.createElement('div');
    wrap.className = 'node-wrap';
    wrap.style.animationDelay = (i * 0.06) + 's';
    const node = document.createElement('div');
    node.className = 'node';
    node.style.width = NODE_W + 'px';
    const ptrDisplayVal = i < n - 1 ? values[i + 1] : 'NULL';
    node.innerHTML = `
      <div class="node-label" style="font-size:${labelFS}">Node&nbsp;[${i}]</div>
      <div class="node-data"  style="font-size:${dataFS}">${v}</div>
      <div class="node-ptr"   style="font-size:${ptrFS}">
        <span class="ptr-key">next</span>
        <span class="ptr-arrow-icon">→</span>
        <span class="ptr-val">${ptrDisplayVal}</span>
      </div>`;
    wrap.appendChild(node);

    if (i < n - 1) {
      const aw = document.createElement('div'); aw.className = 'arrow-wrap'; aw.style.width = ARROW_W + 'px';
      const ln = document.createElement('div'); ln.className = 'arrow-line';
      aw.appendChild(ln); wrap.appendChild(aw);
    }
    nodeRow.appendChild(wrap);

    const addrCell = document.createElement('div');
    addrCell.className = 'addr-cell';
    addrCell.style.width = NODE_W + 'px';
    addrCell.textContent = addr;
    addrRow.appendChild(addrCell);
    if (i < n - 1) {
      const addrAw = document.createElement('div');
      addrAw.className = 'addr-cell addr-cell-arrow';
      addrAw.style.width = ARROW_W + 'px';
      addrRow.appendChild(addrAw);
    }
  });

  // NULL terminus
  const ptrArrow = document.createElement('div');
  ptrArrow.className = 'ptr-cell ptr-cell-arrow';
  ptrArrow.style.width = NULL_W + 'px';
  ptrRow.appendChild(ptrArrow);
  const nullWrap = document.createElement('div'); nullWrap.className = 'node-wrap';
  const arrowToNull = document.createElement('div'); arrowToNull.className = 'arrow-wrap'; arrowToNull.style.width = ARROW_W + 'px';
  const lineToNull = document.createElement('div'); lineToNull.className = 'arrow-line';
  arrowToNull.appendChild(lineToNull);
  const nullNode = document.createElement('div'); nullNode.className = 'null-node';
  nullNode.style.fontSize = ptrFS;
  nullNode.innerHTML = `<div class="null-ptr-label" style="font-size:${addrFS}">PTR</div>NULL`;
  nullWrap.appendChild(arrowToNull); nullWrap.appendChild(nullNode);
  nodeRow.appendChild(nullWrap);
  const addrNull = document.createElement('div');
  addrNull.className = 'addr-cell addr-cell-arrow';
  addrNull.style.width = NULL_W + 'px';
  addrRow.appendChild(addrNull);

  listCanvas.appendChild(ptrRow);
  listCanvas.appendChild(nodeRow);
  listCanvas.appendChild(addrRow);
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
