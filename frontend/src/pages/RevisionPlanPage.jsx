import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Target,
  BookOpen,
  BrainCircuit,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

const priorityConfig = {
  critical: { color: 'destructive', icon: AlertTriangle, label: 'Critical' },
  high: { color: 'warning', icon: Target, label: 'High' },
  medium: { color: 'default', icon: BookOpen, label: 'Medium' },
  low: { color: 'secondary', icon: CheckCircle, label: 'Low' },
};

export default function RevisionPlanPage() {
  const { addToast } = useToast();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getRevisionPlan();
      setPlan(res.data);
    } catch {
      addToast('Failed to load revision plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revision Plan</h1>
          <p className="text-muted-foreground mt-1">Your personalized daily study schedule</p>
        </div>
        <Button variant="outline" onClick={loadPlan} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Card */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex gap-8">
              <Skeleton className="h-16 w-32" />
              <Skeleton className="h-16 w-32" />
              <Skeleton className="h-16 w-32" />
            </div>
          ) : plan ? (
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-lg font-bold">{plan.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-50">
                  <BrainCircuit className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasks</p>
                  <p className="text-lg font-bold">{plan.tasks?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-50">
                  <Clock className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <p className="text-lg font-bold">{formatTime(plan.totalEstimatedMinutes || 0)}</p>
                </div>
              </div>
              {plan.remainingTopics > 0 && (
                <div className="flex items-center">
                  <Badge variant="outline">+{plan.remainingTopics} more topics to review</Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No plan available</p>
          )}
        </CardContent>
      </Card>

      {/* Task List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plan?.tasks?.length > 0 ? (
        <div className="space-y-4">
          {plan.tasks.map((task, i) => {
            const config = priorityConfig[task.priority] || priorityConfig.medium;
            const PriorityIcon = config.icon;
            return (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-secondary shrink-0">
                      <PriorityIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{task.topic}</h3>
                        <Badge variant={config.color}>{config.label}</Badge>
                      </div>
                      {task.parentTopic && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Parent: {task.parentTopic}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mb-3">{task.action}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimatedMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {task.accuracy}% accuracy
                        </span>
                        {task.daysSinceLastStudy != null && (
                          <span>
                            Last studied: {task.daysSinceLastStudy === 999
                              ? 'Never'
                              : `${task.daysSinceLastStudy} days ago`}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <Progress value={task.accuracy} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-16 w-16 text-success/30 mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {plan?.message || 'No revision tasks for today. Upload materials and start learning!'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
