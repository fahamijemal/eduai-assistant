import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Mongoose models before importing the service
vi.mock('../../models/TopicMastery.js', () => ({
  TopicMastery: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/InteractionHistory.js', () => ({
  InteractionHistory: {
    find: vi.fn(),
  },
}));

import { updateMastery, getUserMasteries, bulkUpdateMastery } from '../masteryService.js';
import { TopicMastery } from '../../models/TopicMastery.js';
import { InteractionHistory } from '../../models/InteractionHistory.js';

describe('masteryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateMastery', () => {
    it('should create a new mastery record if none exists', async () => {
      const mockMastery = {
        userId: 'user1',
        topicName: 'Math',
        accuracy: 0,
        attempts: 0,
        correctAttempts: 0,
        confidenceScore: 0,
        improvementTrend: 0,
        avgResponseTimeMs: null,
        lastUpdated: null,
        save: vi.fn(),
      };

      TopicMastery.findOne.mockResolvedValue(null);
      TopicMastery.create.mockResolvedValue(mockMastery);
      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await updateMastery('user1', 'Math', true, 5000);

      expect(TopicMastery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          topicName: 'Math',
          accuracy: 0,
          attempts: 0,
          correctAttempts: 0,
        }),
      );
      expect(result.save).toHaveBeenCalled();
    });

    it('should update accuracy correctly for correct answer', async () => {
      const mockMastery = {
        userId: 'user1',
        topicName: 'Math',
        accuracy: 50,
        attempts: 2,
        correctAttempts: 1,
        confidenceScore: 0.5,
        improvementTrend: 0,
        avgResponseTimeMs: 3000,
        lastUpdated: new Date(),
        save: vi.fn(),
      };

      TopicMastery.findOne.mockResolvedValue(mockMastery);
      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await updateMastery('user1', 'Math', true, 4000);

      // After: attempts=3, correct=2, accuracy = round(2/3*100) = 67
      expect(result.attempts).toBe(3);
      expect(result.correctAttempts).toBe(2);
      expect(result.accuracy).toBe(67);
      expect(result.save).toHaveBeenCalled();
    });

    it('should update accuracy correctly for incorrect answer', async () => {
      const mockMastery = {
        userId: 'user1',
        topicName: 'Math',
        accuracy: 100,
        attempts: 1,
        correctAttempts: 1,
        confidenceScore: 0.7,
        improvementTrend: 0,
        avgResponseTimeMs: 2000,
        lastUpdated: new Date(),
        save: vi.fn(),
      };

      TopicMastery.findOne.mockResolvedValue(mockMastery);
      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await updateMastery('user1', 'Math', false, 6000);

      // After: attempts=2, correct=1, accuracy = round(1/2*100) = 50
      expect(result.attempts).toBe(2);
      expect(result.correctAttempts).toBe(1);
      expect(result.accuracy).toBe(50);
    });

    it('should calculate average response time correctly', async () => {
      const mockMastery = {
        userId: 'user1',
        topicName: 'Math',
        accuracy: 100,
        attempts: 1,
        correctAttempts: 1,
        confidenceScore: 0.7,
        improvementTrend: 0,
        avgResponseTimeMs: 4000,
        lastUpdated: new Date(),
        save: vi.fn(),
      };

      TopicMastery.findOne.mockResolvedValue(mockMastery);
      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await updateMastery('user1', 'Math', true, 8000);

      // avgResponseTimeMs = round((4000 * 1 + 8000) / 2) = 6000
      expect(mockMastery.avgResponseTimeMs).toBe(6000);
    });

    it('should detect improvement trend from interaction history', async () => {
      const mockMastery = {
        userId: 'user1',
        topicName: 'Math',
        accuracy: 60,
        attempts: 5,
        correctAttempts: 3,
        confidenceScore: 0.5,
        improvementTrend: 0,
        avgResponseTimeMs: 3000,
        lastUpdated: new Date(),
        save: vi.fn(),
      };

      TopicMastery.findOne.mockResolvedValue(mockMastery);

      // Simulate improving trend: recent all correct, older mostly wrong
      const interactions = [
        { correct: true },
        { correct: true },
        { correct: true },
        { correct: false },
        { correct: false },
        { correct: false },
      ];

      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(interactions),
          }),
        }),
      });

      const result = await updateMastery('user1', 'Math', true, 2000);

      // Recent 3: [true, true, true] = 100%, older 3: [false, false, false] = 0%
      // Diff = 1.0 > 0.1 so improvementTrend = 1
      expect(result.improvementTrend).toBe(1);
    });
  });

  describe('getUserMasteries', () => {
    it('should return sorted mastery records', async () => {
      const mockResult = [
        { topicName: 'Math', accuracy: 30 },
        { topicName: 'Science', accuracy: 70 },
      ];
      TopicMastery.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockResult),
      });

      const result = await getUserMasteries('user1');

      expect(TopicMastery.find).toHaveBeenCalledWith({ userId: 'user1' });
      expect(result).toEqual(mockResult);
    });
  });

  describe('bulkUpdateMastery', () => {
    it('should update mastery for multiple results', async () => {
      const mockMastery = {
        accuracy: 50,
        attempts: 1,
        correctAttempts: 0,
        confidenceScore: 0,
        improvementTrend: 0,
        avgResponseTimeMs: null,
        lastUpdated: null,
        save: vi.fn(),
      };

      TopicMastery.findOne.mockResolvedValue(null);
      TopicMastery.create.mockResolvedValue({ ...mockMastery });
      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const results = [
        { topic: 'Math', isCorrect: true, responseTimeMs: 3000 },
        { topic: 'Science', isCorrect: false, responseTimeMs: 5000 },
      ];

      const updated = await bulkUpdateMastery('user1', results);

      expect(updated).toHaveLength(2);
      expect(TopicMastery.create).toHaveBeenCalledTimes(2);
    });
  });
});
