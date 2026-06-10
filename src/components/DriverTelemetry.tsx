import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  Navigation, 
  Loader2, 
  Users, 
  Compass, 
  Award,
  Footprints,
  Activity
} from 'lucide-react';
import { getDriverMeta, getTeamColor } from '../utils/f1Data';

// Reusable track coordinate list matching the backend
const TRACK_TRACE = [
  { x: 100, y: 150 }, { x: 120, y: 160 }, { x: 150, y: 180 }, { x: 200, y: 200 },
  { x: 250, y: 210 }, { x: 290, y: 200 }, { x: 330, y: 170 }, { x: 370, y: 150 },
  { x: 420, y: 140 }, { x: 480, y: 160 }, { x: 520, y: 190 }, { x: 550, y: 240 },
  { x: 570, y: 290 }, { x: 550, y: 340 }, { x: 490, y: 380 }, { x: 420, y: 400 },
  { x: 350, y: 390 }, { x: 300, y: 370 }, { x: 250, y: 340 }, { x: 200, y: 300 },
  { x: 150, y: 240 }, { x: 110, y: 180 }
];

interface DriverTelemetryRecord {
  timestamp: string;
  speed: number;
  throttle: number;
  brake: boolean;
  gear: number;
  rpm: number;
  drs: boolean;
  x: number;
  y: number;
}

export default function DriverTelemetry() {
  const [activeDrivers, setActiveDrivers] = useState<string[]>([
    'max_verstappen',
    'norris'
  ]);
  const [driverFeeds, setDriverFeeds] = useState<Record<string, DriverTelemetryRecord[]>>({});
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const availableDrivers = [
    { id: 'max_verstappen', code: 'VER', name: 'Max Verstappen' },
    { id: 'norris', code: 'NOR', name: 'Lando Norris' },
    { id: 'hamilton', code: 'HAM', name: 'Lewis Hamilton' },
    { id: 'charles_leclerc', code: 'LEC', name: 'Charles Leclerc' },
    { id: 'piastri', code: 'PIA', name: 'Oscar Piastri' },
    { id: 'sainz', code: 'SAI', name: 'Carlos Sainz' },
    { id: 'russell', code: 'RUS', name: 'George Russell' },
    { id: 'alonso', code: 'ALO', name: 'Fernando Alonso' },
    { id: 'perez', code: 'PER', name: 'Sergio Perez' },
    { id: 'hulkenberg', code: 'HUL', name: 'Nico Hulkenberg' }
  ];

  // Fetch telemetry traces for active drivers
  const fetchTelemetry = async () => {
    try {
      const liveStatusRes = await fetch('/api/live/session');
      if (liveStatusRes.ok) {
        const liveInfo = await liveStatusRes.json();
        setSessionActive(liveInfo.active);
        if (!liveInfo.active) {
          // No active playout, so return early
          return;
        }
      }

      const feeds: Record<string, DriverTelemetryRecord[]> = {};
      await Promise.all(
        activeDrivers.map(async (drvId) => {
          const res = await fetch(`/api/live/telemetry/${drvId}`);
          if (res.ok) {
            const data = await res.json();
            feeds[drvId] = data;
          }
        })
      );
      setDriverFeeds(feeds);
    } catch (err) {
      console.warn('Error loading telemetry compare feeds:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTelemetry().then(() => setLoading(false));

    // Poll telemetry trace endpoints every 2 seconds matching simulated updates
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 1500);

    return () => clearInterval(interval);
  }, [activeDrivers]);

  // Handle Driver Toggle inside check list
  const toggleDriver = (id: string) => {
    setActiveDrivers((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one driver
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 3) return [...prev.slice(1), id]; // Comparison ceiling is 3 drivers
        return [...prev, id];
      }
    });
  };

  // 2D HTML5 Canvas track render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and translate context coordinate offsets
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw track layout loop background
    ctx.beginPath();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#262626';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Track scaling boundaries
    const scaleX = 1.1;
    const scaleY = 1.1;
    const offsetX = 10;
    const offsetY = -20;

    TRACK_TRACE.forEach((p, idx) => {
      if (idx === 0) {
        ctx.moveTo(p.x * scaleX + offsetX, p.y * scaleY + offsetY);
      } else {
        ctx.lineTo(p.x * scaleX + offsetX, p.y * scaleY + offsetY);
      }
    });
    ctx.closePath();
    ctx.stroke();

    // Draw thin inner race-line guides
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#dc2626'; // Red circuit centerline
    ctx.setLineDash([6, 5]);
    TRACK_TRACE.forEach((p, idx) => {
      if (idx === 0) {
        ctx.moveTo(p.x * scaleX + offsetX, p.y * scaleY + offsetY);
      } else {
        ctx.lineTo(p.x * scaleX + offsetX, p.y * scaleY + offsetY);
      }
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Overlay active driver markers dynamically
    activeDrivers.forEach((drvId) => {
      const records = driverFeeds[drvId] || [];
      if (records.length === 0) return;
      const last = records[records.length - 1];

      const x = last.x * scaleX + offsetX;
      const y = last.y * scaleY + offsetY;

      // Pulse ring
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = getTeamColor(drvId);
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Filled marker
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Display name tag
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(drvId.slice(0, 3).toUpperCase(), x + 10, y - 5);
      ctx.shadowBlur = 0; // reset
    });

  }, [driverFeeds, activeDrivers]);

  // Format Recharts comparative trace timeline
  const getTimelineData = () => {
    // Collect the longest feed to index points (0 - 14)
    let maxLen = 0;
    activeDrivers.forEach((id) => {
      const records = driverFeeds[id] || [];
      if (records.length > maxLen) maxLen = records.length;
    });

    if (maxLen === 0) return [];

    const dataPoints = [];
    for (let i = 0; i < maxLen; i++) {
      const item: any = { index: i + 1 };
      activeDrivers.forEach((id) => {
        const list = driverFeeds[id] || [];
        if (list[i]) {
          item[`speed_${id}`] = list[i].speed;
          item[`throttle_${id}`] = list[i].throttle;
          item[`rpm_${id}`] = list[i].rpm;
        }
      });
      dataPoints.push(item);
    }
    return dataPoints;
  };

  const cData = getTimelineData();

  return (
    <div className="space-y-6">
      
      {/* Selector and configuration deck */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Driver checkbox filters */}
        <div className="lg:col-span-1 bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-500 font-bold tracking-widest uppercase">
            <Users className="w-4 h-4 text-red-500" />
            <span>Driver comparison roster</span>
          </div>
          
          <p className="text-[11px] font-mono text-neutral-400">
            Select up to <strong className="text-white">3 drivers</strong> to overlay telemetry telemetry speed traces concurrently.
          </p>

          <div className="space-y-1.5 pt-2">
            {availableDrivers.map((item) => {
              const active = activeDrivers.includes(item.id);
              const color = getTeamColor(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleDriver(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border font-mono text-xs transition-all duration-200 uppercase cursor-pointer ${
                    active 
                      ? 'bg-neutral-900 text-white border-neutral-800' 
                      : 'bg-black text-neutral-500 border-neutral-950 hover:bg-neutral-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-1.5 h-3 rounded-full" 
                      style={{ backgroundColor: color }} 
                    />
                    <span className="font-extrabold">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-bold">
                    {item.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Telemetry charts dashboard */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Main comparative parameters speed trace */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                  SPEED OVERLAY TRACE (KM/H)
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 font-bold">
                AUTO-REFRESH ACTIVE
              </span>
            </div>

            {loading ? (
              <div className="h-[240px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : !sessionActive ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-center p-4">
                <Compass className="w-10 h-10 text-neutral-700 animate-bounce" />
                <p className="text-xs font-mono text-neutral-500 uppercase mt-3">
                  Awaiting dynamic simulator GP stream startup...
                </p>
                <p className="text-[10px] text-neutral-600 font-mono mt-1">
                  Start playout under the Live Race Center to access comparative telemetry streams.
                </p>
              </div>
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
                    <XAxis dataKey="index" stroke="#525252" fontSize={10} fontStyle="italic" />
                    <YAxis stroke="#525252" domain={[60, 360]} fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000000', borderColor: '#262626', color: '#fff' }} 
                      labelClassName="font-mono text-xs text-neutral-500"
                    />
                    {activeDrivers.map((drvId) => (
                      <Line
                        key={drvId}
                        type="monotone"
                        dataKey={`speed_${drvId}`}
                        name={drvId.toUpperCase()}
                        stroke={getTeamColor(drvId)}
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={200}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Secondary comparison throttle trace overlay */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                THROTTLE PEDAL COMPONENT TRACE (%)
              </span>
            </div>

            {loading ? (
              <div className="h-[180px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
              </div>
            ) : !sessionActive ? (
              <div className="h-[180px] flex items-center justify-center text-center text-neutral-600 font-mono text-xs uppercase select-none">
                AWAITING SPEED STREAMS...
              </div>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
                    <XAxis dataKey="index" stroke="#525252" fontSize={10} />
                    <YAxis stroke="#525252" domain={[0, 100]} fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000000', borderColor: '#262626', color: '#fff' }} 
                      labelClassName="font-mono text-xs text-neutral-500"
                    />
                    {activeDrivers.map((drvId) => (
                      <Line
                        key={drvId}
                        type="monotone"
                        dataKey={`throttle_${drvId}`}
                        name={`${drvId.slice(0,3).toUpperCase()} Throttle`}
                        stroke={getTeamColor(drvId)}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={200}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Grid: 2D Track Map Layout + Gear/Brake telemetry boxes */}
      {sessionActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Interactive Circuit mapping */}
          <div className="lg:col-span-1 bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-red-500" />
                <span className="font-mono text-xs font-black tracking-widest uppercase text-white">
                  Circuit Tracking Map
                </span>
              </div>
              <span className="text-[9px] font-mono text-neutral-500 uppercase bg-black px-2 py-0.5 rounded">
                Silverstone GP
              </span>
            </div>

            <div className="flex items-center justify-center border border-neutral-900/60 bg-black/40 rounded-xl p-2 relative h-[360px]">
              <canvas
                ref={canvasRef}
                width={360}
                height={350}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Engine Parameters telemetry diagnostics blocks */}
          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-red-500" />
              <span className="font-mono text-xs font-black tracking-widest uppercase text-white text-medium">
                Live Driver Cockpit Diagnostics
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDrivers.map((id) => {
                const feedsList = driverFeeds[id] || [];
                const last = feedsList[feedsList.length - 1];
                const meta = getDriverMeta(id);
                const color = getTeamColor(id);

                if (!last) return null;

                return (
                  <div key={id} className="bg-black/50 border border-neutral-900 rounded-xl p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-mono text-xs font-extrabold uppercase text-white">
                          {id.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500">
                        RPM: <strong className="text-white font-bold">{last.rpm}</strong>
                      </span>
                    </div>

                    {/* Numeric parameters details list */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      
                      {/* speed */}
                      <div className="bg-neutral-950 p-2 border border-neutral-900 rounded">
                        <span className="text-[8px] font-mono text-neutral-500 block uppercase">SPEED</span>
                        <span className="text-sm font-extrabold text-white font-mono">{last.speed}</span>
                        <span className="text-[8px] font-mono text-neutral-500 block">KM/H</span>
                      </div>

                      {/* throttle */}
                      <div className="bg-neutral-950 p-2 border border-neutral-900 rounded">
                        <span className="text-[8px] font-mono text-neutral-500 block uppercase">THROTTLE</span>
                        <span className="text-sm font-extrabold text-emerald-500 font-mono">{last.throttle}%</span>
                        <span className="text-[8px] font-mono text-neutral-500 block">PEDAL</span>
                      </div>

                      {/* gear */}
                      <div className="bg-neutral-950 p-2 border border-neutral-900 rounded">
                        <span className="text-[8px] font-mono text-neutral-500 block uppercase">GEAR</span>
                        <span className="text-base font-extrabold text-sky-400 font-mono">G{last.gear}</span>
                        <span className="text-[8px] font-mono text-neutral-500 block font-bold">RATIO</span>
                      </div>

                    </div>

                    {/* Brake and DRS states */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Brake overlay */}
                      <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded flex items-center justify-between font-mono">
                        <span className="text-neutral-500 text-[10px]">BRAKE ACTIVE</span>
                        {last.brake ? (
                          <span className="px-1.5 py-0.5 bg-red-950 text-red-500 border border-red-900 rounded text-[9px] font-black">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-neutral-600 text-[9px]">OFF</span>
                        )}
                      </div>

                      {/* DRS status */}
                      <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded flex items-center justify-between font-mono">
                        <span className="text-neutral-500 text-[10px]">DRS FLAP</span>
                        {last.drs ? (
                          <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded text-[9px] font-black animate-pulse">
                            OPENED
                          </span>
                        ) : (
                          <span className="text-neutral-600 text-[9px]">CLOSED</span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
            
            {/* Visual warning advisory */}
            <div className="p-3.5 bg-red-950/20 border border-neutral-900/40 rounded-xl flex items-center gap-3">
              <Footprints className="w-5 h-5 text-red-500" />
              <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                SAFETY WARNING: Accelerations, braking pressure variations, and gear selections computed here are high-fidelity models synced directly over server-authoritative WebSocket nodes for precise motorsport analytics.
              </p>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
