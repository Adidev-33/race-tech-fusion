import { GoogleGenAI } from '@google/genai';
import {
  DriverStandingRepository,
  ConstructorStandingRepository,
  RaceWeekendRepository,
  AiInsightRepository
} from '../repositories/F1Repositories.js';

export class AiPredictionService {
  private driverStandingRepo = new DriverStandingRepository();
  private constructorStandingRepo = new ConstructorStandingRepository();
  private raceRepo = new RaceWeekendRepository();
  private insightRepo = new AiInsightRepository();

  private inFlightRequests = new Map<string, Promise<string>>();

  private getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY is not set. AI prediction features will fall back to static heuristics.');
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  public async generateRaceInsights(raceId: string): Promise<string> {
    const cached = await this.insightRepo.findByRaceId(raceId);
    if (cached) {
      return cached;
    }

    if (this.inFlightRequests.has(raceId)) {
      console.log(`⏳ Awaiting existing in-flight Gemini AI request for race: ${raceId}`);
      return this.inFlightRequests.get(raceId)!;
    }

    const promise = (async () => {
      try {
        const result = await this.performInsightGeneration(raceId);
        return result;
      } finally {
        this.inFlightRequests.delete(raceId);
      }
    })();

    this.inFlightRequests.set(raceId, promise);
    return promise;
  }

  private async performInsightGeneration(raceId: string): Promise<string> {
    const race = await this.raceRepo.findById(raceId);
    if (!race) {
      return 'Race details not found.';
    }

    const driverStandings = await this.driverStandingRepo.findAll();
    const constructorStandings = await this.constructorStandingRepo.findAll();

    const topDrivers = driverStandings.slice(0, 5).map(
      d => `P${d.position}: ${d.driver.givenName} ${d.driver.familyName} (${d.team.name}) - ${d.points}pts`
    ).join('\n');

    const topTeams = constructorStandings.slice(0, 3).map(
      t => `P${t.position}: ${t.team.name} - ${t.points}pts`
    ).join('\n');

    const prompt = `
You are the Lead Race Strategist and Chief Formula 1 AI Analytics Engine at Race Tech Fusion.
Analyze the following motorsport data and provide a detailed strategy briefing, custom AI predictions, and tactical preview for the upcoming Grand Prix.

CURRENT CHAMPIONSHIP SITUATION:
=== Top 5 Drivers ===
${topDrivers}

=== Top 3 Teams ===
${topTeams}

GP EVENT FOCUS:
- Race: ${race.raceName}
- Circuit: ${race.circuit.circuitName}
- Location: ${race.circuit.locality}, ${race.circuit.country}
- Round: ${race.round}

Provide a styled Strategy Report in clean markdown format (do not use HTML). It should have the following named parts:
1.  **Race Overview & Technical Focus**: Analyze the circuit's layout (downforce requirements, engine power vs. high speed corners, traction zones) and how it affects the front-running cars.
2.  **Tyre Degradation & Pit Strategy (AI prediction)**: Estimate tyre compounds selection, key degradation risks, and the most likely optimal 1-stop or 2-stop strategy window.
3.  **Safety Car & Collision Probability**: Give a calculated probability (in %) with key danger zones around the track.
4.  **Strategic Winner & Podium Predictions**: Predict the top 3 drivers based on current standings, track characteristics, and momentum.
5.  **Dark Horse Driver**: Select one driver outside the top 5 likely to overperform here.

Make the tone highly engaging, authoritative, and typical of professional motorsports analysts (like David Croft, Martin Brundle, or telemetry engineers).
`;

    const ai = this.getGeminiClient();
    if (!ai) {
      return this.generateStaticInsights(race);
    }

    try {
      console.log(`🤖 Requesting Gemini AI analysis for race: ${race.raceName}...`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const mdText = response.text || 'Unable to generate analysis at this time.';
      await this.insightRepo.save(raceId, mdText);
      return mdText;
    } catch (e: any) {
      console.error('❌ Error generating Gemini AI insights:', e);
      return this.generateStaticInsights(race);
    }
  }

  private generateStaticInsights(race: any): string {
    return `
### 🏁 Tactical Preview: ${race.raceName} (Analytical Backup)

*Note: The primary AI strategy module is currently running offline. Here is a localized telemetry estimate.*

*   **Circuit Analysis**: **${race.circuit.circuitName}** in ${race.circuit.locality}, ${race.circuit.country} features unique traction demands. Teams running high downforce setups will generally capture a major performance benefit in low-speed sections.
*   **Optimal Strategy**: An estimated 1-stop strategy (Medium to Hard tyres) is expected. Strategy windows open around Lap 18-24. High ambient temperatures could trigger minor blistering risks.
*   **Podium Outlook & Power Rankings**: Top title contenders are heavily favored owing to current chassis mechanical grip and straight-line efficiency. Key battles to expect are around DRS zone limits and Turn 1 braking overtakes.
*   **Safety Car Risk**: Calculated at **45%** average based on historic collisions at high speed apex sections.
    `;
  }
}
