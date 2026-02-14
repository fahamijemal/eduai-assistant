import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/TopicMastery.js', () => ({
  TopicMastery: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/InteractionHistory.js', () => ({
  InteractionHistory: {
    aggregate: vi.fn(),
    find: vi.fn(),
  },
}));

import { detectWeakTopics, getWeaknessPatterns } from '../weaknessDetectionService.js';
import { TopicMastery } from '../../models/TopicMastery.js';
import { InteractionHistory } from '../../models/InteractionHistory.js';

describe('weaknessDetectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectWeakTopics', () => {
    it('should return empty array when no weak topics', async () => {
      TopicMastery.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      const result = await detectWeakTopics('user1');

      expect(result).toEqual([]);
    });

    it('should detect topics with low accuracy', async () => {
      TopicMastery.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            topicName: 'Math',
            parentTopic: null,
            accuracy: 30,
            confidenceScore: 0.5,
            attempts: 5,
            improvementTrend: 0,
          },
        ]),
      });

      const result = await detectWeakTopics('user1');

      expect(result).toHaveLength(1);
      expect(result[0].topicName).toBe('Math');
      expect(result[0].reasons).toContain('Low accuracy (30%)');
    });

    it('should detect topics with low confidence', async () => {
      TopicMastery.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            topicName: 'Physics',
            parentTopic: null,
            accuracy: 55,
            confidenceScore: 0.3,
            attempts: 4,
            improvementTrend: 0,
          },
        ]),
      });

      const result = await detectWeakTopics('user1');

      expect(result).toHaveLength(1);
      expect(result[0].reasons).toContain('Low confidence (30%)');
    });

    it('should include declining performance as a reason', async () => {
      TopicMastery.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            topicName: 'Chemistry',
            parentTopic: null,
            accuracy: 40,
            confidenceScore: 0.35,
            attempts: 6,
            improvementTrend: -1,
          },
        ]),
      });

      const result = await detectWeakTopics('user1');

      expect(result[0].reasons).toContain('Declining performance');
    });

    it('should return multiple reasons for very weak topics', async () => {
      TopicMastery.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            topicName: 'Biology',
            parentTopic: null,
            accuracy: 20,
            confidenceScore: 0.2,
            attempts: 8,
            improvementTrend: -1,
          },
        ]),
      });

      const result = await detectWeakTopics('user1');

      expect(result[0].reasons.length).toBe(3);
      expect(result[0].reasons).toContain('Low accuracy (20%)');
      expect(result[0].reasons).toContain('Low confidence (20%)');
      expect(result[0].reasons).toContain('Declining performance');
    });
  });

  describe('getWeaknessPatterns', () => {
    it('should return frequently incorrect topics', async () => {
      InteractionHistory.aggregate.mockImplementation((pipeline) => {
        // Check if it's the "incorrect" aggregation (has correct: false match)
        const matchStage = pipeline[0]?.$match;
        if (matchStage?.correct === false) {
          return Promise.resolve([
            { _id: 'Math', incorrectCount: 10, lastOccurrence: new Date() },
          ]);
        }
        // Slow topics aggregation
        return Promise.resolve([]);
      });

      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await getWeaknessPatterns('user1');

      expect(result.frequentlyIncorrect).toHaveLength(1);
      expect(result.frequentlyIncorrect[0].topic).toBe('Math');
      expect(result.frequentlyIncorrect[0].incorrectCount).toBe(10);
    });

    it('should detect slow response topics', async () => {
      InteractionHistory.aggregate.mockImplementation((pipeline) => {
        const matchStage = pipeline[0]?.$match;
        if (matchStage?.correct === false) {
          return Promise.resolve([]);
        }
        // Slow topics
        if (matchStage?.responseTimeMs) {
          return Promise.resolve([
            { _id: 'Physics', avgResponseTime: 45000, count: 5 },
          ]);
        }
        return Promise.resolve([]);
      });

      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await getWeaknessPatterns('user1');

      expect(result.slowTopics).toHaveLength(1);
      expect(result.slowTopics[0].topic).toBe('Physics');
      expect(result.slowTopics[0].avgResponseTimeMs).toBe(45000);
    });

    it('should detect repeated misunderstandings (3+ consecutive errors)', async () => {
      InteractionHistory.aggregate.mockResolvedValue([]);
      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              // 4 consecutive wrong for Math (most recent first)
              { topicTag: 'Math', correct: false },
              { topicTag: 'Math', correct: false },
              { topicTag: 'Math', correct: false },
              { topicTag: 'Math', correct: false },
              { topicTag: 'Math', correct: true },
              // 2 consecutive wrong for Science (below threshold)
              { topicTag: 'Science', correct: false },
              { topicTag: 'Science', correct: false },
              { topicTag: 'Science', correct: true },
            ]),
          }),
        }),
      });

      const result = await getWeaknessPatterns('user1');

      expect(result.repeatedMisunderstandings).toHaveLength(1);
      expect(result.repeatedMisunderstandings[0].topic).toBe('Math');
      expect(result.repeatedMisunderstandings[0].consecutiveErrors).toBe(4);
    });

    it('should return empty patterns when no interactions exist', async () => {
      InteractionHistory.aggregate.mockResolvedValue([]);
      InteractionHistory.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await getWeaknessPatterns('user1');

      expect(result.frequentlyIncorrect).toEqual([]);
      expect(result.slowTopics).toEqual([]);
      expect(result.repeatedMisunderstandings).toEqual([]);
    });
  });
});
