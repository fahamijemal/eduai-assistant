import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
} from 'recharts';

export default function AnalyticsPage() {
  const [mastery, setMastery] = useState([]);
  const [weakTopics, setWeakTopics] = useState(null);
  const [studyTime, setStudyTime] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [mRes, wRes, sRes, pRes] = await Promise.all([
          analyticsApi.getMastery().catch(() => null),
          analyticsApi.getWeakTopics().catch(() => null),
          analyticsApi.getStudyTime().catch(() => null),
          analyticsApi.getPerformanceTrend().catch(() => null),
        ]);
        if (mRes) setMastery(mRes.data.masteries || []);
        if (wRes) setWeakTopics(wRes.data);
        if (sRes) setStudyTime(sRes.data);
        if (pRes) setPerformance(pRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const trendIcon = (trend) => {
    if (trend === 1) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === -1) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  // Prepare radar data from mastery
  const radarData = mastery.slice(0, 8).map((m) => ({
    topic: m.topicName.length > 15 ? m.topicName.slice(0, 15) + '...' : m.topicName,
    accuracy: m.accuracy,
    confidence: Math.round(m.confidenceScore * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your learning progress and performance</p>
      </div>

      <Tabs defaultValue="mastery">
        <TabsList>
          <TabsTrigger value="mastery">
            <Target className="h-4 w-4 mr-2" />
            Mastery
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="studytime">
            <Clock className="h-4 w-4 mr-2" />
            Study Time
          </TabsTrigger>
          <TabsTrigger value="weaknesses">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Weaknesses
          </TabsTrigger>
        </TabsList>

        {/* Mastery Tab */}
        <TabsContent value="mastery">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Topic Mastery Radar</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Accuracy" dataKey="accuracy" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                      <Radar name="Confidence" dataKey="confidence" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">No mastery data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Topic List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : mastery.length > 0 ? (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {mastery.map((m) => (
                      <div key={m._id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">{m.topicName}</span>
                            {trendIcon(m.improvementTrend)}
                          </div>
                          <Progress value={m.accuracy} className="h-2" />
                        </div>
                        <span className="text-sm font-bold w-12 text-right">{m.accuracy}%</span>
                        <Badge variant="outline" className="text-xs">
                          {m.attempts} tries
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">No topics yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : performance?.quizTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performance.quizTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="avgScore" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} name="Avg Score" />
                    <Area type="monotone" dataKey="accuracy" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="Accuracy" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Take quizzes to see performance trends</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Time Tab */}
        <TabsContent value="studytime">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : studyTime?.dailyBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studyTime.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#2563eb" radius={[4, 4, 0, 0]} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No study sessions recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weaknesses Tab */}
        <TabsContent value="weaknesses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weak Topics</CardTitle>
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
                    {weakTopics.weakTopics.map((t) => (
                      <div key={t.topicName} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{t.topicName}</span>
                          <span className="text-sm font-bold text-destructive">{t.accuracy}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.reasons.join(' | ')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No weak topics detected</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weakness Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-4">
                    {weakTopics?.patterns?.frequentlyIncorrect?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Frequently Incorrect</p>
                        <div className="space-y-1">
                          {weakTopics.patterns.frequentlyIncorrect.map((item) => (
                            <div key={item.topic} className="flex justify-between text-sm">
                              <span>{item.topic}</span>
                              <Badge variant="destructive">{item.incorrectCount} errors</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {weakTopics?.patterns?.slowTopics?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Slow Response Topics</p>
                        <div className="space-y-1">
                          {weakTopics.patterns.slowTopics.map((item) => (
                            <div key={item.topic} className="flex justify-between text-sm">
                              <span>{item.topic}</span>
                              <Badge variant="warning">{Math.round(item.avgResponseTimeMs / 1000)}s avg</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {weakTopics?.patterns?.repeatedMisunderstandings?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Repeated Misunderstandings</p>
                        <div className="space-y-1">
                          {weakTopics.patterns.repeatedMisunderstandings.map((item) => (
                            <div key={item.topic} className="flex justify-between text-sm">
                              <span>{item.topic}</span>
                              <Badge variant="destructive">{item.consecutiveErrors}x streak</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!weakTopics?.patterns?.frequentlyIncorrect?.length &&
                      !weakTopics?.patterns?.slowTopics?.length &&
                      !weakTopics?.patterns?.repeatedMisunderstandings?.length && (
                        <p className="text-sm text-muted-foreground text-center py-8">No patterns detected yet</p>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
