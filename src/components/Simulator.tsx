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
  RotateCcw, 
  Gauge, 
  Sparkles, 
  Compass, 
  Sliders, 
  ShieldAlert,
  Play,
  Info,
  Cpu
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

export default function Simulator() {
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [session, setSession] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<TimingRecord[]>([]);
  const [lastWeather, setLastWeather] = useState<WeatherData | null>(null);
  const [messages, setMessages] = useState<RaceControlMsg[]>([]);
  const [sessionTimeLeft, setSessionTimeLeft] = useState('1:24:15');
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [standings, setStandings] = useState<DriverStanding[]>([]);

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
      // Attempt reconnection after 4s
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

    // Session clock simulator timer
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

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearInterval(interval);
    };
  }, []);

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

  // Trigger telemetry start
  const triggerPlayout = async (type: 'Race' | 'Qualifying') => {
    setIsStartingStream(true);
    try {
      const res = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType: type })
      });
      if (res.ok) {
        const sInfo = await res.json();
        setSession(sInfo.session);
        fetchTimingBoard();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsStartingStream(false);
    }
  };

  const stopPlayout = async () => {
    try {
      await fetch('/api/live/stop', { method: 'POST' });
      setSession(null);
      setLeaderboard([]);
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6">
      {/* Hero Description Section */}
      <div className="relative overflow-hidden bg-neutral-950 border border-neutral-900 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-600/10 text-amber-500 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Simulation Engine v2.0
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-[10px] text-neutral-500 hidden sm:inline">WEBSOCKET TELEMETRY PIPELINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              High-Fidelity F1 Race Simulator
            </h1>
            <p className="text-sm text-neutral-400 mt-2.5 max-w-2xl leading-relaxed">
              Generate realistic telemetry for a full <strong className="text-neutral-200">Grand Prix</strong> or <strong className="text-neutral-200">Qualifying</strong> session 
              with 20 drivers, dynamic intervals, lap-by-lap timing, evolving weather conditions, and authentic race control messages — 
              all streamed in real-time via WebSockets.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
              <span>SERVER-AUTHORITATIVE SIMULATION</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { icon: '🏎️', label: '20 Drivers' },
                { icon: '🌦️', label: 'Dynamic Weather' },
                { icon: '🏁', label: 'Flag Events' },
                { icon: '⏱️', label: 'Lap Timing' },
              ].map((feature) => (
                <span key={feature.label} className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-mono text-neutral-400">
                  {feature.icon} {feature.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operations Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 bg-neutral-950 border border-neutral-900 rounded-xl shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            {session && <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />}
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-sans flex items-center gap-2 uppercase">
              Simulation Control Panel
            </h2>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
            Deploy a simulated F1 session using the controls below. The timing board, weather, and race control will update in real-time.
          </p>
        </div>

        {/* Real-time Link Status Badge + Controls */}
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
                <span className="text-red-500 font-black">DISCONNECTED</span>
              </>
            )}
          </button>

          {/* Trigger controllers */}
          {!session ? (
            <div className="flex items-center gap-2">
              <button
                disabled={isStartingStream}
                onClick={() => triggerPlayout('Race')}
                className="px-3 sm:px-4 py-2 bg-red-600 text-black hover:bg-red-500 text-xs font-mono font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-red-900/10 cursor-pointer disabled:opacity-50"
              >
                <Tv className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Start</span> Simulator GP
              </button>
              <button
                disabled={isStartingStream}
                onClick={() => triggerPlayout('Qualifying')}
                className="px-3 sm:px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase rounded-lg border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sliders className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Start</span> Qualifying
              </button>
            </div>
          ) : (
            <button
              onClick={stopPlayout}
              className="px-3 sm:px-4 py-2 bg-red-950 text-red-300 hover:bg-red-900 text-xs font-mono font-bold uppercase rounded-lg transition-colors border border-red-900 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Stop Session Playout
            </button>
          )}
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
                    SIMULATED TIMING BOARD
                  </span>
                </div>
                {session && (
                  <div className="flex items-center gap-3 sm:gap-4 font-mono text-[10px]">
                    <span className="text-neutral-500">MODE: <span className="text-emerald-500 font-bold uppercase">{session.sessionType}</span></span>
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
                      <th className="py-3 px-3 sm:px-4">GAP</th>
                      <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">INT</th>
                      <th className="py-3 px-3 sm:px-4 text-right">LAST LAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {leaderboard.map((item, idx) => {
                        const meta = getDriverMeta(item.driverId);
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
                            layoutId={`sim_row_${item.driverId}`}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                            className="border-b border-neutral-950/80 hover:bg-neutral-900/30 transition-colors font-mono text-xs"
                          >
                            {/* Position */}
                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-extrabold text-neutral-400 w-12 text-sm">
                              {idx + 1}
                            </td>

                            {/* Driver detail */}
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
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="font-extrabold text-white text-xs sm:text-sm uppercase truncate">
                                      {names[names.length - 1]}
                                    </span>
                                    <span className="bg-neutral-900 px-1 py-0.5 rounded text-[9px] text-neutral-500 font-bold hidden sm:inline">
                                      {dCode}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Constructor/Team detail */}
                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <TeamLogo constructorId={constructorId} className="w-4 h-4 flex-shrink-0" />
                                <span className="text-neutral-400 font-medium truncate">
                                  {getOfficialTeamName(constructorId, teamName)}
                                </span>
                              </div>
                            </td>

                            {/* Points accumulated */}
                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-neutral-400 font-bold hidden lg:table-cell">
                              {10 - idx > 0 ? 10 - idx : 0} pts
                            </td>

                            {/* Total sector laps completed */}
                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-white">
                              {item.laps}
                            </td>

                            {/* Gap to leader */}
                            <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                              <span className={idx === 0 ? 'text-red-500 font-black' : 'text-neutral-300'}>
                                {item.gapToLeader}
                              </span>
                            </td>

                            {/* Interval ahead */}
                            <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-neutral-400 hidden sm:table-cell">
                              {item.intervalAhead}
                            </td>

                            {/* Last sector lap time */}
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

            {/* Micro instructions / explanation card */}
            <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-xl flex gap-3.5 items-start">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono text-white font-extrabold uppercase">Simulation Telemetry Pipeline</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                  The timing board streams asynchronous metrics directly over high-performance WebSockets. Intervals-ahead and lap durations adapt dynamically using a server-authoritative physics model. All 20 drivers compete simultaneously with stochastic variance.
                </p>
              </div>
            </div>

          </div>

          {/* Right sidebar info columns: Weather diagnostics + scrolling logs */}
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
                    WEATHER TELEMETRY
                  </span>
                  {lastWeather.rainfall ? (
                    <span className="px-2 py-0.5 bg-blue-900 text-blue-300 text-[9px] font-bold font-mono rounded animate-bounce">
                      RAIN
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-neutral-900 text-neutral-500 text-[9px] font-bold font-mono rounded">
                      DRY
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Track temp */}
                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">TRACK</span>
                      <Thermometer className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-500" />
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {lastWeather.trackTemp}°C
                    </span>
                  </div>

                  {/* Air temp */}
                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">AIR</span>
                      <Thermometer className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {lastWeather.airTemp}°C
                    </span>
                  </div>

                  {/* Humidity */}
                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">HUMIDITY</span>
                      <CloudRain className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-sky-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {lastWeather.humidity}%
                    </span>
                  </div>

                  {/* Wind speed */}
                  <div className="bg-black/40 border border-neutral-900 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between h-[72px] sm:h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">WIND</span>
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
                  <span>RACE CONTROL TICKER</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-3.5 flex-grow font-mono text-[10px]">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2 font-mono py-12">
                      <Compass className="w-8 h-8 opacity-40 animate-spin" />
                      <span className="uppercase">Awaiting feed trigger...</span>
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
        /* Empty state — no session running yet */
        <div className="text-center py-16 sm:py-24 bg-neutral-950 border border-neutral-900 rounded-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-600/10 flex items-center justify-center mx-auto text-amber-500">
            <Tv className="w-8 h-8" />
          </div>
          <div className="space-y-2.5 max-w-lg mx-auto px-4">
            <h2 className="text-white font-extrabold tracking-tight font-sans text-lg uppercase">
              Simulation Engine Standing By
            </h2>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              No simulation session is currently active. Use the control triggers above to boot a high-fidelity F1 simulator sequence. 
              Choose between a full <strong className="text-neutral-300">Grand Prix (57+ laps)</strong> or a <strong className="text-neutral-300">Qualifying</strong> session to begin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
            <button
              onClick={() => triggerPlayout('Race')}
              className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-black text-xs font-mono font-black uppercase rounded-lg transition-colors cursor-pointer"
            >
              Start Grand Prix Simulation
            </button>
            <button
              onClick={() => triggerPlayout('Qualifying')}
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 text-xs font-mono font-black uppercase rounded-lg transition-colors cursor-pointer"
            >
              Start Qualifying Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
