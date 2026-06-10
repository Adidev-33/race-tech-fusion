import { useState } from 'react';
import { Search, ArrowUpDown, Award, Trophy, Shield, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DriverStanding } from '../types.js';
import { getDriverMeta, getTeamColor, getOfficialTeamName } from '../utils/f1Data.js';
import { TeamLogo, CountryFlag, DriverNumberBadge, DriverAvatar, DriverPortrait } from './F1Logos.js';

interface DriverStandingsProps {
  standings: DriverStanding[];
}

export default function DriverStandings({ standings }: DriverStandingsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'position' | 'points' | 'wins'>('position');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDriver, setSelectedDriver] = useState<DriverStanding | null>(null);

  const handleSort = (field: 'position' | 'points' | 'wins') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredStandings = standings
    .filter((s) => {
      const nameMatch = `${s.driver.givenName} ${s.driver.familyName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const officialTeamName = getOfficialTeamName(s.team.constructorId, s.team.name);
      const teamMatch = officialTeamName.toLowerCase().includes(searchTerm.toLowerCase());
      const nationalityMatch = s.driver.nationality.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || teamMatch || nationalityMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'position') {
        comparison = a.position - b.position;
      } else if (sortField === 'points') {
        comparison = b.points - a.points;
      } else if (sortField === 'wins') {
        comparison = b.wins - a.wins;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      {/* Search Header and Quick Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search drivers, constructors, nationalities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-neutral-500">SORT BY:</span>
          <button
            onClick={() => handleSort('position')}
            className={`px-3 py-1.5 rounded border transition-colors ${
              sortField === 'position' ? 'bg-red-600 border-red-600 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Position
          </button>
          <button
            onClick={() => handleSort('points')}
            className={`px-3 py-1.5 rounded border transition-colors ${
              sortField === 'points' ? 'bg-red-600 border-red-600 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Points
          </button>
          <button
            onClick={() => handleSort('wins')}
            className={`px-3 py-1.5 rounded border transition-colors ${
              sortField === 'wins' ? 'bg-red-600 border-red-600 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Wins
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Responsive Telemetry Standings Table */}
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50 font-mono text-[10px] text-neutral-400 tracking-wider uppercase select-none">
                <th className="py-3 px-4 text-center w-12">POS</th>
                <th className="py-3 px-4">DRIVER</th>
                <th className="py-3 px-3 sm:px-4 hidden md:table-cell">CONSTRUCTOR</th>
                <th className="py-3 px-3 sm:px-4 text-right cursor-pointer hover:text-white transition-colors hidden sm:table-cell" onClick={() => handleSort('wins')}>
                  WINS <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('points')}>
                  POINTS <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900/40 text-sm text-neutral-300">
              {filteredStandings.length > 0 ? (
                filteredStandings.map((s) => {
                  const driverColor = getTeamColor(s.team.constructorId);
                  const isSelected = selectedDriver?.driver.driverId === s.driver.driverId;
                  
                  return (
                    <tr
                      key={s.driver.driverId}
                      onClick={() => setSelectedDriver(s)}
                      className={`hover:bg-neutral-900/40 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-neutral-900' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-center w-12">
                        {s.position === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-500/10 text-yellow-500 text-xs border border-yellow-500/20">
                            1
                          </span>
                        ) : s.position === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-neutral-400/10 text-neutral-300 text-xs border border-neutral-400/20">
                            2
                          </span>
                        ) : s.position === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-700/10 text-amber-500 text-xs border border-amber-700/20">
                            3
                          </span>
                        ) : (
                          <span className="text-neutral-500">{s.position}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-1.5 h-8 rounded-full"
                            style={{ backgroundColor: driverColor }}
                          />
                          <DriverAvatar driverId={s.driver.driverId} constructorId={s.team.constructorId} className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />
                          <DriverNumberBadge number={s.driver.permanentNumber || '1'} constructorId={s.team.constructorId} className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 hidden sm:block" />
                          <div>
                            <span className="font-extrabold text-white group-hover:text-red-500 transition-colors">
                              {s.driver.givenName} {s.driver.familyName}
                            </span>
                            <span className="font-mono text-xs text-neutral-500 uppercase ml-2 select-none">
                              {s.driver.code || s.driver.permanentNumber}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <TeamLogo constructorId={s.team.constructorId} className="w-4 h-4 flex-shrink-0" />
                          <span className="text-neutral-400 font-medium">{getOfficialTeamName(s.team.constructorId, s.team.name)}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5 uppercase tracking-wide flex items-center gap-1.5">
                          <CountryFlag nationality={s.driver.nationality} className="w-3.5 h-2 rounded-sm" />
                          {s.driver.nationality}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-neutral-400 hidden sm:table-cell">{s.wins}</td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-white pr-6">{s.points}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500 italic">
                    No active drivers match your design criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Driver Details Side panel / Drawer */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl min-h-[300px]">
          <AnimatePresence mode="wait">
            {selectedDriver ? (
              <motion.div
                key={selectedDriver.driver.driverId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Full size Driver Portrait Card */}
                <div className="w-full flex justify-center bg-neutral-900/20 rounded-xl border border-neutral-900/60 overflow-hidden shadow-inner select-none relative group min-h-[200px] h-72">
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent opacity-45 pointer-events-none" />
                  
                  {/* Large Stylized Driver Number (Official F1 Card Style) */}
                  <span 
                    className="absolute right-4 bottom-2 text-7xl font-black italic tracking-tighter select-none opacity-20 font-mono transition-opacity duration-300 group-hover:opacity-30"
                    style={{ color: getTeamColor(selectedDriver.team.constructorId) }}
                  >
                    {selectedDriver.driver.permanentNumber}
                  </span>

                  <DriverPortrait 
                    driverId={selectedDriver.driver.driverId} 
                    constructorId={selectedDriver.team.constructorId} 
                    className="h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105" 
                  />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest flex items-center gap-1">
                      <CountryFlag nationality={selectedDriver.driver.nationality} className="w-3.5 h-2 rounded-sm" /> Driver Profile
                    </span>
                    <h2 className="text-2xl font-black text-white mt-0.5">
                      {selectedDriver.driver.givenName} {selectedDriver.driver.familyName}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedDriver(null)}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-white border border-neutral-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-t border-neutral-900 pt-4 space-y-4">
                  {/* Performance Statistics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">World Titles</span>
                      <span className="text-xl font-bold font-mono text-white flex items-center gap-1.5 mt-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        {getDriverMeta(selectedDriver.driver.driverId).championships}
                      </span>
                    </div>

                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Car Constructor</span>
                      <span className="text-[13px] font-bold text-neutral-200 mt-1 truncate flex items-center gap-1.5">
                        <TeamLogo constructorId={selectedDriver.team.constructorId} className="w-4 h-4 flex-shrink-0" />
                        {getOfficialTeamName(selectedDriver.team.constructorId, selectedDriver.team.name)}
                      </span>
                    </div>

                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Career Podiums</span>
                      <span className="text-xl font-bold font-mono text-white flex items-center gap-1.5 mt-1">
                        <Award className="w-4 h-4 text-teal-400" />
                        {getDriverMeta(selectedDriver.driver.driverId).podiums || 15}
                      </span>
                    </div>

                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Age / Country</span>
                      <span className="text-sm font-bold text-white block mt-1">
                        {getDriverMeta(selectedDriver.driver.driverId).age} years / {selectedDriver.driver.nationality}
                      </span>
                    </div>
                  </div>

                  {/* Biodata List */}
                  <div className="space-y-2 bg-neutral-900/40 p-4 border border-neutral-900 rounded-lg text-xs font-mono text-neutral-400">
                    <div className="flex justify-between py-1 border-b border-neutral-900">
                      <span>DATE OF BIRTH</span>
                      <span className="text-neutral-200">{selectedDriver.driver.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-900">
                      <span>NATIONALITY</span>
                      <span className="text-neutral-200">{selectedDriver.driver.nationality}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>BIO LINK</span>
                      <a
                        href={selectedDriver.driver.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-500 hover:underline"
                      >
                        Wikipedia
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500 h-full">
                <HelpCircle className="w-8 h-8 text-neutral-700 mb-3 animate-bounce" />
                <h3 className="text-sm font-bold text-neutral-400">Explore Driver Profile</h3>
                <p className="text-xs text-neutral-600 mt-1 max-w-xs">
                  Click on any driver row in the leaderboard to access complete telemetry bio-data, career statistics, and history.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
