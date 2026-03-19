#!/usr/bin/env python3
"""Search helper — streams URLs line by line as they are found.
Usage: python search.py <max_results> <query1> ||| <query2> ...
Each line of stdout is one URL. Prints DONE when finished.
"""
import sys
import json
import threading

SKIP_DOMAINS = [
    "pagesjaunes", "canpages", "yellowpages", "yelp",
    "facebook.com", "instagram.com", "linkedin.com", "twitter.com",
    "google.com", "youtube.com", "tiktok.com",
    "a-zbusinessfinder", "shopinmontreal", "storeboard", "expat.com",
    "asdphone", "zipleaf", "canadapages", "wikipedia",
    "kijiji", "indeed", "jobillico", "glassdoor",
]

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

lock = threading.Lock()
seen = set()

def search_one(query, max_results):
    try:
        results = list(DDGS().text(query, max_results=max_results))
        for r in results:
            url = r.get("href", "")
            if not url.startswith("http"):
                continue
            parts = url.split("/")
            domain = parts[2] if len(parts) > 2 else ""
            if any(s in domain for s in SKIP_DOMAINS):
                continue
            with lock:
                if domain not in seen:
                    seen.add(domain)
                    print(url, flush=True)
    except:
        pass

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("DONE", flush=True)
        sys.exit(0)
    max_r = 50
    query_parts = args
    if args[0].isdigit():
        max_r = int(args[0])
        query_parts = args[1:]
    raw = " ".join(query_parts)
    queries = [q.strip() for q in raw.split("|||") if q.strip()]
    if not queries:
        print("DONE", flush=True)
        sys.exit(0)

    threads = []
    for q in queries:
        t = threading.Thread(target=search_one, args=(q, max_r))
        t.start()
        threads.append(t)
    for t in threads:
        t.join()
    print("DONE", flush=True)
