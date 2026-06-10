import { useState } from 'react';
import { Search, MapPin, Settings, UserCheck, Compass, HelpCircle, X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConstructorStanding } from '../types.js';
import { getTeamMeta, getTeamColor, getOfficialTeamName } from '../utils/f1Data.js';
import { TeamLogo, TeamCarImage } from './F1Logos.js';

interface ConstructorStandingsProps {
  standings: ConstructorStanding[];
}

export default function ConstructorStandings({ standings }: ConstructorStandingsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<ConstructorStanding | null>(null);

  const filteredStandings = standings.filter((s) => {
    const officialName = getOfficialTeamName(s.team.constructorId, s.team.name);
    return officialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.team.nationality.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search constructor teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Teams List Table */}
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
          <table className="w-full text-left border-collapse min-w-[440px]">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50 font-mono text-[10px] text-neutral-400 tracking-wider uppercase select-none">
                <th className="py-3 px-4 text-center w-12">POS</th>
                <th className="py-3 px-4">CONSTRUCTOR TEAM</th>
                <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">NATIONALITY</th>
                <th className="py-3 px-3 sm:px-4 text-right hidden sm:table-cell">WINS</th>
                <th className="py-3 px-4 text-right">POINTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900/40 text-sm text-neutral-300">
              {filteredStandings.length > 0 ? (
                filteredStandings.map((s) => {
                  const teamColor = getTeamColor(s.team.constructorId);
                  const isSelected = selectedTeam?.team.constructorId === s.team.constructorId;
                  
                  return (
                    <tr
                      key={s.team.constructorId}
                      onClick={() => setSelectedTeam(s)}
                      className={`hover:bg-neutral-900/40 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-neutral-900' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-center w-12">
                        <span className="text-neutral-500">{s.position}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-1.5 h-6 rounded-full"
                            style={{ backgroundColor: teamColor }}
                          />
                          <TeamLogo constructorId={s.team.constructorId} className="w-5 h-5 flex-shrink-0" />
                          <span className="font-extrabold text-white group-hover:text-red-500 transition-colors">
                            {getOfficialTeamName(s.team.constructorId, s.team.name)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-neutral-400 hidden sm:table-cell">{s.team.nationality}</td>
                      <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-neutral-400 hidden sm:table-cell">{s.wins}</td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-white pr-6">{s.points}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500 italic">
                    No constructors match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Team Bio Drawer Panel */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl min-h-[300px]">
          <AnimatePresence mode="wait">
            {selectedTeam ? (
              <motion.div
                key={selectedTeam.team.constructorId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Full width Team Car Render Image */}
                <div className="w-full flex justify-center bg-neutral-900/20 p-5 rounded-xl border border-neutral-900/60 overflow-hidden shadow-inner select-none relative group min-h-[120px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent opacity-20 pointer-events-none" />
                  <TeamCarImage 
                    constructorId={selectedTeam.team.constructorId} 
                    className="w-full h-24 md:h-32 object-contain filter drop-shadow-[0_6px_16px_rgba(255,255,255,0.06)] transition-transform duration-500 group-hover:scale-105" 
                  />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">Constructor Details</span>
                    <div className="flex items-center mt-1">
                      <h2 className="text-2xl font-black text-white">
                        {getOfficialTeamName(selectedTeam.team.constructorId, selectedTeam.team.name)}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-white border border-neutral-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-t border-neutral-900 pt-4 space-y-4">
                  {/* Performance Statistics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Championships</span>
                      <span className="text-xl font-bold font-mono text-white flex items-center gap-1.5 mt-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        {getTeamMeta(selectedTeam.team.constructorId).championships} Titles
                      </span>
                    </div>

                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Team Principal</span>
                      <span className="text-xs font-bold text-neutral-200 mt-1 truncate block">
                        {getTeamMeta(selectedTeam.team.constructorId).principal}
                      </span>
                    </div>

                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">2026 Chassis</span>
                      <span className="text-sm font-mono font-bold text-white flex items-center gap-1.5 mt-1">
                        <Settings className="w-4 h-4 text-neutral-500" />
                        {getTeamMeta(selectedTeam.team.constructorId).chassis}
                      </span>
                    </div>

                    <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800/60 font-mono">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Headquarters</span>
                      <span className="text-[10px] font-semibold text-neutral-300 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                        {getTeamMeta(selectedTeam.team.constructorId).base}
                      </span>
                    </div>
                  </div>

                  {/* Biodata List */}
                  <div className="space-y-2 bg-neutral-900/40 p-4 border border-neutral-900 rounded-lg text-xs font-mono text-neutral-400">
                    <div className="flex justify-between py-1 border-b border-neutral-900">
                      <span>NATION OF ORIGIN</span>
                      <span className="text-neutral-200">{selectedTeam.team.nationality}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-900">
                      <span>COMPETITIVE ID</span>
                      <span className="text-neutral-200 uppercase">{selectedTeam.team.constructorId}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>BIO LINK</span>
                      <a
                        href={selectedTeam.team.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-500 hover:underline"
                      >
                        Wikipedia Entry
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500 h-full">
                <Compass className="w-8 h-8 text-neutral-700 mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-neutral-400">Constructor Specifications</h3>
                <p className="text-xs text-neutral-600 mt-1 max-w-xs">
                  Click on any manufacturer in the standings tab to view details about their headquarter base, chassis specifications, technical directors, and historical championship counts.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
