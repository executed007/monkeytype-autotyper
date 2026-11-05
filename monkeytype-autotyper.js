// ==UserScript==
// @name         Monkeytype Auto-Typer
// @namespace    monkeytype
// @version      1.0
// @description  Tampermonkey auto-typing script for Monkeytype with human-like keystroke timing.
// @author       executed
// @match        https://monkeytype.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  const TARGET_WPM = 200;
  const CALIBRATION = 1.15;
  const ERROR_RATE = 0;
  const THINK_CHANCE = 0.04;
  const HOLD_MEAN = 55;
  const HOLD_SD = 12;
  const PAUSE_MEAN = 160;
  const PAUSE_SD = 60;
  const MS_PER_CHAR = 60000 / (TARGET_WPM * CALIBRATION * 5);

  const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));
  const isDone = l => l.classList.contains('correct') || l.classList.contains('incorrect');
  const activeWord = () => document.querySelector('.word.active');
  const lettersOf = w => Array.from(w.querySelectorAll('letter'));

  const gauss = (mean, sd) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const CODES = {
    ' ': 'Space', '-': 'Minus', '=': 'Equal', '[': 'BracketLeft', ']': 'BracketRight',
    '\\': 'Backslash', ';': 'Semicolon', "'": 'Quote', '`': 'Backquote', ',': 'Comma',
    '.': 'Period', '/': 'Slash', '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4',
    '%': 'Digit5', '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
    '_': 'Minus', '+': 'Equal', '{': 'BracketLeft', '}': 'BracketRight', '|': 'Backslash',
    ':': 'Semicolon', '"': 'Quote', '<': 'Comma', '>': 'Period', '?': 'Slash', '~': 'Backquote',
    'Backspace': 'Backspace'
  };
  const SHIFTED = '!@#$%^&*()_+{}|:"<>?~';
  const codeFor = ch =>
    CODES[ch] || (/[a-z]/i.test(ch) ? 'Key' + ch.toUpperCase() : /[0-9]/.test(ch) ? 'Digit' + ch : 'NoCode');

  let enabled = true;
  let el = null;
  let btn = null;

  function findInput() {
    const sels = ['#wordsInput', 'textarea#wordsInput', '.words-input', 'textarea', 'input'];
    for (const s of sels) {
      const e = document.querySelector(s);
      if (e) return e;
    }
    return document.activeElement || document.body;
  }

  function focused() {
    if (!el || !el.isConnected) el = findInput();
    if (document.activeElement !== el) { try { el.focus({ preventScroll: true }); } catch (_) {} }
    return el;
  }

  function mkKey(type, ch) {
    const kc = ch === ' ' ? 32 : ch === 'Backspace' ? 8 : ch.toUpperCase().charCodeAt(0);
    const ev = new KeyboardEvent(type, {
      key: ch,
      code: codeFor(ch),
      bubbles: true,
      cancelable: true,
      composed: true,
      shiftKey: SHIFTED.includes(ch) || ch !== ch.toLowerCase()
    });
    try {
      Object.defineProperty(ev, 'keyCode', { get: () => kc });
      Object.defineProperty(ev, 'which', { get: () => kc });
    } catch (_) {}
    return ev;
  }

  function holdDuration() {
    return Math.max(25, gauss(HOLD_MEAN, HOLD_SD));
  }

  function spacingDelay(prevChar, nextChar) {
    const base = Math.max(8, MS_PER_CHAR - HOLD_MEAN);
    let delay = gauss(base, base * 0.4);
    if (nextChar === ' ' || /[.,;:!?'"\-]/.test(prevChar || '')) delay *= 1.25;
    if (prevChar && nextChar &&
        /th|he|in|er|an|re|on|at|en|nd|ti|es|or|te|of|ed|is|it|al|ar|st|to|nt|ng|se|ha|as|ou|io|le|ve|co|me|de|hi|ri|ro|ic|ne|ea|ra|ce|li|ch|ll|be|ma|si|om|ur/
          .test(prevChar + nextChar)) delay *= 0.8;
    if (Math.random() < THINK_CHANCE) delay += Math.max(40, gauss(PAUSE_MEAN, PAUSE_SD));
    return Math.max(8, delay);
  }

  async function press(ch, lastChar) {
    const t = focused();
    if (!t || !t.isConnected) return;
    const hold = holdDuration();
    const gap = spacingDelay(lastChar, ch);

    const kd = mkKey('keydown', ch);
    t.dispatchEvent(kd);

    if (!kd.defaultPrevented) {
      if (ch === 'Backspace') {
        if (typeof t.value === 'string' && t.value.length) {
          t.value = t.value.slice(0, -1);
          t.dispatchEvent(new InputEvent('input', {
            inputType: 'deleteContentBackward', data: null, bubbles: true, composed: true
          }));
        }
      } else {
        const be = new InputEvent('beforeinput', {
          inputType: 'insertText', data: ch, bubbles: true, cancelable: true, composed: true
        });
        t.dispatchEvent(be);
        if (!be.defaultPrevented && typeof t.value === 'string') {
          t.value += ch;
          t.dispatchEvent(new InputEvent('input', {
            inputType: 'insertText', data: ch, bubbles: true, composed: true
          }));
        }
      }
    }

    await sleep(hold);
    t.dispatchEvent(mkKey('keyup', ch));
    await sleep(gap);
  }

  const NEIGHBORS = {
    a: 'sqwz', b: 'vghn', c: 'xdfv', d: 'sfrce', e: 'wrsdf', f: 'dgrte', g: 'fhtyb',
    h: 'gjuyv', i: 'uojkh', j: 'hkui', k: 'jlio', l: 'kop', m: 'njk', n: 'bhjm',
    o: 'ipkl', p: 'ol', q: 'wa', r: 'etdf', s: 'adwxz', t: 'rygf', u: 'yijk',
    v: 'cbgf', w: 'qeas', x: 'zcsd', y: 'tuhg', z: 'asx'
  };

  function typoFor(ch) {
    const n = NEIGHBORS[ch.toLowerCase()];
    if (!n) return 'a';
    const pick = n[Math.floor(Math.random() * n.length)];
    return ch === ch.toUpperCase() && /[a-z]/i.test(ch) ? pick.toUpperCase() : pick;
  }

  async function typeChar(ch, lastChar) {
    if (!enabled) return;
    if (Math.random() < ERROR_RATE && /[a-z]/i.test(ch)) {
      await press(typoFor(ch), lastChar);
      await sleep(Math.max(40, gauss(90, 30)));
      await press('Backspace', null);
      await sleep(Math.max(30, gauss(70, 25)));
    }
    await press(ch, lastChar);
  }

  async function run() {
    while (true) {
      if (!enabled) { await sleep(100); continue; }
      const w = activeWord();
      if (!w) { await sleep(120); continue; }

      const letters = lettersOf(w);
      let lastChar = null;
      for (let i = 0; i < letters.length; i++) {
        if (!enabled) break;
        const l = letters[i];
        if (isDone(l)) { lastChar = l.textContent; continue; }
        try { await typeChar(l.textContent, lastChar); }
        catch (e) { console.error('[auto-typer]', e); }
        lastChar = l.textContent;
      }

      if (enabled && activeWord() === w) {
        try { await typeChar(' ', lastChar); } catch (_) {}
      }
    }
  }

  function paint() {
    if (!btn) return;
    btn.textContent = 'Auto: ' + (enabled ? 'ON' : 'OFF');
    btn.style.background = enabled ? '#e2b714' : '#333';
    btn.style.color = enabled ? '#111' : '#eee';
  }

  function setEnabled(v) {
    enabled = v;
    paint();
    if (enabled) {
      el = findInput();
      try { el.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  function mount() {
    btn = document.createElement('div');
    btn.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99999;' +
      'padding:9px 13px;border-radius:9px;font:600 13px/1 system-ui,sans-serif;' +
      'cursor:pointer;user-select:none;box-shadow:0 2px 10px rgba(0,0,0,.35)';
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => setEnabled(!enabled));
    document.body.appendChild(btn);
    paint();
  }

  setInterval(() => {
    if (document.body && (!btn || !btn.isConnected)) mount();
  }, 500);

  window.autoTyper = {
    start: () => setEnabled(true),
    stop: () => setEnabled(false),
    toggle: () => setEnabled(!enabled)
  };

  run();
})();
