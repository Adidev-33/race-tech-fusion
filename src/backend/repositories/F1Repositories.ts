import { JsonDatabase } from '../infrastructure/JsonDatabase.js';
import {
  Season,
  Circuit,
  RaceWeekend,
  Team,
  Driver,
  DriverStanding,
  ConstructorStanding,
  RaceResult,
  RaceWeekendDetails
} from '../../types.js';

export interface Repository<T, ID = string> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  saveAll(entities: T[]): Promise<void>;
}

// 1. Season Repository
export class SeasonRepository implements Repository<Season, string> {
  async findAll(): Promise<Season[]> {
    return JsonDatabase.readCollection<Season>('seasons');
  }

  async findById(year: string): Promise<Season | null> {
    const list = await this.findAll();
    return list.find(s => s.year === year) || null;
  }

  async save(entity: Season): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(s => s.year === entity.year);
    if (index >= 0) list[index] = entity;
    else list.push(entity);
    await JsonDatabase.writeCollection('seasons', list);
  }

  async saveAll(entities: Season[]): Promise<void> {
    const list = await this.findAll();
    for (const entity of entities) {
      const index = list.findIndex(s => s.year === entity.year);
      if (index >= 0) list[index] = entity;
      else list.push(entity);
    }
    await JsonDatabase.writeCollection('seasons', list);
  }
}

// 2. Circuit Repository
export class CircuitRepository implements Repository<Circuit, string> {
  async findAll(): Promise<Circuit[]> {
    return JsonDatabase.readCollection<Circuit>('circuits');
  }

  async findById(id: string): Promise<Circuit | null> {
    const list = await this.findAll();
    return list.find(c => c.circuitId === id) || null;
  }

  async save(entity: Circuit): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(c => c.circuitId === entity.circuitId);
    if (index >= 0) list[index] = entity;
    else list.push(entity);
    await JsonDatabase.writeCollection('circuits', list);
  }

  async saveAll(entities: Circuit[]): Promise<void> {
    const list = await this.findAll();
    for (const entity of entities) {
      const index = list.findIndex(c => c.circuitId === entity.circuitId);
      if (index >= 0) list[index] = entity;
      else list.push(entity);
    }
    await JsonDatabase.writeCollection('circuits', list);
  }
}

// 3. Team (Constructor) Repository
export class TeamRepository implements Repository<Team, string> {
  async findAll(): Promise<Team[]> {
    return JsonDatabase.readCollection<Team>('teams');
  }

  async findById(id: string): Promise<Team | null> {
    const list = await this.findAll();
    return list.find(t => t.constructorId === id) || null;
  }

  async save(entity: Team): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(t => t.constructorId === entity.constructorId);
    if (index >= 0) list[index] = entity;
    else list.push(entity);
    await JsonDatabase.writeCollection('teams', list);
  }

  async saveAll(entities: Team[]): Promise<void> {
    const list = await this.findAll();
    for (const entity of entities) {
      const index = list.findIndex(t => t.constructorId === entity.constructorId);
      if (index >= 0) list[index] = entity;
      else list.push(entity);
    }
    await JsonDatabase.writeCollection('teams', list);
  }
}

// 4. Driver Repository
export class DriverRepository implements Repository<Driver, string> {
  async findAll(): Promise<Driver[]> {
    return JsonDatabase.readCollection<Driver>('drivers');
  }

  async findById(id: string): Promise<Driver | null> {
    const list = await this.findAll();
    return list.find(d => d.driverId === id) || null;
  }

  async save(entity: Driver): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(d => d.driverId === entity.driverId);
    if (index >= 0) list[index] = entity;
    else list.push(entity);
    await JsonDatabase.writeCollection('drivers', list);
  }

  async saveAll(entities: Driver[]): Promise<void> {
    const list = await this.findAll();
    for (const entity of entities) {
      const index = list.findIndex(d => d.driverId === entity.driverId);
      if (index >= 0) list[index] = entity;
      else list.push(entity);
    }
    await JsonDatabase.writeCollection('drivers', list);
  }
}

// 5. Race Weekend Repository
export class RaceWeekendRepository implements Repository<RaceWeekend, string> {
  async findAll(): Promise<RaceWeekend[]> {
    return JsonDatabase.readCollection<RaceWeekend>('race_weekends');
  }

  async findById(id: string): Promise<RaceWeekend | null> {
    const list = await this.findAll();
    return list.find(r => r.id === id) || null;
  }

  async findBySeason(season: string): Promise<RaceWeekend[]> {
    const list = await this.findAll();
    return list.filter(r => r.season === season);
  }

  async save(entity: RaceWeekend): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(r => r.id === entity.id);
    if (index >= 0) list[index] = entity;
    else list.push(entity);
    await JsonDatabase.writeCollection('race_weekends', list);
  }

  async saveAll(entities: RaceWeekend[]): Promise<void> {
    const list = await this.findAll();
    for (const entity of entities) {
      const index = list.findIndex(r => r.id === entity.id);
      if (index >= 0) list[index] = entity;
      else list.push(entity);
    }
    await JsonDatabase.writeCollection('race_weekends', list);
  }
}

// 6. Driver Standing Repository
export class DriverStandingRepository implements Repository<DriverStanding, string> {
  // Primary key can be composite: "season-driverId"
  async findAll(): Promise<DriverStanding[]> {
    return JsonDatabase.readCollection<DriverStanding>('driver_standings');
  }

  // Find standings for a specific standing composite id or driverId
  async findById(id: string): Promise<DriverStanding | null> {
    const list = await this.findAll();
    return list.find(ds => `${ds.driver.driverId}` === id) || null;
  }

  async findBySeason(season: string): Promise<DriverStanding[]> {
    // Standardize: standing file holds standings. Since standings might be stored season-by-season,
    // we can filter them by looking up standing elements (can save them with an injected season tag).
    // Let's add a filter or save structure.
    return JsonDatabase.readCollection<DriverStanding>('driver_standings');
  }

  async save(entity: DriverStanding): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(ds => ds.driver.driverId === entity.driver.driverId);
    if (index >= 0) list[index] = entity;
    else list.push(entity);
    await JsonDatabase.writeCollection('driver_standings', list);
  }

  async saveAll(entities: DriverStanding[]): Promise<void> {
    // Standings are often overwritten for the current season.
    await JsonDatabase.writeCollection('driver_standings', entities);
  }
}

// 7. Constructor Standing Repository
export class ConstructorStandingRepository implements Repository<ConstructorStanding, string> {
  async findAll(): Promise<ConstructorStanding[]> {
    return JsonDatabase.readCollection<ConstructorStanding>('constructor_standings');
  }

  async findById(id: string): Promise<ConstructorStanding | null> {
    const list = await this.findAll();
    return list.find(cs => cs.team.constructorId === id) || null;
  }

  async save(entity: ConstructorStanding): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(cs => cs.team.constructorId === entity.team.constructorId);
    if (index >= 0) list[index] = entity;
    else list.push(entity);
    await JsonDatabase.writeCollection('constructor_standings', list);
  }

  async saveAll(entities: ConstructorStanding[]): Promise<void> {
    await JsonDatabase.writeCollection('constructor_standings', entities);
  }
}

// 8. Race Result Repository
export interface SavedRaceResults {
  raceId: string; // "season-round"
  results: RaceResult[];
}

export class RaceResultRepository {
  async findAll(): Promise<SavedRaceResults[]> {
    return JsonDatabase.readCollection<SavedRaceResults>('race_results');
  }

  async findByRaceId(raceId: string): Promise<RaceResult[] | null> {
    const list = await this.findAll();
    const item = list.find(r => r.raceId === raceId);
    return item ? item.results : null;
  }

  async save(raceId: string, results: RaceResult[]): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(r => r.raceId === raceId);
    if (index >= 0) list[index] = { raceId, results };
    else list.push({ raceId, results });
    await JsonDatabase.writeCollection('race_results', list);
  }
}

// 9. AI Insights Repository
export interface SavedAiInsight {
  raceId: string;
  insights: string;
  updatedAt: string;
}

export class AiInsightRepository {
  async findAll(): Promise<SavedAiInsight[]> {
    return JsonDatabase.readCollection<SavedAiInsight>('ai_insights');
  }

  async findByRaceId(raceId: string): Promise<string | null> {
    const list = await this.findAll();
    const item = list.find(r => r.raceId === raceId);
    return item ? item.insights : null;
  }

  async save(raceId: string, insights: string): Promise<void> {
    const list = await this.findAll();
    const index = list.findIndex(r => r.raceId === raceId);
    const item = { raceId, insights, updatedAt: new Date().toISOString() };
    if (index >= 0) list[index] = item;
    else list.push(item);
    await JsonDatabase.writeCollection('ai_insights', list);
  }
}
