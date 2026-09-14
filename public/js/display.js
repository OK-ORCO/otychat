/**
 * OtyChat Display Overlay
 * Handles animations and visual feedback on the presentation screen
 * Updated for modern playful design (1920x1080)
 */

const socket = io();

let totalDrinks = 0;
let totalQuestions = 0;

// Join as display client
socket.emit('join-display');

// ============================================
// EMOJI ANIMATIONS
// ============================================

socket.on('emoji-blast', (data) => {
  spawnEmoji(data.emoji, data.emojiUrl, data.userColor);
});

function spawnEmoji(emoji, emojiUrl, userColor = '#ec4899') {
  const el = document.createElement('div');
  el.className = 'emoji-float';

  // Apply user's color as a glowing bubble effect
  el.style.background = `radial-gradient(circle, ${userColor}30 0%, ${userColor}10 50%, transparent 70%)`;
  el.style.borderRadius = '50%';
  el.style.padding = '20px';
  el.style.boxShadow = `0 0 30px ${userColor}50, 0 0 60px ${userColor}30`;

  // Check if it's a custom emoji URL or a unicode emoji
  // Handle both absolute URLs (http...) and relative paths (/emojis/...)
  const isUrl = emoji && (emoji.startsWith('/') || emoji.startsWith('http'));
  if (isUrl) {
    const img = document.createElement('img');
    // Relative paths are resolved automatically against current origin
    img.src = emoji;
    img.alt = 'emoji';
    el.appendChild(img);
  } else if (emojiUrl && (emojiUrl.startsWith('/') || emojiUrl.startsWith('http'))) {
    const img = document.createElement('img');
    img.src = emojiUrl;
    img.alt = emoji || 'emoji';
    el.appendChild(img);
  } else if (emoji) {
    el.textContent = emoji;
  }

  // Random horizontal position across 1920px width
  const x = Math.random() * 1720 + 100;
  const y = 980; // Start near bottom

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  document.querySelector('.overlay').appendChild(el);

  // Remove after animation
  setTimeout(() => el.remove(), 3500);
}

// Spawn multiple emojis for emphasis
function spawnEmojiFlurry(emoji, emojiUrl, count = 5) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnEmoji(emoji, emojiUrl), i * 100);
  }
}

// ============================================
// DRAWING BLASTS
// ============================================

socket.on('drawing-blast', (data) => {
  showDrawingBlast(data);
});

function showDrawingBlast(data) {
  const el = document.createElement('div');
  el.className = 'drawing-blast';

  let content = `<div class="author">@${escapeHtml(data.username)}</div>`;

  if (data.drawing) {
    content += `<img src="${data.drawing}" alt="Drawing">`;
  }
  if (data.text) {
    content += `<div class="text">${escapeHtml(data.text)}</div>`;
  }

  el.innerHTML = content;
  document.querySelector('.overlay').appendChild(el);

  setTimeout(() => el.remove(), 5000);
}

// ============================================
// CURRENT QUESTION
// ============================================

socket.on('show-question', (question) => {
  showCurrentQuestion(question);
});

socket.on('hide-question', () => {
  hideCurrentQuestion();
});

socket.on('question-upvoted', ({ questionId, votes }) => {
  const votesEl = document.getElementById('question-votes');
  if (votesEl.dataset.questionId === String(questionId)) {
    votesEl.textContent = `👍 ${votes}`;
  }
});

function showCurrentQuestion(question) {
  const container = document.getElementById('current-question');
  const authorEl = document.getElementById('question-author');
  const contentEl = document.getElementById('question-content');
  const votesEl = document.getElementById('question-votes');

  authorEl.textContent = `@${question.username}`;
  votesEl.textContent = `👍 ${question.votes || 0}`;
  votesEl.dataset.questionId = question.id;

  let content = '';
  if (question.text) {
    content += `<p>${escapeHtml(question.text)}</p>`;
  }
  if (question.drawing) {
    content += `<img src="${question.drawing}" alt="Drawing">`;
  }
  contentEl.innerHTML = content;

  container.classList.add('active');
}

function hideCurrentQuestion() {
  document.getElementById('current-question').classList.remove('active');
}

// ============================================
// POKEMON CAUGHT
// ============================================

socket.on('pokemon-caught', (data) => {
  showPokemonCaught(data);
});

function showPokemonCaught(data) {
  const el = document.createElement('div');
  el.className = 'pokemon-caught-toast' + (data.isShiny ? ' shiny' : '');

  const spriteUrl = data.isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${data.pokemonId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemonId}.png`;

  el.innerHTML = `
    <div class="sprite">
      <img src="${spriteUrl}" alt="${escapeHtml(data.pokemonName)}">
    </div>
    <h2>${escapeHtml(data.username)} caught</h2>
    <div class="pokemon-name">${escapeHtml(data.pokemonName)}${data.isShiny ? ' ✨' : ''}</div>
    ${data.isShiny ? '<div class="shiny-badge">✨ SHINY! ✨</div>' : ''}
  `;

  document.querySelector('.overlay').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ============================================
// KUDOS
// ============================================

socket.on('kudos', (data) => {
  showKudosBurst(data);
});

function showKudosBurst(data) {
  const el = document.createElement('div');
  el.className = 'kudos-burst';

  let messageHtml = '';
  if (data.message) {
    messageHtml = `<div class="message" style="font-size: 24px; margin-top: 8px; color: #666;">"${escapeHtml(data.message)}"</div>`;
  }

  el.innerHTML = `
    <div class="heart">💖</div>
    <div class="text">
      <span class="from">${escapeHtml(data.fromUsername)}</span>
      →
      <span class="to">${escapeHtml(data.toUsername)}</span>
      ${messageHtml}
    </div>
  `;

  document.querySelector('.overlay').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ============================================
// LEVEL UP
// ============================================

socket.on('level-up', (data) => {
  showLevelUpBurst(data);
});

function showLevelUpBurst(data) {
  const el = document.createElement('div');
  el.className = 'level-up-burst';

  let zoneHtml = '';
  if (data.unlockedZone) {
    zoneHtml = `<div class="zone-unlock">🗺️ ${escapeHtml(data.unlockedZone)} Zone Unlocked!</div>`;
  }

  el.innerHTML = `
    <div class="stars">⭐✨⭐</div>
    <h2>LEVEL UP!</h2>
    <div class="username">${escapeHtml(data.username)}</div>
    <div class="level">Level ${data.level}</div>
    ${zoneHtml}
  `;

  document.querySelector('.overlay').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ============================================
// ACHIEVEMENTS
// ============================================

socket.on('achievement-unlocked', (data) => {
  showToast('achievement', '🏆', 'Achievement Unlocked!', `${data.username}: ${data.achievement}`);
});

// ============================================
// DRINKS
// ============================================

socket.on('drink-logged', (data) => {
  totalDrinks = data.totalDrinks || totalDrinks + 1;
  updateDrinkCounter();
  showToast('drink', '🍺', 'Cheers!', `${data.username} logged drink #${data.count}`);
});

function updateDrinkCounter() {
  const counter = document.getElementById('drink-counter');
  document.getElementById('total-drinks').textContent = totalDrinks;
  counter.style.display = 'flex';
}

// ============================================
// QUESTIONS COUNT
// ============================================

socket.on('question-added', (data) => {
  totalQuestions++;
  const counter = document.getElementById('question-counter');
  document.getElementById('total-questions').textContent = totalQuestions;
  counter.style.display = 'flex';
});

// ============================================
// ONLINE COUNT
// ============================================

socket.on('user-count', (count) => {
  document.getElementById('online-count').textContent = count;
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(type, icon, title, message) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `achievement-toast ${type}`;
  toast.innerHTML = `
    <span class="icon">${icon}</span>
    <div class="info">
      <div class="title">${escapeHtml(title)}</div>
      <div class="message">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
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
// KEYBOARD SHORTCUTS (for admin control)
// ============================================

document.addEventListener('keydown', (e) => {
  // Press 'H' to hide current question
  if (e.key === 'h' || e.key === 'H') {
    hideCurrentQuestion();
  }

  // Press 'C' to clear all animations
  if (e.key === 'c' || e.key === 'C') {
    document.querySelectorAll('.emoji-float, .drawing-blast, .pokemon-caught-toast, .kudos-burst, .level-up-burst').forEach(el => el.remove());
  }

  // Press 'T' to test emoji
  if (e.key === 't' || e.key === 'T') {
    spawnEmojiFlurry('🎉', null, 5);
  }
});

// ============================================
// CONNECTION STATUS
// ============================================

socket.on('connect', () => {
  console.log('✅ Display connected to server');
});

socket.on('disconnect', () => {
  console.log('❌ Display disconnected from server');
});

console.log('🖥️ OtyChat Display Overlay loaded (1920x1080)');
console.log('Keyboard shortcuts: H = hide question, C = clear animations, T = test emoji');
