#!/usr/bin/env python3

import asyncio
import aiohttp
import feedparser

async def test_rss_feed():
    feed_url = 'https://feeds.reuters.com/news/technology'
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(feed_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)
                    print(f'✅ RSS Feed Test Success: {feed.feed.title}')
                    print(f'   - Found {len(feed.entries)} entries')
                    if feed.entries:
                        print(f'   - Latest: {feed.entries[0].title[:60]}...')
                    return True
                else:
                    print(f'❌ RSS Feed Test Failed: Status {response.status}')
                    return False
    except Exception as e:
        print(f'❌ RSS Feed Test Error: {e}')
        return False

# Run the test
if __name__ == '__main__':
    result = asyncio.run(test_rss_feed())
    status = 'PASSED' if result else 'FAILED'
    print(f'RSS Feed Test: {status}')