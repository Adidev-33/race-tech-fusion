/**
 * Race Tech Fusion - Model Registry
 * Centralized repository for managing the lifecycle, metrics, and parameters of F1 prediction models.
 */

export type ModelStatus = 'Training' | 'Testing' | 'Production' | 'Archived';

export interface ModelMetadata {
  id: string; // e.g., "xgb_winner_v3.2"
  name: string; // "Race Winner Prediction Model"
  type: string; // "XGBoost Classifier", "Random Forest Classifier", etc.
  category: 'Winner' | 'Podium' | 'Championship' | 'SafetyCar' | 'TyreDegradation' | 'Strategy';
  version: string; // "3.2"
  accuracy: number; // Validation Accuracy Score e.g. 0.881 (88.1%)
  precision: number;
  recall: number;
  trainingDate: string;
  hyperparameters: Record<string, any>;
  featuresUsed: string[];
  status: ModelStatus;
  trainingSamplesCount: number;
}

export class ModelRegistry {
  private static instance: ModelRegistry;
  private registry: Map<string, ModelMetadata> = new Map();

  private constructor() {
    this.seedRegistry();
  }

  public static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  /**
   * Seed the registry with initial model states spanning classifiers, regressors, and time-series.
   */
  private seedRegistry() {
    const epoch = new Date().toISOString();

    const initialModels: ModelMetadata[] = [
      // 1. Race Winner Predictions
      {
        id: 'xgb_winner_prod',
        name: 'Race Winner Core Predictor',
        type: 'XGBoost Classifier',
        category: 'Winner',
        version: '3.2.1',
        accuracy: 0.884,
        precision: 0.891,
        recall: 0.876,
        trainingDate: epoch,
        hyperparameters: { n_estimators: 180, learning_rate: 0.05, max_depth: 6, subsample: 0.85 },
        featuresUsed: ['Qualifying Position', 'Circuit Safety Factor', 'Driver Recent Form', 'Team Race Pace'],
        status: 'Production',
        trainingSamplesCount: 2450
      },
      {
        id: 'lgbm_winner_candidate',
        name: 'Race Winner Competitor',
        type: 'LightGBM Classifier',
        category: 'Winner',
        version: '3.1.5',
        accuracy: 0.871,
        precision: 0.865,
        recall: 0.870,
        trainingDate: epoch,
        hyperparameters: { num_leaves: 31, learning_rate: 0.03, max_depth: 5 },
        featuresUsed: ['Qualifying Position', 'Circuit Safety Factor', 'Driver Recent Form', 'Team Race Pace'],
        status: 'Testing',
        trainingSamplesCount: 2450
      },
      {
        id: 'rf_winner_legacy',
        name: 'Race Winner Forest',
        type: 'Random Forest Classifier',
        category: 'Winner',
        version: '2.4.0',
        accuracy: 0.825,
        precision: 0.810,
        recall: 0.835,
        trainingDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        hyperparameters: { n_estimators: 250, max_depth: 8, min_samples_split: 4 },
        featuresUsed: ['Qualifying Position', 'Driver Podium Rate', 'Constructor Rank'],
        status: 'Archived',
        trainingSamplesCount: 1800
      },

      // 2. Podium Probability Predictor
      {
        id: 'cat_podium_prod',
        name: 'Podium Threshold Predictor',
        type: 'CatBoost Classifier',
        category: 'Podium',
        version: '2.1.0',
        accuracy: 0.912,
        precision: 0.918,
        recall: 0.902,
        trainingDate: epoch,
        hyperparameters: { iterations: 400, depth: 7, l2_leaf_reg: 3.5 },
        featuresUsed: ['Qualifying Position', 'Podium Conversion Rate', 'Chassis Cornering Efficiency'],
        status: 'Production',
        trainingSamplesCount: 3200
      },

      // 3. Championship Simulation Tracker
      {
        id: 'monte_carlo_championship_prod',
        name: 'Monte Carlo Formula Engine',
        type: 'Monte Carlo Simulation',
        category: 'Championship',
        version: '5.2.0',
        accuracy: 0.945,
        precision: 0.950,
        recall: 0.938,
        trainingDate: epoch,
        hyperparameters: { trials: 10000, skew_factor: 1.15, penalty_probability: 0.04 },
        featuresUsed: ['Driver Standings Points', 'Championship Consistency Matrix', 'Constructor Points Rate'],
        status: 'Production',
        trainingSamplesCount: 10000
      },

      // 4. Safety Car Incidents Engine
      {
        id: 'xgb_safety_car_prod',
        name: 'Safety Car Probabilistic Engine',
        type: 'XGBoost Classifier',
        category: 'SafetyCar',
        version: '2.0.2',
        accuracy: 0.862,
        precision: 0.840,
        recall: 0.880,
        trainingDate: epoch,
        hyperparameters: { n_estimators: 120, max_depth: 4, learning_rate: 0.08 },
        featuresUsed: ['Circuit Safety Car Frequency', 'Weather Rainfall Factor', 'Historical Circuit Incidents'],
        status: 'Production',
        trainingSamplesCount: 1240
      },

      // 5. Hard Compound Tyre Degradation wear rate
      {
        id: 'nn_tyre_life_prod',
        name: 'Neural Compound Thermal Wear Map',
        type: 'Multi-Layer Perceptron Regressor',
        category: 'TyreDegradation',
        version: '4.1.0',
        accuracy: 0.931, // R-squared score mapped to accuracy metric
        precision: 0.925,
        recall: 0.935,
        trainingDate: epoch,
        hyperparameters: { hidden_layer_sizes: [64, 32], activation: 'relu', alpha: 0.0001 },
        featuresUsed: ['Tyre Compound Compound Type', 'Track Surface Temperature', 'Downforce Load index', 'Rolling Stint Age'],
        status: 'Production',
        trainingSamplesCount: 6500
      },

      // 6. Strategic Pit Window Recommender
      {
        id: 'bayes_opt_strategy_prod',
        name: 'Optimal Overcut/Undercut Strategy optimizer',
        type: 'Bayesian Simulation Engine',
        category: 'Strategy',
        version: '3.6.0',
        accuracy: 0.895,
        precision: 0.901,
        recall: 0.888,
        trainingDate: epoch,
        hyperparameters: { confidence_bounds: 0.95, utility_multiplier: 1.25 },
        featuresUsed: ['Current Compound', 'Driver Pace Index', 'Pit Stop Duration Target', 'Track Humidity'],
        status: 'Production',
        trainingSamplesCount: 4500
      }
    ];

    initialModels.forEach(m => this.registry.set(m.id, m));
  }

  // --- API Actions ---

  public getModel(id: string): ModelMetadata | null {
    return this.registry.get(id) || null;
  }

  public getAllModels(): ModelMetadata[] {
    return Array.from(this.registry.values());
  }

  public registerModel(meta: ModelMetadata): void {
    this.registry.set(meta.id, meta);
  }

  public updateModelStatus(id: string, status: ModelStatus): boolean {
    const existing = this.registry.get(id);
    if (!existing) return false;
    existing.status = status;
    return true;
  }

  public getModelsByCategory(cat: ModelMetadata['category']): ModelMetadata[] {
    return this.getAllModels().filter(m => m.category === cat);
  }

  public getProductionModelForCategory(cat: ModelMetadata['category']): ModelMetadata {
    const list = this.getModelsByCategory(cat).filter(m => m.status === 'Production');
    if (list.length > 0) return list[0];
    
    // Safety fallback
    const allOfCat = this.getModelsByCategory(cat);
    if (allOfCat.length > 0) return allOfCat[0];
    
    throw new Error(`Incomplete Model Registry layout: No production model is listed under category ${cat}`);
  }

  /**
   * Promotes a testing or training candidate model to Active Production.
   * Auto archives/testing toggles the former production version.
   */
  public promoteModel(id: string): boolean {
    const target = this.registry.get(id);
    if (!target) return false;

    // Set other models of this category in production to Archived
    const category = target.category;
    this.getAllModels().forEach(m => {
      if (m.category === category && m.status === 'Production' && m.id !== id) {
        m.status = 'Archived';
      }
    });

    target.status = 'Production';
    return true;
  }
}
