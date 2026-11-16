#!/usr/bin/env python3
"""Pulls the latest @faeryumusic posts from a Behold JSON feed, saves small
copies of the pictures in img/ig/, and writes data/instagram.json for build.py.

Runs once a day from .github/workflows/instagram.yml (one feed request a day,
far below Behold's free monthly limit). Safe to run by hand too.
"""
import json, os, sys, urllib.request

# Paste the Behold JSON feed link here (looks like https://feeds.behold.so/abc123...).
FEED = os.environ.get("BEHOLD_FEED", "")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "img", "ig")
DATA = os.path.join(ROOT, "data", "instagram.json")
UA = {"User-Agent": "faeryu-site-builder"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


def main():
    if not FEED:
        print("no feed link set; skipping")
        return
    try:
        feed = json.loads(get(FEED))
    except Exception as err:  # keep yesterday's grid if the feed is down
        print("feed unavailable, keeping the old grid:", err)
        return
    os.makedirs(IMG_DIR, exist_ok=True)
    posts, keep = [], set()
    for p in feed.get("posts", [])[:6]:
        size = (p.get("sizes") or {}).get("medium") or {}
        src = size.get("mediaUrl")
        if not src or not p.get("permalink"):
            continue
        name = "".join(c for c in str(p["id"]) if c.isalnum()) + ".webp"
        path = os.path.join(IMG_DIR, name)
        if not os.path.exists(path):
            try:
                data = get(src)
            except Exception as err:
                print("skipping a post, picture failed:", err)
                continue
            with open(path, "wb") as f:
                f.write(data)
        keep.add(name)
        alt = (p.get("altText") or p.get("prunedCaption") or "").strip().replace("\n", " ")
        if len(alt) > 140:
            alt = alt[:137].rsplit(" ", 1)[0] + "..."
        posts.append({
            "permalink": p["permalink"],
            "img": "img/ig/" + name,
            "w": size.get("width", 700), "h": size.get("height", 700),
            "alt": alt,
            "video": p.get("mediaType") == "VIDEO",
            "date": p.get("timestamp", ""),
        })
    if not posts:
        print("feed had no usable posts; keeping the old grid")
        return
    for old in os.listdir(IMG_DIR):  # drop pictures that rolled off the feed
        if old not in keep:
            os.remove(os.path.join(IMG_DIR, old))
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    with open(DATA, "w") as f:
        json.dump({"posts": posts}, f, indent=1)
    print(f"saved {len(posts)} posts")


if __name__ == "__main__":
    sys.exit(main())
