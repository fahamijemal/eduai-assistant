import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/TopicMastery.js', () => ({
  TopicMastery: {
    find: vi.fn(),
  },
}));

import { generateDailyPlan } from '../revisionSchedulerService.js';
import { TopicMastery } from '../../models/TopicMastery.js';

describe('revisionSchedulerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty plan when no masteries exist', async () => {
    TopicMastery.find.mockResolvedValue([]);

    const result = await generateDailyPlan('user1');

    expect(result.tasks).toEqual([]);
    expect(result.totalEstimatedMinutes).toBe(0);
    expect(result.message).toContain('No topics found');
  });

  it('should include overdue topics in the plan', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
    const masteries = [
      {
        topicName: 'Math',
        parentTopic: 'STEM',
        accuracy: 30,
        attempts: 3,
        lastUpdated: twoDaysAgo,
      },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await generateDailyPlan('user1');

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].topic).toBe('Math');
    expect(result.tasks[0].priority).toBe('critical'); // overdue + low accuracy
    expect(result.tasks[0].estimatedMinutes).toBe(30);
  });

  it('should include never-attempted topics', async () => {
    const masteries = [
      {
        topicName: 'History',
        parentTopic: null,
        accuracy: 0,
        attempts: 0,
        lastUpdated: null,
      },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await generateDailyPlan('user1');

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].topic).toBe('History');
    expect(result.tasks[0].action).toBe('First study – read material');
  });

  it('should sort tasks by priority (critical > high > medium > low)', async () => {
    const oldDate = new Date(Date.now() - 30 * 86400000);
    const masteries = [
      { topicName: 'Easy', parentTopic: null, accuracy: 80, attempts: 10, lastUpdated: oldDate },
      { topicName: 'Hard', parentTopic: null, accuracy: 20, attempts: 5, lastUpdated: oldDate },
      { topicName: 'Medium', parentTopic: null, accuracy: 55, attempts: 3, lastUpdated: oldDate },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await generateDailyPlan('user1');

    // All are overdue; Hard (20% + overdue) = critical, Medium (55% + overdue) = high, Easy (80% + overdue) = high
    const priorities = result.tasks.map((t) => t.priority);
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < priorities.length; i++) {
      expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i - 1]]);
    }
  });

  it('should limit daily plan to 6 tasks', async () => {
    const oldDate = new Date(Date.now() - 30 * 86400000);
    const masteries = Array.from({ length: 10 }, (_, i) => ({
      topicName: `Topic ${i}`,
      parentTopic: null,
      accuracy: 30 + i * 5,
      attempts: 3,
      lastUpdated: oldDate,
    }));
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await generateDailyPlan('user1');

    expect(result.tasks.length).toBeLessThanOrEqual(6);
    expect(result.remainingTopics).toBeGreaterThan(0);
  });

  it('should suggest correct actions based on accuracy', async () => {
    const oldDate = new Date(Date.now() - 30 * 86400000);
    const masteries = [
      { topicName: 'Low', parentTopic: null, accuracy: 20, attempts: 5, lastUpdated: oldDate },
      { topicName: 'MidLow', parentTopic: null, accuracy: 45, attempts: 5, lastUpdated: oldDate },
      { topicName: 'Mid', parentTopic: null, accuracy: 65, attempts: 5, lastUpdated: oldDate },
      { topicName: 'High', parentTopic: null, accuracy: 88, attempts: 5, lastUpdated: oldDate },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await generateDailyPlan('user1');
    const actionMap = {};
    result.tasks.forEach((t) => { actionMap[t.topic] = t.action; });

    expect(actionMap['Low']).toBe('Re-study fundamentals');
    expect(actionMap['MidLow']).toBe('Practice with easy quiz');
    expect(actionMap['Mid']).toBe('Practice with medium quiz');
    expect(actionMap['High']).toBe('Quick review');
  });

  it('should calculate total estimated minutes', async () => {
    const oldDate = new Date(Date.now() - 30 * 86400000);
    const masteries = [
      { topicName: 'A', parentTopic: null, accuracy: 20, attempts: 3, lastUpdated: oldDate },
      { topicName: 'B', parentTopic: null, accuracy: 60, attempts: 3, lastUpdated: oldDate },
    ];
    TopicMastery.find.mockResolvedValue(masteries);

    const result = await generateDailyPlan('user1');

    expect(result.totalEstimatedMinutes).toBe(
      result.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
    );
    expect(result.totalEstimatedMinutes).toBeGreaterThan(0);
  });
});
