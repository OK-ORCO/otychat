import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Types matching the backend
interface User {
  odId: string;
  odUserId: number;
  odName: string;
  odTitle: string;
  odCoins: number;
  odDrinksTonight: number;
  odDrinksTotal: number;
  odReactions: number;
  odQuestions: number;
  odDrawings: number;
  odPokemon: number;
  odAchievements: string[];
  odTrainerLevel: number;
  odTrainerXp: number;
  odXpForCurrentLevel: number;
  odXpForNextLevel: number | null;
  odCurrentZone: string;
  odShinyCharm: boolean;
  odProfilePic?: string;
  odStatus?: string;
  odNameColor?: string;
}

interface Pokemon {
  odId: string;
  odPokemonId: number;
  odName: string;
  odRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  odIsShiny: boolean;
  odZone: string;
  odSpriteUrl: string;
  odCaughtAt?: string;
  odExpiresAt?: number;
}

interface BallInventory {
  great: number;
  ultra: number;
  master: number;
}

interface StoneInventory {
  fire: number;
  water: number;
  thunder: number;
  leaf: number;
  moon: number;
  sun: number;
  dragon: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  title: string | null;
}

export interface AchievementData {
  achievements: AchievementDef[];
  unlocked: { id: string; unlockedAt: string }[];
  progress: Record<string, { current: number; milestones: number[] }>;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'ball' | 'stone' | 'effect' | 'permanent';
  ballType?: string;
  stoneType?: string;
  effectType?: string;
  quantity?: number;
}

interface Zone {
  name: string;
  levelRequired: number;
  pokemon: {
    common: number[];
    uncommon: number[];
    rare: number[];
    legendary?: number[];
  };
}

interface FeedItem {
  id: string;
  type: 'achievement' | 'pokemon' | 'drink' | 'kudos' | 'drawing' | 'slide' | 'question' | 'level-up' | 'pokemon-caught';
  message: string;
  timestamp: Date;
  icon: string;
  username?: string;
}

interface Question {
  odId: string;
  odUserId: number;
  odUsername: string;
  odContent: string;
  odType: 'text' | 'drawing' | 'image';
  odImageData?: string;
  odUpvotes: number;
  odHasUpvoted: boolean;
  odCreatedAt: string;
}

interface ChatMessage {
  odId: string;
  odUserId: number;
  odUsername: string;
  odContent: string;
  odType: 'text' | 'drawing' | 'image';
  odImageData?: string;
  odUpvotes: number;
  odHasUpvoted: boolean;
  odInQueue: boolean;
  odCreatedAt: string;
}

interface DM {
  odId: string;
  odFromId: number;
  odFromName: string;
  odToId: number;
  odToName: string;
  odContent: string;
  odImageData?: string | null;
  odRead: boolean;
  odCreatedAt: string;
}

interface LeaderboardEntry {
  username: string;
  level?: number;
  xp?: number;
  count?: number;
}

interface Leaderboards {
  xp: LeaderboardEntry[];
  pokemon: LeaderboardEntry[];
  shiny: LeaderboardEntry[];
  drinks: LeaderboardEntry[];
}

interface JoinError {
  message: string;
  code: 'WRONG_PASSWORD' | 'PASSWORD_REQUIRED' | string;
}

interface ForgotPasswordResult {
  success: boolean;
  password?: string;
  message: string;
}

export interface UserProfileData {
  username: string;
  notFound?: boolean;
  profilePic: string;
  title: string;
  status: string;
  nameColor: string;
  level: number;
  coins: number;
  pokemonCaught: number;
  shinyCaught: number;
  achievements: number;
  drinkCount: number;
  kudosReceived: number;
  joinedAt: string;
  online: boolean;
  recentPokemon: { pokemonId: number; name: string; isShiny: boolean; caughtAt: string; sprite: string }[];
}

export interface CatchResult {
  kind: 'caught' | 'failed';
  message: string;
  pokemonName?: string;
  isShiny?: boolean;
  sprite?: string;
  coins?: number;
  xp?: number;
  attemptsRemaining?: number;
  fled?: boolean;
}

export interface Notice {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
}

export type EmergencyStatus = 'pending' | 'accepted' | 'declined';

export interface EmergencyState {
  role: 'host' | 'invitee';
  id: string;
  hostUsername: string;
  isAll?: boolean;
  invitees: { username: string; status: EmergencyStatus }[];
  expiresAt: number;
  myResponse?: 'accepted' | 'declined';
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  user: User | null;
  onlineUsers: { odName: string; odTitle: string; odProfilePic?: string }[];
  onlineCount: number;
  questions: Question[];
  chatMessages: ChatMessage[];
  queueMessages: ChatMessage[];
  displayedMessageId: string | null;
  feed: FeedItem[];
  activePokemon: Pokemon | null;
  caughtPokemon: Pokemon[];
  catchResult: CatchResult | null;
  ballInventory: BallInventory;
  stoneInventory: StoneInventory;
  zones: Record<string, Zone>;
  shopItems: ShopItem[];
  achievementData: AchievementData;
  profiles: Record<string, UserProfileData>;
  dms: DM[];
  unreadDMCount: number;
  leaderboards: Leaderboards;
  joinError: JoinError | null;
  forgotPasswordResult: ForgotPasswordResult | null;
  notice: Notice | null;
  emergency: EmergencyState | null;

  // Actions
  join: (username: string, password: string) => void;
  forgotPassword: (username: string) => void;
  clearJoinError: () => void;
  clearForgotPasswordResult: () => void;
  sendReaction: (emoji: string) => void;
  sendQuestion: (content: string, type: 'text' | 'drawing' | 'image', imageData?: string) => void;
  upvoteQuestion: (questionId: string) => void;
  // Chat actions
  sendChat: (content: string, type: 'text' | 'drawing' | 'image', imageData?: string) => void;
  sendToQueue: (content: string, type: 'text' | 'drawing' | 'image', imageData?: string) => void;
  upvoteChat: (messageId: string) => void;
  // Queue actions
  dismissFromQueue: (messageId: string) => void;
  clearQueue: () => void;
  showOnDisplay: (messageId: string) => void;
  hideFromDisplay: () => void;
  // Pokemon
  catchPokemon: (odId: string, ballType: string) => void;
  runFromPokemon: () => void;
  clearCatchResult: () => void;
  changeZone: (zone: string) => void;
  // Other actions
  logDrink: () => void;
  unlogDrink: () => void;
  buyItem: (itemId: string) => void;
  evolvePokemon: (pokemonId: number, method: 'level' | 'stone', stone?: string) => void;
  sendDM: (toUsername: string, content: string, drawing?: string, image?: string) => void;
  markDMsRead: (fromUsername: string) => void;
  sendKudos: (toUsername: string, message: string) => void;
  updateProfile: (updates: { profilePic?: string; status?: string; title?: string; nameColor?: string }) => void;
  requestProfile: (username: string) => void;
  showNotice: (text: string, kind?: Notice['kind']) => void;
  dismissNotice: () => void;
  // Popcorn Emergency
  startEmergency: (invitees: string[] | 'all') => void;
  respondEmergency: (accepted: boolean) => void;
  endEmergency: () => void;
  dismissEmergency: () => void;
  leave: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const EMPTY_STONES: StoneInventory = { fire: 0, water: 0, thunder: 0, leaf: 0, moon: 0, sun: 0, dragon: 0 };

function mapStones(stones: Record<string, number> | undefined): StoneInventory {
  if (!stones) return EMPTY_STONES;
  return {
    fire: stones.fire_stone || 0,
    water: stones.water_stone || 0,
    thunder: stones.thunder_stone || 0,
    leaf: stones.leaf_stone || 0,
    moon: stones.moon_stone || 0,
    sun: stones.sun_stone || 0,
    dragon: stones.dragon_scale || 0,
  };
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<JoinError | null>(null);
  const [forgotPasswordResult, setForgotPasswordResult] = useState<ForgotPasswordResult | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ odName: string; odTitle: string; odProfilePic?: string }[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [queueMessages, setQueueMessages] = useState<ChatMessage[]>([]);
  const [displayedMessageId, setDisplayedMessageId] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [activePokemon, setActivePokemon] = useState<Pokemon | null>(null);
  const [caughtPokemon, setCaughtPokemon] = useState<Pokemon[]>([]);
  const [catchResult, setCatchResult] = useState<CatchResult | null>(null);
  const [ballInventory, setBallInventory] = useState<BallInventory>({ great: 0, ultra: 0, master: 0 });
  const [stoneInventory, setStoneInventory] = useState<StoneInventory>(EMPTY_STONES);
  const [zones, setZones] = useState<Record<string, Zone>>({});
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [achievementData, setAchievementData] = useState<AchievementData>({ achievements: [], unlocked: [], progress: {} });
  const [profiles, setProfiles] = useState<Record<string, UserProfileData>>({});
  const [dms, setDms] = useState<DM[]>([]);
  const [unreadDMCount, setUnreadDMCount] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [emergency, setEmergency] = useState<EmergencyState | null>(null);
  const [leaderboards, setLeaderboards] = useState<Leaderboards>({
    xp: [],
    pokemon: [],
    shiny: [],
    drinks: []
  });

  // Ref to track current username for event handlers
  const usernameRef = useRef<string | null>(null);

  // Sync username ref with user state
  useEffect(() => {
    usernameRef.current = user?.odName || null;
  }, [user?.odName]);

  // Ref to track seen question IDs (prevents duplicates from rapid events/React Strict Mode)
  const seenQuestionIds = useRef<Set<string>>(new Set());
  // Ref to track seen chat message IDs
  const seenChatIds = useRef<Set<string>>(new Set());

  // Track if we've attempted auto-login
  const autoLoginAttempted = useRef(false);

  // Track credentials for the current join attempt (to save on success)
  const lastJoinCredentials = useRef<{ username: string; password: string } | null>(null);

  // Wild Pokemon leave on their own when the catch window closes
  const spawnExpiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addFeedItem = (item: Omit<FeedItem, 'id' | 'timestamp'>) => {
    setFeed(prev => [{
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
    }, ...prev].slice(0, 50)); // Keep last 50 items
  };

  const showNotice = useCallback((text: string, kind: Notice['kind'] = 'info') => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ id: Date.now(), text, kind });
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  const dismissNotice = useCallback(() => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(null);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io({
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);

      // Handle reconnection - re-join if we were logged in
      const storedUsername = localStorage.getItem('otychat_username');
      const storedPassword = localStorage.getItem('otychat_password');
      if (storedUsername && storedPassword && usernameRef.current) {
        console.log('Reconnecting as:', storedUsername);
        newSocket.emit('join', { username: storedUsername, password: storedPassword });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Auth events
    newSocket.on('join-error', (data: JoinError) => {
      console.log('Join error:', data);
      setJoinError(data);
      // Clear stored password on error (it might be wrong)
      if (data.code === 'WRONG_PASSWORD') {
        localStorage.removeItem('otychat_password');
      }
    });

    // Generic server error (invalid username etc). Surface it on the join screen
    // when not logged in, otherwise as a notice.
    newSocket.on('error', (data: { message?: string }) => {
      const message = data?.message || 'Something went wrong';
      if (!usernameRef.current) {
        setJoinError({ message, code: 'ERROR' });
      } else {
        showNotice(message, 'error');
      }
    });

    newSocket.on('forgot-password-result', (data: ForgotPasswordResult) => {
      setForgotPasswordResult(data);
    });

    // User events - server sends 'trainer-stats' on join and whenever coins,
    // title, inventory or zone unlocks change.
    newSocket.on('trainer-stats', (data: {
      id: number;
      username?: string;
      coins: number;
      title: string;
      level: number;
      xp: number;
      xpForCurrentLevel?: number;
      xpForNextLevel: number | null;
      currentZone: string;
      unlockedZones: string[];
      totalCaught: number;
      uniqueCaught: number;
      shinyCaught: number;
      shinyCharm: boolean;
      reactions: number;
      questions: number;
      drinks: number;
      balls: { pokeball: number; great: number; ultra: number; master: number };
      stones: Record<string, number>;
      profilePic?: string | null;
      status?: string;
      nameColor?: string;
    }) => {
      const username = data.username || localStorage.getItem('otychat_username') || 'Unknown';

      // Save credentials on successful login for auto-reconnect
      if (lastJoinCredentials.current) {
        localStorage.setItem('otychat_username', lastJoinCredentials.current.username);
        localStorage.setItem('otychat_password', lastJoinCredentials.current.password);
        lastJoinCredentials.current = null;
      }

      setUser({
        odId: String(data.id),
        odUserId: data.id,
        odName: username,
        odTitle: data.title || '',
        odCoins: data.coins,
        odDrinksTonight: data.drinks,
        odDrinksTotal: data.drinks,
        odReactions: data.reactions,
        odQuestions: data.questions,
        odDrawings: 0,
        odPokemon: data.totalCaught,
        odAchievements: [],
        odTrainerLevel: data.level,
        odTrainerXp: data.xp,
        odXpForCurrentLevel: data.xpForCurrentLevel || 0,
        odXpForNextLevel: data.xpForNextLevel,
        odCurrentZone: data.currentZone,
        odShinyCharm: data.shinyCharm,
        odProfilePic: data.profilePic || undefined,
        odStatus: data.status || '',
        odNameColor: data.nameColor || '#ec4899',
      });
      setBallInventory({
        great: data.balls.great,
        ultra: data.balls.ultra,
        master: data.balls.master,
      });
      setStoneInventory(mapStones(data.stones));
    });

    newSocket.on('user-count', (count: number) => {
      setOnlineCount(count);
    });

    newSocket.on('online-users', (users: { odName: string; odTitle: string; odProfilePic?: string }[]) => {
      setOnlineUsers(users);
      setOnlineCount(users.length);
    });

    newSocket.on('xp-gained', (data: { amount: number; newXP: number; level: number; currentLevelXP?: number; nextLevelXP: number | null }) => {
      setUser(prev => prev ? {
        ...prev,
        odTrainerXp: data.newXP,
        odTrainerLevel: data.level,
        odXpForCurrentLevel: data.currentLevelXP ?? prev.odXpForCurrentLevel,
        odXpForNextLevel: data.nextLevelXP,
      } : null);
    });

    newSocket.on('level-up', (data: { oldLevel: number; newLevel: number; newZonesUnlocked?: string[] }) => {
      const zone = data.newZonesUnlocked && data.newZonesUnlocked[0];
      addFeedItem({
        type: 'level-up',
        message: `You reached Level ${data.newLevel}!${zone ? ` New zone unlocked: ${zone}` : ''}`,
        icon: '🎉',
      });
      showNotice(`Level ${data.newLevel}!${zone ? ` ${zone} unlocked` : ''}`, 'success');
    });

    // Everyone else's activity, broadcast by the server
    newSocket.on('feed-event', (ev: {
      type: string;
      username?: string;
      fromUsername?: string;
      toUsername?: string;
      level?: number;
      achievement?: string;
      icon?: string;
      pokemonName?: string;
      isShiny?: boolean;
      toName?: string;
      message?: string;
    }) => {
      const me = usernameRef.current;
      if (ev.type === 'level-up' && ev.username && ev.username !== me) {
        addFeedItem({ type: 'level-up', message: `${ev.username} reached Level ${ev.level}`, icon: '🎉', username: ev.username });
      } else if (ev.type === 'achievement' && ev.username && ev.username !== me) {
        addFeedItem({ type: 'achievement', message: `${ev.username} unlocked ${ev.achievement}`, icon: ev.icon || '🏆', username: ev.username });
      } else if (ev.type === 'pokemon-caught' && ev.username && ev.username !== me) {
        addFeedItem({ type: 'pokemon-caught', message: `${ev.username} caught ${ev.isShiny ? 'a shiny ' : ''}${ev.pokemonName}`, icon: ev.isShiny ? '✨' : '⚡', username: ev.username });
      } else if (ev.type === 'pokemon-evolved' && ev.username && ev.username !== me) {
        addFeedItem({ type: 'pokemon', message: `${ev.username}'s Pokemon evolved into ${ev.toName}`, icon: '🌟', username: ev.username });
      } else if (ev.type === 'kudos' && ev.fromUsername && ev.fromUsername !== me && ev.toUsername !== me) {
        addFeedItem({ type: 'kudos', message: `${ev.fromUsername} gave kudos to ${ev.toUsername}`, icon: '💖', username: ev.fromUsername });
      }
    });

    newSocket.on('drink-logged-broadcast', (data: { username: string; count: number }) => {
      if (data.username === usernameRef.current) return;
      addFeedItem({ type: 'drink', message: `${data.username} logged a drink (${data.count} tonight)`, icon: '🍺', username: data.username });
    });

    // Questions (legacy presentation feed)
    newSocket.on('questions-sync', (serverQuestions: Array<{
      id: number;
      user_id: number;
      text: string | null;
      drawing: string | null;
      type: 'text' | 'drawing' | 'image' | null;
      created_at: string;
      username: string;
      upvotes?: number;
    }>) => {
      const mapped: Question[] = serverQuestions.map(sq => ({
        odId: String(sq.id),
        odUserId: sq.user_id,
        odUsername: sq.username,
        odContent: sq.text || '',
        odType: sq.type || (sq.drawing ? 'drawing' : 'text'),
        odImageData: sq.drawing || undefined,
        odUpvotes: sq.upvotes || 0,
        odHasUpvoted: false,
        odCreatedAt: sq.created_at,
      }));
      setQuestions(mapped);
    });

    newSocket.on('question-added', (serverQuestion: {
      id: number;
      user_id: number;
      text: string | null;
      drawing: string | null;
      type: 'text' | 'drawing' | 'image' | null;
      created_at: string;
      username: string;
      upvotes?: number;
    }) => {
      const questionId = String(serverQuestion.id);
      if (seenQuestionIds.current.has(questionId)) return;
      seenQuestionIds.current.add(questionId);

      const questionType = serverQuestion.type || (serverQuestion.drawing ? 'drawing' : 'text');
      const question: Question = {
        odId: questionId,
        odUserId: serverQuestion.user_id,
        odUsername: serverQuestion.username,
        odContent: serverQuestion.text || '',
        odType: questionType,
        odImageData: serverQuestion.drawing || undefined,
        odUpvotes: serverQuestion.upvotes || 0,
        odHasUpvoted: false,
        odCreatedAt: serverQuestion.created_at,
      };
      setQuestions(prev => [question, ...prev]);
    });

    newSocket.on('question-upvoted', (data: { questionId: number | string; votes: number }) => {
      const qId = String(data.questionId);
      setQuestions(prev => prev.map(q =>
        q.odId === qId ? { ...q, odUpvotes: data.votes, odHasUpvoted: true } : q
      ));
    });

    // ========== PERSISTENT CHAT ==========

    type ServerChatMessage = {
      id: number;
      user_id: number;
      text: string | null;
      drawing: string | null;
      type: 'text' | 'drawing' | 'image' | null;
      votes: number;
      in_queue: number;
      created_at: string;
      username: string;
    };

    const mapChat = (sm: ServerChatMessage, inQueue?: boolean): ChatMessage => ({
      odId: String(sm.id),
      odUserId: sm.user_id,
      odUsername: sm.username,
      odContent: sm.text || '',
      odType: sm.type || (sm.drawing ? 'drawing' : 'text'),
      odImageData: sm.drawing || undefined,
      odUpvotes: sm.votes || 0,
      odHasUpvoted: false,
      odInQueue: inQueue ?? sm.in_queue === 1,
      odCreatedAt: sm.created_at,
    });

    newSocket.on('chat-sync', (serverMessages: ServerChatMessage[]) => {
      const messages = serverMessages.map(sm => mapChat(sm));
      setChatMessages(messages);
      messages.forEach(m => seenChatIds.current.add(m.odId));
    });

    newSocket.on('queue-sync', (serverMessages: ServerChatMessage[]) => {
      setQueueMessages(serverMessages.map(sm => mapChat(sm, true)));
    });

    newSocket.on('chat-message-added', (serverMessage: ServerChatMessage) => {
      const messageId = String(serverMessage.id);
      if (seenChatIds.current.has(messageId)) return;
      seenChatIds.current.add(messageId);

      const message = mapChat(serverMessage);
      setChatMessages(prev => [...prev, message]);
      if (message.odUsername !== usernameRef.current) {
        const t = message.odType;
        addFeedItem({
          type: 'question',
          message: `${message.odUsername} sent a ${t === 'image' ? 'photo' : t === 'drawing' ? 'drawing' : 'message'}`,
          icon: t === 'image' ? '📷' : t === 'drawing' ? '🎨' : '💬',
          username: message.odUsername,
        });
      }
    });

    newSocket.on('queue-item-added', (serverMessage: ServerChatMessage) => {
      const message = mapChat(serverMessage, true);
      setQueueMessages(prev => prev.some(m => m.odId === message.odId) ? prev : [...prev, message]);
    });

    newSocket.on('chat-upvoted', (data: { messageId: number | string; votes: number }) => {
      const mId = String(data.messageId);
      setChatMessages(prev => prev.map(m =>
        m.odId === mId ? { ...m, odUpvotes: data.votes } : m
      ));
      setQueueMessages(prev => prev.map(m =>
        m.odId === mId ? { ...m, odUpvotes: data.votes } : m
      ));
    });

    newSocket.on('queue-item-dismissed', (data: { messageId: number | string }) => {
      const mId = String(data.messageId);
      setQueueMessages(prev => prev.filter(m => m.odId !== mId));
      setChatMessages(prev => prev.map(m =>
        m.odId === mId ? { ...m, odInQueue: false } : m
      ));
    });

    newSocket.on('queue-cleared', () => {
      setQueueMessages([]);
      setChatMessages(prev => prev.map(m => ({ ...m, odInQueue: false })));
    });

    newSocket.on('display-question-changed', (data: { messageId: number | string | null }) => {
      setDisplayedMessageId(data.messageId === null || data.messageId === undefined ? null : String(data.messageId));
    });

    // ========== POKEMON ==========

    newSocket.on('pokemon-spawn', (data: {
      odId: string;
      pokemonId: number;
      pokemonName: string;
      rarity: Pokemon['odRarity'];
      isShiny: boolean;
      zone: string;
      sprite: string;
      expiresAt: number;
    }) => {
      setCatchResult(null);
      setActivePokemon({
        odId: data.odId,
        odPokemonId: data.pokemonId,
        odName: data.pokemonName,
        odRarity: data.rarity,
        odIsShiny: data.isShiny,
        odZone: data.zone,
        odSpriteUrl: data.sprite,
        odExpiresAt: data.expiresAt,
      });
      if (spawnExpiryTimer.current) clearTimeout(spawnExpiryTimer.current);
      const msLeft = Math.max(0, data.expiresAt - Date.now());
      spawnExpiryTimer.current = setTimeout(() => {
        setActivePokemon(prev => (prev && prev.odId === data.odId ? null : prev));
      }, msLeft);
      addFeedItem({
        type: 'pokemon',
        message: `A wild ${data.isShiny ? 'shiny ' : ''}${data.pokemonName} appeared!`,
        icon: data.isShiny ? '✨' : '🌿',
      });
    });

    newSocket.on('pokemon-caught', (data: {
      pokemonId: number;
      pokemonName: string;
      isShiny: boolean;
      rewards: { coins: number; xp: number };
      sprite?: string;
      isQuickCatch?: boolean;
    }) => {
      if (spawnExpiryTimer.current) clearTimeout(spawnExpiryTimer.current);
      setActivePokemon(null);
      setCatchResult({
        kind: 'caught',
        message: `Gotcha! ${data.isShiny ? 'Shiny ' : ''}${data.pokemonName} was caught${data.isQuickCatch ? ' (quick catch bonus)' : ''}!`,
        pokemonName: data.pokemonName,
        isShiny: data.isShiny,
        sprite: data.sprite,
        coins: data.rewards?.coins,
        xp: data.rewards?.xp,
      });
      addFeedItem({
        type: 'pokemon-caught',
        message: `You caught ${data.isShiny ? 'a shiny ' : ''}${data.pokemonName}!`,
        icon: data.isShiny ? '✨' : '⚡',
      });
    });

    newSocket.on('catch-failed', (data: {
      reason?: string;
      message?: string;
      fled?: boolean;
      attemptsRemaining?: number;
      pokemonName?: string;
    }) => {
      if (data.fled) {
        if (spawnExpiryTimer.current) clearTimeout(spawnExpiryTimer.current);
        setActivePokemon(null);
      }
      setCatchResult({
        kind: 'failed',
        message: data.message || 'It broke free!',
        fled: !!data.fled,
        attemptsRemaining: data.attemptsRemaining,
        pokemonName: data.pokemonName,
      });
    });

    newSocket.on('pokedex-data', (list: Pokemon[]) => {
      setCaughtPokemon(Array.isArray(list) ? list : []);
    });

    newSocket.on('balls-updated', (inv: { great: number; ultra: number; master: number }) => {
      setBallInventory({ great: inv.great, ultra: inv.ultra, master: inv.master });
    });

    newSocket.on('zones-data', (data: { zones: Record<string, Zone> }) => {
      setZones(data.zones || (data as unknown as Record<string, Zone>));
    });

    newSocket.on('zone-changed', (data: { zone: string; zoneName: string }) => {
      setUser(prev => prev ? { ...prev, odCurrentZone: data.zone } : null);
      showNotice(`Now hunting in ${data.zoneName}`, 'success');
    });

    newSocket.on('zone-change-failed', (data: { message: string }) => {
      showNotice(data.message || 'Zone not unlocked', 'error');
    });

    newSocket.on('pokemon-evolved', (data: { toName: string }) => {
      showNotice(`Evolved into ${data.toName}!`, 'success');
    });

    newSocket.on('evolve-failed', (data: { message: string }) => {
      showNotice(data.message, 'error');
    });

    // ========== SHOP ==========

    newSocket.on('shop-items', (items: Record<string, Omit<ShopItem, 'id'>>) => {
      setShopItems(Object.entries(items).map(([id, item]) => ({ id, ...item })));
    });

    newSocket.on('shop-purchase', (data: { itemId: string; itemName: string; newBalance: number }) => {
      setUser(prev => prev ? { ...prev, odCoins: data.newBalance } : null);
      showNotice(`Bought ${data.itemName}`, 'success');
    });

    newSocket.on('shop-error', (data: { message: string }) => {
      showNotice(data.message || 'Cannot purchase', 'error');
    });

    // ========== ACHIEVEMENTS ==========

    newSocket.on('achievements-list', (data: AchievementData) => {
      setAchievementData(data);
    });

    newSocket.on('achievement-unlocked', (data: { achievement: string; icon: string; reward?: number }) => {
      addFeedItem({
        type: 'achievement',
        message: `Achievement unlocked: ${data.achievement}!`,
        icon: data.icon,
      });
      showNotice(`${data.icon} ${data.achievement}${data.reward ? ` (+${data.reward} coins)` : ''}`, 'success');
    });

    // ========== PROFILES ==========

    newSocket.on('user-profile', (profile: UserProfileData) => {
      setProfiles(prev => ({ ...prev, [profile.username]: profile }));
    });

    // ========== DRINKS ==========

    newSocket.on('drink-logged', (data: { tonight: number; total: number }) => {
      setUser(prev => prev ? { ...prev, odDrinksTonight: data.tonight, odDrinksTotal: data.total } : null);
    });

    // ========== KUDOS ==========

    newSocket.on('kudos-received', (data: { fromUsername: string; message: string; coins: number }) => {
      setUser(prev => prev ? { ...prev, odCoins: prev.odCoins + data.coins } : null);
      addFeedItem({
        type: 'kudos',
        message: data.message
          ? `${data.fromUsername} sent you kudos: "${data.message}" (+${data.coins} coins)`
          : `${data.fromUsername} sent you kudos! (+${data.coins} coins)`,
        icon: '💖',
        username: data.fromUsername,
      });
      showNotice(`${data.fromUsername} sent you kudos (+${data.coins} coins)`, 'success');
    });

    newSocket.on('kudos-sent', (data: { toUsername: string; coins: number }) => {
      setUser(prev => prev ? { ...prev, odCoins: prev.odCoins + data.coins } : null);
    });

    newSocket.on('kudos-error', (data: { message: string }) => {
      showNotice(data.message, 'error');
    });

    // ========== DMs ==========

    newSocket.on('dm-received', (dm: DM) => {
      setDms(prev => prev.some(d => d.odId === dm.odId) ? prev : [...prev, dm]);
      if (usernameRef.current && dm.odFromName !== usernameRef.current) {
        setUnreadDMCount(prev => prev + 1);
      }
    });

    newSocket.on('dm-history', (history: DM[]) => {
      setDms(history);
    });

    newSocket.on('unread-dm-count', (count: number) => {
      setUnreadDMCount(count);
    });

    // ========== LEADERBOARDS ==========

    newSocket.on('leaderboards', (data: Leaderboards) => {
      setLeaderboards(data);
    });

    // ========== POPCORN EMERGENCY ==========

    newSocket.on('popcorn-emergency-invite', (data: { emergencyId: string; hostUsername: string; invitees: string[]; expiresAt: number }) => {
      setEmergency({
        role: 'invitee',
        id: data.emergencyId,
        hostUsername: data.hostUsername,
        invitees: data.invitees.map(username => ({ username, status: 'pending' })),
        expiresAt: data.expiresAt,
      });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    });

    newSocket.on('popcorn-emergency-status', (data: { id: string; hostUsername: string; isAll: boolean; invitees: { username: string; status: EmergencyStatus }[]; expiresAt: number }) => {
      setEmergency({
        role: 'host',
        id: data.id,
        hostUsername: data.hostUsername,
        isAll: data.isAll,
        invitees: data.invitees,
        expiresAt: data.expiresAt,
      });
    });

    newSocket.on('popcorn-emergency-response', (data: { username: string; status: EmergencyStatus }) => {
      setEmergency(prev => {
        if (!prev) return prev;
        const invitees = prev.invitees.map(i => i.username === data.username ? { ...i, status: data.status } : i);
        const mine = data.username === usernameRef.current && data.status !== 'pending' ? data.status : prev.myResponse;
        return { ...prev, invitees, myResponse: mine };
      });
    });

    newSocket.on('popcorn-emergency-ended', (data: { reason?: string }) => {
      setEmergency(prev => {
        if (prev && prev.role === 'invitee' && !prev.myResponse && data?.reason === 'expired') {
          showNotice('The popcorn emergency timed out', 'info');
        }
        return null;
      });
    });

    newSocket.on('popcorn-emergency-error', (data: { message: string }) => {
      showNotice(data.message, 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // showNotice is stable (empty deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-login on page refresh if credentials are stored
  useEffect(() => {
    if (socket && !autoLoginAttempted.current && !user) {
      autoLoginAttempted.current = true;
      const storedUsername = localStorage.getItem('otychat_username');
      const storedPassword = localStorage.getItem('otychat_password');
      if (storedUsername && storedPassword) {
        lastJoinCredentials.current = { username: storedUsername, password: storedPassword };
        setPendingUsername(storedUsername);
        setPendingPassword(storedPassword);
        socket.connect();
      }
    }
  }, [socket, user]);

  // Connect socket when we have a pending username but socket isn't connected
  useEffect(() => {
    if (socket && !connected && pendingUsername) {
      socket.connect();
    }
  }, [socket, connected, pendingUsername]);

  // Emit join when socket connects and we have a pending username
  useEffect(() => {
    if (socket && connected && pendingUsername && pendingPassword !== null) {
      socket.emit('join', { username: pendingUsername, password: pendingPassword });
      setPendingUsername(null);
      setPendingPassword(null);
    }
  }, [socket, connected, pendingUsername, pendingPassword]);

  // Actions
  const join = useCallback((username: string, password: string) => {
    setJoinError(null);
    lastJoinCredentials.current = { username, password };
    setPendingUsername(username);
    setPendingPassword(password);
    if (socket) {
      if (!socket.connected) {
        socket.connect();
      } else {
        socket.emit('join', { username, password });
        setPendingUsername(null);
        setPendingPassword(null);
      }
    }
  }, [socket]);

  const forgotPassword = useCallback((username: string) => {
    setForgotPasswordResult(null);
    socket?.emit('forgot-password', { username });
  }, [socket]);

  const clearJoinError = useCallback(() => {
    setJoinError(null);
  }, []);

  const clearForgotPasswordResult = useCallback(() => {
    setForgotPasswordResult(null);
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    socket?.emit('send-emoji', { emoji });
  }, [socket]);

  const sendQuestion = useCallback((content: string, type: 'text' | 'drawing' | 'image', imageData?: string) => {
    socket?.emit('send-question', {
      text: content || null,
      drawing: imageData || null,
      type: type
    });
  }, [socket]);

  const upvoteQuestion = useCallback((questionId: string) => {
    socket?.emit('upvote-question', { questionId });
  }, [socket]);

  // Chat actions
  const sendChat = useCallback((content: string, type: 'text' | 'drawing' | 'image', imageData?: string) => {
    socket?.emit('send-chat', {
      text: content || null,
      drawing: imageData || null,
      type: type
    });
  }, [socket]);

  const sendToQueue = useCallback((content: string, type: 'text' | 'drawing' | 'image', imageData?: string) => {
    socket?.emit('send-to-queue', {
      text: content || null,
      drawing: imageData || null,
      type: type
    });
  }, [socket]);

  const upvoteChat = useCallback((messageId: string) => {
    socket?.emit('upvote-chat', { messageId });
    // Optimistic highlight; the server rejects repeat votes silently
    setChatMessages(prev => prev.map(m => m.odId === messageId ? { ...m, odHasUpvoted: true } : m));
  }, [socket]);

  // Queue actions
  const dismissFromQueue = useCallback((messageId: string) => {
    socket?.emit('dismiss-from-queue', { messageId });
  }, [socket]);

  const clearQueue = useCallback(() => {
    socket?.emit('clear-queue');
  }, [socket]);

  const showOnDisplay = useCallback((messageId: string) => {
    socket?.emit('show-on-display', { messageId });
  }, [socket]);

  const hideFromDisplay = useCallback(() => {
    socket?.emit('hide-from-display');
  }, [socket]);

  const catchPokemon = useCallback((odId: string, ballType: string) => {
    setCatchResult(null);
    socket?.emit('catch-pokemon', { odId, ballType });
  }, [socket]);

  const runFromPokemon = useCallback(() => {
    socket?.emit('run-from-pokemon');
    if (spawnExpiryTimer.current) clearTimeout(spawnExpiryTimer.current);
    setActivePokemon(null);
    setCatchResult(null);
  }, [socket]);

  const clearCatchResult = useCallback(() => {
    setCatchResult(null);
  }, []);

  const changeZone = useCallback((zone: string) => {
    socket?.emit('change-zone', { zone });
  }, [socket]);

  const logDrink = useCallback(() => {
    socket?.emit('log-drink');
  }, [socket]);

  const unlogDrink = useCallback(() => {
    socket?.emit('unlog-drink');
  }, [socket]);

  const buyItem = useCallback((itemId: string) => {
    socket?.emit('buy-item', { itemId });
  }, [socket]);

  const evolvePokemon = useCallback((pokemonId: number, method: 'level' | 'stone', stone?: string) => {
    socket?.emit('evolve-pokemon', { pokemonId, method, stone });
  }, [socket]);

  const sendDM = useCallback((toUsername: string, content: string, drawing?: string, image?: string) => {
    socket?.emit('send-dm', { toUsername, content, drawing: drawing || image });
  }, [socket]);

  const markDMsRead = useCallback((fromUsername: string) => {
    socket?.emit('mark-dms-read', { fromUsername });
    setDms(prev => {
      const readCount = prev.filter(dm => dm.odFromName === fromUsername && !dm.odRead).length;
      setUnreadDMCount(count => Math.max(0, count - readCount));
      return prev.map(dm => dm.odFromName === fromUsername ? { ...dm, odRead: true } : dm);
    });
  }, [socket]);

  const sendKudos = useCallback((toUsername: string, message: string) => {
    socket?.emit('send-kudos', { toUsername, message });
  }, [socket]);

  const updateProfile = useCallback((updates: { profilePic?: string; status?: string; title?: string; nameColor?: string }) => {
    socket?.emit('update-profile', updates);
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...(updates.profilePic !== undefined && { odProfilePic: updates.profilePic }),
        ...(updates.status !== undefined && { odStatus: updates.status }),
        ...(updates.title !== undefined && { odTitle: updates.title }),
        ...(updates.nameColor !== undefined && { odNameColor: updates.nameColor }),
      };
    });
  }, [socket]);

  const requestProfile = useCallback((username: string) => {
    socket?.emit('get-user-profile', { username });
  }, [socket]);

  const startEmergency = useCallback((invitees: string[] | 'all') => {
    socket?.emit('popcorn-emergency', { invitees });
  }, [socket]);

  const respondEmergency = useCallback((accepted: boolean) => {
    socket?.emit('popcorn-emergency-respond', { accepted });
    setEmergency(prev => prev ? { ...prev, myResponse: accepted ? 'accepted' : 'declined' } : prev);
  }, [socket]);

  const endEmergency = useCallback(() => {
    socket?.emit('popcorn-emergency-end');
    setEmergency(null);
  }, [socket]);

  const dismissEmergency = useCallback(() => {
    setEmergency(null);
  }, []);

  const leave = useCallback(() => {
    socket?.emit('leave');
    socket?.disconnect();
    setUser(null);
    setEmergency(null);
    localStorage.removeItem('otychat_username');
    localStorage.removeItem('otychat_password');
    autoLoginAttempted.current = false;
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      user,
      onlineUsers,
      onlineCount,
      questions,
      chatMessages,
      queueMessages,
      displayedMessageId,
      feed,
      activePokemon,
      caughtPokemon,
      catchResult,
      ballInventory,
      stoneInventory,
      zones,
      shopItems,
      achievementData,
      profiles,
      dms,
      unreadDMCount,
      leaderboards,
      joinError,
      forgotPasswordResult,
      notice,
      emergency,
      join,
      forgotPassword,
      clearJoinError,
      clearForgotPasswordResult,
      sendReaction,
      sendQuestion,
      upvoteQuestion,
      sendChat,
      sendToQueue,
      upvoteChat,
      dismissFromQueue,
      clearQueue,
      showOnDisplay,
      hideFromDisplay,
      catchPokemon,
      runFromPokemon,
      clearCatchResult,
      changeZone,
      logDrink,
      unlogDrink,
      buyItem,
      evolvePokemon,
      sendDM,
      markDMsRead,
      sendKudos,
      updateProfile,
      requestProfile,
      showNotice,
      dismissNotice,
      startEmergency,
      respondEmergency,
      endEmergency,
      dismissEmergency,
      leave,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
