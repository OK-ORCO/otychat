# OtyChat - Interactive Presentation Companion

## Overview

A playful web app for in-person presentation hangouts. Everyone joins from their phone and can:
- 🎭 Send emoji reactions to the presentation screen
- 🎨 Draw PictoChat-style doodles with optional text
- ❓ Submit and upvote questions (live feed)
- 💬 DM other participants
- 🍺 Track drinks
- ⚡ Catch Pokémon with zones, leveling, and evolution
- 🏆 Earn achievements, XP, and coins
- 📊 Compete on leaderboards

**Inspiration:** FroggieChat, PictoChat (Nintendo DS), Pokémon GO

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build/dev server
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication
- **Custom playful UI** with Fredoka/Nunito fonts, gradients, and rounded corners

### Backend
- **Node.js** with Express
- **Socket.io** for WebSocket communication
- **SQLite** for persistent data (better-sqlite3)

### Design System
- Rounded corners (12-16px radius)
- Gradient backgrounds (pink/purple for active states, green for success)
- Soft shadows and blur effects
- Cream-colored "paper" for drawing canvas with ruled lines
- Mobile-first responsive design (optimized for 390x844 iPhone viewport)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  client/src/                                                 │
│  ├── contexts/SocketContext.tsx  (central socket state)     │
│  ├── app/components/             (UI components)            │
│  │   ├── MainApp.tsx             (tab navigation)           │
│  │   ├── MessageComposer.tsx     (draw/text input)          │
│  │   ├── EmojiPicker.tsx         (emoji reactions)          │
│  │   └── tabs/                   (Feed, React, Pokemon...)  │
│  └── app/data/emoji-data.ts      (custom emoji URLs)        │
└─────────────────────────────────────────────────────────────┘
                              │
                         WebSocket
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Backend                           │
│  ├── server.js       (Express + Socket.io)                  │
│  ├── db.js           (SQLite queries)                       │
│  ├── pokemon.js      (zones, spawns, catch rates)           │
│  └── achievements.js (achievement definitions)              │
└─────────────────────────────────────────────────────────────┘
                              │
                           SQLite
                              │
                    data/otychat.db
```

---

## Navigation

Bottom tab bar with **6 tabs**:

| Tab | Icon | Purpose |
|-----|------|---------|
| Feed | 📊 | Dashboard with leaderboards, stats, activity feed |
| React | 🎭 | Emoji reactions, questions feed, drawing/text input |
| Pokémon | ⚡ | Catch Pokémon, view Pokédex, change zones |
| DMs | 💬 | Direct messages with other users |
| Fun | 🎉 | Tools: Popcorn Emergency, future fun features |
| Me | 👤 | Profile, stats, inventory, settings |

---

## Screens & Components

### 1. Login Screen

Simple username entry with animated background. Credentials cached in localStorage for auto-login.

### 2. Feed Tab (Dashboard)

```
┌─────────────────────────────────────┐
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ ⚡  │ │ 🪙  │ │ 👥  │  Quick     │
│ │ Lv1 │ │ 55  │ │  3  │  Stats     │
│ └─────┘ └─────┘ └─────┘            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✨ Shiny Hunters    [⚡][🎯][✨][🎭] │
│ │ 1. chase ............ 4        │ │
│ │ 2. TestUser ......... 0        │ │
│ │ 3. Artist ........... 0        │ │
│ │ (auto-cycles every 5 seconds)  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Live Activity                       │
│ ┌─────────────────────────────────┐ │
│ │ ❓ Chase asked a question       │ │
│ │ 🎨 Chase sent a drawing         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Features:**
- Quick stats bar: Level, Coins, Online count
- Cycling leaderboards with a Tonight / All time toggle: tonight = reactions, catches, messages, drinks for this session; all time = XP, catches, shinies, drinks
- Live activity feed (last 10 events)

### 3. React Tab

```
┌─────────────────────────────────────┐
│ [😀][🔥][💀][😂][👏][❤️][🎉] [•••]  │  Emoji bar
│                                     │
│ Questions & Reactions               │
│ ┌─────────────────────────────────┐ │
│ │ C chase  ❓Question    6:54 AM │ │
│ │ No more duplicates!            │ │
│ │ 👍 0                           │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ C chase  🎨Drawing     8:30 PM │ │
│ │ [drawing image]                │ │
│ │ 👍 2                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─┐ ┌───────────────────────┐ ┌─┐  │
│ │Ι│ │                       │ │🗑│  │
│ │🪣│ │  Canvas (draw/type)  │ │➤│  │
│ │•│ │                       │ └─┘  │
│ └─┘ └───────────────────────┘      │
└─────────────────────────────────────┘
```

**MessageComposer Controls:**
- **Left side (top to bottom):**
  - `Ι` Insert point - toggles text mode (shows ✏️ when active)
  - `🪣` Color picker - opens color palette modal
  - `•` Brush size - opens size selector modal
- **Center:** Canvas with ruled paper lines
- **Right side:**
  - `🗑️` Clear - resets canvas and text
  - `➤` Send - submits drawing/text (pointing NE like paper airplane)

**Behavior:**
- Default mode is draw - tap canvas to draw
- Tap `Ι` to enable text mode - textarea appears over canvas
- Drawing and text can be combined
- Text aligns to ruled paper lines

### 4. Pokémon Tab

- Zone selector (unlock zones by leveling up)
- Active Pokémon spawn with catch modal
- Ball selector (Poké Ball, Great Ball, Ultra Ball, Master Ball)
- Catch rate calculations with quick-catch bonus
- Pokédex grid showing caught/uncaught silhouettes

### 5. DMs Tab

- List of conversations
- Unread message badges
- Same MessageComposer for sending drawings/text

### 6. Fun Tab

The "Fun" tab is a collection of interactive tools for the room.

```
┌─────────────────────────────────────────┐
│  🎉 Fun Stuff                           │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  🍿 POPCORN EMERGENCY               ││
│  │  Need everyone's attention?         ││
│  │  Sound the alarm.                   ││
│  │  [    🚨 SEND EMERGENCY    ]        ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  📺 On the big screen               ││
│  │  alice: Is this thing on?           ││
│  │  [    Hide from display    ]        ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

- While the user is hosting an emergency, the Popcorn card is replaced by the live status panel (who accepted / declined / pending, countdown, Close button).
- **Poll**: anyone starts one (question + 2 to 6 options), everyone votes from their phone and can change their vote, results render live on the big screen. The creator (or the host with the party code) closes it; results linger a minute.
- **Awards ceremony** (host, party code): the big screen plays tonight's winners one card at a time (Hype Machine, Top Catcher, Shiny of the Night, Best Question, Chatterbox, Most Loved, Last One Standing), then a summary. Every phone gets a full-screen sheet with its own wins highlighted.
- "On the big screen" mirrors whatever the Slides overlay is currently showing from the question queue, with a Hide button. Anyone can hide it.
- **Open a new room** (host, party code): wipes chat and queue for the next presentation. Drinks never reset.

The overlay also shows a **join card** (QR + URL + headcount) for 90 seconds when it connects, and the extension popup can toggle it.

**Future Fun Tab Ideas:**
- **Group Challenges** - "Everyone catch a Pikachu in 2 minutes"
- **Trivia Mode** - Presenter asks questions, everyone buzzes in
- **Soundboard** - Play sound effects to the room
- **Confetti Cannon** - Trigger celebration on display
- **Secret Messages** - Send anonymous notes to display

### 7. Me Tab

- Profile picture and username
- Trainer level with XP bar
- Stats: Pokémon caught, shinies, reactions, drinks
- Inventory: balls, evolution stones
- Shop for items, including Big Screen stunts (confetti cannon, airhorn, drumroll, sad trombone, rimshot, name in lights) that fire on the projector
- Background theme selector
- Logout button

---

## Popcorn Emergency Feature

### Overview

A way to summon friends when the popcorn is ready (or any urgent group moment). The host selects who to invite, and recipients get a full-screen modal they must respond to.

### User Flow

**1. Host Initiates**
- Host taps "🍿 POPCORN EMERGENCY" button in Fun tab
- Modal opens with user selection

**2. Select Recipients**
```
┌─────────────────────────────────────────┐
│  🍿 Popcorn Emergency                   │
│                                         │
│  Who needs to come?                     │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [✓] SELECT ALL                      ││
│  ├─────────────────────────────────────┤│
│  │ [✓] @alice                          ││
│  │ [✓] @bob                            ││
│  │ [ ] @charlie                        ││
│  │ [✓] @diana                          ││
│  └─────────────────────────────────────┘│
│                                         │
│  [  Cancel  ]  [ 🚨 SEND EMERGENCY ]    │
└─────────────────────────────────────────┘
```

**3. Recipients Get Notified**
```
┌─────────────────────────────────────────┐
│                                         │
│               🍿                        │
│                                         │
│       POPCORN EMERGENCY!                │
│                                         │
│        @chase needs you!                │
│                                         │
│  ┌─────────────┐    ┌─────────────┐     │
│  │   DECLINE   │    │   ACCEPT    │     │
│  │     ❌      │    │     ✅      │     │
│  └─────────────┘    └─────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

**4. Host Sees Responses**
```
┌─────────────────────────────────────────┐
│  🍿 Emergency Status                    │
│                                         │
│  Waiting for responses...               │
│                                         │
│  ✅ @alice                              │
│  ✅ @bob                                │
│  ⏳ @diana                              │
│  ❌ @charlie                            │
│                                         │
│  2 accepted · 1 declined · 1 pending    │
│                                         │
│  [     Close Emergency     ]            │
└─────────────────────────────────────────┘
```

**5. Display Overlay (when sent to ALL)**
- If host selected "SELECT ALL", the emergency shows on the presentation screen
- Emergency broadcast aesthetic with animated popcorn
- Shows responders appearing as they accept

### Server State

No persistent storage required. Emergency state held in memory:

```javascript
let activeEmergency = {
  id: 'emergency-123',
  hostSocketId: 'socket-abc',
  hostUsername: 'chase',
  invitees: ['alice', 'bob', 'charlie'],
  isAll: true,
  responses: {
    'alice': 'accepted',
    'bob': 'pending',
    'charlie': 'declined'
  },
  createdAt: Date.now()
};
```

### Auto-Expiration

- Emergency auto-expires after 5 minutes if not closed
- Prevents zombie emergencies if host disconnects

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username }` | Join/rejoin session |
| `reaction` | `{ emoji }` | Send emoji to display |
| `send-question` | `{ text?, drawing? }` | Submit question/drawing |
| `upvote-question` | `{ questionId }` | Upvote a question |
| `catch-pokemon` | `{ odId, ballType }` | Attempt to catch |
| `change-zone` | `{ zone }` | Change hunting zone |
| `log-drink` | `{}` | Log a drink |
| `send-dm` | `{ toUsername, content }` | Send direct message |
| `send-kudos` | `{ toUsername, message }` | Give kudos |
| `buy-item` | `{ itemId }` | Purchase from shop |
| `popcorn-emergency` | `{ invitees: string[] \| 'all' }` | Initiate emergency |
| `popcorn-emergency-respond` | `{ accepted: boolean }` | Respond to invite |
| `popcorn-emergency-end` | `{}` | Host closes emergency |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `trainer-stats` | `{ coins, level, xp, ... }` | User data on join |
| `questions-sync` | `[questions]` | Initial questions list |
| `question-added` | `{ id, username, text, drawing }` | New question |
| `question-upvoted` | `{ questionId, votes }` | Vote update |
| `pokemon-spawned` | `{ pokemon }` | New spawn for user |
| `pokemon-caught` | `{ pokemon, xpGained }` | Successful catch |
| `catch-failed` | `{ ballUsed }` | Failed catch attempt |
| `level-up` | `{ level, unlockedZone? }` | Level up notification |
| `leaderboards` | `{ xp, pokemon, shiny, reactions }` | Leaderboard data |
| `online-users` | `[users]` | Online user list |
| `popcorn-emergency-invite` | `{ hostUsername, emergencyId }` | Invite received |
| `popcorn-emergency-response` | `{ username, status }` | Someone responded |
| `popcorn-emergency-ended` | `{}` | Emergency closed |

### Server → Display

| Event | Payload | Description |
|-------|---------|-------------|
| `emoji-blast` | `{ emoji, emojiUrl }` | Show emoji on screen |
| `popcorn-emergency-start` | `{ hostUsername, invitees }` | Show emergency on screen (all only) |
| `popcorn-emergency-response` | `{ username, status }` | Update responder on screen |
| `popcorn-emergency-end` | `{}` | Hide emergency from screen |

---

## XP & Leveling System

**XP Gains:**
- Emoji reaction: +1 XP
- Question asked: +20 XP
- Drawing sent: +15 XP
- Question upvoted: +5 XP per vote
- Pokémon caught: +25 XP
- Shiny caught: +100 XP
- Log drink: +10 XP

**Level Thresholds:** 0, 200, 500, 1000, 1750, 2750...

**Zone Unlocks:**
- Meadow: Level 1 (starter)
- Forest: Level 5
- Mountain: Level 10
- Ocean: Level 15
- Sky Temple: Level 20
- Mystery: Level 25

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  coins INTEGER DEFAULT 0,
  title TEXT,
  trainer_level INTEGER DEFAULT 1,
  trainer_xp INTEGER DEFAULT 0,
  current_zone TEXT DEFAULT 'meadow',
  shiny_charm BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pokemon caught
CREATE TABLE pokemon_caught (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  pokemon_id INTEGER,
  is_shiny BOOLEAN DEFAULT FALSE,
  zone TEXT,
  caught_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ball inventory
CREATE TABLE ball_inventory (
  user_id INTEGER PRIMARY KEY,
  great_balls INTEGER DEFAULT 0,
  ultra_balls INTEGER DEFAULT 0,
  master_balls INTEGER DEFAULT 0
);

-- Questions
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  text TEXT,
  drawing TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User stats
CREATE TABLE user_stats (
  user_id INTEGER PRIMARY KEY,
  reactions INTEGER DEFAULT 0,
  questions INTEGER DEFAULT 0,
  drinks INTEGER DEFAULT 0
);
```

---

## File Structure

```
OtyChat/
├── server.js              # Express + Socket.io server
├── db.js                  # SQLite database functions
├── pokemon.js             # Pokemon zones, spawns, catch rates
├── achievements.js        # Achievement definitions
├── push.js                # Push notification logic
├── .env                   # VAPID keys for push notifications
├── SPEC.md               # This file
├── CLAUDE.md             # Development guide for Claude
├── data/
│   └── otychat.db        # SQLite database
├── otychat-extension/    # Chrome extension for display overlay
│   ├── manifest.json
│   ├── content.js
│   ├── overlay.css
│   ├── background.js
│   ├── lib/socket.io.min.js
│   └── popup/
└── client/               # React frontend
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── contexts/
        │   └── SocketContext.tsx
        ├── hooks/
        │   └── usePushNotifications.ts
        └── app/
            ├── components/
            │   ├── MainApp.tsx
            │   ├── LoginScreen.tsx
            │   ├── MessageComposer.tsx
            │   ├── EmojiPicker.tsx
            │   ├── UserProfile.tsx
            │   ├── NotificationPrompt.tsx
            │   ├── IOSInstallPrompt.tsx
            │   ├── PopcornEmergency.tsx
            │   └── tabs/
            │       ├── FeedTab.tsx
            │       ├── ReactTab.tsx
            │       ├── PokemonTab.tsx
            │       ├── DMsTab.tsx
            │       ├── FunTab.tsx
            │       └── MeTab.tsx
            └── data/
                └── emoji-data.ts
```

---

## Running Locally

```bash
# Terminal 1 - Backend
npm install
npm run backend:start

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

---

## Push Notifications

Web Push notifications for DMs, Popcorn Emergencies, and other events even when the app is backgrounded.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   App UI    │  │   Service   │  │  Push Subscription  │  │
│  │             │  │   Worker    │  │  (stored in DB)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                         Push Message
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     OtyChat Server                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Socket.io  │──│  web-push   │  │  Push Subscriptions │  │
│  │   Events    │  │   Library   │  │   (SQLite table)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Setup Requirements

1. **Install**: `npm install web-push`
2. **Generate VAPID keys**: `npx web-push generate-vapid-keys`
3. **Environment variables**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

### Database Addition

```sql
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Push Notification Triggers

| Event | Title | Body | Who Receives |
|-------|-------|------|--------------|
| DM received | `Message from @{sender}` | Message preview or "📷 Sent a drawing" | Recipient |
| Popcorn Emergency | `🍿 POPCORN EMERGENCY` | `{host} needs you!` | All invitees |
| Question upvoted | `Your question got upvoted!` | `+{n} votes` | Question author |

### File Additions

```
OtyChat/
├── push.js                    # Push notification logic
├── .env                       # VAPID keys
├── client/
│   ├── public/
│   │   ├── sw.js              # Service Worker
│   │   ├── manifest.json      # PWA manifest
│   │   └── icons/             # App icons (various sizes)
│   └── src/
│       ├── hooks/
│       │   └── usePushNotifications.ts
│       └── components/
│           ├── NotificationPrompt.tsx
│           └── IOSInstallPrompt.tsx
```

### Notes

- **iOS requires PWA install** - Show install prompt for Safari users
- **HTTPS required** - Service workers only work on HTTPS (localhost exempt)
- **Subscription cleanup** - Remove subscriptions that return 410/404

---

## Chrome Extension (Display Overlay)

A Chrome extension that injects a transparent overlay onto Google Slides (including fullscreen mode) to display emoji reactions and Popcorn Emergency broadcasts.

### Extension Structure

```
otychat-extension/
├── manifest.json           # Extension manifest (v3)
├── content.js              # Injected into Google Slides pages
├── overlay.css             # Styles for overlay elements
├── background.js           # Service worker for extension lifecycle
├── lib/
│   └── socket.io.min.js    # Socket.io client (bundled)
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic (server URL config)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Features

**Emoji Animations (6 patterns):**
- `float-up` - Classic rise and fade
- `pop-in` - Scale bounce in place
- `bounce-across` - Traverse screen horizontally
- `spiral-rise` - Corkscrew upward
- `firework` - Rise and burst into particles
- `rain-down` - Fall from top

**Popcorn Emergency Broadcast:**
- Full-screen takeover with emergency bars
- Animated popcorn icon
- Real-time responder status updates
- Popcorn kernel background animation

### Installation

1. Create `otychat-extension/` folder with structure above
2. Download `socket.io.min.js` from CDN into `lib/`
3. Create icon PNGs (16, 48, 128px)
4. Chrome → `chrome://extensions/` → Developer Mode → Load Unpacked
5. Select the folder

### Popup Configuration

- Server URL input (default: `http://localhost:3000`)
- "Save & Connect" button
- "Test Emojis" button (fires all 6 animation patterns)

---

## Post-V1 Ideas

- Admin panel for moderating questions
- Pokémon trading between users
- Custom emoji upload
- End-of-night awards ceremony
- Evolution UI (the server already supports stone and level evolutions; no screen calls it yet)
