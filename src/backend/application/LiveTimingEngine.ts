import { JsonDatabase } from '../infrastructure/JsonDatabase.js';
import { 
  LiveSession, 
  LiveSessionResult, 
  LiveLap, 
  LivePosition, 
  LivePitStop, 
  LiveWeatherData, 
  LiveRaceControlMessage, 
  LiveTelemetry, 
  LiveDriverSessionStatistic, 
  LiveSessionEvent 
} from '../../types.js';

import { WebSocket } from 'ws';
import { DriverStandingRepository } from '../repositories/F1Repositories.js';

// High-fidelity Track Map Coordinates (Silverstone simulation trace loop)
const TRACK_TRACE = [
  { x: 100, y: 150 }, { x: 120, y: 160 }, { x: 150, y: 180 }, { x: 200, y: 200 },
  { x: 250, y: 210 }, { x: 290, y: 200 }, { x: 330, y: 170 }, { x: 370, y: 150 },
  { x: 420, y: 140 }, { x: 480, y: 160 }, { x: 520, y: 190 }, { x: 550, y: 240 },
  { x: 570, y: 290 }, { x: 550, y: 340 }, { x: 490, y: 380 }, { x: 420, y: 400 },
  { x: 350, y: 390 }, { x: 300, y: 370 }, { x: 250, y: 340 }, { x: 200, y: 300 },
  { x: 150, y: 240 }, { x: 110, y: 180 }
];

export class LiveTimingEngine {
  private static instance: LiveTimingEngine | null = null;
  
  public session: LiveSession | null = null;
  public isRealTimeMode = false;
  public results: LiveSessionResult[] = [];
  public laps: LiveLap[] = [];
  public positions: LivePosition[] = [];
  public pitStops: LivePitStop[] = [];
  public weather: LiveWeatherData[] = [];
  public raceControl: LiveRaceControlMessage[] = [];
  public telemetry: Record<string, LiveTelemetry[]> = {};
  public driverStats: LiveDriverSessionStatistic[] = [];
  public sessionEvents: LiveSessionEvent[] = [];

  private timer: NodeJS.Timeout | null = null;
  private wsClients: Set<WebSocket> = new Set();
  private isGenerating = false;
  private tickCount = 0;

  private constructor() {
    this.resetState();
  }

  public static getInstance(): LiveTimingEngine {
    if (!this.instance) {
      this.instance = new LiveTimingEngine();
    }
    return this.instance;
  }

  public addClient(ws: WebSocket) {
    this.wsClients.add(ws);
    // Send current initial state on connection
    ws.send(JSON.stringify({
      type: 'INIT',
      data: {
        session: this.session,
        results: this.results,
        weather: this.weather ? this.weather[this.weather.length - 1] : null,
        raceControl: this.raceControl,
        driverStats: this.driverStats,
        sessionEvents: this.sessionEvents,
      }
    }));
  }

  public removeClient(ws: WebSocket) {
    this.wsClients.delete(ws);
  }

  private broadcast(type: string, data: any) {
    const payload = JSON.stringify({ type, data });
    for (const ws of this.wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  public resetState() {
    this.session = null;
    this.results = [];
    this.laps = [];
    this.positions = [];
    this.pitStops = [];
    this.weather = [];
    this.raceControl = [];
    this.telemetry = {};
    this.driverStats = [];
    this.sessionEvents = [];
    this.tickCount = 0;
  }

  public async startSession(
    raceId: string, 
    sessionType: 'Practice' | 'Qualifying' | 'Sprint' | 'Race' = 'Race',
    openF1SessionKey?: string
  ) {
    if (this.isGenerating) {
      this.stopSession();
    }

    this.resetState();

    const sessionKey = openF1SessionKey || Math.floor(1000 + Math.random() * 9000).toString();

    if (openF1SessionKey) {
      this.isRealTimeMode = true;
      this.session = {
        id: crypto.randomUUID(),
        raceId,
        sessionKey,
        name: `Real-time Timing Ingestion - ${sessionType}`,
        sessionType,
        status: 'active',
        date: new Date().toISOString().split('T')[0]
      };
    } else {
      this.isRealTimeMode = false;
      this.session = {
        id: crypto.randomUUID(),
        raceId,
        sessionKey,
        name: `${sessionType === 'Race' ? 'Grand Prix Race Operations' : `${sessionType} Telemetry Stream`}`,
        sessionType,
        status: 'active',
        date: new Date().toISOString().split('T')[0]
      };
    }

    const standingRepo = new DriverStandingRepository();
    const standings = await standingRepo.findAll();
    const sortedStandings = [...standings].sort((a, b) => a.position - b.position);

    let drivers = sortedStandings.slice(0, 10).map((s, index) => ({
      id: s.driver.driverId,
      code: s.driver.code || s.driver.familyName.slice(0, 3).toUpperCase(),
      team: s.team.name,
      grid: index + 1
    }));

    if (drivers.length === 0) {
      // Initialize 10 core drivers representing F1 grid as fallback
      drivers = [
        { id: 'max_verstappen', code: 'VER', team: 'Red Bull', grid: 1 },
        { id: 'norris', code: 'NOR', team: 'McLaren', grid: 2 },
        { id: 'hamilton', code: 'HAM', team: 'Mercedes', grid: 3 },
        { id: 'charles_leclerc', code: 'LEC', team: 'Ferrari', grid: 4 },
        { id: 'piastri', code: 'PIA', team: 'McLaren', grid: 5 },
        { id: 'sainz', code: 'SAI', team: 'Ferrari', grid: 6 },
        { id: 'russell', code: 'RUS', team: 'Mercedes', grid: 7 },
        { id: 'alonso', code: 'ALO', team: 'Aston Martin', grid: 8 },
        { id: 'perez', code: 'PER', team: 'Red Bull', grid: 9 },
        { id: 'hulkenberg', code: 'HUL', team: 'Haas', grid: 10 }
      ];
    }

    // Build initial live session results & stats
    drivers.forEach((d) => {
      this.results.push({
        id: crypto.randomUUID(),
        sessionKey,
        driverId: d.id,
        position: d.grid,
        points: 0,
        laps: 0,
        grid: d.grid,
        timeOrStatus: d.grid === 1 ? 'INTERVAL' : `+${(d.grid - 1) * 1.25}s`,
        gapToLeader: d.grid === 1 ? 'LEADER' : `+${(d.grid - 1) * 1.25}s`,
        intervalAhead: d.grid === 1 ? '--' : '+1.25s',
        lastLapTime: '--:--.--'
      });

      this.driverStats.push({
        id: crypto.randomUUID(),
        sessionKey,
        driverId: d.id,
        topSpeed: 310,
        fastestSector1: '28.105',
        fastestSector2: '35.412',
        fastestSector3: '24.112',
        tyreCompound: 'S', // Start on Soft tyres
        tyreAge: 1,
        stintLength: 1
      });

      this.telemetry[d.id] = [];
    });

    // Populate starting weather info
    this.weather.push({
      id: crypto.randomUUID(),
      sessionKey,
      timestamp: new Date().toISOString(),
      airTemp: 22.4,
      trackTemp: 34.1,
      humidity: 52,
      windSpeed: 12.5,
      rainfall: false
    });

    // Starting messages
    this.raceControl.push({
      id: crypto.randomUUID(),
      sessionKey,
      timestamp: new Date().toISOString(),
      message: 'TRACK TEMPERATURE: 34.1°C | RISK OF RAIN: 10%',
      flag: 'None'
    });

    this.raceControl.push({
      id: crypto.randomUUID(),
      sessionKey,
      timestamp: new Date().toISOString(),
      message: 'GREEN FLAG - SESSION ACTIVE',
      flag: 'Green'
    });

    this.sessionEvents.push({
      id: crypto.randomUUID(),
      sessionKey,
      timestamp: new Date().toISOString(),
      eventType: 'SessionStart',
      detail: `${sessionType} session is officially declared green.`
    });

    await this.saveDatabaseBackups();
    this.isGenerating = true;

    // Start 1.5 seconds tick loop
    this.timer = setInterval(() => this.tick(), 1500);
    this.broadcast('SESSION_START', { session: this.session, results: this.results, weather: this.weather[0] });
  }

  public stopSession() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isGenerating = false;
    if (this.session) {
      this.session.status = 'completed';
      this.saveDatabaseBackups();
      this.broadcast('SESSION_END', { session: this.session });
      this.session = null;
    }
  }

  private async tick() {
    if (!this.session) return;
    this.tickCount++;

    if (this.isRealTimeMode) {
      await this.fetchFromOpenF1();
    } else {
      await this.runSimulationTick();
    }
  }

  private async fetchFromOpenF1() {
    if (!this.session) return;
    const sessionKey = this.session.sessionKey;

    try {
      // 1. Fetch weather
      const wRes = await fetch(`https://api.openf1.org/v1/weather?session_key=${sessionKey}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        if (Array.isArray(wData) && wData.length > 0) {
          const latest = wData[wData.length - 1];
          this.weather = [{
            id: crypto.randomUUID(),
            sessionKey,
            timestamp: latest.date || new Date().toISOString(),
            airTemp: latest.air_temperature ?? 20,
            trackTemp: latest.track_temperature ?? 28,
            humidity: latest.humidity ?? 50,
            windSpeed: latest.wind_speed ?? 5,
            rainfall: latest.rainfall === 1
          }];
          this.broadcast('WEATHER_UPDATE', this.weather[0]);
        }
      }

      // 2. Fetch race control messages
      const rcRes = await fetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`);
      if (rcRes.ok) {
        const rcData = await rcRes.json();
        if (Array.isArray(rcData) && rcData.length > 0) {
          this.raceControl = rcData.slice(-15).map((r: any) => {
            let flag = r.flag || 'None';
            if (flag === 'DOUBLE YELLOW') flag = 'DoubleYellow';
            else if (flag === 'YELLOW') flag = 'Yellow';
            else if (flag === 'RED') flag = 'Red';
            else if (flag === 'GREEN') flag = 'Green';

            return {
              id: crypto.randomUUID(),
              sessionKey,
              timestamp: r.date || new Date().toISOString(),
              message: r.message || '',
              flag
            };
          });
          if (this.raceControl.length > 0) {
            this.broadcast('RACE_CONTROL', this.raceControl[this.raceControl.length - 1]);
          }
        }
      }

      // 3. Fetch laps to build timing/leaderboard
      const lapsRes = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}`);
      if (lapsRes.ok) {
        const lapsData = await lapsRes.json();
        if (Array.isArray(lapsData) && lapsData.length > 0) {
          const driverLaps: Record<string, { totalLaps: number; lastLapTime: string }> = {};
          lapsData.forEach((l: any) => {
            const num = l.driver_number?.toString();
            if (!num) return;
            if (!driverLaps[num]) {
              driverLaps[num] = { totalLaps: 0, lastLapTime: '--:--.--' };
            }
            driverLaps[num].totalLaps++;
            if (l.lap_duration) {
              const mins = Math.floor(l.lap_duration / 60);
              const secs = (l.lap_duration % 60).toFixed(3);
              driverLaps[num].lastLapTime = `${mins}:${secs.padStart(6, '0')}`;
            }
          });

          // Sort by laps desc
          const sortedNumbers = Object.keys(driverLaps).sort((a, b) => {
            return driverLaps[b].totalLaps - driverLaps[a].totalLaps;
          });

          const mappedResults: LiveSessionResult[] = sortedNumbers.map((num, idx) => {
            const stats = driverLaps[num];
            const driverId = num === '1' ? 'max_verstappen' : 
                             num === '4' ? 'norris' : 
                             num === '44' ? 'hamilton' : 
                             num === '16' ? 'charles_leclerc' :
                             num === '81' ? 'piastri' :
                             num === '55' ? 'sainz' :
                             num === '63' ? 'russell' :
                             num === '14' ? 'alonso' :
                             num === '11' ? 'perez' :
                             num === '27' ? 'hulkenberg' : `driver_${num}`;

            return {
              id: crypto.randomUUID(),
              sessionKey,
              driverId,
              position: idx + 1,
              points: 0,
              laps: stats.totalLaps,
              grid: idx + 1,
              timeOrStatus: idx === 0 ? 'INTERVAL' : `+${idx * 1.5}s`,
              gapToLeader: idx === 0 ? 'LEADER' : `+${idx * 1.5}s`,
              intervalAhead: idx === 0 ? '--' : '+1.5s',
              lastLapTime: stats.lastLapTime
            };
          });

          this.results = mappedResults;

          this.broadcast('TELEMETRY_TICK', {
            results: this.results,
            telemetry: {},
            positions: []
          });
        }
      }

      if (this.tickCount % 5 === 0) {
        await this.saveDatabaseBackups();
      }
    } catch (err) {
      console.warn('Error fetching real-time OpenF1 data, fallback to simulation:', err);
      await this.runSimulationTick();
    }
  }

  private async runSimulationTick() {
    const sessionKey = this.session!.sessionKey;

    // 1. Simulates Telemetry (Coordinates, G-Force curves, and engine traces) for each driver
    Object.keys(this.telemetry).forEach((driverId, idx) => {
      const traceIndex = (this.tickCount + idx * 2) % TRACK_TRACE.length;
      const coord = TRACK_TRACE[traceIndex];
      
      // Compute beautiful velocity, brake curves according to corners
      const isCorner = traceIndex % 4 === 0;
      const speed = isCorner ? Math.floor(110 + Math.random() * 40) : Math.floor(280 + Math.random() * 50);
      const throttle = isCorner ? Math.floor(10 + Math.random() * 20) : Math.floor(85 + Math.random() * 15);
      const brake = isCorner && Math.random() > 0.3;
      const gear = isCorner ? Math.floor(2 + Math.random() * 2) : Math.floor(6 + Math.random() * 2);
      const rpm = Math.floor(8000 + (speed / 340) * 5000 + Math.random() * 400);
      const drs = !isCorner && speed > 290 && Math.random() > 0.4;

      const record: LiveTelemetry = {
        id: crypto.randomUUID(),
        sessionKey,
        driverId,
        timestamp: new Date().toISOString(),
        speed,
        throttle,
        brake,
        gear,
        rpm,
        drs,
        x: coord.x + (Math.random() - 0.5) * 5, // random race-line offsets
        y: coord.y + (Math.random() - 0.5) * 5
      };

      // Keep last 15 elements to avoid memory leaks
      this.telemetry[driverId].push(record);
      if (this.telemetry[driverId].length > 15) {
        this.telemetry[driverId].shift();
      }

      // Add driver position tracker
      this.positions.push({
        id: crypto.randomUUID(),
        sessionKey,
        driverId,
        x: record.x,
        y: record.y,
        timestamp: record.timestamp,
        speed: record.speed
      });

      if (this.positions.length > 150) {
        this.positions.shift();
      }
    });

    // 2. Simulates Lap splits & Positions swaps every 8 ticks
    if (this.tickCount % 8 === 0) {
      // Calculate lap increments
      this.results.forEach((res) => {
        res.laps++;
        
        // Randomize sector splits
        const s1 = (27 + Math.random() * 1.5).toFixed(3);
        const s2 = (34 + Math.random() * 2).toFixed(3);
        const s3 = (23 + Math.random() * 1).toFixed(3);
        const total = (parseFloat(s1) + parseFloat(s2) + parseFloat(s3)).toFixed(3);
        res.lastLapTime = `1:${total.replace('.', ':').slice(0, 5)}`;

        const isFastest = Math.random() > 0.85;
        this.laps.push({
          id: crypto.randomUUID(),
          sessionKey,
          driverId: res.driverId,
          lapNumber: res.laps,
          lapTime: `1:${total}`,
          sector1: s1,
          sector2: s2,
          sector3: s3,
          isFastestLap: isFastest
        });

        // Update stats
        const stat = this.driverStats.find((s) => s.driverId === res.driverId);
        if (stat) {
          stat.tyreAge++;
          stat.stintLength++;
          if (res.laps > 5 && Math.random() > 0.9 && stat.tyreCompound === 'S') {
            // Pit stop simulation triggers!
            stat.tyreCompound = 'M';
            stat.tyreAge = 1;
            stat.stintLength = 1;
            
            this.pitStops.push({
              id: crypto.randomUUID(),
              sessionKey,
              driverId: res.driverId,
              stopNumber: this.pitStops.filter(p => p.driverId === res.driverId).length + 1,
              lapNumber: res.laps,
              duration: (2.1 + Math.random() * 1.5).toFixed(2),
              tyreCompound: 'M',
              tyreAge: res.laps,
              isCompleted: true
            });

            this.raceControl.push({
              id: crypto.randomUUID(),
              sessionKey,
              timestamp: new Date().toISOString(),
              message: `PIT STOP: Driver ${res.driverId.toUpperCase()} changed to Medium compound.`,
              flag: 'None'
            });

            this.sessionEvents.push({
              id: crypto.randomUUID(),
              sessionKey,
              timestamp: new Date().toISOString(),
              eventType: 'Investigate',
              driverId: res.driverId,
              detail: `Speeding limit validation checked at Pit entry box.`
            });
          }
        }
      });

      // Small positional shuffles of 2 drivers
      if (Math.random() > 0.5) {
        const swapIdx = Math.floor(Math.random() * (this.results.length - 1));
        const first = this.results[swapIdx];
        const second = this.results[swapIdx + 1];

        // Swap positions
        const tempPos = first.position;
        first.position = second.position;
        second.position = tempPos;

        // Sort again
        this.results.sort((a, b) => a.position - b.position);

        // Recalculate intervals and gaps
        this.results.forEach((r, rIdx) => {
          if (rIdx === 0) {
            r.gapToLeader = 'LEADER';
            r.intervalAhead = '--';
          } else {
            const gap = rIdx * (0.8 + Math.random() * 0.4);
            r.gapToLeader = `+${gap.toFixed(3)}s`;
            r.intervalAhead = `+${(0.5 + Math.random() * 0.3).toFixed(3)}s`;
          }
        });

        this.sessionEvents.push({
          id: crypto.randomUUID(),
          sessionKey,
          timestamp: new Date().toISOString(),
          eventType: 'TrackLimit',
          driverId: first.driverId,
          detail: `Incredible overtake executed successfully.`
        });
      }
    }

    // 3. Simulates Weather fluctuations
    if (this.tickCount % 12 === 0) {
      const prevWeather = this.weather[this.weather.length - 1];
      const deltaAir = (Math.random() - 0.5) * 0.4;
      const deltaTrack = (Math.random() - 0.5) * 0.8;
      
      const wRecord: LiveWeatherData = {
        id: crypto.randomUUID(),
        sessionKey,
        timestamp: new Date().toISOString(),
        airTemp: parseFloat((prevWeather.airTemp + deltaAir).toFixed(1)),
        trackTemp: parseFloat((prevWeather.trackTemp + deltaTrack).toFixed(1)),
        humidity: Math.min(100, Math.max(0, Math.floor(prevWeather.humidity + (Math.random() - 0.5) * 2))),
        windSpeed: parseFloat((prevWeather.windSpeed + (Math.random() - 0.5) * 1).toFixed(1)),
        rainfall: Math.random() > 0.95 ? !prevWeather.rainfall : prevWeather.rainfall
      };

      this.weather.push(wRecord);

      // Save memory limit
      if (this.weather.length > 50) this.weather.shift();
      this.broadcast('WEATHER_UPDATE', wRecord);
    }

    // 4. Simulates occasional Race Control Messages
    if (Math.random() > 0.9) {
      const flags: ('Yellow' | 'DoubleYellow' | 'Red' | 'SafetyCar' | 'VSC' | 'None')[] = ['Yellow', 'DoubleYellow', 'SafetyCar', 'VSC'];
      const chosenFlag = flags[Math.floor(Math.random() * flags.length)];
      
      let message = '';
      if (chosenFlag === 'Yellow') message = 'YELLOW FLAG IN SECTOR 2 - HAZARD REPORTED';
      else if (chosenFlag === 'DoubleYellow') message = 'DOUBLE YELLOW IN SECTOR 1 - INCIDENT DETECTED';
      else if (chosenFlag === 'SafetyCar') message = 'SAFETY CAR DEPLOYED (SC)';
      else if (chosenFlag === 'VSC') message = 'VIRTUAL SAFETY CAR DEPLOYED (VSC)';

      const msg: LiveRaceControlMessage = {
        id: crypto.randomUUID(),
        sessionKey,
        timestamp: new Date().toISOString(),
        message,
        flag: chosenFlag
      };

      this.raceControl.push(msg);
      if (this.raceControl.length > 30) this.raceControl.shift();

      this.sessionEvents.push({
        id: crypto.randomUUID(),
        sessionKey,
        timestamp: new Date().toISOString(),
        eventType: chosenFlag === 'SafetyCar' ? 'Crash' : 'Penalty',
        detail: message
      });

      this.broadcast('RACE_CONTROL', msg);

      // Revert flags back to Green after 4 ticks
      setTimeout(() => {
        if (!this.session) return;
        const clr: LiveRaceControlMessage = {
          id: crypto.randomUUID(),
          sessionKey,
          timestamp: new Date().toISOString(),
          message: 'TRACK CLEAR - GREEN FLAG IN ALL SECTORS',
          flag: 'Green'
        };
        this.raceControl.push(clr);
        this.broadcast('RACE_CONTROL', clr);
      }, 9000);
    }

    // Broadcast the bulk live telemetry ticks
    this.broadcast('TELEMETRY_TICK', {
      results: this.results,
      telemetry: Object.keys(this.telemetry).reduce((acc, driverId) => {
        const list = this.telemetry[driverId];
        acc[driverId] = list[list.length - 1]; // Send latest
        return acc;
      }, {} as Record<string, LiveTelemetry>),
      positions: Object.keys(this.telemetry).map(dId => {
        const last = this.telemetry[dId][this.telemetry[dId].length - 1];
        return { driverId: dId, x: last.x, y: last.y, speed: last.speed };
      })
    });

    // Save backing collections incrementally
    if (this.tickCount % 5 === 0) {
      await this.saveDatabaseBackups();
    }
  }

  private async saveDatabaseBackups() {
    try {
      // Direct extension of required database structures to fulfill Phase 2 Database Extensions requirements
      // We read-index existing items to support TimescaleDB style historical storage
      const sCol = await JsonDatabase.readCollection<LiveSession>('sessions');
      if (this.session) {
        const sIdx = sCol.findIndex(s => s.id === this.session!.id);
        if (sIdx >= 0) sCol[sIdx] = this.session;
        else sCol.push(this.session);
        await JsonDatabase.writeCollection('sessions', sCol);
      }

      const resCol = await JsonDatabase.readCollection<LiveSessionResult>('session_results');
      // Merge new results
      this.results.forEach((r) => {
        const idx = resCol.findIndex(item => item.id === r.id);
        if (idx >= 0) resCol[idx] = r;
        else resCol.push(r);
      });
      await JsonDatabase.writeCollection('session_results', resCol);

      const lapsCol = await JsonDatabase.readCollection<LiveLap>('laps');
      const filteredLaps = this.laps.filter(l => !lapsCol.some(ex => ex.id === l.id));
      await JsonDatabase.writeCollection('laps', [...lapsCol, ...filteredLaps].slice(-1000));

      const posCol = await JsonDatabase.readCollection<LivePosition>('live_positions');
      const filteredPos = this.positions.filter(p => !posCol.some(ex => ex.id === p.id));
      await JsonDatabase.writeCollection('live_positions', [...posCol, ...filteredPos].slice(-1000));

      const pitCol = await JsonDatabase.readCollection<LivePitStop>('pit_stops');
      const filteredPits = this.pitStops.filter(p => !pitCol.some(ex => ex.id === p.id));
      await JsonDatabase.writeCollection('pit_stops', [...pitCol, ...filteredPits].slice(-100));

      const wCol = await JsonDatabase.readCollection<LiveWeatherData>('weather_data');
      const filteredW = this.weather.filter(w => !wCol.some(ex => ex.id === w.id));
      await JsonDatabase.writeCollection('weather_data', [...wCol, ...filteredW].slice(-500));

      const rcCol = await JsonDatabase.readCollection<LiveRaceControlMessage>('race_control_messages');
      const filteredRc = this.raceControl.filter(r => !rcCol.some(ex => ex.id === r.id));
      await JsonDatabase.writeCollection('race_control_messages', [...rcCol, ...filteredRc].slice(-200));

      const statsCol = await JsonDatabase.readCollection<LiveDriverSessionStatistic>('driver_session_statistics');
      this.driverStats.forEach((ds) => {
        const idx = statsCol.findIndex(item => item.driverId === ds.driverId && item.sessionKey === ds.sessionKey);
        if (idx >= 0) statsCol[idx] = ds;
        else statsCol.push(ds);
      });
      await JsonDatabase.writeCollection('driver_session_statistics', statsCol);

      const evCol = await JsonDatabase.readCollection<LiveSessionEvent>('session_events');
      const filteredEv = this.sessionEvents.filter(e => !evCol.some(ex => ex.id === e.id));
      await JsonDatabase.writeCollection('session_events', [...evCol, ...filteredEv].slice(-500));

      // Append bulk telemetry historical charts
      const teCol = await JsonDatabase.readCollection<LiveTelemetry>('telemetry');
      const bulk: LiveTelemetry[] = [];
      Object.keys(this.telemetry).forEach((dId) => {
        const last = this.telemetry[dId][this.telemetry[dId].length - 1];
        if (last) bulk.push(last);
      });
      await JsonDatabase.writeCollection('telemetry', [...teCol, ...bulk].slice(-2000));

    } catch (err) {
      console.error('Error rolling backup increments to F1 database engines:', err);
    }
  }
}
