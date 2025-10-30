import json
import os
from typing import Dict, Any
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage user subscriptions and check access
    Args: event with httpMethod, queryStringParameters, body
    Returns: HTTP response with subscription status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, user_id, plan, status, 
                           trial_start_date, trial_end_date,
                           subscription_start_date, subscription_end_date,
                           created_at, updated_at
                    FROM subscriptions
                    WHERE user_id = %s
                """, (user_id,))
                
                subscription = cur.fetchone()
                
                if not subscription:
                    cur.execute("""
                        INSERT INTO subscriptions (user_id, plan, status, trial_start_date, trial_end_date)
                        VALUES (%s, 'free', 'trial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 days')
                        RETURNING id, user_id, plan, status, trial_start_date, trial_end_date,
                                  subscription_start_date, subscription_end_date, created_at, updated_at
                    """, (user_id,))
                    subscription = cur.fetchone()
                    conn.commit()
                
                now = datetime.now(timezone.utc)
                trial_end = subscription['trial_end_date']
                sub_end = subscription['subscription_end_date']
                
                has_access = False
                days_left = 0
                is_trial = subscription['status'] == 'trial'
                
                if is_trial and trial_end and now < trial_end:
                    has_access = True
                    days_left = (trial_end - now).days
                elif subscription['status'] == 'active' and sub_end and now < sub_end:
                    has_access = True
                    days_left = (sub_end - now).days
                
                response_data = {
                    'user_id': subscription['user_id'],
                    'plan': subscription['plan'],
                    'status': subscription['status'],
                    'has_access': has_access,
                    'is_trial': is_trial,
                    'days_left': days_left,
                    'trial_end_date': trial_end.isoformat() if trial_end else None,
                    'subscription_end_date': sub_end.isoformat() if sub_end else None
                }
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(response_data),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id', 'default_user')
            action = body.get('action', 'activate')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'activate':
                    cur.execute("""
                        UPDATE subscriptions
                        SET plan = 'pro',
                            status = 'active',
                            subscription_start_date = CURRENT_TIMESTAMP,
                            subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '30 days',
                            last_payment_date = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = %s
                        RETURNING id, user_id, plan, status, subscription_end_date
                    """, (user_id,))
                    
                    result = cur.fetchone()
                    conn.commit()
                    
                    if result:
                        result['subscription_end_date'] = result['subscription_end_date'].isoformat()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'subscription': result,
                            'message': 'Подписка успешно активирована'
                        }),
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
