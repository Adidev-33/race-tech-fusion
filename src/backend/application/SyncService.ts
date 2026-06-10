import {
  SeasonRepository,
  CircuitRepository,
  TeamRepository,
  DriverRepository,
  RaceWeekendRepository,
  DriverStandingRepository,
  ConstructorStandingRepository,
  RaceResultRepository
} from '../repositories/F1Repositories.js';
import {
  Season,
  Circuit,
  Team,
  Driver,
  RaceWeekend,
  DriverStanding,
  ConstructorStanding,
  RaceResult
} from '../../types.js';

const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Generic fetch with retry mechanism
async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Fetch to ${url} failed. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

export class SyncService {
  private seasonRepo = new SeasonRepository();
  private circuitRepo = new CircuitRepository();
  private teamRepo = new TeamRepository();
  private driverRepo = new DriverRepository();
  private raceRepo = new RaceWeekendRepository();
  private driverStandingRepo = new DriverStandingRepository();
  private constructorStandingRepo = new ConstructorStandingRepository();
  private resultRepo = new RaceResultRepository();

  public isSyncing = false;

  // 1. Sync Seasons List
  public async syncSeasons(): Promise<void> {
    console.log('🔄 Syncing F1 seasons list...');
    try {
      const data = await fetchWithRetry(`${JOLPICA_BASE_URL}/seasons.json?limit=100&offset=50`);
      const rawSeasons = data?.MRData?.SeasonTable?.Seasons || [];
      const seasons: Season[] = rawSeasons.map((s: any) => ({
        year: s.season,
        url: s.url,
      }));
      await this.seasonRepo.saveAll(seasons);
      console.log(`✅ Synced ${seasons.length} seasons.`);
    } catch (error) {
      console.error('❌ Failed to sync seasons:', error);
      throw error;
    }
  }

  // 2. Sync Races (Schedule / Calendar for current season)
  public async syncRaces(season = 'current'): Promise<void> {
    console.log(`🔄 Syncing race calendar/schedule for season: ${season}...`);
    try {
      const data = await fetchWithRetry(`${JOLPICA_BASE_URL}/${season}.json`);
      const rawRaces = data?.MRData?.RaceTable?.Races || [];
      
      const parsedRaces: RaceWeekend[] = [];
      const parsedCircuits: Circuit[] = [];

      for (const r of rawRaces) {
        const circuit: Circuit = {
          circuitId: r.Circuit.circuitId,
          circuitName: r.Circuit.circuitName,
          url: r.Circuit.url,
          locality: r.Circuit.Location.locality,
          country: r.Circuit.Location.country,
          lat: r.Circuit.Location.lat,
          long: r.Circuit.Location.long,
        };
        parsedCircuits.push(circuit);

        const raceWeekend: RaceWeekend = {
          id: `${r.season}-${r.round}`,
          season: r.season,
          round: r.round,
          raceName: r.raceName,
          circuit: circuit,
          date: r.date,
          time: r.time,
          url: r.url,
          firstPractice: r.FirstPractice ? { name: 'FP1', date: r.FirstPractice.date, time: r.FirstPractice.time } : undefined,
          secondPractice: r.SecondPractice ? { name: 'FP2', date: r.SecondPractice.date, time: r.SecondPractice.time } : undefined,
          thirdPractice: r.ThirdPractice ? { name: 'FP3', date: r.ThirdPractice.date, time: r.ThirdPractice.time } : undefined,
          qualifying: r.Qualifying ? { name: 'Qualifying', date: r.Qualifying.date, time: r.Qualifying.time } : undefined,
          sprint: r.Sprint ? { name: 'Sprint', date: r.Sprint.date, time: r.Sprint.time } : undefined,
        };
        parsedRaces.push(raceWeekend);
      }

      await this.circuitRepo.saveAll(parsedCircuits);
      await this.raceRepo.saveAll(parsedRaces);
      console.log(`✅ Synced ${parsedRaces.length} race weekends and ${parsedCircuits.length} circuits.`);
    } catch (error) {
      console.error('❌ Failed to sync race schedule:', error);
      throw error;
    }
  }

  // 3. Sync Drivers
  public async syncDrivers(season = 'current'): Promise<void> {
    console.log(`🔄 Syncing active drivers for season: ${season}...`);
    try {
      const data = await fetchWithRetry(`${JOLPICA_BASE_URL}/${season}/drivers.json?limit=100`);
      const rawDrivers = data?.MRData?.DriverTable?.Drivers || [];
      const drivers: Driver[] = rawDrivers.map((d: any) => ({
        driverId: d.driverId,
        permanentNumber: d.permanentNumber,
        code: d.code,
        url: d.url,
        givenName: d.givenName,
        familyName: d.familyName,
        dateOfBirth: d.dateOfBirth,
        nationality: d.nationality,
      }));
      await this.driverRepo.saveAll(drivers);
      console.log(`✅ Synced ${drivers.length} drivers.`);
    } catch (error) {
      console.error('❌ Failed to sync drivers:', error);
      throw error;
    }
  }

  // 4. Sync Teams (Constructors)
  public async syncTeams(season = 'current'): Promise<void> {
    console.log(`🔄 Syncing active constructors for season: ${season}...`);
    try {
      const data = await fetchWithRetry(`${JOLPICA_BASE_URL}/${season}/constructors.json?limit=100`);
      const rawConstructors = data?.MRData?.ConstructorTable?.Constructors || [];
      const teams: Team[] = rawConstructors.map((c: any) => ({
        constructorId: c.constructorId,
        name: c.name,
        url: c.url,
        nationality: c.nationality,
      }));
      await this.teamRepo.saveAll(teams);
      console.log(`✅ Synced ${teams.length} constructors.`);
    } catch (error) {
      console.error('❌ Failed to sync constructors:', error);
      throw error;
    }
  }

  // 5. Sync Driver Standings
  public async syncDriverStandings(season = 'current'): Promise<void> {
    console.log(`🔄 Syncing Driver Standings for season: ${season}...`);
    try {
      const data = await fetchWithRetry(`${JOLPICA_BASE_URL}/${season}/driverStandings.json`);
      const standingsLists = data?.MRData?.StandingsTable?.StandingsLists || [];
      if (standingsLists.length === 0) {
        console.log(`⚠️ No driver standings data found for season ${season}.`);
        return;
      }

      const rawStandings = standingsLists[0].DriverStandings || [];
      const standings: DriverStanding[] = rawStandings.map((s: any) => {
        const d = s.Driver;
        const c = s.Constructors[0];
        
        const driver: Driver = {
          driverId: d.driverId,
          permanentNumber: d.permanentNumber,
          code: d.code,
          url: d.url,
          givenName: d.givenName,
          familyName: d.familyName,
          dateOfBirth: d.dateOfBirth,
          nationality: d.nationality,
        };

        const team: Team = {
          constructorId: c.constructorId,
          name: c.name,
          url: c.url,
          nationality: c.nationality,
        };

        return {
          position: parseInt(s.position, 10),
          points: parseFloat(s.points),
          wins: parseInt(s.wins, 10),
          driver,
          team,
        };
      });

      // Save components individually to preserve metadata
      const drivers = standings.map(s => s.driver);
      const teams = standings.map(s => s.team);
      await this.driverRepo.saveAll(drivers);
      await this.teamRepo.saveAll(teams);

      await this.driverStandingRepo.saveAll(standings);
      console.log(`✅ Synced ${standings.length} Driver Standings entries.`);
    } catch (error) {
      console.error('❌ Failed to sync driver standings:', error);
      throw error;
    }
  }

  // 6. Sync Constructor Standings
  public async syncConstructorStandings(season = 'current'): Promise<void> {
    console.log(`🔄 Syncing Constructor Standings for season: ${season}...`);
    try {
      const data = await fetchWithRetry(`${JOLPICA_BASE_URL}/${season}/constructorStandings.json`);
      const standingsLists = data?.MRData?.StandingsTable?.StandingsLists || [];
      if (standingsLists.length === 0) {
        console.log(`⚠️ No constructor standings data found for season ${season}.`);
        return;
      }

      const rawStandings = standingsLists[0].ConstructorStandings || [];
      const standings: ConstructorStanding[] = rawStandings.map((s: any) => {
        const c = s.Constructor;
        const team: Team = {
          constructorId: c.constructorId,
          name: c.name,
          url: c.url,
          nationality: c.nationality,
        };
        return {
          position: parseInt(s.position, 10),
          points: parseFloat(s.points),
          wins: parseInt(s.wins, 10),
          team,
        };
      });

      const teams = standings.map(s => s.team);
      await this.teamRepo.saveAll(teams);

      await this.constructorStandingRepo.saveAll(standings);
      console.log(`✅ Synced ${standings.length} Constructor Standings entries.`);
    } catch (error) {
      console.error('❌ Failed to sync constructor standings:', error);
      throw error;
    }
  }

  // Helper: Sync Dynamic Results for a Specific Race Round or Last Completing Race
  public async syncRaceResults(season: string, round: string): Promise<RaceResult[]> {
    console.log(`🔄 Syncing race results for ${season} round ${round}...`);
    try {
      const data = await fetchWithRetry(`${JOLPICA_BASE_URL}/${season}/${round}/results.json`);
      const races = data?.MRData?.RaceTable?.Races || [];
      if (races.length === 0) return [];
      
      const race = races[0];
      const rawResults = race.Results || [];
      const parsedResults: RaceResult[] = rawResults.map((res: any) => {
        const d = res.Driver;
        const c = res.Constructor;

        const driver: Driver = {
          driverId: d.driverId,
          permanentNumber: d.permanentNumber,
          code: d.code,
          url: d.url,
          givenName: d.givenName,
          familyName: d.familyName,
          dateOfBirth: d.dateOfBirth,
          nationality: d.nationality,
        };

        const team: Team = {
          constructorId: c.constructorId,
          name: c.name,
          url: c.url,
          nationality: c.nationality,
        };

        return {
          number: res.number,
          position: parseInt(res.position, 10),
          points: parseFloat(res.points),
          grid: parseInt(res.grid, 10),
          laps: parseInt(res.laps, 10),
          status: res.status,
          time: res.Time?.time || undefined,
          fastestLap: res.FastestLap ? {
            rank: parseInt(res.FastestLap.rank, 10),
            lap: parseInt(res.FastestLap.lap, 10),
            time: res.FastestLap.Time?.time || '',
            avgSpeed: res.FastestLap.AverageSpeed?.speed || '',
          } : undefined,
          driver,
          team,
        };
      });

      const actualSeason = race.season;
      const actualRound = race.round;
      const actualId = `${actualSeason}-${actualRound}`;
      const requestedId = `${season}-${round}`;

      // Save under actual ID
      await this.resultRepo.save(actualId, parsedResults);

      // If requested ID is different (e.g. "current-last"), also save under requested ID
      if (requestedId !== actualId) {
        await this.resultRepo.save(requestedId, parsedResults);
      }

      console.log(`✅ Synced results for race round ${round} (Actual ID: ${actualId}), ${parsedResults.length} entries.`);
      return parsedResults;
    } catch (error) {
      console.error(`❌ Failed to sync race results for round ${round}:`, error);
      return [];
    }
  }

  // Complete, unified background sync function
  public async syncAll(season = 'current'): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      console.log('🏁 STARTING FULL FORMULA 1 DATABASE SYNCHRONIZATION...');
      await this.syncSeasons();
      await this.syncTeams(season);
      await this.syncDrivers(season);
      await this.syncRaces(season);
      await this.syncDriverStandings(season);
      await this.syncConstructorStandings(season);
      
      // Also sync results for the last completed race (round "last")
      await this.syncRaceResults(season, 'last');
      
      console.log('🏁 FULL SYNCHRONIZATION COMPLETED SUCCESSFULLY');
    } catch (error) {
      console.error('❌ Synchronizer completed with errors:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

