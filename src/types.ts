/**
 * Race Tech Fusion - Shared Domain Types
 * Clean Architecture - Enterprise Domain Layer
 */

export interface Season {
  year: string;
  url: string;
}

export interface Circuit {
  circuitId: string;
  circuitName: string;
  url: string;
  locality: string;
  country: string;
  lat: string;
  long: string;
  image?: string; // Cacheable or generated image
}

export interface Session {
  name: string;
  date: string;
  time?: string;
}

export interface RaceWeekend {
  id: string; // Composite of season-round
  season: string;
  round: string;
  raceName: string;
  circuit: Circuit;
  date: string;
  time?: string;
  url: string;
  firstPractice?: Session;
  secondPractice?: Session;
  thirdPractice?: Session;
  qualifying?: Session;
  sprint?: Session;
}

export interface Team {
  constructorId: string;
  name: string;
  url: string;
  nationality: string;
  image?: string;
  championships?: number;
  established?: string;
  base?: string;
}

export interface Driver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  image?: string;
  careerStats?: {
    championships: number;
    podiums: number;
    wins: number;
    poles: number;
  };
}

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driver: Driver;
  team: Team;
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  team: Team;
}

export interface RaceResult {
  number: string;
  position: number;
  points: number;
  grid: number;
  laps: number;
  status: string;
  time?: string;
  fastestLap?: {
    rank: number;
    lap: number;
    time: string;
    avgSpeed: string;
  };
  driver: Driver;
  team: Team;
}

export interface RaceWeekendDetails extends RaceWeekend {
  results?: RaceResult[];
  aiInsights?: string; // Gemini-generated analysis
}

export interface DashboardStats {
  driverLeader: DriverStanding | null;
  constructorLeader: ConstructorStanding | null;
  nextRace: RaceWeekend | null;
  lastRaceResults: RaceWeekendDetails | null;
  seasonProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface LiveSession {
  id: string; // UUID
  raceId: string; // e.g. "2026-06"
  sessionKey: string; // OpenF1 session_key e.g. "9515"
  name: string; // e.g. "Monaco Grand Prix"
  sessionType: 'Practice' | 'Qualifying' | 'Sprint' | 'Race';
  status: 'scheduled' | 'active' | 'completed';
  date: string;
}

export interface LiveSessionResult {
  id: string;
  sessionKey: string;
  driverId: string;
  position: number;
  points: number;
  laps: number;
  grid: number;
  timeOrStatus: string;
  fastestLapTime?: string;
  gapToLeader: string;
  intervalAhead: string;
  lastLapTime: string;
}

export interface LiveLap {
  id: string;
  sessionKey: string;
  driverId: string;
  lapNumber: number;
  lapTime?: string;
  sector1?: string;
  sector2?: string;
  sector3?: string;
  isFastestLap?: boolean;
}

export interface LivePosition {
  id: string;
  sessionKey: string;
  driverId: string;
  x: number;
  y: number;
  timestamp: string;
  speed: number;
}

export interface LivePitStop {
  id: string;
  sessionKey: string;
  driverId: string;
  stopNumber: number;
  lapNumber: number;
  duration: string;
  tyreCompound: string;
  tyreAge: number; // in laps
  isCompleted: boolean;
}

export interface LiveWeatherData {
  id: string;
  sessionKey: string;
  timestamp: string;
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  rainfall: boolean;
}

export interface LiveRaceControlMessage {
  id: string;
  sessionKey: string;
  timestamp: string;
  message: string;
  flag: 'Green' | 'Yellow' | 'DoubleYellow' | 'Red' | 'SafetyCar' | 'VSC' | 'None';
}

export interface LiveTelemetry {
  id: string;
  sessionKey: string;
  driverId: string;
  timestamp: string;
  speed: number;
  throttle: number; // 0..100
  brake: boolean;
  gear: number;
  rpm: number;
  drs: boolean;
  x: number;
  y: number;
}

export interface LiveDriverSessionStatistic {
  id: string;
  sessionKey: string;
  driverId: string;
  topSpeed: number;
  fastestSector1: string;
  fastestSector2: string;
  fastestSector3: string;
  tyreCompound: string;
  tyreAge: number;
  stintLength: number;
}

export interface LiveSessionEvent {
  id: string;
  sessionKey: string;
  timestamp: string;
  eventType: 'Investigate' | 'Penalty' | 'Crash' | 'TrackLimit' | 'SessionStart' | 'SessionEnd';
  driverId?: string;
  detail: string;
}
