# OtyChat

A real-time presentation companion app for in-person hangouts. 

## Features

- **Emoji Reactions** - Fire emojis that blast onto the presentation screen
- **PictoChat Drawing** - Sketch doodles with optional text on a ruled paper canvas
- **Live Q&A** - Submit and upvote questions in real-time
- **Direct Messages** - Chat privately with other participants
- **Pokemon Catching** - Catch Pokemon in different zones, level up your trainer
- **Achievements & Leaderboards** - Earn XP, coins, and compete with friends
- **Much, much, more**

## Tech Stack

**Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Radix UI, Socket.io Client

**Backend:** Node.js, Express, Socket.io, SQLite (sql.js)

## Quick Start

```bash
# Backend (port 3000)
npm install
npm start

# Frontend (port 5173)
cd client
npm install
npm run dev
```

Open http://localhost:5173 in your browser (a phone-sized window; the app is mobile-only).

```bash
npm test        # end-to-end socket smoke test
npm run build   # build the client; the backend then serves it at /
```

## Deploying

Runs as a single Node service on Railway. See "Deploying to Railway" in `CLAUDE.md` for the volume, variables and the one-time asset upload.

## Documentation

- `CLAUDE.md` - Development guide with architecture, patterns, and debugging tips
- `SPEC.md` - Full feature specification
- `SKILL.md` - Claude Code skills for common tasks

## License

MIT
