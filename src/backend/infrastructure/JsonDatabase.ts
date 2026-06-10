import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export class JsonDatabase {
  private static initPromise: Promise<void> | null = null;

  public static async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          if (!fs.existsSync(DATA_DIR)) {
            await fs.promises.mkdir(DATA_DIR, { recursive: true });
          }
        } catch (error) {
          console.error('Error initializing JSON database folder:', error);
        }
      })();
    }
    return this.initPromise;
  }

  public static async readCollection<T>(collectionName: string): Promise<T[]> {
    await this.initialize();
    const filePath = path.join(DATA_DIR, `${collectionName}.json`);
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const rawData = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(rawData) as T[];
    } catch (error) {
      console.warn(`Error reading collection ${collectionName}, returning empty array:`, error);
      return [];
    }
  }

  public static async writeCollection<T>(collectionName: string, data: T[]): Promise<void> {
    await this.initialize();
    const filePath = path.join(DATA_DIR, `${collectionName}.json`);
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error writing collection ${collectionName}:`, error);
      throw error;
    }
  }
}
