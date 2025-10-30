import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  user_id: string;
  plan: string;
  status: string;
  has_access: boolean;
  is_trial: boolean;
  days_left: number;
  trial_end_date: string | null;
  subscription_end_date: string | null;
}

export default function Subscription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await fetch(
        'https://functions.poehali.dev/d15da108-b3f4-4dd4-8469-329cb7dd16b7?user_id=default_user'
      );
      const data = await res.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await fetch('https://functions.poehali.dev/d15da108-b3f4-4dd4-8469-329cb7dd16b7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default_user',
          action: 'activate',
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: '🎉 Подписка активирована!',
          description: 'Теперь у вас полный доступ к MindBloom Pro',
        });
        loadSubscription();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось активировать подписку',
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  };

  const proFeatures = [
    { icon: 'Sparkles', title: 'Неограниченный AI-анализ', desc: 'Получайте инсайты когда угодно' },
    { icon: 'TrendingUp', title: 'Расширенная аналитика', desc: 'Глубокий анализ закономерностей' },
    { icon: 'Brain', title: 'Библиотека контента', desc: 'Медитации, курсы, техники' },
    { icon: 'Download', title: 'Экспорт данных', desc: 'PDF и Excel отчёты' },
    { icon: 'Bell', title: 'Умные напоминания', desc: 'Персональные push-уведомления' },
    { icon: 'LineChart', title: 'История без ограничений', desc: 'Доступ ко всем записям' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={24} />
            </Button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Icon name="Crown" size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-pink-400 bg-clip-text text-transparent">
              MindBloom Pro
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">Раскройте весь потенциал вашего ментального здоровья</p>
        </header>

        {subscription && (
          <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-2 border-primary/20 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Icon name={subscription.has_access ? 'Check' : 'Clock'} size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {subscription.is_trial ? 'Пробный период' : subscription.plan === 'pro' ? 'Pro подписка' : 'Бесплатный план'}
                  </h3>
                  <p className="text-muted-foreground">
                    {subscription.has_access ? (
                      <>Осталось дней: <span className="font-bold text-primary">{subscription.days_left}</span></>
                    ) : (
                      'Доступ закончился'
                    )}
                  </p>
                </div>
              </div>
              <Badge
                className={`text-lg px-4 py-2 ${
                  subscription.has_access
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {subscription.status === 'trial' ? '🎁 Пробная версия' : subscription.status === 'active' ? '✅ Активна' : '⏰ Истекла'}
              </Badge>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-8 bg-white/60 backdrop-blur-sm border-2 border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Бесплатно</h3>
              <div className="text-4xl font-bold text-muted-foreground mb-2">0 ₽</div>
              <p className="text-sm text-muted-foreground">Базовый функционал</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Ежедневный трекинг</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Простые графики</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="X" size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">1 AI-отчёт в месяц</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="X" size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">История 30 дней</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Текущий план
            </Button>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border-4 border-primary shadow-2xl animate-scale-in relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-primary to-accent text-white text-xs">
                Популярно
              </Badge>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Icon name="Crown" size={24} className="text-primary" />
                Pro подписка
              </h3>
              <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                199 ₽
              </div>
              <p className="text-sm font-semibold text-primary">в месяц</p>
              <Badge className="mt-2 bg-green-100 text-green-800 border-green-200">
                🎁 2 дня бесплатно
              </Badge>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Всё из бесплатного</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Неограниченный AI-анализ</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Расширенная аналитика</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Библиотека контента</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Экспорт данных</span>
              </li>
            </ul>
            {subscription?.status !== 'active' && (
              <Button
                onClick={handleActivate}
                disabled={activating}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform shadow-lg"
              >
                {activating ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Активация...
                  </>
                ) : (
                  <>
                    <Icon name="Zap" size={20} className="mr-2" />
                    Начать пробный период
                  </>
                )}
              </Button>
            )}
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {proFeatures.map((feature, idx) => (
            <Card
              key={idx}
              className="p-6 bg-white/60 backdrop-blur-sm border-2 border-primary/10 hover:border-primary/30 transition-all animate-fade-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Icon name={feature.icon as any} size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            💳 Безопасная оплата через Яндекс.Кассу • ❌ Отмена в любой момент
          </p>
          <p className="text-xs text-muted-foreground">
            После окончания пробного периода с вас будет списано 199₽. Вы можете отменить подписку в любое время.
          </p>
        </div>
      </div>
    </div>
  );
}
