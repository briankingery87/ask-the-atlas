# Ask the Atlas

**The custom side of the [CFB Atlas](https://experience.arcgis.com/experience/99f6d8062d3943c08aa7728d209060ff/).**
Live at **https://briankingery87.github.io/ask-the-atlas/**
Question-first college football answers for all 666 NCAA programs - FBS, FCS, Division II and Division III -
computed live in the browser from published ArcGIS Online feature services.

One HTML file. No server, no build step, no API key, no tracking.

## The two halves

The CFB Atlas has two halves that share one data model.

| | The Experience | Ask the Atlas |
|---|---|---|
| Shape | Configurable | Custom |
| Built with | ArcGIS Experience Builder | One HTML file, vanilla JS, Leaflet |
| Model | Layer-first: pick a view, toggle layers, click a feature | Question-first: one page per question |
| Strength | Cartography, exploration, authored popups | Joins across services, distance math, ad-hoc filtering, composite indexes |
| Answers | "Show me the fan territory layer" | "Whose country do I live in" |

Neither replaces the other.

## The questions

| Page | Question | What it does |
|---|---|---|
| Home Turf | Whose country do you live in? | Search, geolocate or click a point. Returns the county's modeled allegiance and margin, a battleground flag, the fan empire it belongs to, the nearest programs across all four divisions, and the games near you this weekend. |
| Tale of the Tape | Who wins the argument? | Head-to-head on 21 metrics for any two of the 666 programs, with a five-season win-percentage sparkline, a head-to-head schedule check and both fan empires drawn. |
| The Gauntlet | How hard is the road? | Strength of schedule computed from the full 1,608-game published season - opponent ratings, ranked opponents, venue split, round-trip miles - plus a week-by-week walk of any program's season and a map of its road. |
| The Screener | Show me the teams that... | A screener over every program: cascading filters, sortable columns with hover definitions, one-click presets, and a full dossier drawer including researched narratives. |
| The Slate | What should I actually watch? | The current slate scored 0-100 on a transparent watchability index, mapped at host venues, with each card naming the components that carried its score. |
| The Experience | Where is the map app? | The configurable half, embedded full-bleed. Mounts on first visit to the tab so the landing page stays fast, with a full-screen escape hatch. |
| Under the Hood | How does it work? | Author bio, methodology for all three indexes, a live data-honesty panel, and the full service catalog with item pages and REST endpoints. |

Deep links: `#home`, `#turf`, `#tape`, `#gauntlet`, `#screener`, `#slate`, `#experience`, `#about`.

Home also carries the live poll strip and a mapped Top 25, and every poll row and bubble opens the program dossier.

## One link

This page is the front door for the whole Atlas. The Experience is embedded on its own tab rather than living at a
separate URL, so there is a single address to share, a single preview card, and one place that stays fast on first load.
The Experience iframe is not requested until someone opens that tab.

For the reverse direction, add a button in the Experience Builder sidebar pointing at this page's URL, so whichever half
someone lands on first, they can reach the other.

## Mobile

Responsive down to 390px. The nav becomes a horizontal scroller, the head-to-head duel bars restack vertically with the
metric label on top, tables scroll horizontally inside their card, and every map refits on rotate.

## Two conventions worth knowing before you edit

**Team marks always sit in a white chip** (`.lchip`). Many ESPN marks are dark navy or have transparent knockouts, so they
disappear on the navy panel and on dark team colors. Never render a bare `<img>` of a logo.

**Map symbology is a team-colored point, never a logo.** At marker scale the marks read as noise - inconsistent sizes,
padding and transparency. `vizColor()` lifts a dark team color until it clears 2.2:1 against the panel, preserving hue.

## Data

Every number is read live from public ArcGIS Online hosted feature services at page load. Nothing is baked in,
so the page stays current with the weekly refresh.

| Service | Layers used | Item |
|---|---|---|
| CFB Atlas Teams | 0 Teams | [8e69edf9](https://www.arcgis.com/home/item.html?id=8e69edf90e734165b2adb24d4437d02d) |
| CFB Atlas Territories | 0 Contested Counties, 2 Fan Territories, 3 Fan Empires | [fafa3894](https://www.arcgis.com/home/item.html?id=fafa389479614579896c2e618ee57175) |
| CFB Atlas Stats | 0 Schedule, 1 Rankings, 2 Ratings, 3 Betting Lines, 4 Calendar | [0bc5eeaf](https://www.arcgis.com/home/item.html?id=0bc5eeaf2c204d038c4a25807dfa00bd) |
| CFB Atlas Games This Week | 0 Games This Week | [d690878e](https://www.arcgis.com/home/item.html?id=d690878eb9d44537b11bf54d1ea12177) |
| CFB Atlas Recruiting | 0 Recruits | [5de80950](https://www.arcgis.com/home/item.html?id=5de80950c4eb4482a9a7360ada942c41) |
| CFB Atlas Travel | 0 Team Travel Routes | [0c27229f](https://www.arcgis.com/home/item.html?id=0c27229f7b764e27a4126022831fb4c0) |

Underlying sources: [College Football Data](https://collegefootballdata.com/) for teams, schedules, polls, ratings,
recruiting and betting lines; Esri Living Atlas county and state boundaries with population; Open-Meteo forecasts.
County allegiance is a **brand-weighted gravity model estimate, not survey data**.

### Placeholder discipline

The Atlas never writes null - it writes typed placeholders so every attribute always renders in a popup.
Anything doing math on this data has to know the whole vocabulary:

```
-1    -1.0    -999    -999.0    ""    "N/A"    "TBD"    "Pending"    "N/A - ..."
```

`has()` in `index.html` encodes exactly that. Fields that are still placeholder are reported as unavailable
and dropped from index denominators - never scored as zero.

## Publishing a change

Double-click `publish.bat` - it stages, commits and pushes, prompting for a message. Equivalent to
`git add -A; git commit -m "..."; git push`.

A **data** refresh never needs a publish; the page reads the services live.

## Running it locally

Double-click `index.html`. If your browser blocks the cross-origin requests from a `file://` page:

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

## Editing it

Everything is in `index.html`, in labelled sections:

```
0 config     service URLs, field lists, the service catalog
1 utils      placeholder vocabulary, color math, packed-field parsers
2 load       one boot sequence, all services
3 home turf  4 tape  5 screener  6 slate  6a gauntlet  6b home  7 about
8 boot       wiring
```

Leaflet 1.9.4 is inlined at the top so the file has no CDN dependency. To add a page: add a `<section class="mode">`,
add a `<button data-mode="...">` to the nav, add a builder function, call it from `boot()`.

## Credits

Built and maintained by Brian Kingery. Team marks are ESPN CDN assets referenced by the Teams layer and remain the
property of their respective institutions. Basemap tiles &copy; Esri. Geocoding by OpenStreetMap Nominatim.

Code is MIT licensed. The data belongs to its sources.
