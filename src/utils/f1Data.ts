/**
 * Race Tech Fusion - Enriched F1 Metadata Helper
 * Provides high-quality images and background data for drivers and constructors
 */

export const TEAM_METADATA: Record<string, { championships: number; base: string; principal: string; chassis: string }> = {
  red_bull: { championships: 6, base: 'Milton Keynes, UK', principal: 'Christian Horner', chassis: 'RB21' },
  ferrari: { championships: 16, base: 'Maranello, Italy', principal: 'Frédéric Vasseur', chassis: 'SF-25' },
  mclaren: { championships: 8, base: 'Woking, UK', principal: 'Andrea Stella', chassis: 'MCL38' },
  mercedes: { championships: 8, base: 'Brackley, UK', principal: 'Toto Wolff', chassis: 'W16' },
  aston_martin: { championships: 0, base: 'Silverstone, UK', principal: 'Mike Krack', chassis: 'AMR25' },
  sauber: { championships: 0, base: 'Hinwil, Switzerland', principal: 'Mattia Binotto', chassis: 'C45' },
  haas: { championships: 0, base: 'Kannapolis, US', principal: 'Ayao Komatsu', chassis: 'VF-25' },
  williams: { championships: 9, base: 'Grove, UK', principal: 'James Vowles', chassis: 'FW47' },
  racing_bulls: { championships: 0, base: 'Faenza, Italy', principal: 'Laurent Mekies', chassis: 'VCARB 02' },
  alpine: { championships: 2, base: 'Enstone, UK', principal: 'Oliver Oakes', chassis: 'A525' },
};

export const DRIVER_METADATA: Record<string, { championships: number; wins: number; podiums: number; countryCode: string; age: number }> = {
  max_verstappen: { championships: 4, wins: 62, podiums: 111, countryCode: 'NL', age: 28 },
  hamilton: { championships: 7, wins: 105, podiums: 201, countryCode: 'GB', age: 41 },
  charles_leclerc: { championships: 0, wins: 8, podiums: 41, countryCode: 'MC', age: 28 },
  norris: { championships: 0, wins: 4, podiums: 25, countryCode: 'GB', age: 26 },
  piastri: { championships: 0, wins: 2, podiums: 9, countryCode: 'AU', age: 25 },
  sainz: { championships: 0, wins: 4, podiums: 25, countryCode: 'ES', age: 31 },
  russell: { championships: 0, wins: 3, podiums: 14, countryCode: 'GB', age: 28 },
  alonso: { championships: 2, wins: 32, podiums: 106, countryCode: 'ES', age: 44 },
  gasly: { championships: 0, wins: 1, podiums: 4, countryCode: 'FR', age: 30 },
  ocon: { championships: 0, wins: 1, podiums: 3, countryCode: 'FR', age: 29 },
  albon: { championships: 0, wins: 0, podiums: 2, countryCode: 'TH', age: 30 },
  stroll: { championships: 0, wins: 0, podiums: 3, countryCode: 'CA', age: 27 },
  hulkenberg: { championships: 0, wins: 0, podiums: 0, countryCode: 'DE', age: 38 },
  bottas: { championships: 0, wins: 10, podiums: 67, countryCode: 'FI', age: 36 },
  magnussen: { championships: 0, wins: 0, podiums: 1, countryCode: 'DK', age: 33 },
  tsunoda: { championships: 0, wins: 0, podiums: 0, countryCode: 'JP', age: 26 },
  perez: { championships: 0, wins: 6, podiums: 39, countryCode: 'MX', age: 36 },
};

export function getTeamMeta(id: string) {
  // Try direct match or key normalization
  const norm = id.toLowerCase().replace(/[\s-]/g, '_');
  for (const [key, val] of Object.entries(TEAM_METADATA)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }
  return { championships: 0, base: 'Unknown', principal: 'Unknown', chassis: 'Unknown' };
}

export function getDriverMeta(id: string) {
  const norm = id.toLowerCase();
  for (const [key, val] of Object.entries(DRIVER_METADATA)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }
  return { championships: 0, wins: 0, podiums: 0, countryCode: 'F1', age: 25 };
}

// Map each constructorId to a beautiful color scheme
export function getTeamColor(id: string): string {
  const norm = id.toLowerCase();
  if (norm.includes('red_bull')) return '#061D41'; // Navy Blue
  if (norm.includes('ferrari')) return '#F60000'; // Rosso Corsa Red
  if (norm.includes('mclaren')) return '#FF8700'; // Papaya Orange
  if (norm.includes('mercedes')) return '#27F4D2'; // Petronas Teal
  if (norm.includes('aston_martin')) return '#004F30'; // British Racing Green
  if (norm.includes('alpine')) return '#0090FF'; // Alpine Blue
  if (norm.includes('williams')) return '#005AFF'; // Royal Blue
  if (norm.includes('haas')) return '#E60000'; // Haas Red/White
  if (norm.includes('sauber') || norm.includes('audi')) return '#52E252'; // Neon Green
  if (norm.includes('rb') || norm.includes('racing_bulls') || norm.includes('cash_app') || norm.includes('torro') || norm.includes('toro')) return '#1A33FF'; // Bright Blue
  return '#909090'; // Neutral Gray
}

export const OFFICIAL_TEAM_NAMES: Record<string, string> = {
  red_bull: 'Oracle Red Bull Racing',
  ferrari: 'Scuderia Ferrari HP',
  mercedes: 'Mercedes-AMG PETRONAS F1 Team',
  mclaren: 'McLaren Formula 1 Team',
  aston_martin: 'Aston Martin Aramco F1 Team',
  alpine: 'BWT Alpine F1 Team',
  williams: 'Williams Racing',
  haas: 'MoneyGram Haas F1 Team',
  sauber: 'Stake F1 Team Kick Sauber',
  audi: 'Audi F1 Team',
  rb: 'Visa Cash App RB F1 Team',
  racing_bulls: 'Visa Cash App RB F1 Team',
  cadillac: 'Cadillac F1 Team'
};

export function getOfficialTeamName(id: string, defaultName?: string): string {
  const norm = id.toLowerCase().replace(/[\s-]/g, '_');
  for (const [key, val] of Object.entries(OFFICIAL_TEAM_NAMES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }
  return defaultName || id;
}

export const CIRCUIT_METADATA: Record<string, { length: string; corners: number; record: string; recordHolder: string; laps: number; firstGp: number }> = {
  albert_park: { length: '5.278 km', corners: 14, record: '1:20.235', recordHolder: 'Charles Leclerc (2022)', laps: 58, firstGp: 1996 },
  shanghai: { length: '5.451 km', corners: 16, record: '1:32.238', recordHolder: 'Michael Schumacher (2004)', laps: 56, firstGp: 2004 },
  suzuka: { length: '5.807 km', corners: 18, record: '1:30.983', recordHolder: 'Lewis Hamilton (2019)', laps: 53, firstGp: 1987 },
  miami: { length: '5.412 km', corners: 19, record: '1:29.708', recordHolder: 'Max Verstappen (2023)', laps: 57, firstGp: 2022 },
  villeneuve: { length: '4.361 km', corners: 14, record: '1:13.078', recordHolder: 'Valtteri Bottas (2019)', laps: 70, firstGp: 1978 },
  monaco: { length: '3.337 km', corners: 19, record: '1:12.909', recordHolder: 'Lewis Hamilton (2021)', laps: 78, firstGp: 1950 },
  catalunya: { length: '4.657 km', corners: 14, record: '1:16.330', recordHolder: 'Max Verstappen (2023)', laps: 66, firstGp: 1991 },
  red_bull_ring: { length: '4.318 km', corners: 10, record: '1:05.619', recordHolder: 'Carlos Sainz (2020)', laps: 71, firstGp: 1970 },
  silverstone: { length: '5.891 km', corners: 18, record: '1:27.097', recordHolder: 'Max Verstappen (2020)', laps: 52, firstGp: 1950 },
  spa: { length: '7.004 km', corners: 19, record: '1:46.286', recordHolder: 'Valtteri Bottas (2018)', laps: 44, firstGp: 1950 },
  hungaroring: { length: '4.381 km', corners: 14, record: '1:16.627', recordHolder: 'Lewis Hamilton (2020)', laps: 70, firstGp: 1986 },
  zandvoort: { length: '4.259 km', corners: 14, record: '1:11.097', recordHolder: 'Lewis Hamilton (2021)', laps: 72, firstGp: 1952 },
  monza: { length: '5.793 km', corners: 11, record: '1:21.046', recordHolder: 'Rubens Barrichello (2004)', laps: 53, firstGp: 1950 },
  baku: { length: '6.003 km', corners: 20, record: '1:43.009', recordHolder: 'Charles Leclerc (2019)', laps: 51, firstGp: 2016 },
  marina_bay: { length: '4.940 km', corners: 19, record: '1:35.867', recordHolder: 'Lewis Hamilton (2023)', laps: 62, firstGp: 2008 },
  americas: { length: '5.513 km', corners: 20, record: '1:36.169', recordHolder: 'Charles Leclerc (2019)', laps: 56, firstGp: 2012 },
  rodriguez: { length: '4.304 km', corners: 17, record: '1:17.774', recordHolder: 'Valtteri Bottas (2021)', laps: 71, firstGp: 1963 },
  interlagos: { length: '4.309 km', corners: 15, record: '1:10.540', recordHolder: 'Valtteri Bottas (2018)', laps: 71, firstGp: 1973 },
  vegas: { length: '6.201 km', corners: 17, record: '1:35.490', recordHolder: 'Oscar Piastri (2023)', laps: 50, firstGp: 2023 },
  losail: { length: '5.419 km', corners: 16, record: '1:24.319', recordHolder: 'Max Verstappen (2023)', laps: 57, firstGp: 2021 },
  yas_marina: { length: '5.281 km', corners: 16, record: '1:26.103', recordHolder: 'Max Verstappen (2021)', laps: 58, firstGp: 2009 },
  madring: { length: '5.474 km', corners: 20, record: 'N/A', recordHolder: 'New Circuit (2026)', laps: 55, firstGp: 2026 }
};

export function getCircuitMeta(id: string) {
  const norm = id.toLowerCase().replace(/[\s-]/g, '_');
  for (const [key, val] of Object.entries(CIRCUIT_METADATA)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }
  return { length: 'Unknown', corners: 0, record: 'Unknown', recordHolder: 'Unknown', laps: 0, firstGp: 0 };
}

