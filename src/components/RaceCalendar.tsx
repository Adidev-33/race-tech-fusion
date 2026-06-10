import { useState } from 'react';
import { Calendar, MapPin, Flag, ChevronRight, Activity, Clock } from 'lucide-react';
import { RaceWeekend } from '../types.js';
import { CircuitMap } from './F1Logos.js';

interface RaceCalendarProps {
  races: RaceWeekend[];
  onSelectRace: (race: RaceWeekend) => void;
}

const getIstTime = (dateStr: string, timeStr?: string) => {
  if (!timeStr) return '';
  try {
    const utcString = `${dateStr}T${timeStr.endsWith('Z') ? timeStr : timeStr + 'Z'}`;
    const d = new Date(utcString);
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (e) {
    return '';
  }
};

export default function RaceCalendar({ races, onSelectRace }: RaceCalendarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Group races by Month helper
  const getMonthName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const filteredRaces = races.filter((r) => {
    return r.raceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.circuit.circuitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.circuit.country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Grouped structure
  const groupedByMonth: Record<string, RaceWeekend[]> = {};
  filteredRaces.forEach((r) => {
    const m = getMonthName(r.date);
    if (!groupedByMonth[m]) {
      groupedByMonth[m] = [];
    }
    groupedByMonth[m].push(r);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search calendar by country, circuit, or grand prix..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
        <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-red-500" /> Match Timings (UTC / IST)
        </p>
      </div>

      {/* Calendar List Grouped by Month */}
      <div className="space-y-8">
        {Object.keys(groupedByMonth).length > 0 ? (
          Object.entries(groupedByMonth).map(([month, monthRaces]) => (
            <div key={month} className="space-y-3">
              {/* Month Header Banner */}
              <h3 className="text-sm font-black text-red-500 font-mono tracking-widest uppercase border-l-2 border-red-500 pl-3">
                {month}
              </h3>

              {/* Race Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthRaces.map((r) => {
                  const isCompleted = r.date < todayStr;
                  const formattedDate = new Date(r.date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    weekday: 'short',
                  });

                  const utcTime = r.time ? r.time.slice(0, 5) : '14:00';
                  const istTime = getIstTime(r.date, r.time || '14:00:00Z');

                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectRace(r)}
                      className="flex items-center justify-between p-5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900/30 cursor-pointer transition-all duration-300 group shadow"
                    >
                      <div className="space-y-2 flex-grow truncate mr-4">
                        {/* Round Info & Status Tag */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono">
                            STAGE {r.round}
                          </span>
                          {isCompleted ? (
                            <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded font-mono uppercase">
                              Completed
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase flex items-center gap-1">
                              <Activity className="w-2.5 h-2.5 animate-pulse" /> Upcoming
                            </span>
                          )}
                        </div>

                        {/* Grand Prix Details */}
                        <div>
                          <h4 className="text-base font-bold text-white tracking-tight group-hover:text-red-500 transition-colors truncate">
                            {r.raceName}
                          </h4>
                          <span className="text-xs text-neutral-400 mt-1 flex items-center gap-1 font-medium truncate">
                            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                            {r.circuit.circuitName}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono block mt-1 uppercase">
                            {r.circuit.locality}, {r.circuit.country}
                          </span>
                        </div>
                      </div>

                      {/* Date Indicator and Arrow Link */}
                      {/* Track Map, Date, and Arrow Link */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Track Layout Map Outline */}
                        <div className="hidden sm:block w-20 h-14 opacity-60 group-hover:opacity-100 transition-opacity bg-neutral-900/10 rounded border border-neutral-900/30 p-0.5">
                          <CircuitMap circuitId={r.circuit.circuitId} className="w-full h-full" />
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-neutral-300 block">{formattedDate}</span>
                          <span className="text-[10px] font-mono text-neutral-500 block uppercase">
                            {utcTime} UTC {istTime ? `/ ${istTime} IST` : ''}
                          </span>
                        </div>
                        <div className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-500 group-hover:text-white group-hover:border-neutral-700 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-500 italic">
            No grand prix matches your search queries. Try entering 'Monaco', 'Silverstone', etc.
          </div>
        )}
      </div>
    </div>
  );
}
