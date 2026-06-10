import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Clock, Award, Shield, User, HelpCircle, Sparkles, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { RaceWeekend, RaceResult } from '../types.js';
import { getDriverMeta, getTeamColor, getOfficialTeamName, getCircuitMeta } from '../utils/f1Data.js';
import { TeamLogo, CountryFlag, DriverNumberBadge, DriverAvatar, CircuitMap } from './F1Logos.js';

interface RaceWeekendDetailsProps {
  race: RaceWeekend;
  onBack: () => void;
}

export default function RaceWeekendDetails({ race, onBack }: RaceWeekendDetailsProps) {
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'results' | 'ai-insights'>('schedule');

  const todayStr = new Date().toISOString().split('T')[0];
  const isUpcoming = race.date >= todayStr;
  const trackMeta = getCircuitMeta(race.circuit.circuitId);

  // Load results on mount
  useEffect(() => {
    if (isUpcoming) {
      setActiveTab('schedule');
      setResults([]);
      setInsights('');
      setLoadingResults(false);
      setLoadingInsights(false);
      return;
    }

    async function loadRaceResults() {
      setLoadingResults(true);
      try {
        const response = await fetch(`/api/races/${race.id}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          if (data.results && data.results.length > 0) {
            // Default to results tab if completed
            setActiveTab('results');
          }
        }
      } catch (err) {
        console.error('Failed to load race results:', err);
      } finally {
        setLoadingResults(false);
      }
    }

    async function loadCachedInsights() {
      try {
        const response = await fetch(`/api/races/${race.id}/insights`);
        if (response.ok) {
          const data = await response.json();
          if (data.insights) {
            setInsights(data.insights);
          }
        }
      } catch (err) {
        console.warn('Failed to load cached insights:', err);
      }
    }

    loadRaceResults();
    loadCachedInsights();
  }, [race]);

  const triggerAiInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await fetch(`/api/races/${race.id}/insights`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      } else {
        throw new Error('Server returned error generating strategics.');
      }
    } catch (err) {
      console.error(err);
      setInsights('Failed to resolve tactical analysis. Please double-check your API configurations.');
    } finally {
      setLoadingInsights(false);
    }
  };

  // Human friendly UTC and IST formatting
  const formatSessionTime = (dateStr?: string, timeStr?: string) => {
    if (!timeStr) return '--:--';
    const utcTime = timeStr.endsWith('Z') ? timeStr.slice(0, 5) : timeStr;
    if (!dateStr) return `${utcTime} UTC`;
    
    try {
      const utcString = `${dateStr}T${timeStr.endsWith('Z') ? timeStr : timeStr + 'Z'}`;
      const d = new Date(utcString);
      const istTime = d.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return `${utcTime} UTC / ${istTime} IST`;
    } catch (e) {
      return `${utcTime} UTC`;
    }
  };

  const sessions = [
    { name: 'FIRST PRACTICE (FP1)', session: race.firstPractice },
    { name: 'SECOND PRACTICE (FP2)', session: race.secondPractice },
    { name: 'THIRD PRACTICE (FP3)', session: race.thirdPractice },
    { name: 'OFFICIAL QUALIFYING', session: race.qualifying },
    { name: 'SESSIONS SPRINT', session: race.sprint },
    { name: 'GRAND PRIX MAIN DEBUT', session: { date: race.date, time: race.time } },
  ].filter(s => s.session);

  return (
    <div className="space-y-6">
      {/* Return Calendar header strip */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
        >
          ← Return to Calendar
        </button>
        <span className="text-neutral-600 font-mono text-xs">/</span>
        <span className="text-neutral-400 font-mono text-xs uppercase">{race.raceName} DETAILS</span>
      </div>

      {/* Hero Overview */}
      <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl" />

        <div className="space-y-2">
          <span className="text-[10px] bg-red-600/20 text-red-500 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Race Weekend Round {race.round}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white">{race.raceName}</h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            Held at the challenging <span className="text-neutral-200 font-medium">{race.circuit.circuitName}</span> in{' '}
            <span className="text-neutral-200">{race.circuit.locality}, {race.circuit.country}</span>.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl text-neutral-400 font-mono text-xs space-y-1.5 min-w-[200px]">
          <div className="flex justify-between">
            <span>COORDINATES</span>
            <span className="text-neutral-200">
              {parseFloat(race.circuit.lat).toFixed(2)}°, {parseFloat(race.circuit.long).toFixed(2)}°
            </span>
          </div>
          <div className="flex justify-between">
            <span>OFFICIAL DATE</span>
            <span className="text-neutral-200">{race.date}</span>
          </div>
          <div className="flex justify-between">
            <span>ROUND SPEC</span>
            <span className="text-red-500 font-bold">STAGE {race.round}</span>
          </div>
        </div>
      </div>

      {/* Segment Tabs Navigation */}
      <div className="flex border-b border-neutral-900 font-mono text-xs gap-2 sm:gap-3 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 border-b-2 px-1 transition-colors uppercase tracking-wider font-bold whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'border-red-500 text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Event Schedule
        </button>
        <button
          onClick={() => !isUpcoming && setActiveTab('results')}
          disabled={isUpcoming}
          className={`pb-3 border-b-2 px-1 transition-all uppercase tracking-wider font-bold flex items-center gap-1.5 whitespace-nowrap ${
            isUpcoming
              ? 'border-transparent text-neutral-700 cursor-not-allowed select-none opacity-40'
              : activeTab === 'results'
              ? 'border-red-500 text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Results Tally
          {isUpcoming ? (
            <Lock className="w-3 h-3 text-neutral-700" />
          ) : (
            results.length > 0 && (
              <span className="bg-red-600/20 text-red-500 px-1 py-0.2 rounded text-[9px]">
                {results.length}
              </span>
            )
          )}
        </button>
        <button
          onClick={() => !isUpcoming && setActiveTab('ai-insights')}
          disabled={isUpcoming}
          className={`pb-3 border-b-2 px-1 transition-all uppercase tracking-wider font-bold flex items-center gap-1.5 whitespace-nowrap ${
            isUpcoming
              ? 'border-transparent text-neutral-700 cursor-not-allowed select-none opacity-40'
              : activeTab === 'ai-insights'
              ? 'border-red-500 text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Strategy Suite
          {isUpcoming && <Lock className="w-3 h-3 text-neutral-700" />}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {/* TAB 1: Event Schedule */}
          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
            >
              {/* Session Timings */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-neutral-500" /> Weekend Session Timings
                </h3>

                <div className="divide-y divide-neutral-900/60 font-mono text-xs">
                  {sessions.map((s: any, i) => (
                    <div key={i} className="flex justify-between py-3">
                      <span className="text-neutral-400 font-bold">{s.name}</span>
                      <div className="text-right">
                        <span className="text-neutral-200 block">{s.session?.date}</span>
                        <span className="text-neutral-500 text-[10px] block mt-0.5">
                          {formatSessionTime(s.session?.date, s.session?.time)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circuit Location Technical panel */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-4 shadow-lg">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Map className="w-4 h-4 text-red-500" /> Technical Circuit Profile
                </h3>

                <div className="space-y-4 text-sm text-neutral-400 leading-relaxed pt-2">
                  {/* Large Track Layout Map */}
                  <div className="w-full flex justify-center bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/40 overflow-hidden shadow-inner h-40 relative group">
                    <CircuitMap circuitId={race.circuit.circuitId} className="h-full object-contain filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition-transform duration-500 group-hover:scale-105" />
                  </div>

                  <p>
                    The track configuration for <span className="text-white font-semibold">{race.circuit.circuitName}</span> represents unique chassis engineering requirements. Aerodynamic profiles balances top speed drag limits in straights against mechanical loading under corners.
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 pt-4 font-mono text-xs">
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                      <span className="text-[10px] text-neutral-500 uppercase block">Track Length</span>
                      <span className="text-white text-xs font-bold mt-1 block">{trackMeta.length}</span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                      <span className="text-[10px] text-neutral-500 uppercase block">Number of Corners</span>
                      <span className="text-white text-xs font-bold mt-1 block">{trackMeta.corners} Corners</span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                      <span className="text-[10px] text-neutral-500 uppercase block">Race Laps</span>
                      <span className="text-white text-xs font-bold mt-1 block">{trackMeta.laps} Laps</span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                      <span className="text-[10px] text-neutral-500 uppercase block">GP Debut Year</span>
                      <span className="text-white text-xs font-bold mt-1 block">{trackMeta.firstGp || 'N/A'}</span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                      <span className="text-[10px] text-neutral-500 uppercase block">GPS Coordinates</span>
                      <span className="text-white text-[10px] font-bold mt-1 block truncate">
                        {parseFloat(race.circuit.lat).toFixed(3)}°, {parseFloat(race.circuit.long).toFixed(3)}°
                      </span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                      <span className="text-[10px] text-neutral-500 uppercase block">Location / Country</span>
                      <span className="text-white text-[10px] font-bold mt-1 block truncate font-sans">
                        {race.circuit.locality}, {race.circuit.country}
                      </span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40 col-span-2">
                      <span className="text-[10px] text-neutral-500 uppercase block">Official Lap Record</span>
                      <span className="text-red-500 text-xs font-bold mt-1 block">
                        {trackMeta.record} <span className="text-neutral-400 font-medium text-[9px]">({trackMeta.recordHolder})</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-neutral-900 rounded-lg border border-neutral-800 text-xs text-neutral-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>
                      Track limits and safety cell setups conform to FIA Level 1 safety regulations. Local tire degradation ranges are managed dynamically.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Results Tally */}
          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {loadingResults ? (
                <div className="py-12 text-center text-neutral-500 italic flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-500" /> Loading results from Jolpica database...
                </div>
              ) : results.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/50 font-mono text-[10px] text-neutral-400 tracking-wider uppercase">
                        <th className="py-3 px-4 text-center w-12">POS</th>
                        <th className="py-3 px-4">DRIVER</th>
                        <th className="py-3 px-4">CONSTRUCTOR</th>
                        <th className="py-3 px-4 text-center w-16">GRID</th>
                        <th className="py-3 px-4 text-center w-16">LAPS</th>
                        <th className="py-3 px-4">TIME / STATUS</th>
                        <th className="py-3 px-4">FASTEST LAP</th>
                        <th className="py-3 px-4 text-right">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/40 text-sm text-neutral-300">
                      {results.map((res) => {
                        const driverColor = getTeamColor(res.team.constructorId);
                        return (
                          <tr key={res.driver.driverId} className="hover:bg-neutral-900/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-center w-12">
                              {res.position === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-500/10 text-yellow-500 text-xs border border-yellow-500/20">
                                  1
                                </span>
                              ) : res.position === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-neutral-400/10 text-neutral-300 text-xs border border-neutral-400/20">
                                  2
                                </span>
                              ) : res.position === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-700/10 text-amber-500 text-xs border border-amber-700/20">
                                  3
                                </span>
                              ) : (
                                <span className="text-neutral-500">{res.position}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-1.5 h-8 rounded-full"
                                  style={{ backgroundColor: driverColor }}
                                />
                                <DriverAvatar
                                  driverId={res.driver.driverId}
                                  constructorId={res.team.constructorId}
                                  className="w-8 h-8 flex-shrink-0"
                                />
                                <DriverNumberBadge
                                  number={res.driver.permanentNumber || res.number}
                                  constructorId={res.team.constructorId}
                                  className="w-6 h-6 flex-shrink-0"
                                />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">
                                      {res.driver.givenName} {res.driver.familyName}
                                    </span>
                                    <span className="text-neutral-500 font-mono text-xs uppercase">
                                      {res.driver.code || res.number}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5 select-none">
                                    <CountryFlag nationality={res.driver.nationality} className="w-3.5 h-2 rounded-sm" />
                                    <span>{res.driver.nationality}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <TeamLogo constructorId={res.team.constructorId} className="w-4 h-4 flex-shrink-0" />
                                <span className="text-neutral-400 font-medium">
                                  {getOfficialTeamName(res.team.constructorId, res.team.name)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-neutral-500">{res.grid}</td>
                            <td className="py-3.5 px-4 text-center font-mono text-neutral-400">{res.laps}</td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-neutral-300 text-xs">
                                {res.time || res.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs">
                              {res.fastestLap ? (
                                <div className="flex flex-col">
                                  <span className={`font-bold ${res.fastestLap.rank === 1 ? 'text-purple-400 font-extrabold flex items-center gap-1' : 'text-neutral-300'}`}>
                                    {res.fastestLap.time}
                                    {res.fastestLap.rank === 1 && (
                                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 rounded">FASTEST</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-neutral-500">
                                    Lap {res.fastestLap.lap} ({res.fastestLap.avgSpeed} km/h)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-neutral-600 font-mono text-xs">--:--.--</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black font-mono text-red-500 pr-6">
                              +{res.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-neutral-950 border border-neutral-800 text-neutral-500 italic rounded-xl">
                  No race results available. This event has not yet completed on the F1 schedule.
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: AI Insights Predictive Suite */}
          {activeTab === 'ai-insights' && (
            <motion.div
              key="ai-insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Gemini Strategic Insights Generator
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Use our deep reasoning models to generate a strategy briefing and calculated predictions for this circuit.
                  </p>
                </div>

                <button
                  onClick={triggerAiInsights}
                  disabled={loadingInsights}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold font-mono tracking-wider uppercase transition-colors disabled:bg-neutral-800 disabled:text-neutral-600 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
                  {insights ? 'Re-Generate Analysis' : 'Run Scenario Analysis'}
                </button>
              </div>

              {loadingInsights ? (
                <div className="p-12 text-center border border-neutral-800 bg-neutral-950 rounded-xl space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <p className="text-sm font-bold text-white">Generating Strategics...</p>
                    <p className="text-xs text-neutral-500">
                      Processing driver standings, track specification parameters, and team metrics...
                    </p>
                  </div>
                </div>
              ) : insights ? (
                <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-300 leading-relaxed text-sm space-y-4 prose-invert max-w-none">
                  <MarkdownRenderer text={insights} />
                </div>
              ) : (
                <div className="p-16 text-center border border-neutral-800 bg-neutral-950 text-neutral-500 rounded-xl space-y-3 flex flex-col items-center">
                  <HelpCircle className="w-10 h-10 text-neutral-700 animate-bounce" />
                  <p className="text-sm font-bold text-neutral-400">Strategy Report Offline</p>
                  <p className="text-xs text-neutral-600 max-w-md">
                    Click the "Run Scenario Analysis" button to trigger the Gemini strategic projection engine and preview tyre allocations for this stage.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // 1. Horizontal Rule
        if (trimmed === '---') {
          return <hr key={idx} className="border-neutral-900 my-4" />;
        }
        
        // 2. Headings
        if (trimmed.startsWith('# ')) {
          const content = parseInlineMarkdown(trimmed.slice(2));
          return <h1 key={idx} className="text-xl font-black text-white mt-5 mb-2 tracking-tight">{content}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          const content = parseInlineMarkdown(trimmed.slice(3));
          return <h2 key={idx} className="text-sm font-extrabold text-red-500 mt-4 mb-1 tracking-wider uppercase font-mono">{content}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          const content = parseInlineMarkdown(trimmed.slice(4));
          return <h3 key={idx} className="text-xs font-bold text-white mt-3 mb-1 uppercase tracking-wider font-mono">{content}</h3>;
        }
        
        // 3. Bullet points
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = parseInlineMarkdown(trimmed.slice(2));
          return (
            <div key={idx} className="flex items-start gap-2 text-neutral-300 pl-2">
              <span className="text-red-500 font-bold select-none">•</span>
              <span className="text-xs leading-relaxed">{content}</span>
            </div>
          );
        }
        
        // 4. Empty lines
        if (trimmed === '') {
          return <div key={idx} className="h-1" />;
        }
        
        // 5. Normal paragraphs
        const content = parseInlineMarkdown(trimmed);
        return <p key={idx} className="text-neutral-300 text-xs leading-relaxed font-medium">{content}</p>;
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="text-neutral-200 italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
