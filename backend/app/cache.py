import os
import json
import hashlib
from typing import Optional, List, Dict, Any
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Global Redis client connection pool
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0
            )
            _redis_client.ping()
        except Exception as e:
            print(f"[Redis] Connection error: {e}")
            _redis_client = None
    return _redis_client


def _make_key(prefix: str, text: str) -> str:
    cleaned = text.strip().lower()
    hashed = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()[:16]
    return f"orchestra:{prefix}:{hashed}"


def get_cached_search(query: str) -> Optional[List[Dict[str, Any]]]:
    client = get_redis_client()
    if not client:
        return None

    try:
        key = _make_key("search", query)
        raw = client.get(key)
        if raw:
            return json.loads(raw)
    except Exception as e:
        print(f"[Redis] Cache read error: {e}")
    return None


def set_cached_search(query: str, results: List[Dict[str, Any]], ttl_seconds: int = 86400) -> bool:
    client = get_redis_client()
    if not client:
        return False

    try:
        key = _make_key("search", query)
        raw = json.dumps(results)
        client.setex(key, ttl_seconds, raw)
        return True
    except Exception as e:
        print(f"[Redis] Cache write error: {e}")
    return False


def get_redis_stats() -> Dict[str, Any]:
    client = get_redis_client()
    if not client:
        return {"status": "disconnected", "cached_keys": 0}

    try:
        keys = client.keys("orchestra:*")
        return {
            "status": "connected",
            "cached_keys": len(keys),
            "url": REDIS_URL
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

