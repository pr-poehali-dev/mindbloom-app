import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface Insight {
  type: string;
  title: string;
  description: string;
  impact: string;
  metric: string;
}

interface Recommendation {
  title: string;
  description: string;
  action: string;
  icon: string;
  priority: string;
}

interface Stats {
  avg_mood: number;
  avg_sleep: number;
  avg_stress: number;
  best_mood: number;
  worst_mood: number;
  total_entries: number;
  mood_trend: string;
}

export default function Analytics() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const entriesRes = await fetch(
        `https://functions.poehali.dev/767af020-3777-411a-8d74-fe45aeaedd10?user_id=default_user&days=${period}`
      );
      const entriesData = await entriesRes.json();
      setEntries(entriesData.entries || []);

      const insightsRes = await fetch(
        `https://functions.poehali.dev/c0e83f73-8b97-44e3-a661-b1e3ce8dd102?user_id=default_user&days=${period}`
      );
      const insightsData = await insightsRes.json();
      setInsights(insightsData.insights || []);
      setRecommendations(insightsData.recommendations || []);
      setStats(insightsData.stats || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = entries
    .slice(0, 30)
    .reverse()
    .map((entry) => ({
      date: new Date(entry.entry_date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
      mood: entry.mood,
      sleep: entry.sleep_hours,
      stress: entry.stress_level,
    }));

  const getImpactColor = (impact: string) => {
    return impact === 'positive' ? 'from-green-500 to-emerald-500' : 'from-orange-500 to-red-500';
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'bg-red-100 border-red-300' : 'bg-blue-100 border-blue-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Button variant="ghost" onClick={() => window.location.href = '/'}>
              <Icon name="ArrowLeft" size={24} />
            </Button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Icon name="TrendingUp" size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-pink-400 bg-clip-text text-transparent">
              Аналитика
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">Ваши закономерности и персональные рекомендации</p>
        </header>

        <div className="flex justify-center gap-2 mb-8">
          {[7, 14, 30, 90].map((days) => (
            <Button
              key={days}
              variant={period === days ? 'default' : 'outline'}
              onClick={() => setPeriod(days)}
              className={period === days ? 'bg-gradient-to-r from-primary to-accent' : ''}
            >
              {days} дней
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-8">
            <Card className="p-8">
              <Skeleton className="h-64 w-full" />
            </Card>
            <div className="grid md:grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-slide-in-up">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Heart" size={24} className="text-primary" />
                    <span className="font-semibold">Среднее настроение</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">{stats.avg_mood}/10</div>
                  <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
                    {stats.mood_trend === 'improving' ? '📈 Улучшается' : '📊 Стабильно'}
                  </Badge>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Moon" size={24} className="text-blue-600" />
                    <span className="font-semibold">Средний сон</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{stats.avg_sleep} ч</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {stats.avg_sleep >= 7 ? 'Отлично!' : 'Можно улучшить'}
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-pink-100 to-pink-50 border-2 border-pink-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Zap" size={24} className="text-pink-600" />
                    <span className="font-semibold">Средний стресс</span>
                  </div>
                  <div className="text-3xl font-bold text-pink-600">{stats.avg_stress}/10</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {stats.avg_stress <= 4 ? 'Низкий' : stats.avg_stress <= 7 ? 'Умеренный' : 'Высокий'}
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-100 to-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Calendar" size={24} className="text-green-600" />
                    <span className="font-semibold">Записей</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{stats.total_entries}</div>
                  <div className="text-sm text-muted-foreground mt-2">За {period} дней</div>
                </Card>
              </div>
            )}

            {chartData.length > 0 && (
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <Icon name="LineChart" size={28} className="text-primary" />
                  Динамика показателей
                </h3>

                <div className="h-80 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#9b87f5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '2px solid #9b87f5',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="#9b87f5"
                        strokeWidth={3}
                        fill="url(#colorMood)"
                        name="Настроение"
                      />
                      <Area
                        type="monotone"
                        dataKey="sleep"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorSleep)"
                        name="Сон"
                      />
                      <Area
                        type="monotone"
                        dataKey="stress"
                        stroke="#ec4899"
                        strokeWidth={3}
                        fill="url(#colorStress)"
                        name="Стресс"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {insights.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Icon name="Lightbulb" size={28} className="text-primary" />
                  Ваши закономерности
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {insights.map((insight, idx) => (
                    <Card
                      key={idx}
                      className={`p-6 bg-gradient-to-br ${
                        insight.impact === 'positive'
                          ? 'from-green-50 to-emerald-50 border-2 border-green-200'
                          : 'from-orange-50 to-red-50 border-2 border-orange-200'
                      } animate-scale-in`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${getImpactColor(
                            insight.impact
                          )} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon
                            name={insight.impact === 'positive' ? 'TrendingUp' : 'TrendingDown'}
                            size={24}
                            className="text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                          <p className="text-sm mb-3">{insight.description}</p>
                          <Badge
                            className={`bg-gradient-to-r ${getImpactColor(insight.impact)} text-white border-0`}
                          >
                            {insight.metric}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Icon name="Sparkles" size={28} className="text-primary" />
                  Персональные рекомендации
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.map((rec, idx) => (
                    <Card
                      key={idx}
                      className={`p-6 border-2 ${getPriorityColor(rec.priority)} animate-fade-in`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                          <Icon name={rec.icon as any} size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{rec.title}</h3>
                            {rec.priority === 'high' && (
                              <Badge className="bg-red-500 text-white text-xs">Важно</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {insights.length === 0 && recommendations.length === 0 && (
              <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
                <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Недостаточно данных</h3>
                <p className="text-muted-foreground">
                  Добавьте больше записей, чтобы получить персонализированные инсайты
                </p>
                <Button onClick={() => (window.location.href = '/')} className="mt-4">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить запись
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
