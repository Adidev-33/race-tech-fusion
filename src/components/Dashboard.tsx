import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Calendar, Zap, Compass, RefreshCw, BarChart2, Shield } from 'lucide-react';
import { DriverStanding, ConstructorStanding, RaceWeekend } from '../types.js';
import { getDriverMeta, getTeamColor, getOfficialTeamName } from '../utils/f1Data.js';
import { TeamLogo, CountryFlag, DriverNumberBadge, DriverAvatar, CircuitMap, DriverPortrait, TeamCarImage } from './F1Logos.js';

interface DashboardProps {
  driverLeader: DriverStanding | null;
  teamLeader: ConstructorStanding | null;
  nextRace: RaceWeekend | null;
  racesCount: number;
  totalRaces: number;
  isSyncing: boolean;
  onNavigate: (tab: string) => void;
  onSync: () => void;
}

export default function Dashboard({
  driverLeader,
  teamLeader,
  nextRace,
  racesCount,
  totalRaces,
  isSyncing,
  onNavigate,
  onSync,
}: DashboardProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!nextRace) return;
    const interval = setInterval(() => {
      const targetTime = new Date(`${nextRace.date}T${nextRace.time || '14:00:00Z'}`).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRace]);

  // Season statistics calculations
  const progressPercent = totalRaces > 0 ? Math.round((racesCount / totalRaces) * 100) : 0;
  const driverMeta = driverLeader ? getDriverMeta(driverLeader.driver.driverId) : null;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Unit */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-2xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-500 font-mono text-xs mb-3 uppercase tracking-wider">
              <Zap className="w-3 h-3 animate-pulse" /> Live Telemetry Analytics Platform
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Race Tech Fusion
            </h1>
            <p className="text-neutral-400 mt-2 max-w-xl text-sm leading-relaxed">
              Motorsport intelligence and telemetric performance analytics. Fully compatible with real-time Jolpica APIs and powered by smart predictive engines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isSyncing
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-white hover:bg-neutral-200 text-black shadow-lg shadow-white/5 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronizing F1 Telemetry...' : 'Sync Database'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Stats & Next Weekend Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Next Race Countdown */}
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl" />
          
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-widest">
              <span>Next Grand Prix</span>
              <Calendar className="w-4 h-4 text-red-500" />
            </div>
            {nextRace ? (
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white border-b border-neutral-900 pb-2">
                  {nextRace.raceName}
                </h3>
                <p className="text-neutral-400 text-sm mt-2">{nextRace.circuit.circuitName}</p>
                <p className="text-neutral-500 text-xs font-mono mt-1">
                  {nextRace.circuit.locality}, {nextRace.circuit.country}
                </p>

                {/* Next Race Track Map */}
                <div className="w-full flex justify-center bg-neutral-900/40 p-3 rounded-xl border border-neutral-900/60 overflow-hidden shadow-inner mt-4 h-28 relative group">
                  <CircuitMap circuitId={nextRace.circuit.circuitId} className="h-full object-contain filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition-transform duration-500 group-hover:scale-105" />
                </div>
              </div>
            ) : (
              <div className="py-6 text-neutral-500 text-sm italic">Loading upcoming event...</div>
            )}
          </div>

          {nextRace && (
            <div className="mt-6">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-xl font-extrabold text-white font-mono">{countdown.days}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">Days</div>
                </div>
                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-xl font-extrabold text-white font-mono">{countdown.hours}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">Hours</div>
                </div>
                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-xl font-extrabold text-white font-mono">{countdown.minutes}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">Mins</div>
                </div>
                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-xl font-extrabold text-white font-mono">{countdown.seconds}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">Secs</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="w-full mt-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-mono border border-neutral-800 transition-colors uppercase tracking-wider"
              >
                View Event Schedule
              </button>
            </div>
          )}
        </div>

        {/* Drivers Standings Leader */}
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl" />
          
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-widest">
              <span>WDC Title Leader</span>
              <Trophy className="w-4 h-4 text-yellow-500" />
            </div>
             {driverLeader ? (
               <div className="mt-4 flex flex-col gap-4">
                 <div className="flex items-start gap-4">
                   <DriverAvatar driverId={driverLeader.driver.driverId} constructorId={driverLeader.team.constructorId} className="w-12 h-12 flex-shrink-0" />
                   <DriverNumberBadge number={driverLeader.driver.permanentNumber || '1'} constructorId={driverLeader.team.constructorId} className="w-12 h-12 text-base flex-shrink-0" />
                   <div>
                     <h3 className="text-xl font-extrabold text-white leading-tight flex items-center gap-1.5">
                       {driverLeader.driver.givenName} {driverLeader.driver.familyName}
                       <CountryFlag nationality={driverLeader.driver.nationality} className="w-3.5 h-2 rounded-sm" />
                     </h3>
                     <p className="text-neutral-400 text-sm mt-1 flex items-center gap-1.5">
                       <TeamLogo constructorId={driverLeader.team.constructorId} className="w-4 h-4 flex-shrink-0" />
                       {getOfficialTeamName(driverLeader.team.constructorId, driverLeader.team.name)}
                     </p>
                     <p className="text-neutral-500 text-xs font-mono uppercase mt-0.5">
                       Nationality: {driverLeader.driver.nationality}
                     </p>
                   </div>
                 </div>

                 {/* Full size Driver Portrait display */}
                 <div className="w-full flex justify-center bg-neutral-900/10 p-1 rounded-xl border border-neutral-900/40 overflow-hidden shadow-inner h-48 relative group">
                   <span 
                     className="absolute right-4 bottom-2 text-7xl font-black italic tracking-tighter select-none opacity-20 font-mono transition-opacity duration-300 group-hover:opacity-30"
                     style={{ color: getTeamColor(driverLeader.team.constructorId) }}
                   >
                     {driverLeader.driver.permanentNumber}
                   </span>
                   <DriverPortrait 
                     driverId={driverLeader.driver.driverId} 
                     constructorId={driverLeader.team.constructorId} 
                     className="h-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:scale-105 z-10" 
                   />
                 </div>
               </div>
             ) : (
               <div className="py-6 text-neutral-500 text-sm italic">Synchronizing drivers list...</div>
             )}
          </div>

          {driverLeader && (
            <div className="mt-6 pt-4 border-t border-neutral-900 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Points Tally</span>
                <p className="text-2xl font-black text-white font-mono mt-0.5">{driverLeader.points}</p>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">GP Victoria Wins</span>
                <p className="text-2xl font-black text-white font-mono mt-0.5">{driverLeader.wins}</p>
              </div>
            </div>
          )}
        </div>

        {/* Constructos Championship Leader */}
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl" />
          
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-widest">
              <span>WCC Leaderboard</span>
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
             {teamLeader ? (
               <div className="mt-4 flex flex-col gap-4">
                 <div className="flex items-start gap-3">
                   <div
                     className="w-2.5 h-12 rounded-full"
                     style={{ backgroundColor: getTeamColor(teamLeader.team.constructorId) }}
                   />
                   <TeamLogo constructorId={teamLeader.team.constructorId} className="w-10 h-10 flex-shrink-0" />
                   <div>
                     <h3 className="text-xl font-extrabold text-white leading-tight">
                       {getOfficialTeamName(teamLeader.team.constructorId, teamLeader.team.name)}
                     </h3>
                     <p className="text-neutral-400 text-sm mt-1">Nationality: {teamLeader.team.nationality}</p>
                     <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 font-mono">
                       Official Constructor
                     </span>
                   </div>
                 </div>

                 {/* Team Car Image display */}
                 <div className="w-full flex justify-center bg-neutral-900/10 p-2 rounded-xl border border-neutral-900/40 overflow-hidden shadow-inner h-28 relative group">
                   <TeamCarImage 
                     constructorId={teamLeader.team.constructorId} 
                     className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(255,255,255,0.04)] transition-transform duration-500 group-hover:scale-105" 
                   />
                 </div>
               </div>
             ) : (
               <div className="py-6 text-neutral-500 text-sm italic">Synchronizing constructors...</div>
             )}
          </div>

          {teamLeader && (
            <div className="mt-6 pt-4 border-t border-neutral-900 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Constructors Points</span>
                <p className="text-2xl font-black text-white font-mono mt-0.5">{teamLeader.points}</p>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Total Podiums</span>
                <p className="text-2xl font-black text-white font-mono mt-0.5">{teamLeader.wins}</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Season Stat progress tracker */}
      <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Season Calendar Tracker</h2>
            <p className="text-xs text-neutral-500 font-mono">Completed rounds relative to schedule</p>
          </div>
          <span className="text-sm font-bold text-red-500 font-mono">{progressPercent}%</span>
        </div>

        <div className="w-full h-3.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-[2px]">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-xs text-neutral-500 font-mono">
          <span>GP Runs: {racesCount} completed</span>
          <span>Total: {totalRaces || 24} Stages</span>
        </div>
      </div>

      {/* Modern High-End Feature Portal Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('drivers')}
          className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-red-500/40 hover:bg-neutral-900 cursor-pointer transition-all duration-300 group shadow"
        >
          <Trophy className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform mb-3" />
          <h4 className="text-sm font-bold text-white">Drivers Standings</h4>
          <p className="text-xs text-neutral-500 mt-1">Championship points, profile stats, and team rosters.</p>
        </div>

        <div
          onClick={() => onNavigate('constructors')}
          className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-red-500/40 hover:bg-neutral-900 cursor-pointer transition-all duration-300 group shadow"
        >
          <BarChart2 className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform mb-3" />
          <h4 className="text-sm font-bold text-white">Constructor Cup</h4>
          <p className="text-xs text-neutral-500 mt-1">Official manufacturer points, rankings, and histories.</p>
        </div>

        <div
          onClick={() => onNavigate('calendar')}
          className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-red-500/40 hover:bg-neutral-900 cursor-pointer transition-all duration-300 group shadow"
        >
          <Calendar className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform mb-3" />
          <h4 className="text-sm font-bold text-white">Race Calendar</h4>
          <p className="text-xs text-neutral-500 mt-1">Season map, GP session schedules, dates, and locations.</p>
        </div>

        <div
          onClick={() => {
            if (nextRace) {
              onNavigate(`race-${nextRace.id}`);
            } else {
              onNavigate('calendar');
            }
          }}
          className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-red-500/40 hover:bg-neutral-900 cursor-pointer transition-all duration-300 group shadow"
        >
          <Compass className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-3" />
          <h4 className="text-sm font-bold text-white">Active Strategy</h4>
          <p className="text-xs text-neutral-500 mt-1">Race analysis, tyre guides, and Gemini strategy prediction.</p>
        </div>
      </div>
    </div>
  );
}
