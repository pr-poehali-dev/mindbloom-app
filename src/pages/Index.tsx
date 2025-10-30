import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const moodEmojis = ['😢', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳'];

const activities = [
  { id: 'walk', label: 'Прогулка', icon: 'Footprints' },
  { id: 'workout', label: 'Тренировка', icon: 'Dumbbell' },
  { id: 'yoga', label: 'Йога', icon: 'Flower2' },
  { id: 'meditation', label: 'Медитация', icon: 'Brain' },
  { id: 'reading', label: 'Чтение', icon: 'BookOpen' },
  { id: 'none', label: 'Не было', icon: 'X' },
];

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mood, setMood] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(5);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const res = await fetch(
        'https://functions.poehali.dev/767af020-3777-411a-8d74-fe45aeaedd10?user_id=default_user&days=7'
      );
      const data = await res.json();
      setEntries(data.entries || []);
      if (data.entries && data.entries.length > 0) {
        setLatestEntry(data.entries[0]);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('https://functions.poehali.dev/767af020-3777-411a-8d74-fe45aeaedd10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default_user',
          mood,
          sleep_hours: sleep,
          stress_level: stress,
          activities: selectedActivities,
          notes,
        }),
      });
      const data = await res.json();
      toast({
        title: 'Запись сохранена!',
        description: 'Ваши данные успешно добавлены в дневник',
      });
      setShowForm(false);
      loadEntries();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить запись',
        variant: 'destructive',
      });
    }
  };

  const chartData = entries
    .slice(0, 7)
    .reverse()
    .map((entry) => ({
      date: new Date(entry.entry_date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
      mood: entry.mood,
      sleep: entry.sleep_hours,
      stress: entry.stress_level,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Icon name="Sparkles" size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-pink-400 bg-clip-text text-transparent">
              MindBloom
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">Ваш умный дневник настроения</p>
        </header>

        {!showForm ? (
          <div className="space-y-8 animate-slide-in-up">
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2">Как вы себя чувствуете сегодня?</h2>
                  <p className="text-muted-foreground">Отследите своё настроение и найдите закономерности</p>
                </div>
                <Button
                  onClick={() => navigate('/analytics')}
                  variant="outline"
                  size="lg"
                  className="mr-2"
                >
                  <Icon name="TrendingUp" size={20} className="mr-2" />
                  Аналитика
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform shadow-lg"
                >
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить запись
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Heart" size={24} className="text-primary" />
                    <span className="font-semibold text-lg">Настроение</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">{latestEntry?.mood || 7}/10</div>
                  <div className="text-2xl mt-2">{moodEmojis[(latestEntry?.mood || 7) - 1]}</div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Moon" size={24} className="text-blue-600" />
                    <span className="font-semibold text-lg">Сон</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{latestEntry?.sleep_hours || 7} ч</div>
                  <div className="text-sm text-muted-foreground mt-2">{(latestEntry?.sleep_hours || 7) >= 7 ? 'Хорошо' : 'Можно лучше'}</div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-50 border border-pink-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Zap" size={24} className="text-pink-600" />
                    <span className="font-semibold text-lg">Стресс</span>
                  </div>
                  <div className="text-3xl font-bold text-pink-600">{latestEntry?.stress_level || 5}/10</div>
                  <div className="text-sm text-muted-foreground mt-2">{(latestEntry?.stress_level || 5) <= 4 ? 'Низкий' : 'Умеренный'}</div>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Icon name="TrendingUp" size={28} className="text-primary" />
                Динамика за неделю
              </h3>
              
              <div className="h-80 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#9b87f5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
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
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
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

              <div className="flex items-center justify-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium">Настроение</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">Сон</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                  <span className="text-sm font-medium">Стресс</span>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                  <Icon name="Lightbulb" size={24} className="text-green-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-green-900">Ваши закономерности</h3>
                  <p className="text-green-800 mb-3">
                    Когда вы спали 8+ часов, ваше настроение в среднем было на <span className="font-bold">1.5 балла выше</span>. 
                    Попробуйте ложиться на 30 минут раньше.
                  </p>
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    +15% улучшение настроения
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-primary/20 shadow-xl animate-scale-in max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Запись за сегодня</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <Icon name="X" size={24} />
              </Button>
            </div>

            <div className="space-y-8">
              <div>
                <Label className="text-lg font-semibold mb-4 block">Настроение</Label>
                <div className="flex items-center gap-4 mb-4">
                  {moodEmojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMood(idx + 1)}
                      className={`text-4xl transition-all hover:scale-125 ${
                        mood === idx + 1 ? 'scale-125' : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <Slider
                  value={[mood]}
                  onValueChange={(val) => setMood(val[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-4"
                />
                <div className="text-center mt-2 text-2xl font-bold text-primary">{mood}/10</div>
              </div>

              <div>
                <Label className="text-lg font-semibold mb-4 block flex items-center gap-2">
                  <Icon name="Moon" size={20} />
                  Сон (часов)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div>
                <Label className="text-lg font-semibold mb-4 block flex items-center gap-2">
                  <Icon name="Zap" size={20} />
                  Уровень стресса
                </Label>
                <Slider
                  value={[stress]}
                  onValueChange={(val) => setStress(val[0])}
                  min={1}
                  max={10}
                  step={1}
                />
                <div className="text-center mt-2 text-lg font-semibold text-pink-600">{stress}/10</div>
              </div>

              <div>
                <Label className="text-lg font-semibold mb-4 block">Активность</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activities.map((activity) => (
                    <Button
                      key={activity.id}
                      variant={selectedActivities.includes(activity.id) ? 'default' : 'outline'}
                      className={`h-auto py-4 flex flex-col gap-2 transition-all ${
                        selectedActivities.includes(activity.id)
                          ? 'bg-gradient-to-br from-primary to-accent scale-105 shadow-lg'
                          : 'hover:scale-105'
                      }`}
                      onClick={() => toggleActivity(activity.id)}
                    >
                      <Icon name={activity.icon as any} size={24} />
                      <span className="text-sm">{activity.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg font-semibold mb-4 block flex items-center gap-2">
                  <Icon name="FileText" size={20} />
                  Заметки (опционально)
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Что важного произошло сегодня?"
                  className="min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform shadow-lg text-lg py-6"
              >
                <Icon name="Check" size={24} className="mr-2" />
                Сохранить запись
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}