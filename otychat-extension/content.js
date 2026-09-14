(function() {
  'use strict';

  // Only run in top frame, not iframes (Google Slides has many iframes)
  if (window !== window.top) return;

  // Prevent double injection
  if (window.__otychatOverlayInjected) return;
  window.__otychatOverlayInjected = true;

  const DEFAULT_SERVER = 'http://localhost:3000';
  let socket = null;
  let overlayContainer = null;
  let serverUrl = DEFAULT_SERVER; // Store for resolving relative URLs

  // ============================================
  // ANIMATION PATTERNS
  // ============================================

  const ANIMATION_PATTERNS = [
    'float-up',
    'pop-in',
    'bounce-across',
    'spiral-rise',
    'firework',
    'rain-down'
  ];

  // Spam prevention: max concurrent emojis on screen
  const MAX_CONCURRENT_EMOJIS = 25;
  let activeEmojiCount = 0;

  function getRandomPattern() {
    return ANIMATION_PATTERNS[Math.floor(Math.random() * ANIMATION_PATTERNS.length)];
  }

  function getRandomX() {
    return Math.random() * (window.innerWidth - 64) + 32;
  }

  function getRandomY() {
    return Math.random() * (window.innerHeight - 64) + 32;
  }

  // ============================================
  // OVERLAY CREATION
  // ============================================

  function createOverlay() {
    if (overlayContainer) return;

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'otychat-overlay';

    // Question card + popcorn emergency container (both hidden by default)
    overlayContainer.innerHTML = `
      <div class="otychat-join" id="otychat-join">
        <div class="otychat-join-qr" id="otychat-join-qr"></div>
        <div class="otychat-join-text">
          <div class="otychat-join-title">Join the party</div>
          <div class="otychat-join-url" id="otychat-join-url"></div>
          <div class="otychat-join-count" id="otychat-join-count"></div>
        </div>
      </div>
      <div class="otychat-poll" id="otychat-poll"></div>
      <div class="otychat-question" id="otychat-question">
        <div class="otychat-question-badge">From the room</div>
        <div class="otychat-question-votes" id="otychat-question-votes"></div>
        <div class="otychat-question-author" id="otychat-question-author"></div>
        <div class="otychat-question-content" id="otychat-question-content"></div>
      </div>
      <div class="otychat-popcorn-emergency" id="otychat-popcorn-emergency">
        <div class="emergency-bars top"></div>
        <div class="emergency-content">
          <div class="popcorn-icon">🍿</div>
          <h1>POPCORN EMERGENCY</h1>
          <div class="host-name" id="popcorn-host"></div>
          <div class="responders" id="popcorn-responders"></div>
        </div>
        <div class="emergency-bars bottom"></div>
        <div class="popcorn-kernels" id="popcorn-kernels"></div>
      </div>
    `;

    attachOverlay();
  }

  function attachOverlay() {
    const parent = document.fullscreenElement || document.body;
    if (overlayContainer.parentNode) {
      overlayContainer.parentNode.removeChild(overlayContainer);
    }
    parent.appendChild(overlayContainer);
  }

  // ============================================
  // FULLSCREEN HANDLING
  // ============================================

  document.addEventListener('fullscreenchange', () => {
    if (overlayContainer) attachOverlay();
  });
  document.addEventListener('webkitfullscreenchange', () => {
    if (overlayContainer) attachOverlay();
  });

  // ============================================
  // SOCKET CONNECTION
  // ============================================

  async function connectSocket() {
    const result = await chrome.storage.sync.get(['serverUrl']);
    serverUrl = result.serverUrl || DEFAULT_SERVER; // Store at module scope

    try {
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        // A redeploy or a sleeping laptop must not kill the overlay for the night
        reconnectionAttempts: Infinity
      });

      socket.on('connect', () => {
        socket.emit('join-display');
        console.log('✅ OtyChat overlay connected');
      });

      socket.on('display-welcome', (data) => showJoinCard(data));
      socket.on('user-count', (count) => updateJoinCount(count));
      socket.on('poll-state', (state) => renderPoll(state));
      socket.on('awards-ceremony', (data) => runAwards(data));
      socket.on('awards-end', () => stopAwards());

      socket.on('disconnect', () => {
        console.log('❌ OtyChat overlay disconnected');
      });

      // Emoji reactions - can be URL path like "/emojis/123.png" or unicode emoji like "😀"
      socket.on('emoji-blast', (data) => {
        const emoji = data.emoji;
        const userColor = data.userColor || '#ec4899';
        // Check if it's a URL (starts with / or http) or unicode emoji
        const isUrl = emoji && (emoji.startsWith('/') || emoji.startsWith('http'));
        if (isUrl) {
          spawnEmoji(null, emoji, userColor); // URL-based emoji
        } else {
          spawnEmoji(emoji, null, userColor); // Unicode emoji
        }
      });

      // Question queue -> big screen
      socket.on('show-question', (question) => {
        showQuestion(question);
      });

      socket.on('hide-question', () => {
        hideQuestion();
      });

      socket.on('chat-upvoted', (data) => {
        updateQuestionVotes(data);
      });

      // Social moments from the room
      socket.on('pokemon-caught', (data) => showPokemonCaught(data));
      socket.on('level-up', (data) => showLevelUp(data));
      socket.on('kudos', (data) => showKudos(data));
      socket.on('achievement-unlocked', (data) => showToast('🏆', 'Achievement unlocked', `${data.username}: ${data.achievement}`, data.icon));
      socket.on('drink-logged', (data) => showToast('🍺', 'Cheers!', `${data.username} logged drink #${data.count}`));
      socket.on('drawing-blast', (data) => showDrawingBlast(data));
      socket.on('pokemon-spawn-wave', () => showToast('🌿', 'Wild Pokémon appeared!', 'Check your phones'));
      socket.on('stunt', (data) => runStunt(data));

      // Popcorn Emergency
      socket.on('popcorn-emergency-start', (data) => {
        showPopcornEmergency(data);
      });

      socket.on('popcorn-emergency-response', (data) => {
        updatePopcornResponder(data);
      });

      socket.on('popcorn-emergency-end', () => {
        hidePopcornEmergency();
      });

    } catch (err) {
      console.error('Failed to connect to OtyChat server:', err);
    }
  }

  // ============================================
  // EMOJI SPAWNING
  // ============================================

  function spawnEmoji(emoji, emojiUrl, userColor = '#ec4899') {
    // Spam prevention: skip if too many emojis on screen
    if (activeEmojiCount >= MAX_CONCURRENT_EMOJIS) {
      return;
    }
    activeEmojiCount++;

    const el = document.createElement('div');
    const pattern = getRandomPattern();
    el.className = `otychat-emoji otychat-${pattern}`;

    // Apply user's color as a glowing bubble effect
    el.style.background = `radial-gradient(circle, ${userColor}30 0%, ${userColor}10 50%, transparent 70%)`;
    el.style.borderRadius = '50%';
    el.style.padding = '15px';
    el.style.boxShadow = `0 0 20px ${userColor}50, 0 0 40px ${userColor}30`;

    // Create emoji content - resolve relative URLs to server
    if (emojiUrl) {
      const img = document.createElement('img');
      // Handle both absolute URLs and relative paths
      if (emojiUrl.startsWith('http')) {
        img.src = emojiUrl;
      } else if (emojiUrl.startsWith('/')) {
        img.src = serverUrl + emojiUrl; // Prepend server URL to relative path
      } else {
        img.src = serverUrl + '/' + emojiUrl;
      }
      img.alt = emoji || 'emoji';
      el.appendChild(img);
    } else if (emoji) {
      el.textContent = emoji;
    }

    // Position based on animation pattern
    switch(pattern) {
      case 'float-up':
        el.style.left = `${getRandomX()}px`;
        el.style.bottom = '0px';
        break;
      case 'pop-in':
        el.style.left = `${getRandomX()}px`;
        el.style.top = `${getRandomY()}px`;
        break;
      case 'bounce-across':
        el.style.left = '-40px';
        el.style.top = `${getRandomY()}px`;
        break;
      case 'spiral-rise':
        el.style.left = `${getRandomX()}px`;
        el.style.bottom = '0px';
        break;
      case 'firework':
        el.style.left = `${getRandomX()}px`;
        el.style.bottom = '0px';
        el.dataset.burstX = getRandomX();
        el.dataset.burstY = window.innerHeight * 0.3 + Math.random() * window.innerHeight * 0.3;
        break;
      case 'rain-down':
        el.style.left = `${getRandomX()}px`;
        el.style.top = '-40px';
        break;
    }

    overlayContainer.appendChild(el);

    // Firework burst effect
    if (pattern === 'firework') {
      setTimeout(() => {
        createFireworkBurst(el, emoji, emojiUrl, userColor);
      }, 600);
    }

    // Remove after animation and decrement counter
    const duration = pattern === 'firework' ? 2000 : 3500;
    setTimeout(() => {
      el.remove();
      activeEmojiCount--;
    }, duration);
  }

  function createFireworkBurst(parentEl, emoji, emojiUrl, userColor = '#ec4899') {
    const rect = parentEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Create 5 mini emojis bursting outward
    for (let i = 0; i < 5; i++) {
      const mini = document.createElement('div');
      mini.className = 'otychat-emoji otychat-burst-particle';

      // Apply user color glow to burst particles
      mini.style.boxShadow = `0 0 15px ${userColor}60`;

      if (emojiUrl) {
        const img = document.createElement('img');
        // Handle both absolute URLs and relative paths
        if (emojiUrl.startsWith('http')) {
          img.src = emojiUrl;
        } else if (emojiUrl.startsWith('/')) {
          img.src = serverUrl + emojiUrl;
        } else {
          img.src = serverUrl + '/' + emojiUrl;
        }
        mini.appendChild(img);
      } else if (emoji) {
        mini.textContent = emoji;
      }

      const angle = (i / 5) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      mini.style.left = `${centerX}px`;
      mini.style.top = `${centerY}px`;
      mini.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
      mini.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);

      overlayContainer.appendChild(mini);
      setTimeout(() => mini.remove(), 1000);
    }
  }

  // ============================================
  // QUESTION CARD
  // ============================================

  let shownQuestionId = null;

  function showQuestion(question) {
    const card = document.getElementById('otychat-question');
    const author = document.getElementById('otychat-question-author');
    const content = document.getElementById('otychat-question-content');
    const votes = document.getElementById('otychat-question-votes');
    if (!card) return;

    shownQuestionId = String(question.id);
    author.textContent = question.username || '';
    votes.textContent = `👍 ${question.votes || 0}`;

    content.innerHTML = '';
    if (question.text) {
      const p = document.createElement('p');
      p.textContent = question.text;
      content.appendChild(p);
    }
    if (question.drawing) {
      const img = document.createElement('img');
      img.src = question.drawing;
      img.alt = '';
      content.appendChild(img);
    }

    // Restart the entrance animation when a new question replaces the old one
    card.classList.remove('active');
    void card.offsetWidth;
    card.classList.add('active');
  }

  function hideQuestion() {
    const card = document.getElementById('otychat-question');
    if (card) card.classList.remove('active');
    shownQuestionId = null;
  }

  function updateQuestionVotes(data) {
    if (shownQuestionId === null || String(data.messageId) !== shownQuestionId) return;
    const votes = document.getElementById('otychat-question-votes');
    if (votes) votes.textContent = `👍 ${data.votes}`;
  }

  // ============================================
  // ROOM MOMENTS (catches, level-ups, kudos, toasts, doodles)
  // ============================================

  const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mount(node, lifetimeMs) {
    overlayContainer.appendChild(node);
    setTimeout(() => node.remove(), lifetimeMs);
  }

  function toastStack() {
    let stack = document.getElementById('otychat-toasts');
    if (!stack) {
      stack = el('div', 'otychat-toasts');
      stack.id = 'otychat-toasts';
      overlayContainer.appendChild(stack);
    }
    return stack;
  }

  function showToast(icon, title, message, iconOverride) {
    const toast = el('div', 'otychat-toast');
    toast.appendChild(el('div', 'otychat-toast-icon', iconOverride || icon));
    const info = el('div', 'otychat-toast-info');
    info.appendChild(el('div', 'otychat-toast-title', title));
    info.appendChild(el('div', 'otychat-toast-message', message));
    toast.appendChild(info);
    const stack = toastStack();
    stack.appendChild(toast);
    // A burst of achievements must not wallpaper the slide
    while (stack.children.length > 4) stack.firstChild.remove();
    setTimeout(() => toast.remove(), 4000);
  }

  function showPokemonCaught(data) {
    const card = el('div', 'otychat-catch' + (data.isShiny ? ' shiny' : ''));
    const img = el('img', 'otychat-catch-sprite');
    img.src = `${SPRITE_BASE}/${data.isShiny ? 'shiny/' : ''}${data.pokemonId}.png`;
    img.alt = '';
    card.appendChild(img);
    card.appendChild(el('div', 'otychat-catch-who', `${data.username} caught`));
    card.appendChild(el('div', 'otychat-catch-name', `${data.pokemonName}${data.isShiny ? ' ✨' : ''}`));
    if (data.isShiny) card.appendChild(el('div', 'otychat-catch-shiny', '✨ SHINY ✨'));
    mount(card, 4000);
  }

  function showLevelUp(data) {
    const card = el('div', 'otychat-levelup');
    card.appendChild(el('div', 'otychat-levelup-stars', '⭐✨⭐'));
    card.appendChild(el('div', 'otychat-levelup-title', 'LEVEL UP'));
    card.appendChild(el('div', 'otychat-levelup-who', data.username));
    card.appendChild(el('div', 'otychat-levelup-level', `Level ${data.level}`));
    mount(card, 4000);
  }

  function showKudos(data) {
    const card = el('div', 'otychat-kudos');
    card.appendChild(el('div', 'otychat-kudos-heart', '💖'));
    const line = el('div', 'otychat-kudos-line');
    line.appendChild(el('span', 'otychat-kudos-from', data.fromUsername));
    line.appendChild(el('span', '', ' sent kudos to '));
    line.appendChild(el('span', 'otychat-kudos-to', data.toUsername));
    card.appendChild(line);
    if (data.message) card.appendChild(el('div', 'otychat-kudos-message', `"${data.message}"`));
    mount(card, 3500);
  }

  function showDrawingBlast(data) {
    const card = el('div', 'otychat-doodle');
    card.appendChild(el('div', 'otychat-doodle-author', data.username));
    if (data.drawing) {
      const img = el('img');
      img.src = data.drawing;
      img.alt = '';
      card.appendChild(img);
    }
    if (data.text) card.appendChild(el('div', 'otychat-doodle-text', data.text));
    mount(card, 6000);
  }

  // ============================================
  // STUNTS (bought with coins from the shop)
  // ============================================

  const CONFETTI_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#fbbf24', '#f97316', '#ef4444'];

  function runStunt(data) {
    const who = data.username || 'Someone';
    switch (data.kind) {
      case 'confetti':
        fireConfetti();
        showToast('🎉', 'Confetti cannon', `${who} fired it`);
        break;
      case 'airhorn':
        playAirhorn();
        showToast('📯', 'Airhorn', who);
        break;
      case 'drumroll':
        playDrumroll();
        showToast('🥁', 'Drumroll', who);
        break;
      case 'sad_trombone':
        playSadTrombone();
        showToast('🎺', 'Sad trombone', who);
        break;
      case 'rimshot':
        playRimshot();
        showToast('🥁', 'Ba dum tss', who);
        break;
      case 'spotlight':
        showSpotlight(data);
        break;
      default:
        break;
    }
  }

  function fireConfetti() {
    const count = 140;
    for (let i = 0; i < count; i++) {
      const piece = el('div', 'otychat-confetti');
      const size = 8 + Math.random() * 8;
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.width = `${size}px`;
      piece.style.height = `${size * (0.4 + Math.random() * 0.6)}px`;
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      piece.style.animationDuration = `${3 + Math.random() * 2.5}s`;
      piece.style.animationDelay = `${Math.random() * 0.8}s`;
      piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 240}px`);
      piece.style.setProperty('--spin', `${Math.round(360 + Math.random() * 720)}deg`);
      overlayContainer.appendChild(piece);
      setTimeout(() => piece.remove(), 6500);
    }
  }

  function showSpotlight(data) {
    const banner = el('div', 'otychat-spotlight');
    banner.style.setProperty('--glow', data.userColor || '#ec4899');
    const bulbs = el('div', 'otychat-spotlight-bulbs');
    for (let i = 0; i < 28; i++) bulbs.appendChild(el('span', 'otychat-bulb'));
    banner.appendChild(bulbs);
    banner.appendChild(el('div', 'otychat-spotlight-label', 'Now appearing'));
    banner.appendChild(el('div', 'otychat-spotlight-name', data.username || ''));
    if (data.message) banner.appendChild(el('div', 'otychat-spotlight-message', data.message));
    mount(banner, 10000);
  }

  // --- synthesised soundboard: nothing to host, nothing to load ---

  function audioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    return Ctx ? new Ctx() : null;
  }

  function noiseBuffer(ctx, seconds) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function finish(ctx, seconds) {
    setTimeout(() => ctx.close(), seconds * 1000 + 200);
  }

  function playAirhorn() {
    const ctx = audioContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.05);
    gain.gain.setValueAtTime(0.35, t0 + 1.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7);
    gain.connect(ctx.destination);
    [0, 7, -5].forEach(detune => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, t0);
      osc.frequency.exponentialRampToValueAtTime(440, t0 + 0.12);
      osc.detune.value = detune;
      osc.connect(gain);
      osc.start(t0);
      osc.stop(t0 + 1.7);
    });
    finish(ctx, 1.7);
  }

  function playDrumroll() {
    const ctx = audioContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 2.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    // 14 hits per second via an LFO on the gain
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(11, t0);
    lfo.frequency.linearRampToValueAtTime(18, t0 + 2);
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    lfo.start(t0);
    src.stop(t0 + 2.1);
    lfo.stop(t0 + 2.1);
    // crash at the end
    const crash = ctx.createBufferSource();
    crash.buffer = noiseBuffer(ctx, 1.2);
    const crashGain = ctx.createGain();
    crashGain.gain.setValueAtTime(0.4, t0 + 2.1);
    crashGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    crash.connect(hp);
    hp.connect(crashGain);
    crashGain.connect(ctx.destination);
    crash.start(t0 + 2.1);
    finish(ctx, 3.3);
  }

  function playSadTrombone() {
    const ctx = audioContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const notes = [[392, 0.4], [370, 0.4], [349, 0.4], [330, 1.3]];
    let t = t0;
    notes.forEach(([freq, dur], i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.05);
      gain.gain.setValueAtTime(0.3, t + dur - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.frequency.setValueAtTime(freq, t);
      // the last note sags
      if (i === notes.length - 1) osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + dur);
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    });
    finish(ctx, t - t0);
  }

  function playRimshot() {
    const ctx = audioContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const hit = (at) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 0.08);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(at);
    };
    hit(t0);
    hit(t0 + 0.16);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t0 + 0.34);
    osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.7);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, t0 + 0.34);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.75);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0 + 0.34);
    osc.stop(t0 + 0.75);
    // cymbal
    const cym = ctx.createBufferSource();
    cym.buffer = noiseBuffer(ctx, 0.9);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    const cymGain = ctx.createGain();
    cymGain.gain.setValueAtTime(0.3, t0 + 0.34);
    cymGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
    cym.connect(hp);
    hp.connect(cymGain);
    cymGain.connect(ctx.destination);
    cym.start(t0 + 0.34);
    finish(ctx, 1.3);
  }

  // ============================================
  // JOIN CARD (QR + URL), shown on connect and on demand
  // ============================================

  const JOIN_CARD_MS = 90 * 1000;
  let joinHideTimer = null;
  let joinInfo = null;

  function showJoinCard(data) {
    joinInfo = data || joinInfo;
    const card = document.getElementById('otychat-join');
    if (!card || !joinInfo) return;
    const qr = document.getElementById('otychat-join-qr');
    qr.innerHTML = joinInfo.qrSvg || '';
    document.getElementById('otychat-join-url').textContent = String(joinInfo.joinUrl || '').replace(/^https?:\/\//, '');
    updateJoinCount(joinInfo.onlineCount || 0);
    card.classList.add('active');
    clearTimeout(joinHideTimer);
    joinHideTimer = setTimeout(hideJoinCard, JOIN_CARD_MS);
  }

  function hideJoinCard() {
    const card = document.getElementById('otychat-join');
    if (card) card.classList.remove('active');
    clearTimeout(joinHideTimer);
  }

  function toggleJoinCard() {
    const card = document.getElementById('otychat-join');
    if (card && card.classList.contains('active')) hideJoinCard();
    else showJoinCard();
  }

  function updateJoinCount(count) {
    const el = document.getElementById('otychat-join-count');
    if (el) el.textContent = count === 1 ? '1 person here' : `${count} people here`;
  }

  // ============================================
  // POLL CARD
  // ============================================

  function renderPoll(state) {
    const card = document.getElementById('otychat-poll');
    if (!card) return;
    card.innerHTML = '';
    if (!state) { card.classList.remove('active'); return; }
    hideJoinCard();

    const head = el('div', 'otychat-poll-head');
    head.appendChild(el('span', 'otychat-poll-badge', state.closed ? 'Poll closed' : 'Poll'));
    head.appendChild(el('span', 'otychat-poll-by', `by ${state.by}`));
    card.appendChild(head);
    card.appendChild(el('div', 'otychat-poll-question', state.question));

    const total = state.total || 0;
    const best = Math.max(0, ...state.options.map(o => o.count));
    state.options.forEach(o => {
      const pct = total ? Math.round((o.count / total) * 100) : 0;
      const row = el('div', 'otychat-poll-option' + (state.closed && o.count === best && best > 0 ? ' winner' : ''));
      const bar = el('div', 'otychat-poll-bar');
      bar.style.width = `${Math.max(pct, 4)}%`;
      row.appendChild(bar);
      const label = el('div', 'otychat-poll-label');
      label.appendChild(el('span', 'otychat-poll-text', o.text));
      label.appendChild(el('span', 'otychat-poll-pct', `${pct}% · ${o.count}`));
      row.appendChild(label);
      card.appendChild(row);
    });
    card.appendChild(el('div', 'otychat-poll-total', `${total} vote${total === 1 ? '' : 's'} · vote from your phone`));
    card.classList.add('active');
  }

  // ============================================
  // AWARDS CEREMONY
  // ============================================

  const AWARD_SLIDE_MS = 6000;
  let awardTimers = [];
  let awardNodes = [];

  function stopAwards() {
    awardTimers.forEach(clearTimeout);
    awardTimers = [];
    awardNodes.forEach(n => n.remove());
    awardNodes = [];
  }

  function profilePicNode(pic, className) {
    const isImage = typeof pic === 'string' && (pic.startsWith('data:') || pic.startsWith('http') || pic.startsWith('/'));
    if (isImage) {
      const img = el('img', className);
      img.src = pic.startsWith('/') ? serverUrl + pic : pic;
      img.alt = '';
      return img;
    }
    return el('div', className + ' emoji', pic || '👤');
  }

  function awardCard(a) {
    const card = el('div', 'otychat-award');
    card.appendChild(el('div', 'otychat-award-icon', a.icon));
    card.appendChild(el('div', 'otychat-award-title', a.title));
    card.appendChild(profilePicNode(a.profilePic, 'otychat-award-pic'));
    card.appendChild(el('div', 'otychat-award-name', a.username));
    if (a.sprite) {
      const img = el('img', 'otychat-award-sprite');
      img.src = a.sprite;
      img.alt = '';
      card.appendChild(img);
    }
    if (a.detail) card.appendChild(el('div', 'otychat-award-detail', a.key === 'question' ? `"${a.detail}"` : a.detail));
    if (a.value !== null && a.label) card.appendChild(el('div', 'otychat-award-value', `${a.value} ${countLabel(a.value, a.label)}`));
    return card;
  }

  // "1 reactions" reads badly; single-word labels drop the s at one
  function countLabel(value, label) {
    return value === 1 && !label.includes(' ') && label.endsWith('s') ? label.slice(0, -1) : label;
  }

  function awardsSummary(awards) {
    const card = el('div', 'otychat-awards-summary');
    card.appendChild(el('div', 'otychat-awards-summary-title', '🏆 Tonight\'s awards'));
    awards.forEach(a => {
      const row = el('div', 'otychat-awards-row');
      row.appendChild(el('span', 'otychat-awards-row-icon', a.icon));
      row.appendChild(el('span', 'otychat-awards-row-title', a.title));
      row.appendChild(el('span', 'otychat-awards-row-name', a.username));
      card.appendChild(row);
    });
    card.appendChild(el('div', 'otychat-awards-thanks', 'Thanks for coming 🎉'));
    return card;
  }

  function runAwards(data) {
    stopAwards();
    hideJoinCard();
    if (!data || !Array.isArray(data.awards) || data.awards.length === 0) return;
    const awards = data.awards;
    awards.forEach((a, i) => {
      awardTimers.push(setTimeout(() => {
        awardNodes.forEach(n => n.remove());
        awardNodes = [];
        const node = awardCard(a);
        overlayContainer.appendChild(node);
        awardNodes.push(node);
      }, i * AWARD_SLIDE_MS));
    });
    awardTimers.push(setTimeout(() => {
      awardNodes.forEach(n => n.remove());
      awardNodes = [];
      const node = awardsSummary(awards);
      overlayContainer.appendChild(node);
      awardNodes.push(node);
    }, awards.length * AWARD_SLIDE_MS));
  }

  // ============================================
  // POPCORN EMERGENCY
  // ============================================

  let popcornResponders = {};
  let popcornKernelInterval = null;

  function playAlarm() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = 0.2;
      gain.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.connect(gain);
      const t0 = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, t0 + i * 0.25);
      }
      gain.gain.setValueAtTime(0.2, t0 + 1.9);
      gain.gain.linearRampToValueAtTime(0, t0 + 2.1);
      osc.start(t0);
      osc.stop(t0 + 2.1);
      osc.onended = () => ctx.close();
    } catch (err) {
      // Presenter may not have interacted with the page yet; the takeover still shows
    }
  }

  function showPopcornEmergency(data) {
    playAlarm();
    const container = document.getElementById('otychat-popcorn-emergency');
    const hostEl = document.getElementById('popcorn-host');
    const respondersEl = document.getElementById('popcorn-responders');

    hostEl.textContent = `${data.hostUsername} needs you!`;
    respondersEl.innerHTML = '';
    popcornResponders = {};

    // Initialize invitees as pending
    data.invitees.forEach(user => {
      popcornResponders[user.username] = 'pending';
      addResponderElement(user.username, 'pending');
    });

    container.classList.add('active');

    // Start popping kernels
    startPopcornKernels();
  }

  function updatePopcornResponder(data) {
    const { username, status } = data;
    popcornResponders[username] = status;

    const el = document.querySelector(`[data-responder="${username}"]`);
    if (el) {
      el.className = `responder ${status}`;
      el.querySelector('.status-icon').textContent = status === 'accepted' ? '✅' : '❌';

      // Accepted users get a pop-in animation
      if (status === 'accepted') {
        el.classList.add('pop-in');
      }
    }
  }

  function addResponderElement(username, status) {
    const respondersEl = document.getElementById('popcorn-responders');
    const el = document.createElement('div');
    el.className = `responder ${status}`;
    el.dataset.responder = username;
    el.innerHTML = `
      <span class="status-icon">${status === 'pending' ? '⏳' : status === 'accepted' ? '✅' : '❌'}</span>
      <span class="name">${escapeHtml(username)}</span>
    `;
    respondersEl.appendChild(el);
  }

  function hidePopcornEmergency() {
    const container = document.getElementById('otychat-popcorn-emergency');
    container.classList.remove('active');
    stopPopcornKernels();
  }

  function startPopcornKernels() {
    const kernelsContainer = document.getElementById('popcorn-kernels');
    kernelsContainer.innerHTML = '';

    popcornKernelInterval = setInterval(() => {
      const kernel = document.createElement('div');
      kernel.className = 'kernel';
      kernel.textContent = '🍿';
      kernel.style.left = `${Math.random() * 100}%`;
      kernel.style.animationDuration = `${1 + Math.random() * 2}s`;
      kernelsContainer.appendChild(kernel);

      setTimeout(() => kernel.remove(), 3000);
    }, 200);
  }

  function stopPopcornKernels() {
    if (popcornKernelInterval) {
      clearInterval(popcornKernelInterval);
      popcornKernelInterval = null;
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // MESSAGE HANDLING (from popup)
  // ============================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'reconnect') {
      if (socket) socket.disconnect();
      connectSocket();
    }
    if (message.action === 'toggle-join') {
      toggleJoinCard();
    }
    if (message.action === 'test') {
      // Test all animation patterns
      ANIMATION_PATTERNS.forEach((pattern, i) => {
        setTimeout(() => spawnEmoji('🎉', null), i * 300);
      });
    }
  });

  // ============================================
  // INIT
  // ============================================

  function init() {
    console.log('🎭 OtyChat Display Overlay initializing...');
    createOverlay();
    connectSocket();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
