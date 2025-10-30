import json
import os
from typing import Dict, Any, List
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from statistics import mean, stdev

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Analyze mood patterns and generate AI insights
    Args: event with httpMethod, queryStringParameters
    Returns: HTTP response with personalized insights and recommendations
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}
    user_id = params.get('user_id', 'default_user')
    days = int(params.get('days', '30'))
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT mood, sleep_hours, stress_level, activities, entry_date
                FROM mood_entries
                WHERE user_id = %s
                AND entry_date >= CURRENT_DATE - INTERVAL '%s days'
                ORDER BY entry_date DESC
            """, (user_id, days))
            
            entries = cur.fetchall()
            
            if len(entries) < 3:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'insights': [],
                        'recommendations': [],
                        'message': 'Недостаточно данных для анализа. Добавьте больше записей.'
                    }),
                    'isBase64Encoded': False
                }
            
            insights = analyze_patterns(entries)
            recommendations = generate_recommendations(insights, entries)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'insights': insights,
                    'recommendations': recommendations,
                    'stats': calculate_stats(entries)
                }),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()


def analyze_patterns(entries: List[Dict]) -> List[Dict]:
    insights = []
    
    moods = [e['mood'] for e in entries]
    sleeps = [float(e['sleep_hours']) for e in entries]
    stress = [e['stress_level'] for e in entries]
    
    good_sleep_entries = [e for e in entries if float(e['sleep_hours']) >= 8]
    poor_sleep_entries = [e for e in entries if float(e['sleep_hours']) < 6]
    
    if good_sleep_entries and poor_sleep_entries:
        good_sleep_mood = mean([e['mood'] for e in good_sleep_entries])
        poor_sleep_mood = mean([e['mood'] for e in poor_sleep_entries])
        diff = good_sleep_mood - poor_sleep_mood
        
        if diff > 0.5:
            insights.append({
                'type': 'sleep_mood_correlation',
                'title': 'Сон влияет на ваше настроение',
                'description': f'При сне 8+ часов ваше настроение в среднем на {diff:.1f} балла выше',
                'impact': 'positive',
                'metric': f'+{int((diff/10)*100)}%'
            })
    
    low_stress_entries = [e for e in entries if e['stress_level'] <= 3]
    high_stress_entries = [e for e in entries if e['stress_level'] >= 7]
    
    if low_stress_entries and high_stress_entries:
        low_stress_mood = mean([e['mood'] for e in low_stress_entries])
        high_stress_mood = mean([e['mood'] for e in high_stress_entries])
        diff = low_stress_mood - high_stress_mood
        
        if diff > 0.5:
            insights.append({
                'type': 'stress_mood_correlation',
                'title': 'Стресс снижает ваше настроение',
                'description': f'При низком стрессе (1-3) настроение на {diff:.1f} балла выше',
                'impact': 'negative',
                'metric': f'-{int((diff/10)*100)}%'
            })
    
    activity_moods = {}
    for entry in entries:
        for activity in (entry['activities'] or []):
            if activity not in activity_moods:
                activity_moods[activity] = []
            activity_moods[activity].append(entry['mood'])
    
    best_activity = None
    best_mood = 0
    for activity, mood_list in activity_moods.items():
        if len(mood_list) >= 2:
            avg_mood = mean(mood_list)
            if avg_mood > best_mood:
                best_mood = avg_mood
                best_activity = activity
    
    if best_activity and best_mood > mean(moods):
        activity_labels = {
            'walk': 'Прогулки',
            'workout': 'Тренировки',
            'yoga': 'Йога',
            'meditation': 'Медитация',
            'reading': 'Чтение'
        }
        
        insights.append({
            'type': 'activity_boost',
            'title': f'{activity_labels.get(best_activity, best_activity)} повышают настроение',
            'description': f'В дни с этой активностью ваше настроение в среднем {best_mood:.1f}/10',
            'impact': 'positive',
            'metric': f'{best_mood:.1f}/10'
        })
    
    return insights


def generate_recommendations(insights: List[Dict], entries: List[Dict]) -> List[Dict]:
    recommendations = []
    
    avg_sleep = mean([float(e['sleep_hours']) for e in entries])
    if avg_sleep < 7:
        recommendations.append({
            'title': 'Улучшите гигиену сна',
            'description': 'Ваш средний сон меньше 7 часов. Попробуйте ложиться на 30 минут раньше.',
            'action': 'sleep_improvement',
            'icon': 'Moon',
            'priority': 'high'
        })
    
    avg_stress = mean([e['stress_level'] for e in entries])
    if avg_stress > 6:
        recommendations.append({
            'title': 'Техники снижения стресса',
            'description': 'Попробуйте дыхательное упражнение 4-7-8 или короткую медитацию.',
            'action': 'stress_reduction',
            'icon': 'Wind',
            'priority': 'high'
        })
    
    activity_counts = {}
    for entry in entries:
        for activity in (entry['activities'] or []):
            activity_counts[activity] = activity_counts.get(activity, 0) + 1
    
    if activity_counts.get('walk', 0) < len(entries) * 0.3:
        recommendations.append({
            'title': 'Добавьте больше прогулок',
            'description': 'Ежедневные прогулки на свежем воздухе улучшают настроение и снижают стресс.',
            'action': 'more_walking',
            'icon': 'Footprints',
            'priority': 'medium'
        })
    
    if activity_counts.get('meditation', 0) < len(entries) * 0.2:
        recommendations.append({
            'title': 'Попробуйте медитацию',
            'description': '5-минутная утренняя медитация поможет начать день спокойно.',
            'action': 'start_meditation',
            'icon': 'Brain',
            'priority': 'medium'
        })
    
    return recommendations[:4]


def calculate_stats(entries: List[Dict]) -> Dict:
    moods = [e['mood'] for e in entries]
    sleeps = [float(e['sleep_hours']) for e in entries]
    stress = [e['stress_level'] for e in entries]
    
    return {
        'avg_mood': round(mean(moods), 1),
        'avg_sleep': round(mean(sleeps), 1),
        'avg_stress': round(mean(stress), 1),
        'best_mood': max(moods),
        'worst_mood': min(moods),
        'total_entries': len(entries),
        'mood_trend': 'improving' if len(moods) >= 3 and moods[0] > moods[-1] else 'stable'
    }