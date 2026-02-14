import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/TopicMastery.js', () => ({
  TopicMastery: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/User.js', () => ({
  User: {
    updateOne: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../models/InteractionHistory.js', () => ({
  InteractionHistory: {
    aggregate: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

// Mock detectWeakTopics since it's called from predictReadiness
vi.mock('../weaknessDetectionService.js', () => ({
  detectWeakTopics: vi.fn().mockResolvedValue([]),
}));

import { predictReadiness } from '../examReadinessService.js';
import { TopicMastery } from '../../models/TopicMastery.js';

describe('examReadinessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 readiness when no masteries exist', async () => {
    TopicMastery.find.mockResolvedValue([]);

    const result = await predictReadiness('user1');

    expect(result.readinessScore).toBe(0);
    expect(result.passProbability).toBe(0);
    expect(result.focusAreas).toEqual([]);
    expect(result.recommendation).toContain('Upload study materials');
  });

  it('should calculate readiness score for high-performing user', async () => {
    const masteries = [
      { accuracy: 90, confidenceScore: 0.85, attempts: 10, improvementTrend: 1 },
      { accuracy: 85, confidenceScore: 0.80, attempts: 8, improvementTrend: 0 },
      { accuracy: 95, confidenceScore: 0.90, attempts: 12, improvementTrend: 1 },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await predictReadiness('user1');

    // avgAccuracy = (90+85+95)/3 = 90
    // avgConfidence = (0.85+0.80+0.90)/3 = 0.85
    // coverage = 3/3 = 1.0
    // improving=2, declining=0, trendScore=(2-0)/3=0.67, normalized=(0.67+1)/2=0.835
    // score = 90*0.4 + 85*0.25 + 100*0.2 + 83.5*0.15 = 36+21.25+20+12.525 = ~90
    expect(result.readinessScore).toBeGreaterThanOrEqual(80);
    expect(result.readinessScore).toBeLessThanOrEqual(100);
    expect(result.passProbability).toBeGreaterThan(0.7);
    expect(result.recommendation).toContain('Excellent');
  });

  it('should calculate readiness score for low-performing user', async () => {
    const masteries = [
      { accuracy: 20, confidenceScore: 0.2, attempts: 3, improvementTrend: -1 },
      { accuracy: 30, confidenceScore: 0.3, attempts: 2, improvementTrend: 0 },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await predictReadiness('user1');

    expect(result.readinessScore).toBeLessThanOrEqual(40);
    expect(result.passProbability).toBeLessThan(0.4);
    expect(result.recommendation).toMatch(/Intensive study|Significant improvement/);
  });

  it('should generate correct recommendation for mid-range score', async () => {
    const masteries = [
      { accuracy: 65, confidenceScore: 0.55, attempts: 5, improvementTrend: 0 },
      { accuracy: 60, confidenceScore: 0.50, attempts: 4, improvementTrend: 1 },
      { accuracy: 70, confidenceScore: 0.60, attempts: 6, improvementTrend: 0 },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await predictReadiness('user1');

    expect(result.readinessScore).toBeGreaterThanOrEqual(40);
    expect(result.readinessScore).toBeLessThan(80);
    expect(result.stats.totalTopics).toBe(3);
    expect(result.stats.attemptedTopics).toBe(3);
  });

  it('should return focus areas from weak topics', async () => {
    const masteries = [
      { accuracy: 90, confidenceScore: 0.9, attempts: 10, improvementTrend: 1 },
      { accuracy: 30, confidenceScore: 0.2, attempts: 3, improvementTrend: -1 },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await predictReadiness('user1');

    expect(result.focusAreas).toBeDefined();
    expect(Array.isArray(result.focusAreas)).toBe(true);
  });

  it('should clamp readiness score between 0 and 100', async () => {
    // All perfect scores should not exceed 100
    const masteries = [
      { accuracy: 100, confidenceScore: 1.0, attempts: 20, improvementTrend: 1 },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await predictReadiness('user1');

    expect(result.readinessScore).toBeLessThanOrEqual(100);
    expect(result.readinessScore).toBeGreaterThanOrEqual(0);
  });
});
