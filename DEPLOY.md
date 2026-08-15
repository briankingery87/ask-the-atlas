# Deploying Ask the Atlas

One static file. GitHub Pages is free, needs no build step, serves HTTPS, and republishes on every push.

Your account: **https://github.com/briankingery87**
Target URL: **https://briankingery87.github.io/ask-the-atlas/**

---

## Step 1 - check Git is installed

Open PowerShell:

```powershell
git --version
```

If that errors, install from https://git-scm.com/download/win, accept every default, close PowerShell and reopen it.

Set your identity once (use the email on your GitHub account):

```powershell
git config --global user.name "Brian Kingery"
git config --global user.email "YOUR-GITHUB-EMAIL@example.com"
```

---

## Step 2 - create the empty repo on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** `ask-the-atlas`
3. **Visibility:** Public *(required for free Pages)*
4. Leave **every** initialize checkbox unticked - no README, no .gitignore, no license. This folder already has them, and
   ticking one creates a commit you would then have to merge around.
5. **Create repository**

---

## Step 3 - push the folder

```powershell
cd "C:\Users\brian.kingery\Claude\CFB Atlas\Claude\experience\ask-the-atlas"

git init
git branch -M main
git add .
git commit -m "Ask the Atlas - initial release"
git remote add origin https://github.com/briankingery87/ask-the-atlas.git
git push -u origin main
```

The first push pops a browser window to authenticate. Sign in, approve, done.

**If it says `remote origin already exists`** (you ran this twice):

```powershell
git remote set-url origin https://github.com/briankingery87/ask-the-atlas.git
git push -u origin main
```

---

## Step 4 - turn Pages on

1. In the repo: **Settings** -> **Pages** (left sidebar)
2. **Source:** Deploy from a branch
3. **Branch:** `main`, folder `/ (root)` -> **Save**
4. Wait about a minute and refresh. The live URL appears at the top:

```
https://briankingery87.github.io/ask-the-atlas/
```

That is the single link to share. HTTPS also removes the `file://` cross-origin question entirely.

A green check next to your commit on the repo home page means the deploy finished. An orange dot means it is still building.

---

## Step 5 - point the Experience back at it

So whichever half someone lands on first can reach the other, add a link in the Experience Builder sidebar:

1. Open the CFB Atlas Experience in ExB, **Edit**
2. Add a **Button** widget to the sidebar, below the existing view buttons
3. Text: `Ask the Atlas` &nbsp;|&nbsp; Action: **Link** -> **URL** -> `https://briankingery87.github.io/ask-the-atlas/`
4. Set it to open in a **new tab**
5. Save and Publish

---

## Publishing updates

Whenever `index.html` changes:

```powershell
cd "C:\Users\brian.kingery\Claude\CFB Atlas\Claude\experience\ask-the-atlas"
git add .
git commit -m "Add the Rewind page"
git push
```

Live in under a minute.

**A data refresh never needs a push.** The page reads the services live, so your Sunday pipeline updates the data and the
published site is current on the next visitor's page load. You only push when the app's code or copy changes.

---

## Free alternatives

| Host | Cost | Setup | Notes |
|---|---|---|---|
| **GitHub Pages** | Free | Push, flip a toggle | Recommended. Version history comes with it, which matters for something that grows all season. |
| **Cloudflare Pages** | Free | Connect the same repo | Faster global CDN, deploy previews per branch, free custom domain and SSL. A drop-in upgrade later - the repo does not change. |
| **Netlify** | Free tier | Connect the repo, or drag the folder onto the dashboard | Drag-and-drop is the fastest way to a URL with no Git at all. Bandwidth cap on free. |
| **ArcGIS Online** | Covered by your licensing | Add Item -> Application | Keeps it inside the org and inherits AGOL sharing. Worse to update, harder to share outside the org. |

Switching later costs nothing - there is no server-side anything.

---

## Optional: a custom domain

If you own a domain (roughly $10-15/year):

1. Add a file named `CNAME` in the repo root containing only the domain, e.g. `atlas.briankingery.com`
2. At your registrar, add a CNAME record pointing that subdomain at `briankingery87.github.io`
3. **Settings -> Pages**, enter the domain, tick **Enforce HTTPS**

Not required. The `github.io` URL is permanent and free.

---

## Before it goes public

- **No keys are in the file.** Every service it reads is shared publicly and queried anonymously. If a layer's sharing is
  ever set back to private the page shows a load error rather than leaking anything - but check sharing before each push.
- **Team logos are ESPN CDN assets** referenced by the Teams layer and hotlinked at render time, not redistributed by the
  repo. If ESPN ever blocks hotlinking, logos degrade to color swatches and nothing breaks.
- **Nominatim has a usage policy.** Geocoding only fires when someone types in the Home Turf search box, which is well
  inside their limits at this scale. Clicking the map calls no geocoder at all.
- **County allegiance is a model estimate**, and the page says so in the footer and on the county card. Keep that sentence
  in place - it is what keeps the whole thing honest.
