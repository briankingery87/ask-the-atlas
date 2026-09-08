# How this app is built

`index.html` is **generated**. Do not hand-edit it - the next build overwrites it.

```
src/app.template.html   the source of truth
vendor/leaflet.css      Leaflet 1.9.4, unmodified
vendor/leaflet.js       Leaflet 1.9.4, unmodified
build.py                inlines vendor/* into index.html. That is the entire build.
smoke.js                Playwright + fully mocked ArcGIS REST. No network needed.
index.html              GENERATED
publish.bat             double-click: add, commit, push to GitHub Pages
```

## The loop

```
python build.py            # writes index.html and .appcheck.js
node --check .appcheck.js  # catches any syntax error before it reaches the browser
node smoke.js              # ~40s, renders every page headless and asserts on it
publish.bat                # paste the commit message
```

`smoke.js` needs `playwright` installed and the headless shell at
`/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
It is a build-time tool only - nothing in it ships to the browser.

## Why the source lives here now

This folder once held only `index.html`. The template that generated it existed
only in a sandbox and was lost, and the next change had to reverse-engineer the
source back out of the built file. Keeping `src/`, `vendor/`, `build.py` and
`smoke.js` in the repo means that cannot happen twice. They add ~360 KB and
GitHub Pages ignores them.

## Sibling apps

| Surface | Repo | What it answers |
|---|---|---|
| The Experience | ArcGIS Experience Builder (no repo) | explore the layers |
| Ask the Atlas | this one | what is worth watching, before kickoff |
| Tux's Take | `briankingery87/tuxs-take` | what happened, after |

A completed game on The Slate links to `tuxs-take/?game=<CFBD game_id>#aftermath`,
which Tux's Take resolves to its own game drawer. That deep link is a contract
between the two repos: if it changes on one side, change it on the other.

## What the page reads

Public ArcGIS REST services, anonymously, at page load. There is no key, no
token and no server, and there never can be - the file is public by
construction. The Slate is built from **CFB_Atlas_Stats/FeatureServer/0
(Schedule)** joined to Teams and Betting Lines, not from Games This Week, so
every week of the season is addressable rather than just the one week that
service happens to hold. Completed games additionally join
**CFB_Atlas_Recaps/FeatureServer/0 and /1** for the result, the Tux grade and the
recap headline. That service is loaded in its own try/catch: if it ever stops
answering, the postgame block simply does not render and the rest of the page is
unaffected.
