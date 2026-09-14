# OtyChat Skills

Custom Claude Code skills for the OtyChat project.

---

## /start-servers

Start both backend and frontend development servers.

```yaml
name: start-servers
description: Start OtyChat backend and frontend servers
```

### Instructions

1. Start the backend server in the background:
   ```bash
   cd /c/Users/chase/Projects/OtyChat && npm start
   ```
   Backend runs on http://localhost:3000

2. Start the frontend dev server in a separate terminal:
   ```bash
   cd /c/Users/chase/Projects/OtyChat/client && npm run dev
   ```
   Frontend runs on http://localhost:5173

3. Report both URLs to the user when ready.

---

## /check-status

Check if OtyChat servers are running.

```yaml
name: check-status
description: Check if backend and frontend servers are running
```

### Instructions

1. Check if port 3000 (backend) is in use:
   ```bash
   netstat -ano | findstr :3000
   ```

2. Check if port 5173 (frontend) is in use:
   ```bash
   netstat -ano | findstr :5173
   ```

3. Report status of both servers to the user.

---

## /reset-db

Reset the SQLite database to fresh state.

```yaml
name: reset-db
description: Delete and recreate the OtyChat database
```

### Instructions

1. Stop the backend server if running
2. Delete the database file:
   ```bash
   rm /c/Users/chase/Projects/OtyChat/data/otychat.db
   ```
3. Restart the backend - it will auto-create fresh tables
4. Warn user that all data (users, pokemon, etc.) will be lost

---

## /add-socket-event

Scaffold a new socket event across frontend and backend.

```yaml
name: add-socket-event
description: Add a new socket event to both client and server
```

### Instructions

When user specifies an event name:

1. **Server (server.js)**: Add socket handler:
   ```javascript
   socket.on('event-name', async (data) => {
     // Handle event
     io.emit('event-response', { ... });
   });
   ```

2. **Client (SocketContext.tsx)**: Add listener and state:
   ```typescript
   newSocket.on('event-response', (data) => {
     setState(data);
   });

   // Add to context value
   const value = {
     state,
     sendEvent: (data) => socket?.emit('event-name', data),
   };
   ```

3. Update TypeScript types if needed

---

## /add-component

Create a new React component with OtyChat styling.

```yaml
name: add-component
description: Create a new styled React component
```

### Instructions

When user specifies a component name:

1. Create file at `client/src/app/components/{ComponentName}.tsx`
2. Use this template:
   ```tsx
   import { useState } from 'react';
   import { useSocket } from '../../contexts/SocketContext';

   interface {ComponentName}Props {
     // props here
   }

   export default function {ComponentName}({ }: {ComponentName}Props) {
     const { user } = useSocket();

     return (
       <div style={{
         background: 'rgba(255, 255, 255, 0.1)',
         borderRadius: 12,
         padding: 16,
         fontFamily: 'Nunito, sans-serif',
       }}>
         {/* Component content */}
       </div>
     );
   }
   ```

---

## /add-pokemon

Add a new Pokemon to the spawn pool.

```yaml
name: add-pokemon
description: Add a new Pokemon to a zone's spawn pool
```

### Instructions

1. Open `pokemon.js`
2. Find the appropriate zone in `ZONE_POKEMON`
3. Add the Pokemon ID to the zone array
4. If needed, add to `POKEMON_DATA` with:
   - name, types, rarity, baseRate, evolutionLevel, evolvesTo

---

## /test-catch

Test the Pokemon catch system.

```yaml
name: test-catch
description: Test Pokemon spawning and catching
```

### Instructions

1. Ensure backend is running
2. Join as a user in the frontend
3. Go to Pokemon tab
4. Check console for `pokemon-spawned` events
5. Attempt a catch and verify `pokemon-caught` or `catch-failed` response
6. Check Pokedex updates

---

## /fix-duplicates

Apply the duplicate prevention pattern to a component.

```yaml
name: fix-duplicates
description: Add ref-based deduplication to prevent duplicate items
```

### Instructions

When user identifies a component with duplicate issues:

1. Add a seen IDs ref at component level:
   ```typescript
   const seenIds = useRef<Set<string>>(new Set());
   ```

2. In the socket event handler, filter duplicates:
   ```typescript
   socket.on('item-added', (item) => {
     const id = String(item.id);
     if (seenIds.current.has(id)) return;
     seenIds.current.add(id);
     setItems(prev => [...prev, item]);
   });
   ```

3. Clear the set on cleanup:
   ```typescript
   return () => {
     seenIds.current.clear();
   };
   ```

---

## /deploy-check

Pre-deployment checklist verification.

```yaml
name: deploy-check
description: Run through deployment checklist
```

### Instructions

Verify each item:
1. [ ] `npm run build` succeeds in client folder
2. [ ] No TypeScript errors
3. [ ] Backend starts without errors
4. [ ] Login flow works
5. [ ] Socket connection establishes
6. [ ] Core features functional (reactions, drawing, Pokemon)
7. [ ] No console errors in browser

Report results to user.

---

## Usage

Invoke skills with `/skillname` in Claude Code:

```
/start-servers
/check-status
/reset-db
/add-socket-event send-kudos
/add-component KudosModal
```
