import { Router, Request, Response, RequestHandler } from 'express';
import {
  SeasonRepository,
  RaceWeekendRepository,
  DriverRepository,
  TeamRepository,
  DriverStandingRepository,
  ConstructorStandingRepository,
  RaceResultRepository
} from '../repositories/F1Repositories.js';
import { SyncService } from '../application/SyncService.js';
import { AiPredictionService } from '../application/AiPredictionService.js';
import { LiveTimingEngine } from '../application/LiveTimingEngine.js';

// Machine Learning Suite Imports
import { FeatureStore } from '../ml/FeatureStore.js';
import { ModelRegistry } from '../ml/ModelRegistry.js';
import { EnsembleLearning } from '../ml/EnsembleLearning.js';
import { PredictiveEngines } from '../ml/PredictiveEngines.js';

export const f1Router = Router();

const seasonRepo = new SeasonRepository();
const raceRepo = new RaceWeekendRepository();
const driverRepo = new DriverRepository();
const teamRepo = new TeamRepository();
const driverStandingRepo = new DriverStandingRepository();
const constructorStandingRepo = new ConstructorStandingRepository();
const resultRepo = new RaceResultRepository();

const syncService = new SyncService();
const aiService = new AiPredictionService();

// Inline wrapper to safely catch async exceptions in Express 4
const load = (fn: (req: Request, res: Response) => Promise<any>): RequestHandler => {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
};

// 1. GET /api/seasons/current
f1Router.get('/seasons/current', load(async (req: Request, res: Response) => {
  const currentSeason = {
    year: '2025', // Use latest dynamic
    status: 'active',
    lastSynced: new Date().toISOString()
  };
  return res.json(currentSeason);
}));

// 2. GET /api/races
f1Router.get('/races', load(async (req: Request, res: Response) => {
  const races = await raceRepo.findAll();
  
  // Basic search/filters
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';
  let filtered = races;
  if (search) {
    filtered = races.filter(r => 
      r.raceName.toLowerCase().includes(search) || 
      r.circuit.circuitName.toLowerCase().includes(search) || 
      r.circuit.country.toLowerCase().includes(search)
    );
  }

  // Sort by round ascend/descend
  const sort = req.query.sort === 'desc' ? -1 : 1;
  filtered.sort((a, b) => (parseInt(a.round, 10) - parseInt(b.round, 10)) * sort);

  return res.json(filtered);
}));

// 3. GET /api/races/upcoming
f1Router.get('/races/upcoming', load(async (req: Request, res: Response) => {
  const races = await raceRepo.findAll();
  if (races.length === 0) {
    return res.status(404).json({ error: 'No races loaded in local DB.' });
  }

  // Date comparison relative to standard local F1 timeframe
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Sort races by ascending date
  const sortedRaces = [...races].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Find first race in future
  const upcoming = sortedRaces.find(r => r.date >= todayStr);
  
  // If none are in future, return the last race of the schedules
  return res.json(upcoming || sortedRaces[sortedRaces.length - 1]);
}));

// 4. GET /api/races/:id
f1Router.get('/races/:id', load(async (req: Request, res: Response) => {
  const race = await raceRepo.findById(req.params.id);
  if (!race) {
    return res.status(404).json({ error: `RaceWeekend with ID ${req.params.id} not found.` });
  }

  // Fetch results and insights
  let results = await resultRepo.findByRaceId(req.params.id) || [];
  
  if (results.length === 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (race.date < todayStr) {
      console.log(`🤖 Race ${race.id} (${race.raceName}) has already occurred but results are not cached. Synchronizing now...`);
      try {
        const syncService = new SyncService();
        results = await syncService.syncRaceResults(race.season, race.round);
      } catch (err) {
        console.error(`❌ Failed to dynamically sync results for race ${race.id}:`, err);
      }
    }
  }
  
  // Safe default details
  return res.json({
    ...race,
    results,
  });
}));

// 5. GET /api/drivers
f1Router.get('/drivers', load(async (req: Request, res: Response) => {
  const drivers = await driverRepo.findAll();
  return res.json(drivers);
}));

// 6. GET /api/drivers/:id
f1Router.get('/drivers/:id', load(async (req: Request, res: Response) => {
  const driver = await driverRepo.findById(req.params.id);
  if (!driver) {
    return res.status(404).json({ error: `Driver with ID ${req.params.id} not found.` });
  }
  return res.json(driver);
}));

// 7. GET /api/teams
f1Router.get('/teams', load(async (req: Request, res: Response) => {
  const teams = await teamRepo.findAll();
  return res.json(teams);
}));

// 8. GET /api/teams/:id
f1Router.get('/teams/:id', load(async (req: Request, res: Response) => {
  const team = await teamRepo.findById(req.params.id);
  if (!team) {
    return res.status(404).json({ error: `Team with ID ${req.params.id} not found.` });
  }
  return res.json(team);
}));

// 9. GET /api/standings/drivers
f1Router.get('/standings/drivers', load(async (req: Request, res: Response) => {
  let standings = await driverStandingRepo.findAll();
  if (standings.length === 0) {
    return res.json([]);
  }
  
  // Ensure position sorting
  standings.sort((a, b) => a.position - b.position);
  return res.json(standings);
}));

// 10. GET /api/standings/constructors
f1Router.get('/standings/constructors', load(async (req: Request, res: Response) => {
  let standings = await constructorStandingRepo.findAll();
  if (standings.length === 0) {
    return res.json([]);
  }
  
  standings.sort((a, b) => a.position - b.position);
  return res.json(standings);
}));

// 11. POST /api/sync
f1Router.post('/sync', load(async (req: Request, res: Response) => {
  if (syncService.isSyncing) {
    return res.status(429).json({ message: 'Synchronizer is already active.', status: 'syncing' });
  }
  
  // Non-blocking trigger of background synchronization
  const season = typeof req.body.season === 'string' ? req.body.season : 'current';
  syncService.syncAll(season).catch(err => {
    console.error('Background sync failed:', err);
  });

  return res.json({ message: 'Synchronization triggered in background.', status: 'triggered' });
}));

// 12. GET /api/sync/status
f1Router.get('/sync/status', load(async (req: Request, res: Response) => {
  const racesCount = (await raceRepo.findAll()).length;
  const driversCount = (await driverRepo.findAll()).length;
  const standingsCount = (await driverStandingRepo.findAll()).length;

  return res.json({
    isSyncing: syncService.isSyncing,
    racesCount,
    driversCount,
    standingsCount,
  });
}));

// 13. POST /api/races/:id/insights
f1Router.post('/races/:id/insights', load(async (req: Request, res: Response) => {
  const raceId = req.params.id;
  try {
    const insights = await aiService.generateRaceInsights(raceId);
    return res.json({ raceId, insights });
  } catch (error: any) {
    console.error('Failed to generate AI insights:', error);
    return res.status(500).json({ error: 'Failed to generate AI strategy insights.' });
  }
}));

// 14. GET /api/races/:id/insights
f1Router.get('/races/:id/insights', load(async (req: Request, res: Response) => {
  const raceId = req.params.id;
  const insights = await aiService.generateRaceInsights(raceId);
  return res.json({ raceId, insights });
}));

// --- PHASE 2 REAL-TIME OPERATIONS SUITE API ---

const liveEngine = LiveTimingEngine.getInstance();

// 14.5 GET /api/live/status
f1Router.get('/live/status', load(async (req: Request, res: Response) => {
  const testLive = req.query.test_live === 'true';

  const races = await raceRepo.findAll();
  const slots: {
    raceId: string;
    raceName: string;
    sessionName: string;
    startTime: string;
    endTime: string;
  }[] = [];

  const buildDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return null;
    const t = timeStr ? (timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`) : '12:00:00Z';
    const parsed = new Date(`${dateStr}T${t}`);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  for (const r of races) {
    const addSlot = (name: string, obj?: { date: string; time?: string }) => {
      if (!obj) return;
      const start = buildDate(obj.date, obj.time);
      if (!start) return;
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours
      slots.push({
        raceId: r.id,
        raceName: r.raceName,
        sessionName: name,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
    };

    addSlot('FP1', r.firstPractice);
    addSlot('FP2', r.secondPractice);
    addSlot('FP3', r.thirdPractice);
    addSlot('Qualifying', r.qualifying);
    addSlot('Sprint', r.sprint);
    addSlot('Race', { date: r.date, time: r.time });
  }

  const now = new Date();

  // Find current active session
  let activeSession = slots.find(s => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    return now >= start && now <= end;
  }) || null;

  // Find next upcoming session
  const upcomingSlots = slots
    .filter(s => new Date(s.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextSession = upcomingSlots[0] || null;

  let isLive = !!activeSession;
  if (testLive) {
    isLive = true;
    if (!activeSession) {
      activeSession = {
        raceId: 'test-gp',
        raceName: 'Developer Test Grand Prix',
        sessionName: 'Race',
        startTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString()
      };
    }
  }

  return res.json({
    live: isLive,
    activeSession,
    nextSession
  });
}));

async function checkAndAutoStartLiveSession(): Promise<any> {
  const races = await raceRepo.findAll();
  const buildDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return null;
    const t = timeStr ? (timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`) : '12:00:00Z';
    const parsed = new Date(`${dateStr}T${t}`);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  let activeSession = null;
  let activeSessionType: 'Practice' | 'Qualifying' | 'Sprint' | 'Race' = 'Race';

  for (const r of races) {
    const checkActive = (name: 'Practice' | 'Qualifying' | 'Sprint' | 'Race', obj?: { date: string; time?: string }) => {
      if (!obj) return;
      const start = buildDate(obj.date, obj.time);
      if (!start) return;
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const now = new Date();
      if (now >= start && now <= end) {
        activeSession = r;
        activeSessionType = name;
      }
    };
    checkActive('Practice', r.firstPractice);
    checkActive('Practice', r.secondPractice);
    checkActive('Practice', r.thirdPractice);
    checkActive('Qualifying', r.qualifying);
    checkActive('Sprint', r.sprint);
    checkActive('Race', { date: r.date, time: r.time });
  }

  if (activeSession) {
    if (!liveEngine.session) {
      let openF1Key: string | undefined = undefined;
      try {
        const oRes = await fetch('https://api.openf1.org/v1/sessions');
        if (oRes.ok) {
          const oData = await oRes.json();
          if (Array.isArray(oData) && oData.length > 0) {
            openF1Key = oData[oData.length - 1].session_key.toString();
          }
        }
      } catch (err) {
        console.warn('Failed to fetch OpenF1 key for auto-start:', err);
      }
      
      const raceId = (activeSession as any).id || 'current-gp';
      await liveEngine.startSession(raceId, activeSessionType, openF1Key);
    }
  }
}

// 15. GET /api/live/session
f1Router.get('/live/session', load(async (req: Request, res: Response) => {
  await checkAndAutoStartLiveSession();
  return res.json({
    active: !!liveEngine.session,
    session: liveEngine.session,
  });
}));

// 16. POST /api/live/start
f1Router.post('/live/start', load(async (req: Request, res: Response) => {
  const { raceId, sessionType } = req.body;
  await liveEngine.startSession(raceId || 'current-gp', sessionType || 'Race');
  return res.json({ message: 'Live timing engine successfully online.', session: liveEngine.session });
}));

// 17. POST /api/live/stop
f1Router.post('/live/stop', load(async (req: Request, res: Response) => {
  liveEngine.stopSession();
  return res.json({ message: 'Live timing engine brought offline.' });
}));

// 18. GET /api/live/timing
f1Router.get('/live/timing', load(async (req: Request, res: Response) => {
  return res.json(liveEngine.results);
}));

// 19. GET /api/live/weather
f1Router.get('/live/weather', load(async (req: Request, res: Response) => {
  return res.json(liveEngine.weather);
}));

// 20. GET /api/live/race-control
f1Router.get('/live/race-control', load(async (req: Request, res: Response) => {
  return res.json(liveEngine.raceControl);
}));

// 21. GET /api/live/telemetry/:driverId
f1Router.get('/live/telemetry/:driverId', load(async (req: Request, res: Response) => {
  const list = liveEngine.telemetry[req.params.driverId] || [];
  return res.json(list);
}));

// 22. GET /api/live/pit-stops
f1Router.get('/live/pit-stops', load(async (req: Request, res: Response) => {
  return res.json(liveEngine.pitStops);
}));

// 23. GET /api/live/stats
f1Router.get('/live/stats', load(async (req: Request, res: Response) => {
  return res.json(liveEngine.driverStats);
}));

// 24. GET /api/live/events
f1Router.get('/live/events', load(async (req: Request, res: Response) => {
  return res.json(liveEngine.sessionEvents);
}));

// --- PHASE 3 ADVANCED MACHINE LEARNING & MLOPS API ENDPOINTS ---

const featureStore = FeatureStore.getInstance();
const modelRegistry = ModelRegistry.getInstance();
const ensembleLearning = EnsembleLearning.getInstance();
const predictiveEngines = PredictiveEngines.getInstance();

// A. Feature Store endpoints
f1Router.get('/ml/features/drivers', load(async (req: Request, res: Response) => {
  const feats = await featureStore.getAllDrivers();
  return res.json(feats);
}));

f1Router.get('/ml/features/teams', load(async (req: Request, res: Response) => {
  const feats = await featureStore.getAllTeams();
  return res.json(feats);
}));

// B. Model Registry endpoints
f1Router.get('/ml/models', load(async (req: Request, res: Response) => {
  const models = modelRegistry.getAllModels();
  return res.json(models);
}));

f1Router.post('/ml/models/promote', load(async (req: Request, res: Response) => {
  const { modelId } = req.body;
  if (!modelId) {
    return res.status(400).json({ error: 'Missing required string parameter: modelId' });
  }
  const success = modelRegistry.promoteModel(modelId);
  if (!success) {
    return res.status(404).json({ error: `Model with ID ${modelId} not found in registry.` });
  }
  return res.json({ success: true, message: `Model ${modelId} successfully promoted to active Production status.` });
}));

f1Router.post('/ml/models/retrain', load(async (req: Request, res: Response) => {
  const { category } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Missing required parameter: category' });
  }
  const reports = await ensembleLearning.executeAutoRetraining(category);
  return res.json({
    message: `Continuous training pipeline successfully triggered for ${category}. Best candidate auto-deployed.`,
    reports
  });
}));

// C. MLOps Monitoring Dashboard
f1Router.get('/ml/monitoring', load(async (req: Request, res: Response) => {
  const logs = await predictiveEngines.getMonitoringLogs();
  return res.json(logs);
}));

// D. Predictions Suite
f1Router.get('/ml/predictions/winner', load(async (req: Request, res: Response) => {
  const circuitId = typeof req.query.circuitId === 'string' ? req.query.circuitId : 'silverstone';
  const odds = await predictiveEngines.predictRaceWinner(circuitId);
  return res.json(odds);
}));

f1Router.get('/ml/predictions/championship', load(async (req: Request, res: Response) => {
  const sims = typeof req.query.simulations === 'string' ? parseInt(req.query.simulations, 10) : 10000;
  const forecast = await predictiveEngines.runChampionshipForecast(sims);
  return res.json(forecast);
}));

f1Router.get('/ml/predictions/safetycar', load(async (req: Request, res: Response) => {
  const circuitId = typeof req.query.circuitId === 'string' ? req.query.circuitId : 'silverstone';
  const hazard = await predictiveEngines.predictSafetyCarIncidents(circuitId);
  return res.json(hazard);
}));

f1Router.get('/ml/predictions/strategy', load(async (req: Request, res: Response) => {
  const circuitId = typeof req.query.circuitId === 'string' ? req.query.circuitId : 'silverstone';
  const recommendation = await predictiveEngines.recommendStrategy(circuitId);
  return res.json(recommendation);
}));

f1Router.get('/ml/predictions/simulations', load(async (req: Request, res: Response) => {
  const circuitId = typeof req.query.circuitId === 'string' ? req.query.circuitId : 'silverstone';
  const simsDistribution = await predictiveEngines.runRaceSimulation(circuitId);
  return res.json(simsDistribution);
}));

// E. Intelligence Scorecards
f1Router.get('/ml/intelligence/drivers', load(async (req: Request, res: Response) => {
  const cards = await predictiveEngines.getDriverIntelligence();
  return res.json(cards);
}));

f1Router.get('/ml/intelligence/teams', load(async (req: Request, res: Response) => {
  const cards = await predictiveEngines.getTeamIntelligence();
  return res.json(cards);
}));
