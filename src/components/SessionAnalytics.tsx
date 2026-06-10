import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  FileText, 
  History, 
  Cpu, 
  Info, 
  AlertCircle 
} from 'lucide-react';
import { getDriverMeta, getTeamColor } from '../utils/f1Data';

interface DriverStats {
  driverId: string;
  topSpeed: number;
  fastestSector1: string;
  fastestSector2: string;
  fastestSector3: string;
  tyreCompound: string;
  tyreAge: number;
  stintLength: number;
}

interface PitStop {
  driverId: string;
  stopNumber: number;
  lapNumber: number;
  duration: string;
  tyreCompound: string;
}

interface SessionEvent {
  id: string;
  timestamp: string;
  eventType: string;
  driverId?: string;
  detail: string;
}

export default function SessionAnalytics() {
  const [stats, setStats] = useState<DriverStats[]>([]);
  const [pitStops, setPitStops] = useState<PitStop[]>([]);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const activeRes = await fetch('/api/live/session');
      if (activeRes.ok) {
        const liveInfo = await activeRes.json();
        setSessionActive(liveInfo.active);
      }

      const statsRes = await fetch('/api/live/stats');
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      const pitRes = await fetch('/api/live/pit-stops');
      if (pitRes.ok) {
        setPitStops(await pitRes.json());
      }

      const evRes = await fetch('/api/live/events');
      if (evRes.ok) {
        setEvents(await evRes.json());
      }
    } catch (e) {
      console.warn('Error loading telemetry analytics:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnalytics().then(() => setLoading(false));

    const poller = setInterval(() => {
      fetchAnalytics();
    }, 2500);

    return () => clearInterval(poller);
  }, []);

  // Format Top speed chart
  const getTopSpeedData = () => {
    return stats.map(s => ({
      name: s.driverId.slice(0, 3).toUpperCase(),
      speed: s.topSpeed,
      fill: getTeamColor(s.driverId)
    })).sort((a,b) => b.speed - a.speed);
  };

  const speedData = getTopSpeedData();

  // Color compound dictionary
  const getCompoundNameAndColor = (compound: string) => {
    switch (compound) {
      case 'S': return { name: 'Soft', border: 'border-red-600', text: 'text-red-500', bg: 'bg-red-500/10' };
      case 'M': return { name: 'Medium', border: 'border-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case 'H': return { name: 'Hard', border: 'border-white', text: 'text-neutral-300', bg: 'bg-white/10' };
      case 'I': return { name: 'Intermediate', border: 'border-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'W': return { name: 'Wet', border: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10' };
      default: return { name: 'Soft', border: 'border-red-600', text: 'text-red-500', bg: 'bg-red-500/10' };
    }
  };

  return (
    <div className="space-y-6">
      
      {!sessionActive ? (
        <div className="text-center py-20 bg-neutral-950 border border-neutral-900 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto text-neutral-500">
            <BarChart2 className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white uppercase font-sans">Analytics Vault Down</h3>
            <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto leading-relaxed">
              No live playout session is running in backend. Deploy a session from the Live Race Center first to generate analytics graphs.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Speed rankings + Fastest Sector rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Speed Rankings chart */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                  TOP SPEED RADAR RANKINGS (KM/H)
                </span>
              </div>

              {speedData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-xs font-mono text-neutral-600 uppercase">
                  Awaiting telemetry logs...
                </div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={speedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#1c1c1c" vertical={false} />
                      <XAxis dataKey="name" stroke="#525252" fontSize={9} />
                      <YAxis stroke="#525252" domain={[150, 350]} fontSize={9} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#262626', color: '#fff' }}
                        labelClassName="font-mono text-xs"
                      />
                      <Bar 
                        dataKey="speed" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={300}
                      >
                        {speedData.map((entry, index) => (
                          <Bar key={`bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Fastest Sector split times */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <Cpu className="w-4 h-4 text-red-500" />
                <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                  FASTEST SECTOR ANALYTICS RECORD
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-950 text-neutral-500 text-[10px] uppercase border-b border-neutral-900">
                      <th className="py-2.5 px-3">DRIVER</th>
                      <th className="py-2.5 px-3">SECTOR 1</th>
                      <th className="py-2.5 px-3">SECTOR 2</th>
                      <th className="py-2.5 px-3">SECTOR 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((item) => {
                      const color = getTeamColor(item.driverId);
                      return (
                        <tr key={item.driverId} className="border-b border-neutral-950 hover:bg-neutral-900/10">
                          <td className="py-2 px-3 font-bold flex items-center gap-2">
                            <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-white uppercase">{item.driverId.slice(0, 3).toUpperCase()}</span>
                          </td>
                          <td className="py-2 px-3 text-neutral-300">{item.fastestSector1}s</td>
                          <td className="py-2 px-3 text-neutral-300">{item.fastestSector2}s</td>
                          <td className="py-2 px-3 text-neutral-300">{item.fastestSector3}s</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Tyre strategy stint map + Pit stop diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tyre compounds & stint ages */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <FileText className="w-4 h-4 text-red-500" />
                <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                  TYRE SELECTIONS &amp; STINT AGES
                </span>
              </div>

              <div className="space-y-4">
                {stats.map((drv) => {
                  const meta = getCompoundNameAndColor(drv.tyreCompound);
                  const color = getTeamColor(drv.driverId);
                  
                  // Compute stint visual progress bar percentage
                  const percentage = Math.min(100, (drv.stintLength / 22) * 100);

                  return (
                    <div key={drv.driverId} className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-white font-extrabold uppercase">{drv.driverId.replace('_', ' ')}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded border ${meta.border} ${meta.text} ${meta.bg} font-black text-[9px] uppercase`}>
                          {meta.name} (L{drv.tyreAge})
                        </span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-red-600 rounded-full" 
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chronological Steward Events Timeline */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-4 flex flex-col max-h-[350px]">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-red-500" />
                  <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                    RACE EVENTS stewarding TIMELINE
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>

              <div className="overflow-y-auto space-y-3.5 flex-grow pr-1 scrollbar-thin">
                {events.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-neutral-600 uppercase py-12">
                    Awaiting crash, penalties or overtake events...
                  </div>
                ) : (
                  [...events].reverse().map((ev) => {
                    const color = ev.driverId ? getTeamColor(ev.driverId) : '#525252';
                    return (
                      <div key={ev.id} className="relative pl-4 border-l-2 border-neutral-900 font-mono text-[11px] space-y-1">
                        {/* Event indicator dot */}
                        <span 
                          className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border border-black"
                          style={{ backgroundColor: color }} 
                        />
                        <div className="flex items-center justify-between text-neutral-500 text-[10px]">
                          <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                          <span className="font-extrabold uppercase text-white bg-neutral-900 px-1.5 py-0.5 rounded text-[8px]">
                            {ev.eventType}
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-normal">
                          {ev.detail}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Historical Pit stops list */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 select-none">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                PIT LANE IN-STATION DURATION LOGS (SECONDS)
              </span>
            </div>

            {pitStops.length === 0 ? (
              <div className="text-center py-10 font-mono text-neutral-600 text-xs uppercase uppercase">
                No pit operations resolved in this stint yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {pitStops.map((pit) => {
                  const color = getTeamColor(pit.driverId);
                  return (
                    <div key={pit.id} className="bg-black/50 border border-neutral-900 rounded-xl p-4.5 space-y-2.5 flex flex-col justify-between font-mono">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-sans font-bold text-white uppercase text-xs">
                            {pit.driverId.slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500">STOP #{pit.stopNumber}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-neutral-500">LAP {pit.lapNumber}</span>
                        <span className="text-xl font-extrabold text-red-500">{pit.duration}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
