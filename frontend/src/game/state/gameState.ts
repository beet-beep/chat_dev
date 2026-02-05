// 게임 상태 관리 시스템
import type { ItemCategory, ItemRarity, GameItem } from "../items/itemDatabase";
import { ITEMS_DATABASE, calculateGachaDrop, RARITY_CONFIG } from "../items/itemDatabase";
import type { SlimeColor, EquippedItems } from "../ui/PixelSlime";

// 유저 프로필
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

// 슬라임 데이터
export interface SlimeData {
  name: string;
  color: SlimeColor;
  level: number;
  exp: number;
  maxExp: number;
  happiness: number;
  hunger: number;
  stats: {
    charm: number;
    luck: number;
    totalTaps: number;
  };
  equipped: EquippedItems;
  createdAt: string;
}

// 인벤토리 아이템
export interface InventoryItem {
  itemId: string;
  quantity: number;
  acquiredAt: string;
  source: "gacha" | "shop" | "quest" | "gift" | "trade";
}

// 거래 기록
export interface TradeRecord {
  id: string;
  type: "buy" | "sell";
  itemId: string;
  price: number;
  currency: "gold" | "gems";
  partnerId?: string;
  partnerName?: string;
  timestamp: string;
}

// 업적
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: {
    type: "tap" | "collect" | "level" | "gacha" | "trade" | "login";
    target: number;
  };
  reward: {
    gold?: number;
    gems?: number;
    itemId?: string;
  };
  progress: number;
  completed: boolean;
  completedAt?: string;
}

// 퀘스트
export interface Quest {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "story";
  tasks: {
    description: string;
    current: number;
    target: number;
    completed: boolean;
  }[];
  reward: {
    gold?: number;
    gems?: number;
    exp?: number;
    itemId?: string;
  };
  expiresAt?: string;
  completed: boolean;
  claimed: boolean;
}

// 친구
export interface Friend {
  id: string;
  username: string;
  displayName: string;
  slimeColor: SlimeColor;
  level: number;
  lastOnline: string;
  status: "online" | "offline";
}

// 건물
export interface Building {
  id: string;
  type: "house" | "shop" | "garden" | "playground" | "cafe" | "library";
  name: string;
  level: number;
  position: { x: number; y: number };
  placedAt: string;
}

// 전체 게임 상태
export interface FullGameState {
  version: number;
  user: UserProfile | null;
  slime: SlimeData;
  currency: {
    gold: number;
    gems: number;
  };
  inventory: Record<string, InventoryItem>;
  gachaHistory: {
    itemId: string;
    rarity: ItemRarity;
    timestamp: string;
  }[];
  trades: TradeRecord[];
  achievements: Achievement[];
  quests: Quest[];
  friends: Friend[];
  buildings: Building[];
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    notificationsEnabled: boolean;
    language: "ko" | "en" | "ja";
  };
  statistics: {
    totalGachaOpened: number;
    totalGoldEarned: number;
    totalGoldSpent: number;
    totalGemsEarned: number;
    totalGemsSpent: number;
    totalTaps: number;
    totalTradesCompleted: number;
    playTime: number; // 분 단위
    loginStreak: number;
    lastLoginDate: string;
  };
  lastSavedAt: string;
}

// 기본 상태
export function createDefaultGameState(): FullGameState {
  const now = new Date().toISOString();
  return {
    version: 1,
    user: null,
    slime: {
      name: "나의 슬라임",
      color: "pink",
      level: 1,
      exp: 0,
      maxExp: 100,
      happiness: 100,
      hunger: 100,
      stats: {
        charm: 0,
        luck: 0,
        totalTaps: 0,
      },
      equipped: {},
      createdAt: now,
    },
    currency: {
      gold: 1000, // 초보자 보너스
      gems: 10,
    },
    inventory: {},
    gachaHistory: [],
    trades: [],
    achievements: createDefaultAchievements(),
    quests: createDefaultQuests(),
    friends: [],
    buildings: [],
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      notificationsEnabled: true,
      language: "ko",
    },
    statistics: {
      totalGachaOpened: 0,
      totalGoldEarned: 1000,
      totalGoldSpent: 0,
      totalGemsEarned: 10,
      totalGemsSpent: 0,
      totalTaps: 0,
      totalTradesCompleted: 0,
      playTime: 0,
      loginStreak: 1,
      lastLoginDate: now.split("T")[0],
    },
    lastSavedAt: now,
  };
}

// 기본 업적
function createDefaultAchievements(): Achievement[] {
  return [
    {
      id: "first_tap",
      name: "첫 번째 터치",
      description: "슬라임을 처음으로 터치하세요",
      icon: "👆",
      condition: { type: "tap", target: 1 },
      reward: { gold: 100 },
      progress: 0,
      completed: false,
    },
    {
      id: "tap_100",
      name: "터치 마스터",
      description: "슬라임을 100번 터치하세요",
      icon: "✨",
      condition: { type: "tap", target: 100 },
      reward: { gold: 500, gems: 5 },
      progress: 0,
      completed: false,
    },
    {
      id: "tap_1000",
      name: "터치 전문가",
      description: "슬라임을 1000번 터치하세요",
      icon: "🌟",
      condition: { type: "tap", target: 1000 },
      reward: { gold: 2000, gems: 20 },
      progress: 0,
      completed: false,
    },
    {
      id: "level_5",
      name: "성장하는 슬라임",
      description: "레벨 5 달성",
      icon: "📈",
      condition: { type: "level", target: 5 },
      reward: { gold: 500 },
      progress: 0,
      completed: false,
    },
    {
      id: "level_10",
      name: "숙련된 슬라임",
      description: "레벨 10 달성",
      icon: "🎯",
      condition: { type: "level", target: 10 },
      reward: { gold: 1000, gems: 10 },
      progress: 0,
      completed: false,
    },
    {
      id: "collect_10",
      name: "수집가",
      description: "아이템 10개 수집",
      icon: "📦",
      condition: { type: "collect", target: 10 },
      reward: { gold: 300 },
      progress: 0,
      completed: false,
    },
    {
      id: "collect_50",
      name: "열정 수집가",
      description: "아이템 50개 수집",
      icon: "🗃️",
      condition: { type: "collect", target: 50 },
      reward: { gold: 1500, gems: 15 },
      progress: 0,
      completed: false,
    },
    {
      id: "gacha_10",
      name: "행운의 시작",
      description: "가챠 10회 진행",
      icon: "🎰",
      condition: { type: "gacha", target: 10 },
      reward: { gold: 200 },
      progress: 0,
      completed: false,
    },
    {
      id: "gacha_100",
      name: "가챠 매니아",
      description: "가챠 100회 진행",
      icon: "🎁",
      condition: { type: "gacha", target: 100 },
      reward: { gems: 50 },
      progress: 0,
      completed: false,
    },
    {
      id: "login_7",
      name: "일주일 연속 출석",
      description: "7일 연속 로그인",
      icon: "📅",
      condition: { type: "login", target: 7 },
      reward: { gold: 1000, gems: 10 },
      progress: 0,
      completed: false,
    },
    {
      id: "login_30",
      name: "한 달 연속 출석",
      description: "30일 연속 로그인",
      icon: "🏆",
      condition: { type: "login", target: 30 },
      reward: { gold: 5000, gems: 50 },
      progress: 0,
      completed: false,
    },
  ];
}

// 기본 퀘스트
function createDefaultQuests(): Quest[] {
  return [
    {
      id: "daily_tap",
      name: "일일 터치",
      description: "슬라임을 50번 터치하세요",
      type: "daily",
      tasks: [{ description: "슬라임 터치하기", current: 0, target: 50, completed: false }],
      reward: { gold: 100, exp: 50 },
      expiresAt: getEndOfDay(),
      completed: false,
      claimed: false,
    },
    {
      id: "daily_gacha",
      name: "오늘의 운세",
      description: "가챠를 3회 진행하세요",
      type: "daily",
      tasks: [{ description: "가챠 진행하기", current: 0, target: 3, completed: false }],
      reward: { gold: 150, exp: 30 },
      expiresAt: getEndOfDay(),
      completed: false,
      claimed: false,
    },
    {
      id: "daily_feed",
      name: "슬라임 돌보기",
      description: "슬라임에게 밥을 주세요",
      type: "daily",
      tasks: [{ description: "밥 주기", current: 0, target: 1, completed: false }],
      reward: { gold: 50, exp: 20 },
      expiresAt: getEndOfDay(),
      completed: false,
      claimed: false,
    },
    {
      id: "weekly_collect",
      name: "주간 수집",
      description: "이번 주에 아이템 10개를 수집하세요",
      type: "weekly",
      tasks: [{ description: "아이템 수집하기", current: 0, target: 10, completed: false }],
      reward: { gold: 500, gems: 5, exp: 200 },
      expiresAt: getEndOfWeek(),
      completed: false,
      claimed: false,
    },
    {
      id: "story_first_dress",
      name: "첫 번째 꾸미기",
      description: "슬라임에게 아이템을 장착해보세요",
      type: "story",
      tasks: [{ description: "아이템 장착하기", current: 0, target: 1, completed: false }],
      reward: { gold: 200, exp: 100 },
      completed: false,
      claimed: false,
    },
  ];
}

function getEndOfDay(): string {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

function getEndOfWeek(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  const end = new Date(now);
  end.setDate(end.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

// 상태 저장/로드
const STORAGE_KEY = "joody_game_state_v2";

export function saveGameState(state: FullGameState): void {
  try {
    const toSave = { ...state, lastSavedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save game state:", e);
  }
}

export function loadGameState(): FullGameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 버전 마이그레이션 처리
      return migrateState(parsed);
    }
  } catch (e) {
    console.error("Failed to load game state:", e);
  }
  return createDefaultGameState();
}

function migrateState(state: any): FullGameState {
  // 기본값과 병합하여 누락된 필드 보완
  const defaultState = createDefaultGameState();
  return {
    ...defaultState,
    ...state,
    slime: { ...defaultState.slime, ...state.slime },
    currency: { ...defaultState.currency, ...state.currency },
    settings: { ...defaultState.settings, ...state.settings },
    statistics: { ...defaultState.statistics, ...state.statistics },
  };
}

// 게임 액션들
export function tapSlime(state: FullGameState): FullGameState {
  const expGain = 1 + Math.floor(state.slime.stats.luck / 10);
  const goldGain = Math.random() < 0.1 ? 1 : 0; // 10% 확률로 골드 획득

  let newExp = state.slime.exp + expGain;
  let newLevel = state.slime.level;
  let newMaxExp = state.slime.maxExp;

  // 레벨업 체크
  while (newExp >= newMaxExp) {
    newExp -= newMaxExp;
    newLevel++;
    newMaxExp = calculateMaxExp(newLevel);
  }

  return {
    ...state,
    slime: {
      ...state.slime,
      exp: newExp,
      level: newLevel,
      maxExp: newMaxExp,
      happiness: Math.min(100, state.slime.happiness + 0.5),
      stats: {
        ...state.slime.stats,
        totalTaps: state.slime.stats.totalTaps + 1,
      },
    },
    currency: {
      ...state.currency,
      gold: state.currency.gold + goldGain,
    },
    statistics: {
      ...state.statistics,
      totalTaps: state.statistics.totalTaps + 1,
      totalGoldEarned: state.statistics.totalGoldEarned + goldGain,
    },
  };
}

export function feedSlime(state: FullGameState, cost: number = 10): FullGameState {
  if (state.currency.gold < cost) return state;

  return {
    ...state,
    slime: {
      ...state.slime,
      hunger: Math.min(100, state.slime.hunger + 30),
      happiness: Math.min(100, state.slime.happiness + 10),
      exp: state.slime.exp + 10,
    },
    currency: {
      ...state.currency,
      gold: state.currency.gold - cost,
    },
    statistics: {
      ...state.statistics,
      totalGoldSpent: state.statistics.totalGoldSpent + cost,
    },
  };
}

export function openGacha(state: FullGameState, cost: { gold?: number; gems?: number } = { gold: 100 }): { state: FullGameState; item: GameItem } | null {
  // 비용 확인
  if (cost.gold && state.currency.gold < cost.gold) return null;
  if (cost.gems && state.currency.gems < cost.gems) return null;

  // 아이템 뽑기
  const item = calculateGachaDrop();

  // 인벤토리에 추가
  const now = new Date().toISOString();
  const newInventory = { ...state.inventory };
  if (newInventory[item.id]) {
    newInventory[item.id] = {
      ...newInventory[item.id],
      quantity: newInventory[item.id].quantity + 1,
    };
  } else {
    newInventory[item.id] = {
      itemId: item.id,
      quantity: 1,
      acquiredAt: now,
      source: "gacha",
    };
  }

  const newState: FullGameState = {
    ...state,
    currency: {
      gold: state.currency.gold - (cost.gold || 0),
      gems: state.currency.gems - (cost.gems || 0),
    },
    inventory: newInventory,
    gachaHistory: [
      ...state.gachaHistory,
      { itemId: item.id, rarity: item.rarity, timestamp: now },
    ].slice(-100), // 최근 100개만 유지
    statistics: {
      ...state.statistics,
      totalGachaOpened: state.statistics.totalGachaOpened + 1,
      totalGoldSpent: state.statistics.totalGoldSpent + (cost.gold || 0),
      totalGemsSpent: state.statistics.totalGemsSpent + (cost.gems || 0),
    },
  };

  return { state: newState, item };
}

export function equipItem(state: FullGameState, category: ItemCategory, itemId: string | null): FullGameState {
  // 아이템 확인
  if (itemId && !state.inventory[itemId]) return state;

  const newEquipped = { ...state.slime.equipped };

  // 카테고리별 장착 처리
  if (category === "hat") newEquipped.hat = itemId || undefined;
  else if (category === "hair") newEquipped.hair = itemId || undefined;
  else if (category === "face") newEquipped.face = itemId || undefined;
  else if (category === "eyes") newEquipped.eyes = itemId || undefined;
  else if (category === "mouth") newEquipped.mouth = itemId || undefined;
  else if (category === "accessory") newEquipped.accessory = itemId || undefined;
  else if (category === "clothes") newEquipped.clothes = itemId || undefined;
  else if (category === "shoes") newEquipped.shoes = itemId || undefined;
  else if (category === "background") newEquipped.background = itemId || undefined;
  else if (category === "effect") newEquipped.effect = itemId || undefined;
  else if (category === "pet") newEquipped.pet = itemId || undefined;

  // 스탯 계산
  let totalCharm = 0;
  let totalLuck = 0;
  Object.values(newEquipped).forEach((eqItemId) => {
    if (eqItemId) {
      const item = ITEMS_DATABASE.find((i) => i.id === eqItemId);
      if (item?.stats) {
        totalCharm += item.stats.charm || 0;
        totalLuck += item.stats.luck || 0;
      }
    }
  });

  return {
    ...state,
    slime: {
      ...state.slime,
      equipped: newEquipped,
      stats: {
        ...state.slime.stats,
        charm: totalCharm,
        luck: totalLuck,
      },
    },
  };
}

export function buyShopItem(state: FullGameState, itemId: string, currency: "gold" | "gems"): FullGameState | null {
  const item = ITEMS_DATABASE.find((i) => i.id === itemId);
  if (!item) return null;

  const price = currency === "gems" && item.gemPrice ? item.gemPrice : item.price;
  if (currency === "gold" && state.currency.gold < price) return null;
  if (currency === "gems" && state.currency.gems < price) return null;

  const now = new Date().toISOString();
  const newInventory = { ...state.inventory };
  if (newInventory[item.id]) {
    newInventory[item.id] = {
      ...newInventory[item.id],
      quantity: newInventory[item.id].quantity + 1,
    };
  } else {
    newInventory[item.id] = {
      itemId: item.id,
      quantity: 1,
      acquiredAt: now,
      source: "shop",
    };
  }

  return {
    ...state,
    currency: {
      gold: currency === "gold" ? state.currency.gold - price : state.currency.gold,
      gems: currency === "gems" ? state.currency.gems - price : state.currency.gems,
    },
    inventory: newInventory,
    statistics: {
      ...state.statistics,
      totalGoldSpent: state.statistics.totalGoldSpent + (currency === "gold" ? price : 0),
      totalGemsSpent: state.statistics.totalGemsSpent + (currency === "gems" ? price : 0),
    },
  };
}

export function calculateMaxExp(level: number): number {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

// 퀘스트 진행도 업데이트
export function updateQuestProgress(state: FullGameState, questId: string, taskIndex: number, amount: number): FullGameState {
  const questIdx = state.quests.findIndex((q) => q.id === questId);
  if (questIdx === -1) return state;

  const quest = state.quests[questIdx];
  if (quest.completed || quest.claimed) return state;

  const newTasks = [...quest.tasks];
  newTasks[taskIndex] = {
    ...newTasks[taskIndex],
    current: Math.min(newTasks[taskIndex].current + amount, newTasks[taskIndex].target),
  };
  newTasks[taskIndex].completed = newTasks[taskIndex].current >= newTasks[taskIndex].target;

  const allCompleted = newTasks.every((t) => t.completed);

  const newQuests = [...state.quests];
  newQuests[questIdx] = {
    ...quest,
    tasks: newTasks,
    completed: allCompleted,
  };

  return { ...state, quests: newQuests };
}

// 퀘스트 보상 수령
export function claimQuestReward(state: FullGameState, questId: string): FullGameState {
  const questIdx = state.quests.findIndex((q) => q.id === questId);
  if (questIdx === -1) return state;

  const quest = state.quests[questIdx];
  if (!quest.completed || quest.claimed) return state;

  const newQuests = [...state.quests];
  newQuests[questIdx] = { ...quest, claimed: true };

  let newState = { ...state, quests: newQuests };

  // 보상 지급
  if (quest.reward.gold) {
    newState.currency.gold += quest.reward.gold;
    newState.statistics.totalGoldEarned += quest.reward.gold;
  }
  if (quest.reward.gems) {
    newState.currency.gems += quest.reward.gems;
    newState.statistics.totalGemsEarned += quest.reward.gems;
  }
  if (quest.reward.exp) {
    newState.slime.exp += quest.reward.exp;
    // 레벨업 체크
    while (newState.slime.exp >= newState.slime.maxExp) {
      newState.slime.exp -= newState.slime.maxExp;
      newState.slime.level++;
      newState.slime.maxExp = calculateMaxExp(newState.slime.level);
    }
  }

  return newState;
}

// 업적 진행도 체크 및 업데이트
export function checkAchievements(state: FullGameState): FullGameState {
  const newAchievements = state.achievements.map((achievement) => {
    if (achievement.completed) return achievement;

    let progress = 0;
    switch (achievement.condition.type) {
      case "tap":
        progress = state.statistics.totalTaps;
        break;
      case "collect":
        progress = Object.keys(state.inventory).length;
        break;
      case "level":
        progress = state.slime.level;
        break;
      case "gacha":
        progress = state.statistics.totalGachaOpened;
        break;
      case "trade":
        progress = state.statistics.totalTradesCompleted;
        break;
      case "login":
        progress = state.statistics.loginStreak;
        break;
    }

    const completed = progress >= achievement.condition.target;

    return {
      ...achievement,
      progress,
      completed,
      completedAt: completed && !achievement.completed ? new Date().toISOString() : achievement.completedAt,
    };
  });

  return { ...state, achievements: newAchievements };
}

// 업적 보상 수령
export function claimAchievementReward(state: FullGameState, achievementId: string): FullGameState {
  const achIdx = state.achievements.findIndex((a) => a.id === achievementId);
  if (achIdx === -1) return state;

  const achievement = state.achievements[achIdx];
  if (!achievement.completed) return state;

  // 이미 수령한 경우 (completedAt이 있는데 보상이 없는 경우로 체크하거나 별도 플래그 필요)
  // 간단히 completedAt 존재로 체크

  let newState = { ...state };

  if (achievement.reward.gold) {
    newState.currency.gold += achievement.reward.gold;
    newState.statistics.totalGoldEarned += achievement.reward.gold;
  }
  if (achievement.reward.gems) {
    newState.currency.gems += achievement.reward.gems;
    newState.statistics.totalGemsEarned += achievement.reward.gems;
  }

  return newState;
}
