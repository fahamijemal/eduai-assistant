import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target,
  Clock,
  Flame,
  Brain,
  AlertTriangle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

export default function DashboardPage() {
  const { user, refreshProfile } = useAuth();
  const [readiness, setReadiness] = useState(null);
  const [weakTopics, setWeakTopics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [readinessRes, weakRes] = await Promise.all([
          analyticsApi.getExamReadiness().catch(() => null),
          analyticsApi.getWeakTopics().catch(() => null),
        ]);
        if (readinessRes) setReadiness(readinessRes.data);
        if (weakRes) setWeakTopics(weakRes.data);
        await refreshProfile();
      } catch {
        // Silent fail for dashboard
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [refreshProfile]);

  const readinessScore = readiness?.readinessScore ?? user?.readinessScore ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground mt-1">Here's your learning progress overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Exam Readiness"
          value={`${readinessScore}%`}
          loading={loading}
          color="text-primary"
        />
        <StatCard
          icon={Clock}
          label="Study Time"
          value={formatTime(user?.studyTime || 0)}
          loading={loading}
          color="text-blue-500"
        />
        <StatCard
          icon={Flame}
          label="Study Streak"
          value={`${user?.streak || 0} days`}
          loading={loading}
          color="text-orange-500"
        />
        <StatCard
          icon={Brain}
          label="AI Interactions"
          value={user?.aiInteractions || 0}
          loading={loading}
          color="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Exam Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold">{readinessScore}%</span>
                  {readiness?.passProbability != null && (
                    <Badge variant={readinessScore >= 60 ? 'success' : 'warning'}>
                      {Math.round(readiness.passProbability * 100)}% pass probability
                    </Badge>
                  )}
                </div>
                <Progress value={readinessScore} />
                {readiness?.recommendation && (
                  <p className="text-sm text-muted-foreground">{readiness.recommendation}</p>
                )}
                {readiness?.focusAreas?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {readiness.focusAreas.map((area) => (
                        <Badge key={area.topic} variant="outline">
                          {area.topic} ({area.accuracy}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {!readiness && (
                  <p className="text-sm text-muted-foreground">
                    Upload study materials and take quizzes to build your readiness score.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weak Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Weak Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : weakTopics?.weakTopics?.length > 0 ? (
              <div className="space-y-3">
                {weakTopics.weakTopics.slice(0, 5).map((topic) => (
                  <div
                    key={topic.topicName}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{topic.topicName}</p>
                      <p className="text-xs text-muted-foreground">
                        {topic.reasons.join(' | ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-destructive">
                        {topic.accuracy}%
                      </span>
                      {topic.improvementTrend === 1 && (
                        <TrendingUp className="inline ml-1 h-3 w-3 text-success" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No weak topics detected yet. Start studying to get insights!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading, color }) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg bg-secondary ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
