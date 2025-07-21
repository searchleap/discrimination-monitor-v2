#!/usr/bin/env python3
import psycopg2
from datetime import datetime

# Database connection
conn_string = "postgresql://neondb_owner:npg_3mZAvXP2Rcfy@ep-jolly-bonus-aejxsh9w-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    
    # Test connection and get basic info
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"✅ Connected to database: {version[0]}")
    
    # Check if tables exist
    cursor.execute("""
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print(f"\n📋 Tables in database: {len(tables)}")
    for table in tables:
        print(f"   - {table[0]}")
    
    # Check if we have any feeds
    cursor.execute('SELECT COUNT(*) FROM "Feed"')
    feed_count = cursor.fetchone()[0]
    print(f"\n📊 Current feeds in database: {feed_count}")
    
    if feed_count == 0:
        print("🔄 Database is ready for seeding")
    else:
        print("✅ Database already has feeds")
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error connecting to database: {e}")
    import traceback
    traceback.print_exc()