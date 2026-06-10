import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { Trophy, Calendar, RefreshCw, BarChart2, ShieldAlert, CheckCircle2, Zap, Menu, X, Monitor } from 'lucide-react';
import { DriverStanding, ConstructorStanding, RaceWeekend } from './types';

import Dashboard from './components/Dashboard';
import DriverStandings from './components/DriverStandings';
import ConstructorStandings from './components/ConstructorStandings';
import RaceCalendar from './components/RaceCalendar';
import RaceWeekendDetails from './components/RaceWeekendDetails';

import LiveRaceCenter from './components/LiveRaceCenter';
import Simulator from './components/Simulator';
import DriverTelemetry from './components/DriverTelemetry';
import SessionAnalytics from './components/SessionAnalytics';
import AiDashboard from './components/AiDashboard';

// Helper Wrapper Component to pull raceId parameter
function RaceWeekendDetailsWrapper({ races }: { races: RaceWeekend[] }) {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const race = races.find((r) => r.id === raceId);

  if (races.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-neutral-500 animate-pulse uppercase">Searching race weekend spec...</p>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500 font-mono">Stage ID "{raceId}" not found in current 2026 calendar.</p>
        <button
          onClick={() => navigate('/calendar')}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-white"
        >
          ← Return to Calendar
        </button>
      </div>
    );
  }

  return <RaceWeekendDetails race={race} onBack={() => navigate('/calendar')} />;
}

// Navigation link data
interface NavItem {
  path: string;
  label: string;
  matchPrefix: string;
  activeClass: string;
  inactiveClass: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [races, setRaces] = useState<RaceWeekend[]>([]);
  const [upcomingRace, setUpcomingRace] = useState<RaceWeekend | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Fetch all initial dataset fields
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Drivers Standings
      const dsRes = await fetch('/api/standings/drivers');
      if (dsRes.ok) {
        const dsData = await dsRes.json();
        setDriverStandings(dsData);
      }

      // 2. Fetch Constructors Standings
      const csRes = await fetch('/api/standings/constructors');
      if (csRes.ok) {
        const csData = await csRes.json();
        setConstructorStandings(csData);
      }

      // 3. Fetch Races Schedule
      const rRes = await fetch('/api/races');
      if (rRes.ok) {
        const rData = await rRes.json();
        setRaces(rData);
      }

      // 4. Fetch Upcoming Grand Prix
      const upRes = await fetch('/api/races/upcoming');
      if (upRes.ok) {
        const upData = await upRes.json();
        setUpcomingRace(upData);
      }
    } catch (e) {
      console.error('Error fetching F1 telemetry datasets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Setup active status polling for synchronize jobs
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync/status');
        if (res.ok) {
          const status = await res.json();
          setIsSyncing(status.isSyncing);
          
          if (status.isSyncing) {
            setSyncMessage('Database sync active in background. Some scores are loading...');
          } else {
            setSyncMessage(null);
          }
        }
      } catch (err) {
        console.warn('Status poll failed:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const testLiveParam = new URLSearchParams(location.search).get('test_live') === 'true';

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const queryStr = testLiveParam ? '?test_live=true' : '';
        const res = await fetch(`/api/live/status${queryStr}`);
        if (res.ok) {
          const status = await res.json();
          setIsLiveActive(status.live);
        }
      } catch (err) {
        console.warn('Failed to check live status:', err);
      }
    };
    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 10000);
    return () => clearInterval(interval);
  }, [location.search, testLiveParam]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Trigger manual sync
  const triggerManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Triggering full Jolpica F1 synchronization sequence...');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        // Wait 3s and refetch data
        setTimeout(async () => {
          await fetchAllData();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper helper to handle old tab names
  const handleNavTransition = (tabName: string) => {
    if (tabName.startsWith('race-')) {
      const id = tabName.replace('race-', '');
      navigate(`/calendar/${id}`);
    } else {
      navigate(`/${tabName}`);
    }
  };

  const isActive = (prefix: string) => {
    if (prefix === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(prefix);
  };

  const navItems: { path: string; label: string; prefix: string; isLive?: boolean; isSimulator?: boolean; isAi?: boolean }[] = [
    { path: '/dashboard', label: 'Dashboard', prefix: '/dashboard' },
    { path: '/drivers', label: 'Drivers', prefix: '/drivers' },
    { path: '/constructors', label: 'Constructors', prefix: '/constructors' },
    { path: '/calendar', label: 'Calendar', prefix: '/calendar' },
    { path: '/live-race', label: 'Live Race', prefix: '/live-race', isLive: true },
    { path: '/simulator', label: 'Simulator', prefix: '/simulator', isSimulator: true },
    { path: '/telemetry', label: 'Telemetry', prefix: '/telemetry' },
    { path: '/analytics', label: 'Analytics', prefix: '/analytics' },
    { path: '/ai-dashboard', label: 'AI Intelligence', prefix: '/ai-dashboard', isAi: true },
  ];

  const getNavClass = (item: typeof navItems[0]) => {
    const active = isActive(item.prefix);
    
    if (item.isLive) {
      if (active) {
        if (!isLiveActive && !testLiveParam) {
          return 'bg-neutral-900 text-red-500 font-extrabold border border-red-900/30';
        }
        return 'bg-red-600 text-black font-extrabold';
      }
      if (!isLiveActive && !testLiveParam) return 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40 cursor-pointer border border-neutral-900/40';
      return 'text-red-500 hover:text-red-400 hover:bg-red-950/20';
    }
    
    if (item.isSimulator) {
      if (active) return 'bg-amber-600 text-black font-extrabold';
      return 'text-amber-500 hover:text-amber-400 hover:bg-amber-950/20';
    }
    
    if (item.isAi) {
      if (active) return 'bg-purple-600/90 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]';
      return 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/10';
    }
    
    if (active) return 'bg-neutral-900 text-white';
    return 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40';
  };

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans flex flex-col antialiased selection:bg-red-500 selection:text-white">
      {/* Dynamic Sync Banner Row */}
      {syncMessage && (
        <div className="bg-red-600 text-white text-xs font-mono py-2 px-4 flex items-center justify-between shadow-md tracking-wider uppercase select-none">
          <div className="flex items-center gap-2 animate-pulse min-w-0">
            <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            <span className="truncate">{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-white/80 hover:text-white font-bold flex-shrink-0 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Structural Navigation Bar */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Branded Logo Title */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none group flex-shrink-0"
          >
            <img 
              src="/logo.png" 
              alt="Race Tech Fusion Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded group-hover:scale-105 transition-transform duration-300" 
            />
            <div className="hidden xs:block">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight group-hover:text-red-500 transition-colors">
                Race Tech Fusion
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 font-mono text-[11px]">
            {navItems.map((item) => {
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                  }}
                  className={`px-2.5 xl:px-3.5 py-2 rounded-lg font-bold uppercase transition-all duration-300 flex items-center gap-1 whitespace-nowrap ${getNavClass(item)}`}
                >
                  {item.isLive && !isLiveActive && !testLiveParam && <span className="text-[10px]">🔒</span>}
                  {item.isSimulator && <Monitor className="w-3 h-3" />}
                  {item.isAi && <Zap className="w-3 h-3" />}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right side: Status badge + Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="font-mono text-[10px] hidden sm:flex items-center gap-1.5 border border-neutral-900 bg-neutral-950 px-2.5 py-1.5 rounded-lg select-none">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`} />
              <span className="text-neutral-400 uppercase hidden md:inline">TELEMETRY:</span>
              <span className="text-white font-bold uppercase">{isSyncing ? 'Syncing' : 'Connected'}</span>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-neutral-900 bg-neutral-950 text-neutral-400 hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="lg:hidden overflow-hidden border-t border-neutral-900 bg-black/98"
            >
              <nav className="px-4 py-3 space-y-1 font-mono text-xs">
                {navItems.map((item) => {
                  const isOffline = item.isLive && !isLiveActive && !testLiveParam;
                  const active = isActive(item.prefix);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase transition-all duration-200 flex items-center gap-2 ${
                        isOffline
                          ? active
                            ? 'bg-neutral-900 text-red-500 border border-red-900/30'
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/60'
                          : active
                          ? item.isLive
                            ? 'bg-red-600 text-black'
                            : item.isSimulator
                            ? 'bg-amber-600 text-black'
                            : item.isAi
                            ? 'bg-purple-600/90 text-white'
                            : 'bg-neutral-900 text-white'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                      }`}
                    >
                      {item.isLive && !isLiveActive && !testLiveParam && <span className="text-[10px]">🔒</span>}
                      {item.isSimulator && <Monitor className="w-3.5 h-3.5" />}
                      {item.isAi && <Zap className="w-3.5 h-3.5" />}
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Structural Layout Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {loading && (
          <div className="h-[200px] flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-neutral-500 animate-pulse uppercase">Fetching official Jolpica telemetry...</p>
          </div>
        )}

        {!loading && (
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <Dashboard
                        driverLeader={driverStandings[0] || null}
                        teamLeader={constructorStandings[0] || null}
                        nextRace={upcomingRace}
                        racesCount={races.filter((r) => r.date < new Date().toISOString()).length}
                        totalRaces={races.length}
                        isSyncing={isSyncing}
                        onNavigate={handleNavTransition}
                        onSync={triggerManualSync}
                      />
                    </motion.div>
                  }
                />
                <Route
                  path="/drivers"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <DriverStandings standings={driverStandings} />
                    </motion.div>
                  }
                />
                <Route
                  path="/constructors"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <ConstructorStandings standings={constructorStandings} />
                    </motion.div>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <RaceCalendar
                        races={races}
                        onSelectRace={(race) => navigate(`/calendar/${race.id}`)}
                      />
                    </motion.div>
                  }
                />
                <Route
                  path="/calendar/:raceId"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <RaceWeekendDetailsWrapper races={races} />
                    </motion.div>
                  }
                />
                <Route
                  path="/live-race"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <LiveRaceCenter />
                    </motion.div>
                  }
                />
                <Route
                  path="/simulator"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <Simulator />
                    </motion.div>
                  }
                />
                <Route
                  path="/telemetry"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <DriverTelemetry />
                    </motion.div>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <SessionAnalytics />
                    </motion.div>
                  }
                />
                <Route
                  path="/ai-dashboard"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <AiDashboard />
                    </motion.div>
                  }
                />
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Structured Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-6 sm:py-8 mt-8 sm:mt-12 font-mono text-[10px] text-neutral-500 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-neutral-900/60">
            <div className="text-center md:text-left">
              &copy; 2026 Race Tech Fusion. Full data sourced under Jolpica &amp; Ergast developer terms.
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
              <span className="hidden sm:inline">PORT: 3000 (INGRESS ROUTE OK)</span>
              <span className="text-neutral-600 hidden sm:inline">|</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> FULL ARCHITECTURE ONLINE
              </span>
            </div>
          </div>
          <p className="text-center md:text-left text-[9px] text-neutral-600 leading-normal">
            Disclaimer: This project is an unofficial fan-made strategy simulator and analytical dashboard. 
            Formula 1, F1, FIA FORMULA ONE WORLD CHAMPIONSHIP, and related marks are trademarks of Formula One Licensing B.V. 
            All rights and credits to logos, driver names, car profiles, and track vectors belong to their respective copyright holders.
          </p>
        </div>
      </footer>
    </div>
  );
}
