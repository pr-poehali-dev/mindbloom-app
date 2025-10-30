import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage mood diary entries (CRUD operations)
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with mood entries data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_id = params.get('user_id', 'default_user')
            days = int(params.get('days', '30'))
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, entry_date, mood, sleep_hours, stress_level, 
                           activities, notes, created_at
                    FROM mood_entries
                    WHERE user_id = %s
                    AND entry_date >= CURRENT_DATE - INTERVAL '%s days'
                    ORDER BY entry_date DESC
                """, (user_id, days))
                
                entries = cur.fetchall()
                
                for entry in entries:
                    entry['entry_date'] = entry['entry_date'].isoformat()
                    entry['created_at'] = entry['created_at'].isoformat()
                    entry['sleep_hours'] = float(entry['sleep_hours'])
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'entries': entries}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id', 'default_user')
            entry_date = body.get('entry_date', datetime.now().date().isoformat())
            mood = body['mood']
            sleep_hours = body['sleep_hours']
            stress_level = body['stress_level']
            activities = body.get('activities', [])
            notes = body.get('notes', '')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO mood_entries 
                    (user_id, entry_date, mood, sleep_hours, stress_level, activities, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, entry_date) 
                    DO UPDATE SET 
                        mood = EXCLUDED.mood,
                        sleep_hours = EXCLUDED.sleep_hours,
                        stress_level = EXCLUDED.stress_level,
                        activities = EXCLUDED.activities,
                        notes = EXCLUDED.notes,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id, entry_date, mood, sleep_hours, stress_level, 
                              activities, notes, created_at
                """, (user_id, entry_date, mood, sleep_hours, stress_level, activities, notes))
                
                entry = cur.fetchone()
                conn.commit()
                
                entry['entry_date'] = entry['entry_date'].isoformat()
                entry['created_at'] = entry['created_at'].isoformat()
                entry['sleep_hours'] = float(entry['sleep_hours'])
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'entry': entry}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()