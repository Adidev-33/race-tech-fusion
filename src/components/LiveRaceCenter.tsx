import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  WifiOff, 
  Tv, 
  Flag, 
  Wind, 
  Thermometer, 
  CloudRain, 
  Timer, 
  Gauge, 
  Sparkles, 
  Compass, 
  ShieldAlert 
} from 'lucide-react';
import { getDriverMeta, getTeamColor, getOfficialTeamName } from '../utils/f1Data.js';
import { DriverStanding } from '../types.js';
import { TeamLogo, CountryFlag, DriverNumberBadge, DriverAvatar } from './F1Logos.js';

interface TimingRecord {
  driverId: string;
  position: number;
  laps: number;
  gapToLeader: string;
  intervalAhead: string;
  lastLapTime: string;
  timeOrStatus: string;
}

interface WeatherData {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  rainfall: boolean;
}

interface RaceControlMsg {
  id: string;
  timestamp: string;
  message: string;
  flag: 'Green' | 'Yellow' | 'DoubleYellow' | 'Red' | 'SafetyCar' | 'VSC' | 'None';
}

export default function LiveRaceCenter() {
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [session, setSession] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<TimingRecord[]>([]);
  const [lastWeather, setLastWeather] = useState<WeatherData | null>(null);
  const [messages, setMessages] = useState<RaceControlMsg[]>([]);
  const [sessionTimeLeft, setSessionTimeLeft] = useState('1:24:15');
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [activeSessionInfo, setActiveSessionInfo] = useState<any>(null);
  const [nextSessionInfo, setNextSessionInfo] = useState<any>(null);
  const [countdownText, setCountdownText] = useState('');

  const socketRef = useRef<WebSocket | null>(null);

  // Connection management
  const connectWebSocket = () => {
    setSocketStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setSocketStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        switch (type) {
          case 'INIT':
            setSession(data.session);
            if (data.results && data.results.length > 0) {
              setLeaderboard(data.results);
            }
            if (data.weather) {
              setLastWeather(data.weather);
            }
            if (data.raceControl) {
              setMessages(data.raceControl);
            }
            break;

          case 'SESSION_START':
            setSession(data.session);
            setLeaderboard(data.results || []);
            setLastWeather(data.weather || null);
            break;

          case 'SESSION_END':
            if (session) {
              setSession({ ...session, status: 'completed' });
            }
            break;

          case 'TELEMETRY_TICK':
            if (data.results && data.results.length > 0) {
              setLeaderboard(data.results);
            }
            break;

          case 'WEATHER_UPDATE':
            setLastWeather(data);
            break;

          case 'RACE_CONTROL':
            setMessages((prev) => [data, ...prev].slice(0, 40));
            break;

          default:
            break;
        }
      } catch (err) {
        console.warn('Error handling WS incoming message:', err);
      }
    };

    ws.onclose = () => {
      setSocketStatus('disconnected');
      setTimeout(() => {
        if (socketRef.current === ws) {
          connectWebSocket();
        }
      }, 4000);
    };

    ws.onerror = () => {
      setSocketStatus('disconnected');
    };
  };

  useEffect(() => {
    connectWebSocket();
    fetchLiveStatus();
    fetchActiveSession();

    // Fetch driver standings for metadata mapping
    async function loadStandings() {
      try {
        const res = await fetch('/api/standings/drivers');
        if (res.ok) {
          const data = await res.json();
          setStandings(data);
        }
      } catch (err) {
        console.warn('Failed to load standings mapping:', err);
      }
    }
    loadStandings();

    // Session clock timer
    const interval = setInterval(() => {
      setSessionTimeLeft((prev) => {
        const parts = prev.split(':').map(Number);
        let [h, m, s] = parts;
        s--;
        if (s < 0) {
          s = 59;
          m--;
          if (m < 0) {
            m = 59;
            h--;
          }
        }
        if (h < 0) return '00:00:00';
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      });
    }, 1000);

    // Poll live status periodically
    const liveStatusInterval = setInterval(fetchLiveStatus, 10000);

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearInterval(interval);
      clearInterval(liveStatusInterval);
    };
  }, []);

  const fetchLiveStatus = async () => {
    try {
      const res = await fetch('/api/live/status');
      if (res.ok) {
        const data = await res.json();
        setIsLive(data.live);
        setActiveSessionInfo(data.activeSession);
        setNextSessionInfo(data.nextSession);
      }
    } catch (e) {
      console.warn('Error fetching live status:', e);
    }
  };

  // Countdown Timer logic
  useEffect(() => {
    if (!nextSessionInfo?.startTime) return;

    const interval = setInterval(() => {
      const start = new Date(nextSessionInfo.startTime).getTime();
      const now = new Date().getTime();
      const diff = start - now;

      if (diff <= 0) {
        setCountdownText('00:00:00:00');
        fetchLiveStatus();
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdownText(
          `${days.toString().padStart(2, '0')}d : ${hours
            .toString()
            .padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs
            .toString()
            .padStart(2, '0')}s`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextSessionInfo]);

  const fetchActiveSession = async () => {
    try {
      const res = await fetch('/api/live/session');
      if (res.ok) {
        const info = await res.json();
        if (info.active) {
          setSession(info.session);
          fetchTimingBoard();
        }
      }
    } catch (e) {
      console.warn('Error fetching active session info:', e);
    }
  };

  const fetchTimingBoard = async () => {
    try {
      const res = await fetch('/api/live/timing');
      if (res.ok) setLeaderboard(await res.json());

      const wRes = await fetch('/api/live/weather');
      if (wRes.ok) {
        const weatherHistory = await wRes.json();
        if (weatherHistory.length > 0) setLastWeather(weatherHistory[weatherHistory.length - 1]);
      }

      const mRes = await fetch('/api/live/race-control');
      if (mRes.ok) setMessages(await mRes.json());
    } catch (e) {
      console.warn('Error filling initial timing data:', e);
    }
  };

  const currentFlag = messages[0]?.flag || 'None';
  const flagColorClass = (flag: string) => {
    switch (flag) {
      case 'Green': return 'bg-emerald-600 text-white';
      case 'Yellow': return 'bg-amber-500 text-black animate-pulse';
      case 'DoubleYellow': return 'bg-amber-600 text-white animate-pulse';
      case 'Red': return 'bg-red-600 text-white animate-pulse';
      case 'SafetyCar': return 'bg-orange-500 text-black';
      case 'VSC': return 'bg-orange-600 text-white';
      default: return 'bg-neutral-900 text-neutral-400 border border-neutral-800';
    }
  };

  // Show offline/countdown screen when no live event
  if (!isLive) {
    return (
      <div className="max-w-4xl mx-auto py-10 sm:py-16 px-4">
        <div className="text-center space-y-8 p-6 sm:p-10 bg-neutral-950 border border-neutral-900 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-neutral-900 to-red-600" />
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/10 flex items-center justify-center mx-auto text-red-500 border border-red-500/20 animate-pulse">
            <Timer className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-3">
            <span className="font-mono text-xs font-black tracking-widest text-red-500 uppercase bg-red-950/20 px-3 py-1.5 rounded-full border border-red-900/30">
              Live Ingestion Gateway Offline
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans uppercase">
              Live Race Centre
            </h1>
            <p className="text-xs text-neutral-400 font-mono max-w-lg mx-auto leading-relaxed">
              Real-time telemetry, live driver coordinates, and sector timings are only broadcast during live Formula 1 sessions.
            </p>
          </div>

          {nextSessionInfo ? (
            <div className="p-4 sm:p-6 bg-black/40 border border-neutral-900/60 rounded-xl space-y-6 max-w-xl mx-auto">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  NEXT SCHEDULED EVENT
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase font-sans">
                  {nextSessionInfo.raceName}
                </h2>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-emerald-400 font-bold uppercase mt-1">
                  🏁 {nextSessionInfo.sessionName}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-900 pt-5 text-left font-mono text-xs">
                <div className="space-y-1 bg-neutral-900/40 p-3 rounded border border-neutral-900">
                  <span className="text-neutral-500 uppercase block text-[9px]">START TIME (UTC)</span>
                  <span className="text-white font-extrabold text-xs sm:text-sm break-all">
                    {new Date(nextSessionInfo.startTime).toUTCString()}
                  </span>
                </div>
                <div className="space-y-1 bg-neutral-900/40 p-3 rounded border border-neutral-900">
                  <span className="text-neutral-500 uppercase block text-[9px]">LOCAL TIME</span>
                  <span className="text-white font-extrabold text-xs sm:text-sm break-all">
                    {new Date(nextSessionInfo.startTime).toLocaleString()}
                  </span>
                </div>
              </div>

              {countdownText && (
                <div className="border-t border-neutral-900 pt-5 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">
                    COUNTDOWN TO GREEN FLAG
                  </span>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono tracking-widest animate-pulse bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
                    {countdownText}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 bg-neutral-900/40 border border-neutral-900 rounded-xl max-w-md mx-auto">
              <p className="text-xs font-mono text-neutral-400">
                All 2026 season events have concluded. Stay tuned for future synchronization packages!
              </p>
            </div>
          )}

          <div className="text-[10px] text-neutral-500 font-mono pt-4 border-t border-neutral-900/50">
            Real-time feed ingests official telemetry streams on-demand.
          </div>
        </div>
      </div>
    );
  }

  // Live session is active — show the real-time timing board
  return (
    <div className="space-y-6">
      {/* Real-time Operations Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 bg-neutral-950 border border-neutral-900 rounded-xl shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2 uppercase">
              REAL-TIME OPERATIONS CENTER
            </h1>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
            State-Authoritative F1 Live Timing, Sector Diagnostics, &amp; OpenF1 Ingestion Gateway.
          </p>
        </div>

        {/* Real-time Link Status Badge */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => connectWebSocket()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase border transition-colors border-neutral-900 bg-black text-neutral-400 hover:text-white hover:bg-neutral-900"
          >
            {socketStatus === 'connected' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">LINK ACTIVE</span>
              </>
            ) : socketStatus === 'connecting' ? (
              <>
                <Timer className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span className="text-amber-500">NEGOTIATING...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="text-red-500 font-black">DISCONNECTED (RETRIES)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {session ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Main 2D Leaderboard Table & telemetry dashboard */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Live Timing Board */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-black px-4 sm:px-5 py-3.5 border-b border-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-red-500" />
                  <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-neutral-300">
                    LIVE FIA TIMING BOARD
                  </span>
                </div>
                {session && (
                  <div className="flex items-center gap-3 sm:gap-4 font-mono text-[10px]">
                    <span className="text-neutral-500">SESSION: <span className="text-emerald-500 font-bold uppercase">{session.sessionType}</span></span>
                    <span className="text-neutral-500 hidden sm:inline">KEY: <span className="text-white font-bold">{session.sessionKey}</span></span>
                    <span className="text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded font-black tracking-wider flex items-center gap-1">
                      <Timer className="w-3 h-3 text-red-500" /> {sessionTimeLeft}
                    </span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-neutral-950 text-neutral-500 font-mono text-[10px] uppercase border-b border-neutral-900 select-none">
                      <th className="py-3 px-3 sm:px-4 text-center w-12">POS</th>
                      <th className="py-3 px-3 sm:px-4">DRIVER</th>
                      <th className="py-3 px-3 sm:px-4 hidden md:table-cell">CONSTRUCTOR</th>
                      <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">POINTS</th>
                      <th className="py-3 px-3 sm:px-4">LAPS</th>
                      <th className="py-3 px-3 sm:px-4">GAP TO LEADER</th>
                      <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">INTERVAL AHEAD</th>
                      <th className="py-3 px-3 sm:px-4 text-right">LAST LAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {leaderboard.map((item, idx) => {
                        const teamColor = getTeamColor(item.driverId);
                        const names = item.driverId.replace('_', ' ').split(' ');
                        const dCode = item.driverId.slice(0, 3).toUpperCase();
                        
                        const standing = standings.find(s => s.driver.driverId === item.driverId);
                        const constructorId = standing?.team?.constructorId || item.driverId;
                        const driverNumber = standing?.driver?.permanentNumber || '1';
                        const nationality = standing?.driver?.nationality || '';
                        const teamName = standing?.team?.name || 'Unknown';
                        
                        return (
                          <motion.tr
                            key={item.driverId}
                            layoutId={`row_${item.driverId}`}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                            className="border-b border-neutral-950/80 hover:bg-neutral-900/30 transition-colors font-mono text-xs"
                          >
                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-extrabold text-neutral-400 w-12 text-sm">
                              {idx + 1}
                            </td>

                            <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span
                                  className="w-1 sm:w-1.5 h-7 sm:h-8 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: teamColor }}
                                />
                                <DriverAvatar
                                  driverId={item.driverId}
                                  constructorId={constructorId}
                                  className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 hidden xs:block"
                                />
                                <DriverNumberBadge
                                  number={driverNumber}
                                  constructorId={constructorId}
                                  className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 hidden sm:block"
                                />
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-neutral-500 text-[10px] hidden lg:inline uppercase">
                                      {names[0]}
                                    </span>
                                    <span className="font-extrabold text-white text-xs sm:text-sm uppercase truncate">
                                      {names[names.length - 1]}
                                    </span>
                                    <span className="bg-neutral-900 px-1 py-0.5 rounded text-[9px] text-neutral-500 font-bold hidden sm:inline">
                                      {dCode}
                                    </span>
                                  </div>
                                  {nationality && (
                                    <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5 select-none hidden md:flex">
                                      <CountryFlag nationality={nationality} className="w-3.5 h-2 rounded-sm" />
                                      <span>{nationality}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <TeamLogo constructorId={constructorId} className="w-4 h-4 flex-shrink-0" />
                                <span className="text-neutral-400 font-medium truncate">
                                  {getOfficialTeamName(constructorId, teamName)}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-neutral-400 font-bold hidden lg:table-cell">
                              {10 - idx > 0 ? 10 - idx : 0} pts
                            </td>

                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-white">
                              {item.laps}
                            </td>

                            <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                              <span className={idx === 0 ? 'text-red-500 font-black' : 'text-neutral-300'}>
                                {item.gapToLeader}
                              </span>
                            </td>

                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-neutral-400 hidden sm:table-cell">
                              {item.intervalAhead}
                            </td>

                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-right font-extrabold text-emerald-400 tracking-wide text-xs sm:text-sm">
                              {item.lastLapTime !== '--:--.--' ? item.lastLapTime : '--:--.--'}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info card */}
            <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-xl flex gap-3.5 items-start">
              <Sparkles className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono text-white font-extrabold uppercase">Live Timing Pipeline</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                  Real-time data ingested from the official OpenF1 API. Intervals and lap durations update dynamically as the session progresses.
                </p>
              </div>
            </div>

          </div>

          {/* Right sidebar: Weather + Race Control */}
          <div className="space-y-6">

            {/* Active Flag Advisory */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-lg p-4 space-y-3">
              <span className="font-mono text-[9px] font-bold text-neutral-500 block uppercase tracking-widest">
                TRACK STATUS FLAG
              </span>
              <div className={`p-3 sm:p-4 rounded-lg flex items-center justify-between font-mono text-xs font-bold uppercase transition-colors duration-500 ${flagColorClass(currentFlag)}`}>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 animate-bounce" />
                  <span>{currentFlag ? `${currentFlag} FLAG` : 'GREEN FLAG'}</span>
                </div>
                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-white animate-pulse hidden sm:inline">
                  AUTO-UPDATED
                </span>
              </div>
            </div>
            
            {/* Live Weather Center */}
            {lastWeather && (
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 justify-between">
                  <span className="font-mono text-[10px] font-black text-neutral-500 tracking-widest uppercase">
                    METEOROLOGICAL TELEMETRY
                  </span>
                  {lastWeather.rainfall ? (
                    <span className="px-2 py-0.5 bg-blue-900 text-blue-300 text-[9px] font-bold font-mono rounded animate-bounce">
                      RAIN REPORTED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-neutral-900 text-neutral-500 text-[9px] font-bold font-mono rounded">
                      DRY
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">TRACK TEMP</span>
                      <Thermometer className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-500" />
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {lastWeather.trackTemp}°C
                    </span>
                  </div>

                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">AIR TEMP</span>
                      <Thermometer className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {lastWeather.airTemp}°C
                    </span>
                  </div>

                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">HUMIDITY</span>
                      <CloudRain className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-sky-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {lastWeather.humidity}%
                    </span>
                  </div>

                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">WIND SPEED</span>
                      <Wind className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-neutral-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {lastWeather.windSpeed} km/h
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Race Control Messages Ticker */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden shadow-xl flex flex-col h-[280px] sm:h-[320px]">
              <div className="bg-black px-4 py-3 border-b border-neutral-900 flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5 font-mono text-[9px] font-black text-neutral-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  <span>RACE CONTROL DIGITAL TICKER</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-3.5 flex-grow font-mono text-[10px]">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2 font-mono py-12">
                      <Compass className="w-8 h-8 opacity-40 animate-spin" />
                      <span className="uppercase">Awaiting live feed...</span>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="pb-3 border-b border-neutral-900/60 last:border-0 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-neutral-500">
                            {new Date(m.timestamp).toLocaleTimeString()}
                          </span>
                          {m.flag !== 'None' && (
                            <span className="px-1.5 py-0.5 bg-neutral-900 rounded text-[8px] text-yellow-500 uppercase font-black">
                              {m.flag} ALERT
                            </span>
                          )}
                        </div>
                        <p className="text-white leading-normal uppercase">
                          {m.message}
                        </p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Live is detected but no session data yet (auto-starting) */
        <div className="text-center py-16 sm:py-24 bg-neutral-950 border border-neutral-900 rounded-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mx-auto text-red-500">
            <Tv className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto px-4">
            <h2 className="text-white font-extrabold tracking-tight font-sans text-lg uppercase">
              Connecting to Live Feed
            </h2>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              A live session has been detected. Connecting to the OpenF1 telemetry stream. The timing board will populate shortly.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
