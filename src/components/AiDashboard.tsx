import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Cpu,
  TrendingUp,
  Activity,
  Zap,
  RotateCw,
  Sliders,
  Database,
  Award,
  AlertTriangle,
  Play,
  CheckCircle,
  HelpCircle,
  Shield,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// --- TS INTERFACES MATCHING BACKEND ENDPOINTS ---

interface WinOdds {
  driverId: string;
  name: string;
  winProbability: number;
  podiumProbability: number;
  confidence: number;
  explainability: { feature: string; impact: number }[];
  modelUsed: string;
  modelVersion: string;
  validationAccuracy: number;
}

interface ChampionshipForecast {
  driverPredictions: {
    driverId: string;
    name: string;
    championProbability: number;
    top3Probability: number;
    avgSimulatedPoints: number;
    pointsMarginCurve: number[];
  }[];
  constructorPredictions: {
    constructorId: string;
    name: string;
    championProbability: number;
    top3Probability: number;
    avgSimulatedPoints: number;
  }[];
  simulationsRun: number;
  lastRetrained: string;
}

interface SafetyCarIncidentPrediction {
  safetyCarProbability: number;
  vscProbability: number;
  redFlagProbability: number;
  highestDangerZone: string;
  confidence: number;
  explainer: { element: string; riskWeight: number }[];
}

interface StrategyRecommendation {
  recommendedStrategy: string;
  expectedRaceTimeGain: number;
  expectedPositionGain: number;
  optimalPitStopWindows: { stint: number; stopLap: number; compound: string }[];
  tyreWearCurves: Record<string, { lap: number; remainingLife: number; performanceDelta: number }[]>;
}

interface DriverScorecard {
  driverId: string;
  name: string;
  racecraft: number;
  qualifying: number;
  consistency: number;
  overtaking: number;
  wetWeather: number;
  tyreManagement: number;
  pressureHandling: number;
  overallRank: number;
}

interface TeamScorecard {
  constructorId: string;
  name: string;
  reliability: number;
  pitCrew: number;
  development: number;
  strategy: number;
  racePace: number;
  qualifyingPace: number;
  overallScore: number;
}

interface ModelMetadata {
  id: string;
  name: string;
  type: string;
  category: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  trainingDate: string;
  hyperparameters: Record<string, any>;
  featuresUsed: string[];
  status: string;
  trainingSamplesCount: number;
}

interface ModelMonitorLog {
  timestamp: string;
  predictionAccuracy: number;
  dataDriftIndex: number;
  confidenceCalibration: number;
  falsePositives: number;
  falseNegatives: number;
  driftMetrics: {
    featureName: string;
    driftDetected: boolean;
    pvalue: number;
    referenceMean: number;
    currentMean: number;
  }[];
}

type ActiveTab = 'predictions' | 'simulations' | 'intelligence' | 'mlops';

export default function AiDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('predictions');
  const [selectedCircuit, setSelectedCircuit] = useState('silverstone');
  const [loading, setLoading] = useState(true);

  // States
  const [winOdds, setWinOdds] = useState<WinOdds[]>([]);
  const [forecast, setForecast] = useState<ChampionshipForecast | null>(null);
  const [safetyCar, setSafetyCar] = useState<SafetyCarIncidentPrediction | null>(null);
  const [strategy, setStrategy] = useState<StrategyRecommendation | null>(null);
  const [driversList, setDriversList] = useState<DriverScorecard[]>([]);
  const [teamsList, setTeamsList] = useState<TeamScorecard[]>([]);
  const [modelsRegistry, setModelsRegistry] = useState<ModelMetadata[]>([]);
  const [monitoringLogs, setMonitoringLogs] = useState<ModelMonitorLog[]>([]);

  // Simulation Grid position distributions state
  const [simulationGrid, setSimulationGrid] = useState<any[]>([]);

  // MLOps retractable state
  const [retrainingStatus, setRetrainingStatus] = useState<Record<string, 'idle' | 'running' | 'success'>>({
    Winner: 'idle',
    Podium: 'idle',
    Championship: 'idle',
    SafetyCar: 'idle',
    TyreDegradation: 'idle',
    Strategy: 'idle'
  });
  const [activeExplainDriver, setActiveExplainDriver] = useState<string | null>(null);

  const fetchPredictionsAndInsights = async (circuit = selectedCircuit) => {
    setLoading(true);
    try {
      // 1. Fetch Winner Odds
      const oddsRes = await fetch(`/api/ml/predictions/winner?circuitId=${circuit}`);
      if (oddsRes.ok) {
        const oddsData = await oddsRes.json();
        setWinOdds(oddsData);
        if (oddsData.length > 0 && !activeExplainDriver) {
          setActiveExplainDriver(oddsData[0].driverId);
        }
      }

      // 2. Fetch Safety Car Probability
      const scRes = await fetch(`/api/ml/predictions/safetycar?circuitId=${circuit}`);
      if (scRes.ok) {
        const scData = await scRes.json();
        setSafetyCar(scData);
      }

      // 3. Fetch Strategy Recomms
      const stratRes = await fetch(`/api/ml/predictions/strategy?circuitId=${circuit}`);
      if (stratRes.ok) {
        const stratData = await stratRes.json();
        setStrategy(stratData);
      }

      // 4. Grid Simulation Distributions
      const simRes = await fetch(`/api/ml/predictions/simulations?circuitId=${circuit}`);
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimulationGrid(simData);
      }
    } catch (e) {
      console.error('Failed to load predictions matrix:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalMlData = async () => {
    try {
      // Championship forecasts
      const forecastRes = await fetch('/api/ml/predictions/championship?simulations=10000');
      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setForecast(forecastData);
      }

      // Driver Scorecards
      const driversRes = await fetch('/api/ml/intelligence/drivers');
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDriversList(driversData);
      }

      // Team Scorecards
      const teamsRes = await fetch('/api/ml/intelligence/teams');
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeamsList(teamsData);
      }

      // Registry
      const regRes = await fetch('/api/ml/models');
      if (regRes.ok) {
        const regData = await regRes.json();
        setModelsRegistry(regData);
      }

      // Monitor
      const monRes = await fetch('/api/ml/monitoring');
      if (monRes.ok) {
        const monData = await monRes.json();
        setMonitoringLogs(monData);
      }
    } catch (e) {
      console.error('Failed to parse global ML scorecards:', e);
    }
  };

  useEffect(() => {
    fetchGlobalMlData().then(() => {
      fetchPredictionsAndInsights(selectedCircuit);
    });
  }, []);

  const handleCircuitChange = (circuit: string) => {
    setSelectedCircuit(circuit);
    fetchPredictionsAndInsights(circuit);
  };

  const triggerRetraining = async (category: string) => {
    setRetrainingStatus(prev => ({ ...prev, [category]: 'running' }));
    try {
      const res = await fetch('/api/ml/models/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      if (res.ok) {
        setRetrainingStatus(prev => ({ ...prev, [category]: 'success' }));
        setTimeout(() => {
          setRetrainingStatus(prev => ({ ...prev, [category]: 'idle' }));
        }, 3000);
        // Refresh registry & prediction statistics
        await fetchGlobalMlData();
        await fetchPredictionsAndInsights(selectedCircuit);
      } else {
        setRetrainingStatus(prev => ({ ...prev, [category]: 'idle' }));
      }
    } catch (err) {
      console.error(err);
      setRetrainingStatus(prev => ({ ...prev, [category]: 'idle' }));
    }
  };

  // Compile tyre degradation charts
  const getTyreChartData = () => {
    if (!strategy?.tyreWearCurves) return [];
    const soft = strategy.tyreWearCurves.S || [];
    const medium = strategy.tyreWearCurves.M || [];
    const hard = strategy.tyreWearCurves.H || [];

    return soft.map((pt, i) => ({
      lap: pt.lap,
      Soft: pt.remainingLife,
      Medium: medium[i]?.remainingLife ?? null,
      Hard: hard[i]?.remainingLife ?? null
    }));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Visual Header Intro */}
      <div className="relative overflow-hidden bg-neutral-950 border border-neutral-900 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -transty-y-10 translate-x-12 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 md:mb-1">
              <span className="bg-red-600/10 text-red-500 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Phase 3 Intelligence
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-[10px] text-neutral-500">MLOPS VERSION 3.5 PRODUCTION ACTIVE</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight md:text-4xl">
              Motorsport AI Intelligence Platform
            </h1>
            <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
              Real-time predictive telemetry, Monte Carlo championship distributions, non-linear tire thermal wear curves, and automated Optuna-style hyperparameter tuning pipelines on the unified RTF machine learning grid.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-500 block uppercase">Prediction Context:</span>
            <select
              value={selectedCircuit}
              onChange={(e) => handleCircuitChange(e.target.value)}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white outline-none focus:border-red-600 cursor-pointer transition-colors"
            >
              <option value="silverstone">🇬🇧 Silverstone Grand Prix</option>
              <option value="spa">🇧🇪 Spa-Francorchamps</option>
              <option value="monaco">🇲🇨 Monaco Grand Prix</option>
              <option value="monza">🇮🇹 Monza Circuit</option>
              <option value="suzuka">🇯🇵 Suzuka International GP</option>
            </select>
          </div>
        </div>

        {/* Global tab controllers */}
        <div className="flex items-center gap-1.5 p-1 bg-black rounded-lg mt-6 sm:mt-8 border border-neutral-900/60 font-mono text-xs max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap ${
              activeTab === 'predictions'
                ? 'bg-neutral-900 text-white shadow-lg'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Brain className="w-4 h-4 opacity-75" />
            Predictive Probabilities
          </button>
          <button
            onClick={() => setActiveTab('simulations')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap ${
              activeTab === 'simulations'
                ? 'bg-neutral-900 text-white shadow-lg'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 opacity-75" />
            10,000 Monte Carlo Forecasts
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap ${
              activeTab === 'intelligence'
                ? 'bg-neutral-900 text-white shadow-lg'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Sliders className="w-4 h-4 opacity-75" />
            Grid Scorecards
          </button>
          <button
            onClick={() => setActiveTab('mlops')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap ${
              activeTab === 'mlops'
                ? 'bg-neutral-900 text-white shadow-lg'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Cpu className="w-4 h-4 opacity-75" />
            MLOps &amp; Registry
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB VIEW CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {activeTab === 'predictions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Odds lists */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Winner Odds Panel */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded bg-red-600" />
                      <h2 className="text-lg font-bold text-white tracking-tight">Race Winning Probabilities</h2>
                    </div>
                    <span className="font-mono text-[10px] text-neutral-500 uppercase">
                      ENSEMBLE BOOST ENABLED
                    </span>
                  </div>

                  {loading ? (
                    <div className="py-12 text-center text-xs font-mono text-neutral-500 animate-pulse">
                      LOADING PREDICTIVE CLASSIFIER OUTPUT ROWS...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {winOdds.map((o, index) => (
                        <div
                          key={o.driverId}
                          onClick={() => setActiveExplainDriver(o.driverId)}
                          className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            activeExplainDriver === o.driverId
                              ? 'bg-neutral-900/40 border-red-500/50 shadow-md'
                              : 'bg-neutral-950/20 border-neutral-900 hover:border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-neutral-500 w-5">
                              P{index + 1}
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-white group-hover:text-red-500 transition-colors">
                                {o.name}
                              </div>
                              <div className="font-mono text-[9px] text-neutral-500">
                                Model: <span className="text-neutral-400">{o.modelUsed} ({o.modelVersion})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-8 font-mono text-right">
                            <div className="hidden sm:block">
                              <div className="text-[10px] text-neutral-500">PODIUM PROBABILITY</div>
                              <div className="text-xs font-bold text-neutral-300">{(o.podiumProbability * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-neutral-500 tracking-wider">WIN PROB</div>
                              <div className="text-sm font-bold text-red-500">{(o.winProbability * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Interactive Tyre Lifespan Deg Curve */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-red-600" />
                      <div>
                        <h2 className="text-base font-bold text-white tracking-tight">Tyre Degradation Curves</h2>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Non-linear thermal wear index mapped per lap stint</p>
                      </div>
                    </div>
                    {strategy && (
                      <span className="bg-neutral-900 font-mono text-xs px-3 py-1 rounded text-neutral-300 border border-neutral-800">
                        Stop Windows: <span className="text-red-500 font-bold">{strategy.recommendedStrategy}</span>
                      </span>
                    )}
                  </div>

                  <div className="h-64 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getTyreChartData()}>
                        <defs>
                          <linearGradient id="softCol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="medCol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="hardCol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="lap" stroke="#525252" fontSize={11} tickLine={false} label={{ value: 'Stint Lap Count', position: 'insideBottom', offset: -5, fill: '#737373', fontSize: 10 }} />
                        <YAxis stroke="#525252" fontSize={11} domain={[0, 100]} label={{ value: 'Remaining Life %', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', fontSize: '11px', fontFamily: 'monospace' }} />
                        <Area type="monotone" dataKey="Soft" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#softCol)" />
                        <Area type="monotone" dataKey="Medium" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#medCol)" />
                        <Area type="monotone" dataKey="Hard" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#hardCol)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Right Column: Explainable AI & Safety incidents */}
              <div className="space-y-6">

                {/* Explainable AI block */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                  <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 mb-4">
                    <Activity className="w-5 h-5 text-red-600 animate-pulse" />
                    <div>
                      <h2 className="text-base font-bold text-white">Explainable AI (SHAP)</h2>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Model feature importances for selected racer</p>
                    </div>
                  </div>

                  {activeExplainDriver && winOdds.length > 0 ? (
                    (() => {
                      const selectedObj = winOdds.find(o => o.driverId === activeExplainDriver);
                      if (!selectedObj) return null;

                      return (
                        <div className="space-y-5">
                          <div className="bg-neutral-900 p-3.5 rounded-lg border border-neutral-800">
                            <div className="font-semibold text-white text-sm">{selectedObj.name}</div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-1.5">
                              <span>Confidence Rate:</span>
                              <span className="text-green-500 font-bold">{(selectedObj.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-1">
                              <span>Validation Accuracy:</span>
                              <span className="text-neutral-200">{(selectedObj.validationAccuracy * 100).toFixed(1)}%</span>
                            </div>
                          </div>

                          <div className="space-y-3 font-mono text-xs">
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Shapley Feature Contributions</div>
                            {selectedObj.explainability.map(e => (
                              <div key={e.feature} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-neutral-400">
                                  <span>{e.feature}</span>
                                  <span className={e.impact >= 0 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                                    {e.impact >= 0 ? '+' : ''}{(e.impact * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-900 rounded overflow-hidden">
                                  <div
                                    className={`h-full rounded ${e.impact >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.abs(e.impact) * 80}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="py-12 text-center text-xs font-mono text-neutral-500">
                      SELECT A DRIVER TO AUDIT SHAP VALUES
                    </div>
                  )}
                </div>

                {/* Safety Car Predictor card */}
                {safetyCar && (
                  <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <div>
                        <h2 className="text-base font-bold text-white">Safety Car Incident Hazard</h2>
                        <p className="text-[10px] text-neutral-500">Probabilities modeled against circuit metrics</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/40">
                        <div className="text-[9px] font-mono text-neutral-500">SAFETY CAR</div>
                        <div className="text-base font-bold text-amber-500 font-mono">{(safetyCar.safetyCarProbability * 100).toFixed(0)}%</div>
                      </div>
                      <div className="bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/40">
                        <div className="text-[9px] font-mono text-neutral-500">VSC</div>
                        <div className="text-base font-bold text-orange-500 font-mono">{(safetyCar.vscProbability * 100).toFixed(0)}%</div>
                      </div>
                      <div className="bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/40">
                        <div className="text-[9px] font-mono text-neutral-500">RED FLAG</div>
                        <div className="text-base font-bold text-red-500 font-mono">{(safetyCar.redFlagProbability * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/30 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-neutral-500 text-[10px] block font-mono">HIGHEST COLLISION RISK ZONE</span>
                        <span className="text-red-400 font-bold">{safetyCar.highestDangerZone}</span>
                      </div>
                      <Shield className="w-4 h-4 text-red-500 opacity-60" />
                    </div>

                    <div className="space-y-2 font-mono text-[10px] text-neutral-400">
                      <div className="text-neutral-500 uppercase tracking-widest text-[9px]">Danger Weight Breakdown</div>
                      {safetyCar.explainer.map(exp => (
                        <div key={exp.element} className="flex justify-between items-center border-b border-neutral-900 py-1">
                          <span>{exp.element}</span>
                          <span className="text-neutral-200 font-bold">{exp.riskWeight}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {activeTab === 'simulations' && (
            <div className="space-y-6">
              {/* 1. Monte Carlo Driver plots */}
              {forecast && (
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-900 pb-3 mb-6 gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">Driver Championship Outliers (Monte Carlo)</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">Statistical projection plots converging after {forecast.simulationsRun.toLocaleString()} runs</p>
                    </div>
                    <span className="font-mono text-xs text-neutral-500">
                      LAST PIPELINE RETRAINED: <span className="text-neutral-300 font-bold">{new Date(forecast.lastRetrained).toLocaleTimeString()}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual bar graph */}
                    <div className="lg:col-span-2 bg-black/40 p-4 border border-neutral-900 rounded-xl">
                      <h3 className="font-mono text-[10px] text-neutral-400 mb-4 uppercase tracking-wider">Champion Win Share Ratio curve</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={forecast.driverPredictions.slice(0, 5)}>
                            <CartesianGrid stroke="#1e1e1e" />
                            <XAxis dataKey="name" stroke="#525252" fontSize={10} />
                            <YAxis stroke="#525252" fontSize={10} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', fontSize: '11px', fontFamily: 'monospace' }} />
                            <Legend />
                            <Bar dataKey="championProbability" name="Championship Win %" fill="#ef4444" radius={[4, 4, 0, 0]} transform="scale(100)" />
                            <Bar dataKey="top3Probability" name="Podium Finish w/ %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Numeric lists */}
                    <div className="space-y-4">
                      <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">Predictive standings table</h3>
                      <div className="space-y-3">
                        {forecast.driverPredictions.slice(0, 6).map((d, i) => (
                          <div key={d.driverId} className="bg-neutral-900/40 border border-neutral-800/60 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-neutral-500 text-xs">#{i + 1}</span>
                              <div>
                                <div className="text-xs font-semibold text-white">{d.name}</div>
                                <div className="text-[10px] font-mono text-neutral-500">Est. Points: {d.avgSimulatedPoints}</div>
                              </div>
                            </div>
                            <div className="font-mono text-right">
                              <span className="text-[10px] text-neutral-500 block uppercase">WIN PROB</span>
                              <span className="text-sm font-bold text-red-500">{(d.championProbability * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Grid finishing position distribution bento box */}
              {simulationGrid.length > 0 && (
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                  <div className="border-b border-neutral-900 pb-3 mb-4">
                    <h2 className="text-base font-bold text-white">Rival Finishes Probabilities</h2>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Heat probability of finishing positions per racer mapped from grid variables</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {simulationGrid.slice(0, 6).map(drv => (
                      <div key={drv.driverId} className="bg-neutral-900/20 border border-neutral-900 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                          <span className="font-semibold text-white text-xs">{drv.name}</span>
                          <span className="font-mono text-[10px] text-red-400">DNF Chance: {(drv.dnfProbability * 100).toFixed(0)}%</span>
                        </div>

                        <div className="h-24">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={drv.positions}>
                              <XAxis dataKey="pos" stroke="#525252" fontSize={8} label={{ value: 'Finish Pos', fill: '#525252', fontSize: 8 }} />
                              <Area type="monotone" dataKey="probability" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Drivers Scorecard Radar */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow flex flex-col justify-between">
                <div className="border-b border-neutral-900 pb-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-red-600" />
                    <h2 className="text-base font-bold text-white">Driver Performance Matrix Radar</h2>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Comparison curves of top championship contenders on a 0-100 skill scale</p>
                </div>

                {driversList.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                    <div className="w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { name: 'Racecraft', Max: driversList[0]?.racecraft ?? 98, Lando: driversList[1]?.racecraft ?? 95, Lewis: driversList[2]?.racecraft ?? 92 },
                          { name: 'Qualifying', Max: driversList[0]?.qualifying ?? 96, Lando: driversList[1]?.qualifying ?? 98, Lewis: driversList[2]?.qualifying ?? 90 },
                          { name: 'Consistency', Max: driversList[0]?.consistency ?? 95, Lando: driversList[1]?.consistency ?? 91, Lewis: driversList[2]?.consistency ?? 94 },
                          { name: 'Overtaking', Max: driversList[0]?.overtaking ?? 92, Lando: driversList[1]?.overtaking ?? 96, Lewis: driversList[2]?.overtaking ?? 97 },
                          { name: 'Wet Pace', Max: driversList[0]?.wetWeather ?? 98, Lando: driversList[1]?.wetWeather ?? 92, Lewis: driversList[2]?.wetWeather ?? 96 },
                          { name: 'Pressure', Max: driversList[0]?.pressureHandling ?? 97, Lando: driversList[1]?.pressureHandling ?? 88, Lewis: driversList[2]?.pressureHandling ?? 93 }
                        ]}>
                          <PolarGrid stroke="#262626" />
                          <PolarAngleAxis dataKey="name" stroke="#a3a3a3" fontSize={10} />
                          <PolarRadiusAxis angle={30} domain={[40, 100]} stroke="#404040" fontSize={8} />
                          <Radar name="Max Verstappen" dataKey="Max" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                          <Radar name="Lando Norris" dataKey="Lando" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4 font-mono text-xs w-full max-w-xs">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-1">Legend keys</div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-white">Max Verstappen:</span>
                        <span className="text-neutral-400">Class Lead in Racecraft &amp; Wet weather</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-white">Lando Norris:</span>
                        <span className="text-neutral-400">Excelled in Qualifying Grid Speeds</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs font-mono text-neutral-500">
                    Radar data missing...
                  </div>
                )}
              </div>

              {/* Constructor Intelligence Scorecard */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                <div className="border-b border-neutral-900 pb-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-red-600" />
                    <h2 className="text-base font-bold text-white">Constructor Competence Matrices</h2>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Composite metric indexes parsed from telemetry &amp; logistics</p>
                </div>

                <div className="space-y-5">
                  {teamsList.map(t => (
                    <div key={t.constructorId} className="bg-neutral-900/20 border border-neutral-900 rounded-lg p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{t.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-red-500">{t.overallScore} SCORE</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                            <span>RELIABILITY SCORE</span>
                            <span className="text-neutral-300">{t.reliability}%</span>
                          </div>
                          <div className="h-1 bg-black/60 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 rounded-full" style={{ width: `${t.reliability}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                            <span>GRID STRATEGY EFF</span>
                            <span className="text-neutral-300">{t.strategy}%</span>
                          </div>
                          <div className="h-1 bg-black/60 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${t.strategy}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'mlops' && (
            <div className="space-y-6">
              
              {/* Retrain Controls list */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                <div className="border-b border-neutral-900 pb-3 mb-4">
                  <h2 className="text-base font-bold text-white">Continuous Model Retraining Pipeline (Optuna Hyperparameter Sweeps)</h2>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Manually invoke automated hyperparameter searches and redeploy high scoring candidates directly to the live environment.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(['Winner', 'Podium', 'Championship', 'SafetyCar', 'TyreDegradation', 'Strategy'] as const).map(cat => {
                    const status = retrainingStatus[cat];
                    const activeModelName = modelsRegistry.find(m => m.category === cat && m.status === 'Production')?.name || `${cat} Predictor`;

                    return (
                      <div key={cat} className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="bg-red-950/40 text-red-400 font-mono text-[9px] px-2 py-0.5 rounded border border-red-900/50 uppercase tracking-widest font-semibold">{cat}</span>
                            <span className="flex items-center gap-1 font-mono text-[9px] text-neutral-500">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> ACTIVE
                            </span>
                          </div>
                          <h3 className="text-white text-xs font-bold mt-2.5 truncate">{activeModelName}</h3>
                        </div>

                        <button
                          disabled={status === 'running'}
                          onClick={() => triggerRetraining(cat)}
                          className={`w-full py-2 border rounded font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            status === 'running'
                              ? 'bg-neutral-900 border-neutral-800 text-neutral-500'
                              : status === 'success'
                              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
                              : 'bg-red-600 border-red-500 text-black hover:bg-red-500'
                          }`}
                        >
                          {status === 'running' ? (
                            <>
                              <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              Bayesian Sweeping...
                            </>
                          ) : status === 'success' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              REDEPLOYED OK!
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Execute Sweep &amp; Retrain
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Registry List */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                <div className="border-b border-neutral-900 pb-3 mb-4">
                  <h2 className="text-base font-bold text-white">Central Registry Catalog</h2>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Comprehensive audit logs of trained model profiles, versions, hyperparameters, and test sample density</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-neutral-900 text-neutral-500 text-[10px] uppercase">
                        <th className="py-2.5 px-3">Model Name</th>
                        <th className="py-2.5 px-3">Model Type</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3 text-right">Accuracy</th>
                        <th className="py-2.5 px-3 text-right">Precision</th>
                        <th className="py-2.5 px-3">Model Hyperparameters Mapping</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {modelsRegistry.map(m => (
                        <tr key={m.id} className="hover:bg-neutral-900/20">
                          <td className="py-3 px-3 text-white font-semibold flex items-center gap-1.5">
                            {m.name}
                            <span className="text-[10px] border border-neutral-800 bg-neutral-900 text-neutral-400 px-1 rounded">v{m.version}</span>
                          </td>
                          <td className="py-3 px-3 text-neutral-300">{m.type}</td>
                          <td className="py-3 px-3 text-neutral-400 font-bold">{m.category}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              m.status === 'Production'
                                ? 'bg-red-950 text-red-400 border border-red-900/60'
                                : m.status === 'Testing'
                                ? 'bg-amber-950 text-amber-400 border border-amber-900/60'
                                : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">{(m.accuracy * 100).toFixed(1)}%</td>
                          <td className="py-3 px-3 text-right text-neutral-400">{(m.precision * 100).toFixed(1)}%</td>
                          <td className="py-3 px-3 text-neutral-500 font-mono text-[10px] max-w-xs truncate" title={JSON.stringify(m.hyperparameters)}>
                            {JSON.stringify(m.hyperparameters)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Drift Tracking logs */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 md:p-6 shadow">
                <div className="border-b border-neutral-900 pb-3 mb-6">
                  <h2 className="text-base font-bold text-white">Kolmogorov-Smirnov Data Drift Index Logs</h2>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Real-world prediction drift tracking and calibration accuracy trends</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Visual trend plot */}
                  <div className="lg:col-span-2 h-64 bg-black/40 p-4 border border-neutral-900 rounded-xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monitoringLogs}>
                        <CartesianGrid stroke="#1c1c1c" />
                        <XAxis dataKey="timestamp" stroke="#525252" fontSize={8} tickFormatter={(str) => new Date(str).toLocaleDateString()} />
                        <YAxis stroke="#525252" fontSize={8} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', fontSize: '11px', fontFamily: 'monospace' }} />
                        <Legend />
                        <Line type="monotone" dataKey="predictionAccuracy" name="Accuracy Rate" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="dataDriftIndex" name="Data Drift index" stroke="#10b981" strokeWidth={1} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Active Drift Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Kolmogorov Feature Drift Audits</h3>
                    {monitoringLogs[monitoringLogs.length - 1]?.driftMetrics.map(met => (
                      <div key={met.featureName} className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">{met.featureName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            met.driftDetected ? 'bg-red-950/50 text-red-400 border border-red-900/30 animate-pulse' : 'bg-green-950/50 text-green-400 border border-green-900/30'
                          }`}>
                            {met.driftDetected ? 'DRIFT! (p<0.05)' : 'NO DRIFT'}
                          </span>
                        </div>
                        <div className="flex justify-between text-neutral-500 text-[10px]">
                          <span>KS p-value: <span className="text-neutral-300">{met.pvalue.toFixed(3)}</span></span>
                          <span>Diff: <span className="text-neutral-300">{Math.abs(met.currentMean - met.referenceMean).toFixed(2)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
