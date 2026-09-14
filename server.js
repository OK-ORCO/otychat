/**
 * OtyChat Server
 * Express + Socket.io + SQLite
 * Enhanced Pokemon System with Zones, Leveling, and Catch Mechanics
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const QRCode = require('qrcode');

const db = require('./db');
const pokemon = require('./pokemon');
const achievements = require('./achievements');
const push = require('./push');

// ============================================
// SERVER SETUP
// ============================================

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const ADMIN_CODE = process.env.ADMIN_CODE || 'otyadmin';
if (!process.env.ADMIN_CODE && process.env.NODE_ENV === 'production') {
  console.warn('[Server] ADMIN_CODE is not set; the default is public in the repo. Set it in the host environment.');
}

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const REACT_BUILD_DIR = path.join(__dirname, 'public-react');

// Third-party art (Discord emojis, avatars) is not in the repo. Locally it lives in
// client/public; on a hosted deploy it is pushed once into the data volume with
// scripts/push-assets.js. Check the volume first, then the local copy.
app.use('/emojis', express.static(path.join(DATA_DIR, 'assets/emojis')));
app.use('/emojis', express.static(path.join(__dirname, 'client/public/emojis')));
app.use('/avatars', express.static(path.join(DATA_DIR, 'assets/avatars')));
app.use('/avatars', express.static(path.join(__dirname, 'client/public/avatars')));

// Legacy web display + admin pages
app.use(express.static(path.join(__dirname, 'public')));
// Built React app (client/ -> public-react/ via `npm run build`)
app.use(express.static(REACT_BUILD_DIR));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) });
});

// ============================================
// ADMIN-GATED ROUTES
// ============================================

// Test routes and asset uploads need the admin code (header or ?code=) so a
// public deploy cannot grant itself Pokemon.
function requireAdminCode(req, res, next) {
  const code = req.get('x-admin-code') || req.query.code;
  if (code !== ADMIN_CODE) {
    return res.status(403).json({ error: 'Admin code required' });
  }
  next();
}
app.use('/api/test', requireAdminCode);
app.use('/api/admin', requireAdminCode);

// Receive one third-party asset file (emoji or avatar) into the data volume.
// Used by scripts/push-assets.js after a hosted deploy.
const ASSET_KINDS = new Set(['emojis', 'avatars']);
app.put('/api/admin/assets/:kind/:filename',
  express.raw({ type: '*/*', limit: '5mb' }),
  (req, res) => {
    const { kind, filename } = req.params;
    if (!ASSET_KINDS.has(kind) || !/^[\w.-]+\.(png|jpg|jpeg|gif|webp)$/i.test(filename)) {
      return res.status(400).json({ error: 'Bad asset path' });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'Empty body' });
    }
    const dir = path.join(DATA_DIR, 'assets', kind);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), req.body);
    res.json({ ok: true, bytes: req.body.length });
  }
);

app.get('/api/admin/assets', (req, res) => {
  const counts = {};
  for (const kind of ASSET_KINDS) {
    const dir = path.join(DATA_DIR, 'assets', kind);
    counts[kind] = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0;
  }
  res.json(counts);
});

// Lets the smoke test confirm passwords are never stored readable
app.get('/api/test/password-shape', (req, res) => {
  const user = db.getUserByUsername(String(req.query.username || ''));
  if (!user) return res.status(404).json({ error: 'no such user' });
  const stored = String(user.password || '');
  res.json({ hashed: stored.startsWith('scrypt$'), startsWith: stored.slice(0, 7), length: stored.length });
});

// Grant test Pokemon and items to a user
app.post('/api/test/grant-pokemon', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    let user = db.getUserByUsername(username);
    if (!user) {
      user = db.createUser(username);
    }

    // Grant some caught Pokemon (mix of common, uncommon, rare, and a shiny)
    const testPokemon = [
      { id: 25, name: 'Pikachu', shiny: false },      // Common favorite
      { id: 1, name: 'Bulbasaur', shiny: false },     // Starter
      { id: 4, name: 'Charmander', shiny: false },    // Starter
      { id: 7, name: 'Squirtle', shiny: false },      // Starter
      { id: 133, name: 'Eevee', shiny: false },       // Popular
      { id: 143, name: 'Snorlax', shiny: false },     // Rare
      { id: 149, name: 'Dragonite', shiny: false },   // Rare
      { id: 150, name: 'Mewtwo', shiny: false },      // Legendary
      { id: 6, name: 'Charizard', shiny: true },      // Shiny!
      { id: 151, name: 'Mew', shiny: true },          // Shiny Legendary!
    ];

    for (const poke of testPokemon) {
      db.catchPokemon(user.id, poke.id, poke.name, poke.shiny, 'meadow');
    }

    // Grant some balls
    db.updateBallInventory(user.id, 'great', 10);
    db.updateBallInventory(user.id, 'ultra', 5);
    db.updateBallInventory(user.id, 'master', 1);

    // Grant some stones
    db.updateStoneInventory(user.id, 'fire_stone', 2);
    db.updateStoneInventory(user.id, 'water_stone', 2);
    db.updateStoneInventory(user.id, 'thunder_stone', 2);
    db.updateStoneInventory(user.id, 'moon_stone', 1);

    // Grant XP to level up
    db.addXP(user.id, 500); // Should get to level 5+

    // Grant coins
    db.addCoins(user.id, 500);

    res.json({
      success: true,
      message: `Granted 10 Pokemon (2 shiny), balls, stones, 500 XP, and 500 coins to ${username}`,
      pokemon: testPokemon.map(p => `${p.name}${p.shiny ? ' ✨' : ''}`),
    });
  } catch (error) {
    console.error('Test grant error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger a Pokemon spawn for a user
app.post('/api/test/spawn', async (req, res) => {
  const { username, pokemonId, shiny, zone } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  // Find the user's socket
  let targetSocket = null;
  for (const [socketId, data] of connectedUsers.entries()) {
    if (data.username === username) {
      targetSocket = io.sockets.sockets.get(socketId);
      break;
    }
  }

  if (!targetSocket) {
    return res.status(404).json({ error: 'User not connected' });
  }

  const spawn = pokemon.adminSpawn(
    targetSocket.data.userId,
    zone || 'meadow',
    pokemonId || null,
    shiny || false
  );

  userSpawns.set(targetSocket.data.userId, spawn.odId);

  // Format spawn data for frontend
  const spawnData = {
    odId: spawn.odId,
    pokemonId: spawn.pokemon.id,
    pokemonName: spawn.pokemon.name,
    rarity: spawn.pokemon.rarity,
    isShiny: spawn.isShiny,
    zone: spawn.zone,
    sprite: pokemon.getSpriteUrl(spawn.pokemon.id, spawn.isShiny),
    animatedSprite: pokemon.getAnimatedSpriteUrl(spawn.pokemon.id, spawn.isShiny),
    expiresAt: spawn.expiresAt,
    catchWindow: pokemon.CATCH_WINDOW,
    quickCatchWindow: pokemon.QUICK_CATCH_WINDOW
  };

  targetSocket.emit('pokemon-spawn', spawnData);

  res.json({
    success: true,
    message: `Spawned ${spawnData.pokemonName}${spawnData.isShiny ? ' ✨' : ''} for ${username}`,
    spawn: spawnData
  });
});

// ============================================
// PUSH NOTIFICATION ROUTES
// ============================================

// Get VAPID public key for client subscription
app.get('/api/push/vapid-key', (req, res) => {
  const publicKey = push.getPublicVapidKey();
  if (!publicKey) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey });
});

// Subscribe to push notifications
app.post('/api/push/subscribe', (req, res) => {
  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).json({ error: 'userId and subscription required' });
  }

  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription format' });
  }

  try {
    const result = db.savePushSubscription(userId, subscription);
    console.log(`[Push] User ${userId} subscribed to push notifications`);
    res.json({ success: true, subscription: result });
  } catch (error) {
    console.error('[Push] Subscribe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from push notifications
app.delete('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint required' });
  }

  try {
    db.removePushSubscription(endpoint);
    console.log(`[Push] Subscription removed`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// XP REWARDS
// ============================================

const XP_REWARDS = {
  emoji: 1,
  question: 20,
  drawing: 15,
  upvote_received: 5,
  drink: 10,
  dm: 2
};

// ============================================
// SHOP ITEMS
// ============================================

const SHOP_ITEMS = {
  // Pokeballs
  great_ball_5: { price: 200, type: 'ball', ballType: 'great', quantity: 5, name: '5x Great Balls' },
  ultra_ball_3: { price: 350, type: 'ball', ballType: 'ultra', quantity: 3, name: '3x Ultra Balls' },
  master_ball: { price: 1000, type: 'ball', ballType: 'master', quantity: 1, name: 'Master Ball' },

  // Spawn effects
  incense: { price: 300, type: 'effect', effectType: 'incense', duration: 30 * 60 * 1000, name: 'Incense (30min)' },
  lure: { price: 250, type: 'effect', effectType: 'lure', uses: 5, name: 'Lure (5 catches)' },
  lucky_egg: { price: 200, type: 'effect', effectType: 'lucky_egg', duration: 30 * 60 * 1000, name: 'Lucky Egg (30min)' },

  // Evolution stones
  fire_stone: { price: 200, type: 'stone', stoneType: 'fire_stone', name: 'Fire Stone' },
  water_stone: { price: 200, type: 'stone', stoneType: 'water_stone', name: 'Water Stone' },
  thunder_stone: { price: 200, type: 'stone', stoneType: 'thunder_stone', name: 'Thunder Stone' },
  leaf_stone: { price: 200, type: 'stone', stoneType: 'leaf_stone', name: 'Leaf Stone' },
  moon_stone: { price: 200, type: 'stone', stoneType: 'moon_stone', name: 'Moon Stone' },
  sun_stone: { price: 250, type: 'stone', stoneType: 'sun_stone', name: 'Sun Stone' },
  dragon_scale: { price: 300, type: 'stone', stoneType: 'dragon_scale', name: 'Dragon Scale' },

  // Permanent upgrades
  shiny_charm: { price: 500, type: 'permanent', name: 'Shiny Charm' }
};

// ============================================
// STATE
// ============================================

const connectedUsers = new Map(); // socketId -> { username, odId, zone, trainerLevel }
const displaySockets = new Set();
const adminSockets = new Set();
const userSpawns = new Map(); // oderId -> current spawn odId
const catchAttempts = new Map(); // odId -> attempt count (max 3)

const MAX_CATCH_ATTEMPTS = 3;

let currentPresentation = null;

// Chat message currently shown on the Slides overlay, or null.
let displayedMessageId = null;

// One Popcorn Emergency at a time, in memory only.
const EMERGENCY_TTL_MS = 5 * 60 * 1000;
let activeEmergency = null;

// One poll at a time, in memory only. Results linger briefly after closing.
const POLL_LINGER_MS = 60 * 1000;
let activePoll = null;

// Awards ceremony currently on screen, so late joiners can see it too.
let activeAwards = null;

// ============================================
// HELPERS
// ============================================

function hideDisplayedQuestion() {
  if (displayedMessageId === null) return;
  displayedMessageId = null;
  emitToDisplay('hide-question');
  io.emit('display-question-changed', { messageId: null });
}

function socketIdForUsername(username) {
  for (const [socketId, data] of connectedUsers.entries()) {
    if (data.username === username) return socketId;
  }
  return null;
}

/** Every socket a user has open (phone plus a second tab counts). */
function socketIdsForUsername(username) {
  const ids = [];
  for (const [socketId, data] of connectedUsers.entries()) {
    if (data.username === username) ids.push(socketId);
  }
  return ids;
}

function emitToUser(username, event, payload) {
  socketIdsForUsername(username).forEach(sid => io.to(sid).emit(event, payload));
}

const TEMP_WORDS = ['sunny', 'fuzzy', 'sleepy', 'zesty', 'lucky', 'jolly', 'mighty', 'sparkly',
  'otter', 'panda', 'mango', 'taco', 'pickle', 'waffle', 'comet', 'dino'];
function generateTempPassword() {
  const pick = () => TEMP_WORDS[Math.floor(Math.random() * TEMP_WORDS.length)];
  return `${pick()}-${pick()}-${Math.floor(10 + Math.random() * 90)}`;
}

// Emoji spam guard: a small bucket per socket, refilled steadily. Excess taps
// are dropped without XP or a blast.
const EMOJI_BURST = 5;
const EMOJI_REFILL_MS = 400;
function takeEmojiToken(socket) {
  const now = Date.now();
  const bucket = socket.data.emojiBucket || { tokens: EMOJI_BURST, last: now };
  bucket.tokens = Math.min(EMOJI_BURST, bucket.tokens + (now - bucket.last) / EMOJI_REFILL_MS);
  bucket.last = now;
  socket.data.emojiBucket = bucket;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

function emergencyPublicState() {
  if (!activeEmergency) return null;
  return {
    id: activeEmergency.id,
    hostUsername: activeEmergency.hostUsername,
    isAll: activeEmergency.isAll,
    invitees: activeEmergency.invitees.map(username => ({
      username,
      status: activeEmergency.responses[username] || 'pending'
    })),
    createdAt: activeEmergency.createdAt,
    expiresAt: activeEmergency.createdAt + EMERGENCY_TTL_MS
  };
}

/** Where phones should point their browser, as seen from this connection. */
function publicUrlFor(headers) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = (headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = headers['x-forwarded-host'] || headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function pollPublicState() {
  if (!activePoll) return null;
  const counts = activePoll.options.map(() => 0);
  activePoll.votes.forEach(index => { counts[index] += 1; });
  return {
    id: activePoll.id,
    question: activePoll.question,
    options: activePoll.options.map((text, i) => ({ text, count: counts[i] })),
    total: activePoll.votes.size,
    closed: activePoll.closed,
    by: activePoll.by,
    createdAt: activePoll.createdAt
  };
}

function broadcastPoll() {
  const state = pollPublicState();
  io.emit('poll-state', state);
}

function clearPoll() {
  if (!activePoll) return;
  clearTimeout(activePoll.lingerTimer);
  activePoll = null;
  io.emit('poll-state', null);
}

const AWARD_DEFS = [
  { key: 'reactions', icon: '🔥', title: 'Hype Machine', label: 'reactions' },
  { key: 'catches', icon: '⚾', title: 'Top Catcher', label: 'Pokémon caught' },
  { key: 'shiny', icon: '✨', title: 'Shiny of the Night', label: null },
  { key: 'question', icon: '❓', title: 'Best Question', label: 'upvotes' },
  { key: 'chatter', icon: '💬', title: 'Chatterbox', label: 'messages' },
  { key: 'kudos', icon: '💖', title: 'Most Loved', label: 'kudos received' },
  { key: 'drinks', icon: '🍺', title: 'Last One Standing', label: 'drinks' }
];

function buildAwards() {
  if (!currentPresentation) return [];
  const rows = db.getNightAwards(currentPresentation.id, currentPresentation.started_at);
  return AWARD_DEFS
    .map(def => {
      const row = rows[def.key];
      if (!row) return null;
      return {
        key: def.key,
        icon: def.icon,
        title: def.title,
        username: row.username,
        profilePic: row.profile_pic || '👤',
        value: row.value ?? null,
        label: def.label,
        detail: row.detail || null,
        pokemonId: row.pokemon_id || null,
        sprite: row.pokemon_id ? pokemon.getSpriteUrl(row.pokemon_id, def.key === 'shiny') : null
      };
    })
    .filter(Boolean);
}

function endEmergency(reason = 'ended') {
  if (!activeEmergency) return;
  const { hostSocketId, invitees, isAll, timer } = activeEmergency;
  clearTimeout(timer);
  activeEmergency = null;

  io.to(hostSocketId).emit('popcorn-emergency-ended', { reason });
  invitees.forEach(username => emitToUser(username, 'popcorn-emergency-ended', { reason }));
  if (isAll) emitToDisplay('popcorn-emergency-end');
  console.log(`[Popcorn] Emergency ${reason}`);
}

function getOnlineCount() {
  return connectedUsers.size;
}

function getOnlineUsers() {
  const users = [];
  connectedUsers.forEach((data, socketId) => {
    // Get full user data from database
    const dbUser = data.odId ? db.getUserById(data.odId) : null;
    users.push({
      odName: data.username,
      odTitle: dbUser?.title || 'Newcomer',
      odProfilePic: dbUser?.profile_pic || '👤',
      zone: data.zone,
      level: data.trainerLevel,
      online: true
    });
  });
  return users;
}

function broadcastUserCount() {
  io.emit('user-count', getOnlineCount());
}

function broadcastUserList() {
  const users = getOnlineUsers();
  io.emit('online-users', users);
  adminSockets.forEach(socketId => {
    io.to(socketId).emit('online-users', users);
  });
}

function broadcastLeaderboards() {
  io.emit('leaderboards', db.getLeaderboards(10));
}

function emitToDisplay(event, data) {
  displaySockets.forEach(socketId => {
    io.to(socketId).emit(event, data);
  });
}

function emitToAdmin(event, data) {
  adminSockets.forEach(socketId => {
    io.to(socketId).emit(event, data);
  });
}

function getUserStats(userId) {
  if (!currentPresentation) return { reactions: 0, questions: 0, drinks: 0 };
  return db.getStats(userId, currentPresentation.id) || { reactions: 0, questions: 0, drinks: 0 };
}

/**
 * Add XP to user and handle level-up
 */
function addUserXP(socket, userId, amount) {
  // Check for lucky egg (2x XP)
  if (db.hasActiveEffect(userId, 'lucky_egg')) {
    amount *= 2;
  }

  const result = db.addXP(userId, amount);
  if (!result) return null;

  // Emit XP gain
  socket.emit('xp-gained', {
    amount,
    newXP: result.newXP,
    level: result.newLevel,
    currentLevelXP: db.LEVEL_THRESHOLDS[result.newLevel - 1] || 0,
    nextLevelXP: db.getXPForNextLevel(result.newLevel)
  });

  // Handle level up
  if (result.leveledUp) {
    socket.emit('level-up', {
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      newZonesUnlocked: result.newZonesUnlocked
    });

    // Broadcast to feed
    io.emit('feed-event', {
      type: 'level-up',
      username: socket.data.username,
      level: result.newLevel,
      timestamp: Date.now()
    });

    emitToDisplay('level-up', {
      username: socket.data.username,
      level: result.newLevel
    });

    // Broadcast updated leaderboards
    broadcastLeaderboards();

    console.log(`[Level Up] ${socket.data.username} reached level ${result.newLevel}!`);
  }

  return result;
}

/**
 * Send full trainer stats to a socket
 */
function sendTrainerStats(socket, user) {
  const totals = db.getUserTotals(user.id) || { reactions: 0, questions: 0, drinks: 0 };
  const pokemonCount = db.getPokemonCount(user.id);
  const uniquePokemon = db.getUniquePokemonCount(user.id);
  const shinyCount = db.getShinyCount(user.id);
  const ballInventory = db.getBallInventory(user.id);
  const stoneInventory = db.getStoneInventory(user.id);
  const activeEffects = db.getActiveEffects(user.id);
  const unlockedZones = db.getUnlockedZones(user.trainer_level);

  socket.emit('trainer-stats', {
    // Basic stats (all-time), plus this session's drinks
    ...totals,
    drinksTonight: getUserStats(user.id).drinks || 0,
    id: user.id,
    username: user.username,
    coins: user.coins,
    title: user.title,

    // Trainer leveling (matching frontend expectations)
    level: user.trainer_level,
    xp: user.trainer_xp,
    xpForCurrentLevel: db.LEVEL_THRESHOLDS[user.trainer_level - 1] || 0,
    xpForNextLevel: db.getXPForNextLevel(user.trainer_level),

    // Zone
    currentZone: user.current_zone,
    unlockedZones,

    // Pokemon stats (matching frontend expectations)
    totalCaught: pokemonCount,
    uniqueCaught: uniquePokemon,
    shinyCaught: shinyCount,
    shinyCharm: user.shiny_charm === 1,

    // Inventory
    balls: {
      pokeball: Infinity,
      great: ballInventory.great_balls,
      ultra: ballInventory.ultra_balls,
      master: ballInventory.master_balls
    },
    stones: {
      fire_stone: stoneInventory.fire_stone,
      water_stone: stoneInventory.water_stone,
      thunder_stone: stoneInventory.thunder_stone,
      leaf_stone: stoneInventory.leaf_stone,
      moon_stone: stoneInventory.moon_stone,
      sun_stone: stoneInventory.sun_stone,
      dragon_scale: stoneInventory.dragon_scale
    },
    activeEffects: activeEffects.map(e => ({
      type: e.effect_type,
      expiresAt: e.expires_at,
      usesRemaining: e.uses_remaining
    })),

    // Profile
    profilePic: user.profile_pic || null,
    status: user.status || '',
    nameColor: user.name_color || '#ec4899'
  });
}

/**
 * Full achievement catalogue plus this user's unlocks and progress counters.
 */
function sendAchievements(socket, userId) {
  const stats = db.getUserTotals(userId) || { reactions: 0, questions: 0, drinks: 0 };
  const pokemonCount = db.getPokemonCount(userId);
  const unlockedRows = db.getUserAchievements(userId);
  socket.emit('achievements-list', {
    achievements: achievements.getAllAchievements(),
    unlocked: unlockedRows.map(r => ({ id: r.achievement_id, unlockedAt: r.unlocked_at })),
    progress: achievements.getProgress(stats, pokemonCount)
  });
}

/**
 * Everything this user has caught, in the shape the phone's Pokedex reads.
 */
function sendPokedex(socket, userId) {
  const caught = db.getUserPokemon(userId).map(p => ({
    odId: String(p.id),
    odPokemonId: p.pokemon_id,
    odName: p.pokemon_name,
    odIsShiny: p.is_shiny === 1,
    odZone: p.zone,
    odCaughtAt: p.caught_at,
    odSpriteUrl: pokemon.getSpriteUrl(p.pokemon_id, p.is_shiny === 1)
  }));
  socket.emit('pokedex-data', caught);
  sendEvolvable(socket, userId);
}

/**
 * Which of this user's Pokemon can evolve right now, and how. Sent with the
 * pokedex so the Evolve panel never goes stale.
 */
function sendEvolvable(socket, userId) {
  const user = db.getUserById(userId);
  if (!user) return;
  const stones = db.getStoneInventory(userId);
  const uniqueIds = [...new Set(db.getUserPokemon(userId).map(p => p.pokemon_id))];

  const evolvable = [];
  for (const pokemonId of uniqueIds) {
    const options = pokemon.getAvailableEvolutions(pokemonId, user.trainer_level, stones);
    if (options.length === 0) continue;
    const data = pokemon.getPokemonData(pokemonId);
    evolvable.push({
      pokemonId,
      name: data ? data.name : `#${pokemonId}`,
      sprite: pokemon.getSpriteUrl(pokemonId, false),
      options: options.map(o => ({
        method: o.type,
        stone: o.stone || null,
        toId: o.to,
        toName: o.name,
        toSprite: pokemon.getSpriteUrl(o.to, false),
        requirement: o.requirement
      }))
    });
  }
  socket.emit('evolvable-data', evolvable);
}

function checkAndEmitAchievements(socket, userId, context = {}) {
  const stats = db.getUserTotals(userId) || { reactions: 0, questions: 0, drinks: 0 };
  const pokemonCount = db.getPokemonCount(userId);

  const unlocked = achievements.checkAchievements(db, userId, stats, {
    ...context,
    pokemonCount
  });

  if (unlocked.length > 0) {
    // Unlocks pay coins and can change the title, so refresh the whole card.
    const refreshed = db.getUserById(userId);
    if (refreshed) sendTrainerStats(socket, refreshed);
    sendAchievements(socket, userId);
  }

  unlocked.forEach(achievement => {
    socket.emit('achievement-unlocked', {
      username: socket.data.username,
      achievement: achievement.name,
      icon: achievement.icon,
      reward: achievement.reward
    });

    io.emit('feed-event', {
      type: 'achievement',
      username: socket.data.username,
      achievement: achievement.name,
      icon: achievement.icon,
      timestamp: Date.now()
    });

    emitToDisplay('achievement-unlocked', {
      username: socket.data.username,
      achievement: achievement.name,
      icon: achievement.icon
    });
  });
}

/**
 * Create per-user Pokemon spawn
 */
function createSpawnForSocket(socket) {
  const userId = socket.data.userId;
  const user = db.getUserById(userId);
  if (!user) return null;

  const hasShinyCharm = user.shiny_charm === 1;
  const zone = user.current_zone || 'meadow';

  const spawn = pokemon.createSpawnForUser(userId, zone, hasShinyCharm);
  if (!spawn) return null;

  userSpawns.set(userId, spawn.odId);

  return spawn;
}

/**
 * Send a spawn to its owner's phone, and a push in case the phone is in a pocket.
 */
function emitSpawn(socket, spawn) {
  socket.emit('pokemon-spawn', {
    odId: spawn.odId,
    pokemonId: spawn.pokemon.id,
    pokemonName: spawn.pokemon.name,
    rarity: spawn.pokemon.rarity,
    isShiny: spawn.isShiny,
    zone: spawn.zone,
    sprite: pokemon.getSpriteUrl(spawn.pokemon.id, spawn.isShiny),
    animatedSprite: pokemon.getAnimatedSpriteUrl(spawn.pokemon.id, spawn.isShiny),
    expiresAt: spawn.expiresAt,
    catchWindow: pokemon.CATCH_WINDOW,
    quickCatchWindow: pokemon.QUICK_CATCH_WINDOW
  });

  push.sendNotification(socket.data.userId, {
    title: `A wild ${spawn.isShiny ? 'SHINY ' : ''}${spawn.pokemon.name} appeared!`,
    body: `${Math.round(pokemon.CATCH_WINDOW / 1000)} seconds to catch it`,
    tag: 'pokemon-spawn',
    url: '/'
  });

  console.log(`[Pokemon] ${spawn.pokemon.name} spawned for ${socket.data.username} in ${spawn.zone}${spawn.isShiny ? ' (SHINY!)' : ''}`);
}

/**
 * Trigger global spawn - creates per-user spawns for all connected users
 */
function triggerGlobalSpawn() {
  console.log('[Pokemon] Global spawn triggered!');

  connectedUsers.forEach((data, socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket || !socket.data.userId) return;

    const spawn = createSpawnForSocket(socket);
    if (spawn) emitSpawn(socket, spawn);
  });

  // Notify display
  emitToDisplay('pokemon-spawn-wave', { count: connectedUsers.size });
}

/**
 * Incense: an extra personal spawn every couple of minutes while it burns.
 * Runs on its own timer so it is independent of the global wave.
 */
const INCENSE_INTERVAL_MS = 2 * 60 * 1000;
function triggerIncenseSpawns() {
  connectedUsers.forEach((data, socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket || !socket.data.userId) return;
    if (userSpawns.has(socket.data.userId)) return;
    if (!db.hasActiveEffect(socket.data.userId, 'incense')) return;

    const spawn = createSpawnForSocket(socket);
    if (spawn) emitSpawn(socket, spawn);
  });
}

// ============================================
// SOCKET.IO HANDLERS
// ============================================

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.emit('user-count', getOnlineCount());

  // ----------------------------------------
  // JOIN HANDLERS
  // ----------------------------------------

  socket.on('join', ({ username, password }) => {
    if (!username || username.length > 16) {
      socket.emit('error', { message: 'Invalid username' });
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = (password || '').trim();

    // Check if user exists
    const existingUser = db.getUserByUsername(trimmedUsername);

    let user;
    if (existingUser) {
      // User exists - verify password
      const result = db.verifyPassword(trimmedUsername, trimmedPassword);
      if (!result.valid) {
        socket.emit('join-error', { message: 'Wrong password', code: 'WRONG_PASSWORD' });
        return;
      }
      user = result.user;
    } else {
      // New user - create with password
      if (!trimmedPassword) {
        socket.emit('join-error', { message: 'Please set a password', code: 'PASSWORD_REQUIRED' });
        return;
      }
      user = db.createUser(trimmedUsername, trimmedPassword);
    }

    socket.data.userId = user.id;
    socket.data.username = user.username;
    socket.data.nameColor = user.name_color || '#ec4899';

    connectedUsers.set(socket.id, {
      username: user.username,
      odId: user.id,
      zone: user.current_zone || 'meadow',
      trainerLevel: user.trainer_level || 1,
      nameColor: user.name_color || '#ec4899'
    });

    if (currentPresentation) {
      db.ensureStats(user.id, currentPresentation.id);
    }

    // Check early bird achievement
    if (getOnlineCount() <= 5) {
      checkAndEmitAchievements(socket, user.id, { isEarlyBird: true });
    }

    // Send full trainer stats
    sendTrainerStats(socket, user);
    sendPokedex(socket, user.id);
    sendAchievements(socket, user.id);

    // Send existing questions (legacy - presentation-based)
    if (currentPresentation) {
      const questions = db.getQuestions(currentPresentation.id);
      socket.emit('questions-sync', questions);
    }

    // Send persistent chat messages
    const chatMessages = db.getChatMessages(100);
    socket.emit('chat-sync', chatMessages);

    // Send question queue
    const queueMessages = db.getQueueMessages();
    socket.emit('queue-sync', queueMessages);

    // Send zone data
    socket.emit('zones-data', {
      zones: pokemon.ZONES,
      requirements: pokemon.ZONE_REQUIREMENTS
    });

    // Send shop items
    socket.emit('shop-items', SHOP_ITEMS);

    // Send leaderboards
    socket.emit('leaderboards', db.getLeaderboards(10));

    // Send DM history
    const dmHistory = db.getUserDMs(user.id, 200);
    const formattedDMs = dmHistory.map(dm => ({
      odId: dm.id.toString(),
      odFromId: dm.from_user_id,
      odFromName: dm.from_username,
      odToId: dm.to_user_id,
      odToName: dm.to_username,
      odContent: dm.content || '',
      odImageData: dm.image_data || null,
      odRead: dm.read === 1,
      odCreatedAt: dm.created_at
    })).reverse(); // Reverse to get chronological order
    socket.emit('dm-history', formattedDMs);

    // Send unread DM count
    const unreadCount = db.getUnreadDMCount(user.id);
    socket.emit('unread-dm-count', unreadCount);

    // What the Slides overlay is showing right now
    socket.emit('display-question-changed', { messageId: displayedMessageId });

    // Poll and awards in progress
    if (activePoll) {
      socket.emit('poll-state', pollPublicState());
      const mine = activePoll.votes.get(user.username);
      if (mine !== undefined) socket.emit('poll-my-vote', { pollId: activePoll.id, option: mine });
    }
    if (activeAwards) socket.emit('awards-ceremony', activeAwards);

    // Re-attach to an in-flight Popcorn Emergency after a reconnect
    if (activeEmergency) {
      if (activeEmergency.hostUsername === user.username) {
        activeEmergency.hostSocketId = socket.id;
        socket.emit('popcorn-emergency-status', emergencyPublicState());
      } else if (activeEmergency.invitees.includes(user.username)
        && (activeEmergency.responses[user.username] || 'pending') === 'pending') {
        socket.emit('popcorn-emergency-invite', {
          emergencyId: activeEmergency.id,
          hostUsername: activeEmergency.hostUsername,
          invitees: activeEmergency.invitees,
          expiresAt: activeEmergency.createdAt + EMERGENCY_TTL_MS
        });
      }
    }

    broadcastUserCount();
    broadcastUserList();

    console.log(`[User] ${trimmedUsername} joined (Level ${user.trainer_level}, Zone: ${user.current_zone})`);
  });

  // Forgot password: passwords are hashed, so the host (who knows the party code,
  // and is in the room) resets it to a fresh one that is shown on screen.
  socket.on('forgot-password', ({ username, adminCode } = {}) => {
    if (!username) {
      socket.emit('forgot-password-result', { success: false, message: 'Please enter your username' });
      return;
    }
    if (adminCode !== ADMIN_CODE) {
      socket.emit('forgot-password-result', { success: false, message: 'Wrong party code. Ask the host.' });
      return;
    }

    const user = db.getUserByUsername(username.trim());
    if (!user) {
      socket.emit('forgot-password-result', { success: false, message: 'Username not found' });
      return;
    }

    const newPassword = generateTempPassword();
    db.setPassword(user.username, newPassword);
    console.log(`[Auth] Password reset for ${user.username}`);
    socket.emit('forgot-password-result', {
      success: true,
      password: newPassword,
      message: `Password reset. Your new password is: ${newPassword}`
    });
  });

  socket.on('join-display', async () => {
    displaySockets.add(socket.id);
    socket.emit('user-count', getOnlineCount());
    console.log('[Display] Connected');

    // Join card: where to go and a QR for it
    const joinUrl = publicUrlFor(socket.handshake.headers);
    try {
      const qrSvg = await QRCode.toString(joinUrl, { type: 'svg', margin: 1, color: { dark: '#1f2937', light: '#ffffff' } });
      socket.emit('display-welcome', { joinUrl, qrSvg, onlineCount: getOnlineCount() });
    } catch (err) {
      socket.emit('display-welcome', { joinUrl, qrSvg: null, onlineCount: getOnlineCount() });
    }

    // Catch the display up on anything in flight
    if (displayedMessageId !== null) {
      const message = db.getChatMessage(displayedMessageId);
      if (message) {
        socket.emit('show-question', {
          id: message.id, username: message.username, text: message.text,
          drawing: message.drawing, type: message.type, votes: message.votes
        });
      }
    }
    if (activePoll) socket.emit('poll-state', pollPublicState());
    if (activeAwards) socket.emit('awards-ceremony', activeAwards);
    if (activeEmergency && activeEmergency.isAll) {
      socket.emit('popcorn-emergency-start', {
        hostUsername: activeEmergency.hostUsername,
        invitees: activeEmergency.invitees.map(username => ({ username }))
      });
      activeEmergency.invitees.forEach(username => {
        const status = activeEmergency.responses[username];
        if (status) socket.emit('popcorn-emergency-response', { username, status });
      });
    }
  });

  socket.on('join-admin', ({ adminCode }) => {
    if (adminCode === ADMIN_CODE) {
      adminSockets.add(socket.id);
      socket.emit('online-users', getOnlineUsers());

      if (currentPresentation) {
        const questions = db.getQuestions(currentPresentation.id);
        socket.emit('questions-sync', questions);
      }

      socket.emit('stats-sync', {
        reactions: 0,
        questions: currentPresentation ? db.getQuestions(currentPresentation.id).length : 0,
        pokemon: 0,
        achievements: 0,
        drinks: currentPresentation ? db.getTotalDrinks(currentPresentation.id) : 0
      });

      console.log('[Admin] Connected');
    }
  });

  socket.on('get-user-count', () => {
    socket.emit('user-count', getOnlineCount());
  });

  socket.on('get-leaderboards', () => {
    socket.emit('leaderboards', db.getLeaderboards(10));
  });

  // ----------------------------------------
  // ZONE MANAGEMENT
  // ----------------------------------------

  socket.on('change-zone', ({ zone }) => {
    if (!socket.data.userId) return;

    const success = db.setZone(socket.data.userId, zone);
    if (success) {
      // Update connected users map
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        userData.zone = zone;
      }

      socket.emit('zone-changed', {
        zone,
        zoneName: pokemon.ZONES[zone]?.name || zone
      });

      console.log(`[Zone] ${socket.data.username} moved to ${zone}`);
    } else {
      socket.emit('zone-change-failed', { message: 'Zone not unlocked' });
    }
  });

  // ----------------------------------------
  // PROFILE UPDATES
  // ----------------------------------------

  socket.on('update-profile', (updates) => {
    if (!socket.data.userId) return;

    // Map frontend field names to database field names
    const dbUpdates = {};
    if (updates.profilePic !== undefined) dbUpdates.profile_pic = updates.profilePic;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.nameColor !== undefined) dbUpdates.name_color = updates.nameColor;

    const success = db.updateProfile(socket.data.userId, dbUpdates);
    if (success) {
      // Update socket.data if nameColor changed
      if (updates.nameColor) {
        socket.data.nameColor = updates.nameColor;
        // Also update connectedUsers
        const userData = connectedUsers.get(socket.id);
        if (userData) {
          userData.nameColor = updates.nameColor;
        }
      }
      socket.emit('profile-updated', updates);
      console.log(`[Profile] ${socket.data.username} updated profile:`, Object.keys(updates).join(', '));
    }
  });

  // ----------------------------------------
  // EMOJI REACTIONS
  // ----------------------------------------

  socket.on('send-emoji', ({ emoji }) => {
    if (!socket.data.userId) return;
    if (!takeEmojiToken(socket)) return;
    console.log(`[Emoji] ${socket.data.username} sent: ${emoji}`);

    if (currentPresentation) {
      db.incrementReactions(socket.data.userId, currentPresentation.id);
    }

    // Add XP
    addUserXP(socket, socket.data.userId, XP_REWARDS.emoji);

    // Broadcast to all clients including display (io.emit covers everyone)
    io.emit('emoji-blast', {
      emoji,
      username: socket.data.username,
      userColor: socket.data.nameColor || '#ec4899'
    });
    // Note: No separate emitToDisplay needed - io.emit already reaches display sockets

    checkAndEmitAchievements(socket, socket.data.userId);
  });

  // ----------------------------------------
  // QUESTIONS
  // ----------------------------------------

  socket.on('send-question', ({ text, drawing, type }) => {
    if (!socket.data.userId || !currentPresentation) return;
    if (!text && !drawing) return;

    // Determine the question type
    const questionType = type || (drawing ? 'drawing' : 'text');

    const question = db.createQuestion(
      socket.data.userId,
      currentPresentation.id,
      text || null,
      drawing || null,
      questionType
    );

    db.incrementQuestions(socket.data.userId, currentPresentation.id);

    // Add XP (more for drawings/images)
    const xp = drawing ? XP_REWARDS.drawing : XP_REWARDS.question;
    addUserXP(socket, socket.data.userId, xp);

    const fullQuestion = {
      ...question,
      username: socket.data.username
    };

    io.emit('question-added', fullQuestion);
    emitToAdmin('question-added', fullQuestion);

    checkAndEmitAchievements(socket, socket.data.userId, {
      isDrawing: questionType === 'drawing'
    });

    if (drawing && questionType === 'drawing') {
      emitToDisplay('drawing-blast', {
        username: socket.data.username,
        text,
        drawing
      });
    }
  });

  socket.on('upvote-question', ({ questionId }) => {
    if (!socket.data.userId) return;

    const success = db.upvoteQuestion(questionId, socket.data.userId);
    if (success) {
      const question = db.getQuestion(questionId);
      if (question) {
        io.emit('question-upvoted', {
          questionId,
          votes: question.votes
        });

        emitToDisplay('question-upvoted', {
          questionId,
          votes: question.votes
        });

        // Give XP to question author
        if (question.user_id !== socket.data.userId) {
          const authorEntry = [...connectedUsers.entries()]
            .find(([_, data]) => data.odId === question.user_id);
          if (authorEntry) {
            const [authorSocketId] = authorEntry;
            const authorSocket = io.sockets.sockets.get(authorSocketId);
            if (authorSocket) {
              addUserXP(authorSocket, question.user_id, XP_REWARDS.upvote_received);
              checkAndEmitAchievements(authorSocket, question.user_id, {
                questionVotes: question.votes
              });
            }
          }
        }
      }
    }
  });

  // ----------------------------------------
  // PERSISTENT CHAT (not tied to presentations)
  // ----------------------------------------

  socket.on('send-chat', ({ text, drawing, type }) => {
    if (!socket.data.userId) return;
    if (!text && !drawing) return;

    const messageType = type || (drawing ? 'drawing' : 'text');

    const message = db.createChatMessage(
      socket.data.userId,
      text || null,
      drawing || null,
      messageType,
      false // not in queue
    );

    // Add XP
    const xp = drawing ? XP_REWARDS.drawing : XP_REWARDS.question;
    addUserXP(socket, socket.data.userId, xp);

    const fullMessage = {
      ...message,
      username: socket.data.username
    };

    io.emit('chat-message-added', fullMessage);

    checkAndEmitAchievements(socket, socket.data.userId, {
      isDrawing: messageType === 'drawing'
    });

    // Doodles and photos both pop onto the big screen
    if (drawing && (messageType === 'drawing' || messageType === 'image')) {
      emitToDisplay('drawing-blast', {
        username: socket.data.username,
        text,
        drawing,
        type: messageType
      });
    }
  });

  socket.on('send-to-queue', ({ text, drawing, type }) => {
    if (!socket.data.userId) return;
    if (!text && !drawing) return;

    const messageType = type || (drawing ? 'drawing' : 'text');

    const message = db.createChatMessage(
      socket.data.userId,
      text || null,
      drawing || null,
      messageType,
      true // in queue
    );

    // Add XP
    const xp = drawing ? XP_REWARDS.drawing : XP_REWARDS.question;
    addUserXP(socket, socket.data.userId, xp);

    const fullMessage = {
      ...message,
      username: socket.data.username
    };

    // Send to chat (visible to everyone)
    io.emit('chat-message-added', fullMessage);

    // Also notify about queue update
    io.emit('queue-item-added', fullMessage);

    checkAndEmitAchievements(socket, socket.data.userId, {
      isDrawing: messageType === 'drawing'
    });
  });

  socket.on('upvote-chat', ({ messageId }) => {
    if (!socket.data.userId) return;

    const success = db.upvoteChatMessage(messageId, socket.data.userId);
    if (success) {
      const message = db.getChatMessage(messageId);
      if (message) {
        io.emit('chat-upvoted', {
          messageId,
          votes: message.votes
        });

        // Give XP to message author
        if (message.user_id !== socket.data.userId) {
          const authorEntry = [...connectedUsers.entries()]
            .find(([_, data]) => data.odId === message.user_id);
          if (authorEntry) {
            const [authorSocketId] = authorEntry;
            const authorSocket = io.sockets.sockets.get(authorSocketId);
            if (authorSocket) {
              addUserXP(authorSocket, message.user_id, XP_REWARDS.upvote_received);
            }
          }
        }
      }
    }
  });

  // ----------------------------------------
  // QUESTION QUEUE MANAGEMENT
  // ----------------------------------------

  socket.on('dismiss-from-queue', ({ messageId }) => {
    if (!socket.data.userId) return;

    db.dismissFromQueue(messageId);
    io.emit('queue-item-dismissed', { messageId });
    if (displayedMessageId !== null && String(displayedMessageId) === String(messageId)) {
      hideDisplayedQuestion();
    }
  });

  socket.on('clear-queue', () => {
    if (!socket.data.userId) return;

    db.clearQueue();
    io.emit('queue-cleared');
    hideDisplayedQuestion();
  });

  socket.on('show-on-display', ({ messageId }) => {
    if (!socket.data.userId) return;

    const message = db.getChatMessage(messageId);
    if (!message) return;

    displayedMessageId = message.id;
    emitToDisplay('show-question', {
      id: message.id,
      username: message.username,
      text: message.text,
      drawing: message.drawing,
      type: message.type,
      votes: message.votes
    });
    io.emit('display-question-changed', { messageId: message.id });
  });

  socket.on('hide-from-display', () => {
    if (!socket.data.userId) return;
    hideDisplayedQuestion();
  });

  // ----------------------------------------
  // USER PROFILES
  // ----------------------------------------

  socket.on('get-user-profile', ({ username }) => {
    if (!socket.data.userId || !username) return;

    const user = db.getUserByUsername(String(username).trim());
    if (!user) {
      socket.emit('user-profile', { username, notFound: true });
      return;
    }

    const totals = db.getUserTotals(user.id) || { drinks: 0 };
    const recentPokemon = db.getUserPokemon(user.id).slice(0, 5).map(p => ({
      pokemonId: p.pokemon_id,
      name: p.pokemon_name,
      isShiny: p.is_shiny === 1,
      caughtAt: p.caught_at,
      sprite: pokemon.getSpriteUrl(p.pokemon_id, p.is_shiny === 1)
    }));

    socket.emit('user-profile', {
      username: user.username,
      profilePic: user.profile_pic || '👤',
      title: user.title || '',
      status: user.status || '',
      nameColor: user.name_color || '#ec4899',
      level: user.trainer_level || 1,
      coins: user.coins || 0,
      pokemonCaught: db.getPokemonCount(user.id),
      shinyCaught: db.getShinyCount(user.id),
      achievements: db.getUserAchievements(user.id).length,
      drinkCount: totals.drinks || 0,
      kudosReceived: db.getKudosReceived(user.id),
      joinedAt: user.created_at,
      online: [...connectedUsers.values()].some(u => u.username === user.username),
      recentPokemon
    });
  });

  // ----------------------------------------
  // DIRECT MESSAGES
  // ----------------------------------------

  socket.on('send-dm', ({ toUsername, content, drawing }) => {
    if (!socket.data.userId) return;
    if (!content && !drawing) return;

    // Look up recipient user in database
    const recipientUser = db.getUserByUsername(toUsername);
    if (!recipientUser) return; // Recipient doesn't exist

    // Save DM to database
    const savedDM = db.saveDM(socket.data.userId, recipientUser.id, content || '', drawing || null);
    if (!savedDM) return;

    const dmData = {
      odId: savedDM.id.toString(),
      odFromId: socket.data.userId,
      odFromName: socket.data.username,
      odToId: recipientUser.id,
      odToName: toUsername,
      odContent: content || '',
      odImageData: drawing || null,
      odRead: false,
      odCreatedAt: savedDM.created_at
    };

    // Every device the recipient has open gets it live
    emitToUser(recipientUser.username, 'dm-received', dmData);

    // Push notification to the recipient whether or not they are online. Online
    // phones that are backgrounded only hear about it this way.
    const notifBody = drawing ? `${socket.data.username} sent you a drawing` : content;
    push.sendNotification(recipientUser.id, {
      title: `DM from ${socket.data.username}`,
      body: notifBody.length > 100 ? notifBody.slice(0, 97) + '...' : notifBody,
      tag: `dm-${socket.data.username}`,
      url: '/'
    });

    // Also send back to sender so they see their own message
    socket.emit('dm-received', dmData);

    // Add XP
    addUserXP(socket, socket.data.userId, XP_REWARDS.dm);
    checkAndEmitAchievements(socket, socket.data.userId, { isDM: true });
  });

  // Mark DMs as read
  socket.on('mark-dms-read', ({ fromUsername }) => {
    if (!socket.data.userId) return;

    const fromUser = db.getUserByUsername(fromUsername);
    if (!fromUser) return;

    db.markDMsAsRead(socket.data.userId, fromUser.id);
  });

  // ----------------------------------------
  // DRINKS
  // ----------------------------------------

  socket.on('log-drink', () => {
    if (!socket.data.userId || !currentPresentation) return;

    db.incrementDrinks(socket.data.userId, currentPresentation.id);

    // Add XP
    addUserXP(socket, socket.data.userId, XP_REWARDS.drink);

    const stats = getUserStats(socket.data.userId);
    const userTotals = db.getUserTotals(socket.data.userId);
    const totalDrinks = db.getTotalDrinks(currentPresentation.id);

    // Send to the user who logged the drink with their personal stats
    socket.emit('drink-logged', {
      tonight: stats.drinks,
      total: userTotals?.drinks || stats.drinks
    });

    // Broadcast to everyone for the display/feed
    io.emit('drink-logged-broadcast', {
      username: socket.data.username,
      count: stats.drinks,
      totalDrinks
    });

    emitToDisplay('drink-logged', {
      username: socket.data.username,
      count: stats.drinks,
      totalDrinks
    });

    checkAndEmitAchievements(socket, socket.data.userId);
  });

  socket.on('unlog-drink', () => {
    if (!socket.data.userId || !currentPresentation) return;

    db.decrementDrinks(socket.data.userId, currentPresentation.id);

    const stats = getUserStats(socket.data.userId);
    const userTotals = db.getUserTotals(socket.data.userId);

    // Send updated stats to the user
    socket.emit('drink-logged', {
      tonight: stats.drinks,
      total: userTotals?.drinks || stats.drinks
    });
  });

  // ----------------------------------------
  // KUDOS
  // ----------------------------------------

  socket.on('send-kudos', ({ toUsername, message }) => {
    if (!socket.data.userId) return;

    const fromUserId = socket.data.userId;
    const fromUsername = socket.data.username;

    // Find recipient
    const toUser = db.getUserByUsername(toUsername);
    if (!toUser) {
      socket.emit('kudos-error', { message: 'User not found' });
      return;
    }

    // Attempt to send kudos (checks cooldown internally)
    const result = db.sendKudos(fromUserId, toUser.id, message || '');

    if (!result.success) {
      if (result.reason === 'cooldown') {
        socket.emit('kudos-error', { message: 'You can only send kudos to the same person once per hour' });
      } else if (result.reason === 'self') {
        socket.emit('kudos-error', { message: "You can't send kudos to yourself!" });
      }
      return;
    }

    // Award coins to both sender and receiver (10 each)
    const KUDOS_COINS = 10;
    db.addCoins(fromUserId, KUDOS_COINS);
    db.addCoins(toUser.id, KUDOS_COINS);

    // Notify sender
    socket.emit('kudos-sent', {
      toUsername,
      coins: KUDOS_COINS
    });

    // Notify receiver on every device they have open
    emitToUser(toUser.username, 'kudos-received', {
      fromUsername,
      message: message || '',
      coins: KUDOS_COINS
    });

    // Broadcast to feed
    io.emit('feed-event', {
      type: 'kudos',
      fromUsername,
      toUsername,
      message: message || '',
      timestamp: Date.now()
    });

    // Broadcast to display
    emitToDisplay('kudos', {
      fromUsername,
      toUsername,
      message: message || ''
    });

    console.log(`[Kudos] ${fromUsername} -> ${toUsername}: "${message || '(no message)'}"`);
  });

  // ----------------------------------------
  // POPCORN EMERGENCY
  // ----------------------------------------

  socket.on('popcorn-emergency', ({ invitees } = {}) => {
    if (!socket.data.userId) return;
    const host = socket.data.username;

    if (activeEmergency) {
      socket.emit('popcorn-emergency-error', {
        message: `${activeEmergency.hostUsername} already has an emergency running`
      });
      return;
    }

    const isAll = invitees === 'all';
    let names;
    if (isAll) {
      names = [...connectedUsers.values()].map(u => u.username);
    } else if (Array.isArray(invitees)) {
      names = invitees.map(n => String(n).trim()).filter(n => n && db.getUserByUsername(n));
    } else {
      names = [];
    }
    names = [...new Set(names)].filter(n => n !== host);

    if (names.length === 0) {
      socket.emit('popcorn-emergency-error', { message: 'Nobody to summon yet' });
      return;
    }

    activeEmergency = {
      id: `emergency-${Date.now()}`,
      hostSocketId: socket.id,
      hostUsername: host,
      invitees: names,
      isAll,
      responses: {},
      createdAt: Date.now(),
      timer: setTimeout(() => endEmergency('expired'), EMERGENCY_TTL_MS)
    };

    const invitePayload = {
      emergencyId: activeEmergency.id,
      hostUsername: host,
      invitees: names,
      expiresAt: activeEmergency.createdAt + EMERGENCY_TTL_MS
    };
    names.forEach(username => {
      emitToUser(username, 'popcorn-emergency-invite', invitePayload);
      const invitee = db.getUserByUsername(username);
      if (invitee) {
        push.sendNotification(invitee.id, {
          title: 'POPCORN EMERGENCY',
          body: `${host} needs you!`,
          tag: 'popcorn-emergency',
          url: '/'
        });
      }
    });

    socket.emit('popcorn-emergency-status', emergencyPublicState());

    if (isAll) {
      emitToDisplay('popcorn-emergency-start', {
        hostUsername: host,
        invitees: names.map(username => ({ username }))
      });
    }

    console.log(`[Popcorn] ${host} summoned ${isAll ? 'everyone' : names.join(', ')}`);
  });

  socket.on('popcorn-emergency-respond', ({ accepted } = {}) => {
    if (!socket.data.userId || !activeEmergency) return;
    const username = socket.data.username;
    if (!activeEmergency.invitees.includes(username)) return;

    const status = accepted ? 'accepted' : 'declined';
    activeEmergency.responses[username] = status;

    const payload = { username, status };
    io.to(activeEmergency.hostSocketId).emit('popcorn-emergency-response', payload);
    socket.emit('popcorn-emergency-response', payload);
    if (activeEmergency.isAll) emitToDisplay('popcorn-emergency-response', payload);

    console.log(`[Popcorn] ${username} ${status}`);
  });

  socket.on('popcorn-emergency-end', () => {
    if (!socket.data.userId || !activeEmergency) return;
    if (activeEmergency.hostUsername !== socket.data.username) return;
    endEmergency('ended');
  });

  // ----------------------------------------
  // POLLS
  // ----------------------------------------

  socket.on('poll-create', ({ question, options } = {}) => {
    if (!socket.data.userId) return;
    if (activePoll && !activePoll.closed) {
      socket.emit('action-error', { message: `${activePoll.by} already has a poll open` });
      return;
    }
    const q = String(question || '').trim().slice(0, 120);
    const opts = (Array.isArray(options) ? options : [])
      .map(o => String(o || '').trim().slice(0, 60))
      .filter(Boolean);
    if (!q || opts.length < 2 || opts.length > 6) {
      socket.emit('action-error', { message: 'A poll needs a question and 2 to 6 options' });
      return;
    }
    if (activePoll) clearPoll();
    activePoll = {
      id: `poll-${Date.now()}`,
      question: q,
      options: opts,
      votes: new Map(),
      closed: false,
      by: socket.data.username,
      createdAt: Date.now(),
      lingerTimer: null
    };
    broadcastPoll();
    console.log(`[Poll] ${socket.data.username}: "${q}" (${opts.length} options)`);
  });

  socket.on('poll-vote', ({ option } = {}) => {
    if (!socket.data.userId || !activePoll || activePoll.closed) return;
    const index = Number(option);
    if (!Number.isInteger(index) || index < 0 || index >= activePoll.options.length) return;
    activePoll.votes.set(socket.data.username, index);
    emitToUser(socket.data.username, 'poll-my-vote', { pollId: activePoll.id, option: index });
    broadcastPoll();
  });

  socket.on('poll-close', ({ adminCode } = {}) => {
    if (!socket.data.userId || !activePoll || activePoll.closed) return;
    if (activePoll.by !== socket.data.username && adminCode !== ADMIN_CODE) {
      socket.emit('action-error', { message: 'Only the poll creator or the host can close it' });
      return;
    }
    activePoll.closed = true;
    broadcastPoll();
    activePoll.lingerTimer = setTimeout(clearPoll, POLL_LINGER_MS);
    console.log(`[Poll] closed: "${activePoll.question}"`);
  });

  socket.on('poll-clear', ({ adminCode } = {}) => {
    if (!socket.data.userId || !activePoll) return;
    if (activePoll.by !== socket.data.username && adminCode !== ADMIN_CODE) return;
    clearPoll();
  });

  // ----------------------------------------
  // AWARDS CEREMONY (host only, via party code)
  // ----------------------------------------

  socket.on('start-awards', ({ adminCode } = {}) => {
    if (!socket.data.userId) return;
    if (adminCode !== ADMIN_CODE) {
      socket.emit('action-error', { message: 'Wrong party code' });
      return;
    }
    const awards = buildAwards();
    if (awards.length === 0) {
      socket.emit('action-error', { message: 'Nothing to award yet. Do something first!' });
      return;
    }
    activeAwards = { awards, by: socket.data.username, startedAt: Date.now() };
    io.emit('awards-ceremony', activeAwards);
    console.log(`[Awards] ${socket.data.username} started the ceremony: ${awards.map(a => `${a.title}=${a.username}`).join(', ')}`);
  });

  socket.on('end-awards', ({ adminCode } = {}) => {
    if (!socket.data.userId || !activeAwards) return;
    if (activeAwards.by !== socket.data.username && adminCode !== ADMIN_CODE) return;
    activeAwards = null;
    io.emit('awards-end');
  });

  // ----------------------------------------
  // NEW NIGHT (host only, via party code)
  // ----------------------------------------

  socket.on('start-new-night', ({ adminCode } = {}) => {
    if (!socket.data.userId) return;
    if (adminCode !== ADMIN_CODE) {
      socket.emit('action-error', { message: 'Wrong party code' });
      return;
    }

    if (currentPresentation) db.endPresentation(currentPresentation.id);
    currentPresentation = db.startPresentation('Hangout');
    db.clearQueue();
    db.clearChatMessages();
    hideDisplayedQuestion();
    // Phones reset their "on the big screen" state even if nothing was up
    io.emit('display-question-changed', { messageId: null });
    endEmergency('new-night');
    clearPoll();
    if (activeAwards) { activeAwards = null; io.emit('awards-end'); }
    userSpawns.clear();
    catchAttempts.clear();

    io.emit('new-night', { by: socket.data.username, presentationId: currentPresentation.id });
    connectedUsers.forEach((data, socketId) => {
      const s = io.sockets.sockets.get(socketId);
      if (!s || !s.data.userId) return;
      db.ensureStats(s.data.userId, currentPresentation.id);
      const u = db.getUserById(s.data.userId);
      if (u) sendTrainerStats(s, u);
      s.emit('chat-sync', []);
      s.emit('queue-sync', []);
    });
    console.log(`[Night] ${socket.data.username} started a new night (${currentPresentation.id})`);
  });

  // ----------------------------------------
  // POKEMON - ENHANCED CATCH SYSTEM
  // ----------------------------------------

  socket.on('catch-pokemon', ({ odId, ballType = 'pokeball' }) => {
    if (!socket.data.userId) return;

    const userId = socket.data.userId;
    const user = db.getUserById(userId);
    if (!user) return;

    // Check attempt count (max 3 tries per spawn)
    const attempts = catchAttempts.get(odId) || 0;
    if (attempts >= MAX_CATCH_ATTEMPTS) {
      socket.emit('catch-failed', {
        reason: 'no_attempts',
        message: 'Out of attempts! Pokemon fled!',
        fled: true
      });
      catchAttempts.delete(odId);
      userSpawns.delete(userId);
      return;
    }

    // Check ball inventory (pokeball is infinite)
    if (ballType !== 'pokeball') {
      const hasEnough = db.useBall(userId, ballType);
      if (!hasEnough) {
        socket.emit('catch-failed', {
          reason: 'no_balls',
          ballType,
          message: `No ${ballType} balls left!`
        });
        return;
      }
    }

    // Increment attempt counter
    catchAttempts.set(odId, attempts + 1);
    const attemptsRemaining = MAX_CATCH_ATTEMPTS - (attempts + 1);

    // Attempt catch with ball type
    const result = pokemon.attemptCatch(odId, ballType);

    if (result.success) {
      // Get rewards
      const rewards = pokemon.getCatchReward(result.pokemon, result.isShiny, result.isQuickCatch);

      // Save to database
      db.catchPokemon(
        userId,
        result.pokemon.id,
        result.pokemon.name,
        result.isShiny,
        result.zone
      );
      db.addCoins(userId, rewards.coins);

      // Add XP
      addUserXP(socket, userId, rewards.xp);

      // Clear user's current spawn and attempts
      userSpawns.delete(userId);
      catchAttempts.delete(odId);

      // Decrement lure if active
      db.decrementEffectUse(userId, 'lure');

      // Send success
      socket.emit('pokemon-caught', {
        pokemonId: result.pokemon.id,
        pokemonName: result.pokemon.name,
        isShiny: result.isShiny,
        rarity: result.pokemon.rarity,
        zone: result.zone,
        isQuickCatch: result.isQuickCatch,
        rewards,
        ballUsed: ballType,
        sprite: pokemon.getSpriteUrl(result.pokemon.id, result.isShiny)
      });

      // Coins changed and the collection grew; refresh both on the phone.
      sendTrainerStats(socket, db.getUserById(userId));
      sendPokedex(socket, userId);

      // Broadcast to all
      io.emit('feed-event', {
        type: 'pokemon-caught',
        username: socket.data.username,
        pokemonId: result.pokemon.id,
        pokemonName: result.pokemon.name,
        isShiny: result.isShiny,
        timestamp: Date.now()
      });

      emitToDisplay('pokemon-caught', {
        username: socket.data.username,
        pokemonId: result.pokemon.id,
        pokemonName: result.pokemon.name,
        isShiny: result.isShiny
      });

      // Check achievements
      checkAndEmitAchievements(socket, userId, {
        isShiny: result.isShiny,
        isLegendary: result.pokemon.rarity === 'legendary'
      });

      // Broadcast updated leaderboards
      broadcastLeaderboards();

      console.log(`[Pokemon] ${socket.data.username} caught ${result.pokemon.name}${result.isShiny ? ' (SHINY!)' : ''} with ${ballType}`);

    } else {
      // Catch failed - check if out of attempts
      const fled = attemptsRemaining <= 0;

      if (fled) {
        catchAttempts.delete(odId);
        userSpawns.delete(userId);
      }

      socket.emit('catch-failed', {
        reason: fled ? 'fled' : result.reason,
        pokemonId: result.pokemon?.id,
        pokemonName: result.pokemon?.name,
        ballUsed: ballType,
        catchChance: result.catchChance,
        attemptsRemaining: fled ? 0 : attemptsRemaining,
        fled,
        message: fled ? 'Pokemon fled!' : `It broke free! ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} left.`
      });

      console.log(`[Pokemon] ${socket.data.username} failed to catch ${result.pokemon?.name || 'unknown'} (${result.reason}) - ${attemptsRemaining} attempts left`);
    }

    // Update inventory
    const ballInventory = db.getBallInventory(userId);
    socket.emit('balls-updated', {
      pokeball: Infinity,
      great: ballInventory.great_balls,
      ultra: ballInventory.ultra_balls,
      master: ballInventory.master_balls
    });
  });

  socket.on('get-pokedex', () => {
    if (!socket.data.userId) return;
    sendPokedex(socket, socket.data.userId);
  });

  socket.on('run-from-pokemon', () => {
    if (!socket.data.userId) return;
    const odId = userSpawns.get(socket.data.userId);
    if (odId) catchAttempts.delete(odId);
    userSpawns.delete(socket.data.userId);
  });

  socket.on('get-evolutions', ({ pokemonId }) => {
    if (!socket.data.userId) return;

    const user = db.getUserById(socket.data.userId);
    const stones = db.getStoneInventory(socket.data.userId);

    const evolutions = pokemon.getAvailableEvolutions(pokemonId, user.trainer_level, stones);

    socket.emit('evolutions-data', {
      pokemonId,
      evolutions
    });
  });

  socket.on('evolve-pokemon', ({ pokemonId, method, stone }) => {
    if (!socket.data.userId) return;

    const userId = socket.data.userId;
    const user = db.getUserById(userId);

    // Check if user has this Pokemon
    if (!db.hasPokemon(userId, pokemonId)) {
      socket.emit('evolve-failed', { message: 'You don\'t have this Pokemon' });
      return;
    }

    let evolution = null;

    if (method === 'level') {
      if (pokemon.canEvolveWithLevel(pokemonId, user.trainer_level)) {
        evolution = pokemon.getLevelEvolution(pokemonId);
      }
    } else if (method === 'stone' && stone) {
      if (pokemon.canEvolveWithStone(pokemonId, stone)) {
        // Use the stone
        if (!db.useStone(userId, stone)) {
          socket.emit('evolve-failed', { message: 'You don\'t have this stone' });
          return;
        }
        evolution = pokemon.getStoneEvolution(pokemonId, stone);
      }
    }

    if (evolution) {
      // Add evolved Pokemon to collection
      db.evolvePokemon(userId, pokemonId, evolution.to, evolution.name);

      socket.emit('pokemon-evolved', {
        fromId: pokemonId,
        toId: evolution.to,
        toName: evolution.name,
        method,
        stone
      });
      sendPokedex(socket, userId);
      sendTrainerStats(socket, db.getUserById(userId));

      io.emit('feed-event', {
        type: 'pokemon-evolved',
        username: socket.data.username,
        fromId: pokemonId,
        toId: evolution.to,
        toName: evolution.name,
        timestamp: Date.now()
      });

      console.log(`[Evolution] ${socket.data.username}'s Pokemon evolved to ${evolution.name}!`);
    } else {
      socket.emit('evolve-failed', { message: 'Cannot evolve this Pokemon' });
    }
  });

  // ----------------------------------------
  // SHOP - ENHANCED
  // ----------------------------------------

  socket.on('buy-item', ({ itemId }) => {
    if (!socket.data.userId) return;

    const user = db.getUserById(socket.data.userId);
    if (!user) return;

    const item = SHOP_ITEMS[itemId];
    if (!item || user.coins < item.price) {
      socket.emit('shop-error', { message: 'Cannot purchase' });
      return;
    }

    // Deduct coins
    db.addCoins(socket.data.userId, -item.price);

    // Handle item by type
    switch (item.type) {
      case 'ball':
        db.updateBallInventory(socket.data.userId, item.ballType, item.quantity);
        break;

      case 'stone':
        db.updateStoneInventory(socket.data.userId, item.stoneType, 1);
        sendEvolvable(socket, socket.data.userId);
        break;

      case 'effect':
        if (item.duration) {
          db.addEffect(socket.data.userId, item.effectType, item.duration);
        } else if (item.uses) {
          db.addEffect(socket.data.userId, item.effectType, 24 * 60 * 60 * 1000, item.uses);
        }
        break;

      case 'permanent':
        if (itemId === 'shiny_charm') {
          db.setShinyCharm(socket.data.userId, true);
        }
        break;
    }

    socket.emit('shop-purchase', {
      itemId,
      itemName: item.name,
      newBalance: user.coins - item.price
    });

    // Send updated inventory
    const updatedUser = db.getUserById(socket.data.userId);
    sendTrainerStats(socket, updatedUser);

    checkAndEmitAchievements(socket, socket.data.userId, { shopPurchase: true });

    console.log(`[Shop] ${socket.data.username} bought ${item.name}`);
  });

  // ----------------------------------------
  // ADMIN COMMANDS
  // ----------------------------------------

  socket.on('admin:start-presentation', () => {
    if (!adminSockets.has(socket.id)) return;

    currentPresentation = db.startPresentation();
    console.log(`[Admin] Presentation started: ${currentPresentation.id}`);

    // Start per-user auto-spawn system
    pokemon.startAutoSpawn(() => {
      triggerGlobalSpawn();
    });
  });

  socket.on('admin:end-presentation', () => {
    if (!adminSockets.has(socket.id) || !currentPresentation) return;

    db.endPresentation(currentPresentation.id);
    pokemon.stopAutoSpawn();
    currentPresentation = null;
    userSpawns.clear();
    console.log('[Admin] Presentation ended');
  });

  socket.on('admin:spawn-pokemon', ({ zone, pokemonId, forceShiny }) => {
    if (!adminSockets.has(socket.id)) return;

    // Spawn for all users
    connectedUsers.forEach((data, socketId) => {
      const userSocket = io.sockets.sockets.get(socketId);
      if (!userSocket || !userSocket.data.userId) return;

      const targetZone = zone || data.zone || 'meadow';
      const spawn = pokemon.adminSpawn(
        userSocket.data.userId,
        targetZone,
        pokemonId || null,
        forceShiny || false
      );

      if (spawn) {
        userSpawns.set(userSocket.data.userId, spawn.odId);
        userSocket.emit('pokemon-spawn', {
          odId: spawn.odId,
          pokemonId: spawn.pokemon.id,
          pokemonName: spawn.pokemon.name,
          rarity: spawn.pokemon.rarity,
          isShiny: spawn.isShiny,
          zone: spawn.zone,
          sprite: pokemon.getSpriteUrl(spawn.pokemon.id, spawn.isShiny),
          animatedSprite: pokemon.getAnimatedSpriteUrl(spawn.pokemon.id, spawn.isShiny),
          expiresAt: spawn.expiresAt,
          catchWindow: pokemon.CATCH_WINDOW,
          quickCatchWindow: pokemon.QUICK_CATCH_WINDOW
        });
      }
    });

    console.log(`[Admin] Spawned Pokemon for all users`);
  });

  socket.on('admin:show-question', (question) => {
    if (!adminSockets.has(socket.id)) return;
    emitToDisplay('show-question', question);
  });

  socket.on('admin:hide-question', () => {
    if (!adminSockets.has(socket.id)) return;
    emitToDisplay('hide-question');
  });

  socket.on('admin:dismiss-question', ({ questionId }) => {
    if (!adminSockets.has(socket.id)) return;
    db.deleteQuestion(questionId);
  });

  socket.on('admin:drawing-prompt', ({ prompt }) => {
    if (!adminSockets.has(socket.id)) return;
    io.emit('drawing-prompt', { prompt });
  });

  // ----------------------------------------
  // DISCONNECT
  // ----------------------------------------

  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    displaySockets.delete(socket.id);
    adminSockets.delete(socket.id);

    if (userData?.odId) {
      userSpawns.delete(userData.odId);
    }

    if (activeEmergency && activeEmergency.hostSocketId === socket.id) {
      endEmergency('host-left');
    }

    broadcastUserCount();
    broadcastUserList();

    if (userData) {
      console.log(`[User] ${userData.username} disconnected (${getOnlineCount()} online)`);
    }
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    await db.initDatabase();
    console.log('[Server] Database initialized');

    // Drinks, reaction stats and Pokemon spawns all hang off an open session
    // ("presentation"). Open one on boot so a fresh database works without the
    // legacy admin page, and restart the spawn timer, which never survived a restart.
    currentPresentation = db.getCurrentPresentation();
    if (currentPresentation) {
      console.log(`[Server] Resuming presentation: ${currentPresentation.id}`);
    } else {
      currentPresentation = db.startPresentation('Hangout');
      console.log(`[Server] Started presentation: ${currentPresentation.id}`);
    }
    pokemon.startAutoSpawn(() => {
      triggerGlobalSpawn();
    });
    setInterval(triggerIncenseSpawns, INCENSE_INTERVAL_MS);

    // Any non-API, non-file path is the React app (deep links, PWA start_url).
    app.get(/^\/(?!api\/|socket\.io\/).*/, (req, res, next) => {
      const indexPath = path.join(REACT_BUILD_DIR, 'index.html');
      if (!fs.existsSync(indexPath)) return next();
      res.sendFile(indexPath);
    });

    // Railway sends SIGTERM on redeploy; flush the SQLite file before exiting.
    const shutdown = (signal) => {
      console.log(`[Server] ${signal} received, saving database`);
      db.saveDatabase();
      process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║        🎮 OTY Chat Server (Enhanced) 🎮        ║
╠═══════════════════════════════════════════════╣
║  App:     http://localhost:${PORT}              ║
║  Admin:   http://localhost:${PORT}/admin.html   ║
║  Display: http://localhost:${PORT}/display.html ║
╠═══════════════════════════════════════════════╣
║  Features:                                    ║
║  • Trainer Leveling (1-25)                    ║
║  • 6 Zones with unique Pokemon               ║
║  • Per-user spawns                           ║
║  • Catch mechanics with Pokeballs            ║
║  • Evolution system                          ║
║  • Enhanced shop                             ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
