#!/usr/bin/env python3
"""Builds the faeryu music site: index.html, one page per release, sitemap.

Edit the data below, then run:  python3 build.py
"""
import html, json, os, shutil

# Set this once the domain is bought, e.g. "https://faeryu.com" (no trailing slash).
SITE = os.environ.get("FAERYU_SITE", "")

BAND = "faeryu"
SPOTIFY = "https://open.spotify.com/artist/0CSeLBbTNaKl7g7Xl2Ztml"
BIO = ("faeryu is an electronic duo that experiments with unsettling, dissonant tones "
       "and raw soundscapes. their goal is to take the listener to deeper and stranger "
       "corners of the mind.")
GENRES = ["dream pop", "shoegaze", "dark ambient", "witch house", "electronic"]

# Other places to find the band. Add links here when you have them.
INSTAGRAM = "https://www.instagram.com/faeryumusic/"
YOUTUBE = "https://www.youtube.com/@faeryumusic"
EMAIL = "faeryumusic@gmail.com"
LINKS = [
    ("instagram", INSTAGRAM),
    ("youtube", YOUTUBE),
    ("spotify", SPOTIFY),
    # ("apple music", "https://music.apple.com/..."),
    # ("youtube", "https://youtube.com/@..."),
    # ("instagram", "https://instagram.com/..."),
    # ("bandcamp", "https://faeryu.bandcamp.com"),
]

# Newest first. "unbodied" is left out on purpose.
RELEASES = [
    dict(slug="solace", title="solace", kind="single", date="2026-10-03",
         album="6XX43Hi5WwEy8lXO7Uglct", tracks=[("solace", 215, "46k9gJY7CsJWa1XdB6iyAQ")]),
    dict(slug="kudzu", title="kudzu", kind="single", date="2025-09-29",
         album="1zVtzG33DnvJ4Hhi3q6bN3", tracks=[("kudzu", 152, "6bUBfCNGmL95GBDfRNqv1V")]),
    dict(slug="corruption", title="corruption", kind="single", date="2025-08-29",
         album="7pJp8OEGbuXQ4Jx3BkujNP", tracks=[("corruption", 213, "4vR4iRWsq1e1hpVgkKb09m")]),
    dict(slug="quietus", title="quietus", kind="single", date="2025-07-13",
         album="21DG8g0xBZIBpsP6SyIQRx", tracks=[("quietus", 159, "0OBJSXZ0CziPVqQSLWSM9B")]),
    dict(slug="dissolution", title="dissolution", kind="single", date="2025-04-25",
         album="3ASYQKAbFKs9e2AX5CGnyK", tracks=[("dissolution", 249, "3peXNPjPyKXQSpc0Ac7byH")]),
    dict(slug="the-greys", title="the greys", kind="single", date="2025-03-07",
         album="0iPWVWrjkwi1yW4xMaW5y3", tracks=[("the greys", 150, "4mrU31N3ijc96YHqqbgUwq")]),
    dict(slug="bare-bones", title="bare bones", kind="EP", date="2023-10-13",
         album="1jTNMFzCTIkLzx5XXTi9oz", tracks=[
             ("rapture", 166, "5sAYtA9l9eadQQRrggHgxL"),
             ("empty", 266, "7Fph7Nq1mu1OZVL9PtaJqH"),
             ("so far away", 207, "1D2FEd8Ih5Utkjzfd3mjm0"),
             ("abstain", 272, "1iehpaKxiv081hfKkKeJHs"),
             ("yearn", 178, "3caRpFOf1RVvPmjjwKIwUI")]),
    dict(slug="empty", title="empty", kind="single", date="2023-09-22",
         album="3Fu4mfK1Qa8ihoxLjC9amq", tracks=[("empty", 266, "3jl5y630geFGyyzDdNRme9")]),
    dict(slug="weathered", title="weathered", kind="single", date="2020-06-05",
         album="1Ykcvm7dyrG5ke7Ra6pRnt", tracks=[("weathered", 300, "36KsZKGmYQWgKYDHgK4B7k")]),
]

# YouTube videos: (id, title, label, date). First one is featured big.
VIDEOS = [
    ("hYPpXPxU5Lc", "dreamwalker", "", "2025-05-15"),
    ("1QL9TjzdS_0", "bare bones", "full audiovisual ep", "2023-10-13"),
    ("Q8xz-kBPHQU", "deserter", "", "2022-11-25"),
    ("SVuJBa2CDJs", "abstain", "", "2024-10-25"),
    ("4_ptRgHbTuY", "heathen", "", "2023-12-22"),
    ("GC-t83oLFkc", "thousand pines", "", "2024-03-15"),
    ("x8CkCrMcikY", "corruption", "lyric video", "2025-10-15"),
    ("cykCc7JRu-4", "weathered", "lyric video", "2026-11-05"),
    ("veF1KyvY9z0", "yearn", "", "2024-11-01"),
]

# Photos in img/photos (name, alt text, wide?). Each has name.jpg and name-sm.jpg.
PHOTOS = [
    ("live-attic-1", "faeryu performing live in a candlelit attic", True),
    ("fog-moss", "faeryu in moss cloaks among foggy pines", False),
    ("rain-lake", "faeryu at the edge of a misty lake", True),
    ("fog-veil", "faeryu under a sheer veil in the fog", False),
    ("live-attic-2", "faeryu singing live, red dress and fur coat", True),
    ("fog-arch", "faeryu sitting beneath a vine archway in the fog", False),
    ("rain-duo", "faeryu in a dark, rainy forest", True),
    ("fog-forest", "faeryu standing in a misty forest", False),
    ("live-attic-3", "faeryu live in the attic", True),
]

MONTHS = ["january", "february", "march", "april", "may", "june", "july",
          "august", "september", "october", "november", "december"]

e = html.escape


def spiral_path(turns=4.2, r=10, cx=12, cy=12, steps=120):
    import math
    pts = []
    for i in range(steps + 1):
        t = i / steps
        a = t * turns * 2 * math.pi
        rr = r * t
        pts.append(f"{cx + rr * math.cos(a):.2f} {cy + rr * math.sin(a):.2f}")
    return "M" + " L".join(pts)


SPIRAL = spiral_path()


def spiral_svg(cls="spiral"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">'
            f'<path d="{SPIRAL}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>')


def logo_svg():
    with open("img/logo.svg") as f:
        svg = f.read().strip()
    return svg.replace('<svg role="img" aria-label="faeryu"', '<svg class="logo" aria-hidden="true" focusable="false"', 1)


def nice_date(d):
    y, m, day = d.split("-")
    return f"{MONTHS[int(m) - 1]} {int(day)}, {y}"


def mmss(s):
    return f"{s // 60}:{s % 60:02d}"


def iso_dur(s):
    return f"PT{s // 60}M{s % 60}S"


def abs_url(path):
    return (SITE + path) if SITE else path


ICON = {
    "instagram": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>',
    "youtube": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.2 9.2v5.6l4.8-2.8z" fill="currentColor"/></svg>',
    "mail": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 7.5l8 5.5 8-5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    "spotify": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 9.4c3.4-1 7.2-.7 10.2 1M7.6 12.5c2.8-.8 5.9-.5 8.4.9M8.2 15.4c2.2-.6 4.5-.4 6.5.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
}


def topbar(root, home):
    left = "" if home else f'<a class="home" href="{root}">{spiral_svg()}<span>faeryu</span></a>'
    return f"""<nav class="topbar" aria-label="faeryu elsewhere">
  <div class="tb-left">{left}</div>
  <div class="tb-right">
    <a class="social" href="{INSTAGRAM}" target="_blank" rel="me noopener">{ICON['instagram']}<span class="handle">@faeryumusic</span><span class="sr"> on instagram</span></a>
    <a class="social" href="{YOUTUBE}" target="_blank" rel="me noopener">{ICON['youtube']}<span class="sr">faeryu on youtube</span></a>
    <a class="social" href="{SPOTIFY}" target="_blank" rel="me noopener">{ICON['spotify']}<span class="sr">faeryu on spotify</span></a>
  </div>
</nav>
"""


def head(title, desc, path, image, ld, root, home=False):
    canon = f'<link rel="canonical" href="{SITE}{path}">' if SITE else ""
    og_img = abs_url("/" + image)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{canon}
<meta name="theme-color" content="#070908">
<meta property="og:type" content="music.musician">
<meta property="og:site_name" content="faeryu music">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{e(og_img)}">
{f'<meta property="og:url" content="{SITE}{path}">' if SITE else ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{root}img/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/style.css">
{'<script>if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("grow")</script>' if home else ''}
{'<link rel="preload" as="image" href="img/logo-grow.png">' if home else ''}
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body class="{'page-home' if home else 'page-release'}">
<canvas id="fog" aria-hidden="true"></canvas>
<div class="grain" aria-hidden="true"></div>
{topbar(root, home)}"""


def foot(root):
    year = "2026"
    links = " · ".join(f'<a href="{e(u)}" rel="me noopener" target="_blank">{e(n)}</a>' for n, u in LINKS)
    return f"""<footer class="foot">
  <p>{links}</p>
  <p class="small">© {year} faeryu</p>
</footer>
<script src="{root}assets/roots.js" defer></script>
<script src="{root}assets/fog.js" defer></script>
<script src="{root}assets/site.js" defer></script>
<script src="{root}assets/logo-grow.js" defer></script>
</body>
</html>
"""


def player(album_id, label):
    # Spotify player loads only when tapped: keeps the page fast.
    return (f'<button class="player" data-album="{album_id}" aria-label="play {e(label)} here">'
            f'<span class="play-dot">{spiral_svg()}</span><span>play here</span></button>')


def video_button(vid, title, sub, big=False):
    # A thumbnail that turns into the YouTube player only when tapped.
    return (f'<button class="video{" big" if big else ""}" data-yt="{vid}" aria-label="play {e(title)} video">'
            f'<img src="img/videos/{vid}.jpg" alt="{e(title)} by faeryu, video" loading="lazy" decoding="async" width="960" height="540">'
            f'<span class="v-shade"></span><span class="v-play">{spiral_svg()}</span>'
            f'<span class="v-text"><span class="v-title">{e(title)}</span><span class="v-sub">{e(sub)}</span></span></button>')


def band_ld():
    ld = {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        "name": BAND,
        "alternateName": ["faeryu music", "Faeryu"],
        "description": BIO,
        "genre": GENRES,
        "image": abs_url("/img/faeryu.jpg"),
        "email": EMAIL,
        "sameAs": [u for _, u in LINKS],
        "subjectOf": [{
            "@type": "VideoObject",
            "name": f"faeryu - {t}" + (f" ({lab})" if lab else ""),
            "description": f"{t} by faeryu" + (f", {lab}" if lab else "") + ".",
            "thumbnailUrl": abs_url(f"/img/videos/{vid}.jpg"),
            "uploadDate": d,
            "embedUrl": f"https://www.youtube.com/embed/{vid}",
            "url": f"https://www.youtube.com/watch?v={vid}",
        } for vid, t, lab, d in VIDEOS],
        "album": [{
            "@type": "MusicAlbum",
            "name": r["title"],
            "datePublished": r["date"],
            "albumReleaseType": "EPRelease" if r["kind"] == "EP" else "SingleRelease",
            "url": abs_url(f"/music/{r['slug']}/"),
        } for r in RELEASES],
    }
    if SITE:
        ld["url"] = SITE + "/"
    return ld


def build_home():
    latest = RELEASES[0]
    cards = []
    for r in RELEASES:
        cards.append(f"""<li class="card">
  <a href="music/{r['slug']}/" class="card-link">
    <img src="img/{r['slug']}.jpg" alt="{e(r['title'])} cover art" loading="lazy" width="320" height="320">
    <span class="card-title">{e(r['title'])}</span>
    <span class="card-meta">{e(r['kind'].lower())} · {r['date'][:4]}</span>
  </a>
</li>""")
    genres = ", ".join(GENRES[:-1]) + ", and " + GENRES[-1]
    vibe = ", ".join(GENRES[:3]) + ", and " + GENRES[3]
    feat = VIDEOS[0]
    vids = []
    for vid, t, lab, d in VIDEOS[1:]:
        vids.append(f"""<li>{video_button(vid, t, lab or d[:4])}</li>""")
    photos = []
    for i, (name, alt, wide) in enumerate(PHOTOS):
        photos.append(f"""<li class="ph{' wide' if wide else ''}"><button class="ph-btn" data-i="{i}" data-full="img/photos/{name}.jpg" aria-label="view photo: {e(alt)}"><img src="img/photos/{name}-sm.jpg" alt="{e(alt)}" loading="lazy" decoding="async"></button></li>""")
    body = f"""<main>
<header class="hero">
  <h1 class="wordmark"><span class="sr">faeryu</span><span class="logo-wrap" data-map="img/logo-grow.png">{logo_svg()}</span></h1>
  <nav class="hero-links">
    <a class="btn" href="{SPOTIFY}" target="_blank" rel="me noopener">listen</a>
    <a class="btn ghost" href="#watch">watch</a>
  </nav>
</header>

<section id="about" class="about" aria-labelledby="about-h">
  <img src="img/faeryu.jpg" alt="faeryu" width="400" height="400" loading="lazy" class="about-img">
  <div>
    <h2 id="about-h" class="section-h">{spiral_svg()}about</h2>
    <p>{e(BIO)}</p>
    <p class="small">for fans of {e(vibe)}.</p>
  </div>
</section>

<section id="watch" aria-labelledby="watch-h">
  <h2 id="watch-h" class="section-h">{spiral_svg()}watch</h2>
  <div class="feature">{video_button(feat[0], feat[1], feat[2] or feat[3][:4], big=True)}</div>
  <ul class="vgrid">
{chr(10).join(vids)}
  </ul>
  <p class="more"><a class="btn ghost" href="{YOUTUBE}" target="_blank" rel="me noopener">{ICON['youtube']}more on youtube</a></p>
</section>

<section id="photos" aria-labelledby="photos-h">
  <h2 id="photos-h" class="section-h">{spiral_svg()}photos</h2>
  <ul class="gallery">
{chr(10).join(photos)}
  </ul>
</section>

<section class="latest" aria-labelledby="latest-h">
  <img src="img/{latest['slug']}.jpg" alt="{e(latest['title'])} cover art" width="480" height="480" class="latest-art" loading="lazy">
  <div>
    <p class="eyebrow">newest</p>
    <h2 id="latest-h"><a href="music/{latest['slug']}/">{e(latest['title'])}</a></h2>
    <p class="card-meta">{e(latest['kind'].lower())} · out {nice_date(latest['date'])}</p>
    {player(latest['album'], latest['title'])}
  </div>
</section>

<section id="music" aria-labelledby="music-h">
  <h2 id="music-h" class="section-h">{spiral_svg()}music</h2>
  <ul class="grid">
{chr(10).join(cards)}
  </ul>
</section>

<section id="contact" class="contact" aria-labelledby="contact-h">
  <h2 id="contact-h" class="section-h">{spiral_svg()}contact</h2>
  <p class="contact-note">booking, press, and everything else</p>
  <a class="email" href="mailto:{EMAIL}">{ICON['mail']}<span>{EMAIL}</span></a>
</section>
</main>

<dialog class="lightbox" aria-label="photo viewer">
  <img alt="">
  <button class="lb-close" aria-label="close">×</button>
  <button class="lb-prev" aria-label="previous photo">‹</button>
  <button class="lb-next" aria-label="next photo">›</button>
</dialog>
"""
    title = "faeryu · official site · faeryu music"
    desc = (f"faeryu is an electronic duo making {genres}. "
            f"listen to solace, corruption, the greys, and every faeryu release, and watch dreamwalker.")
    out = head(title, desc, "/", "img/faeryu.jpg", band_ld(), "", home=True) + body + foot("")
    with open("index.html", "w") as f:
        f.write(out)


def build_release(r, i):
    root = "../../"
    path = f"/music/{r['slug']}/"
    total = sum(t[1] for t in r["tracks"])
    track_rows = "\n".join(
        f'<li><span class="tn">{n:02d}</span><a href="https://open.spotify.com/track/{tid}" target="_blank" rel="noopener">{e(t)}</a><span class="td">{mmss(d)}</span></li>'
        for n, (t, d, tid) in enumerate(r["tracks"], 1))
    newer = RELEASES[i - 1] if i > 0 else None
    older = RELEASES[i + 1] if i + 1 < len(RELEASES) else None
    nav = '<nav class="pager">'
    nav += f'<a href="{root}music/{newer["slug"]}/">← {e(newer["title"])}</a>' if newer else "<span></span>"
    nav += f'<a href="{root}music/{older["slug"]}/">{e(older["title"])} →</a>' if older else "<span></span>"
    nav += "</nav>"
    kind = r["kind"].lower()
    if r["kind"] == "EP":
        ld = {"@context": "https://schema.org", "@type": "MusicAlbum", "name": r["title"],
              "albumReleaseType": "EPRelease", "numTracks": len(r["tracks"]),
              "track": [{"@type": "MusicRecording", "name": t, "duration": iso_dur(d),
                         "url": f"https://open.spotify.com/track/{tid}"} for t, d, tid in r["tracks"]]}
    else:
        t, d, tid = r["tracks"][0]
        ld = {"@context": "https://schema.org", "@type": "MusicRecording", "name": t,
              "duration": iso_dur(d), "inAlbum": {"@type": "MusicAlbum", "name": r["title"],
                                                  "albumReleaseType": "SingleRelease"}}
    ld.update({"byArtist": {"@type": "MusicGroup", "name": BAND, "url": abs_url("/")},
               "datePublished": r["date"], "image": abs_url(f"/img/{r['slug']}.jpg"),
               "url": abs_url(path), "genre": GENRES,
               "sameAs": [f"https://open.spotify.com/album/{r['album']}"]})
    body = f"""<main class="release">
<article class="rel">
  <img src="{root}img/{r['slug']}.jpg" alt="{e(r['title'])} by faeryu, cover art" width="640" height="640" class="rel-art">
  <div class="rel-info">
    <p class="eyebrow">faeryu · {e(kind)}</p>
    <h1>{e(r['title'])}</h1>
    <p class="card-meta">released {nice_date(r['date'])} · {len(r['tracks'])} {'song' if len(r['tracks']) == 1 else 'songs'} · {mmss(total)}</p>
    <ol class="tracks">
{track_rows}
    </ol>
    <div class="rel-actions">
      {player(r['album'], r['title'])}
      <a class="btn ghost" href="https://open.spotify.com/album/{r['album']}" target="_blank" rel="noopener">open in spotify</a>
    </div>
  </div>
</article>
{nav}
</main>
"""
    title = f"{r['title']} · faeryu ({kind}, {r['date'][:4]})"
    desc = (f"listen to {r['title']}, a {kind} by faeryu released {nice_date(r['date'])}. "
            f"electronic {', '.join(GENRES[:3])}.")
    os.makedirs(f"music/{r['slug']}", exist_ok=True)
    with open(f"music/{r['slug']}/index.html", "w") as f:
        f.write(head(title, desc, path, f"img/{r['slug']}.jpg", ld, root) + body + foot(root))


def build_extras():
    with open("404.html", "w") as f:
        f.write(head("lost in the fog · faeryu", "this page drifted away.", "/404.html",
                     "img/faeryu.jpg", {"@context": "https://schema.org", "@type": "WebPage"}, SITE + "/")
                + f'<main class="lost"><h1>lost in the fog</h1><p><a class="btn" href="{SITE}/">back to faeryu</a></p></main>'
                + foot(SITE + "/"))
    robots = "User-agent: *\nAllow: /\n"
    if SITE:
        robots += f"\nSitemap: {SITE}/sitemap.xml\n"
        urls = [("/", RELEASES[0]["date"])] + [(f"/music/{r['slug']}/", r["date"]) for r in RELEASES]
        xml = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        xml += [f"  <url><loc>{SITE}{u}</loc><lastmod>{d}</lastmod></url>" for u, d in urls]
        xml.append("</urlset>")
        with open("sitemap.xml", "w") as f:
            f.write("\n".join(xml) + "\n")
        host = SITE.split("://", 1)[1]
        if "github.io" not in host:  # own domain: tell GitHub Pages about it
            with open("CNAME", "w") as f:
                f.write(host + "\n")
        elif os.path.exists("CNAME"):
            os.remove("CNAME")
    with open("robots.txt", "w") as f:
        f.write(robots)


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    if os.path.isdir("music"):
        shutil.rmtree("music")
    build_home()
    for i, r in enumerate(RELEASES):
        build_release(r, i)
    build_extras()
    print(f"built {1 + len(RELEASES)} pages" + (f" for {SITE}" if SITE else " (no domain set yet)"))
