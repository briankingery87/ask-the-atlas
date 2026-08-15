# First push to GitHub - the hand-held version

You already made the repo at **https://github.com/briankingery87/ask-the-atlas**. It is empty, which is why the Pages
screen says it needs content. Everything below gets the files up there. It is six commands.

Do them **one at a time**. After each one, read what PowerShell prints before typing the next.

---

## Step 0 - open PowerShell in the right folder

This is the step people get wrong, so do it this way:

1. Open **File Explorer**
2. Navigate to `C:\Users\brian.kingery\Claude\CFB Atlas\Claude\experience\ask-the-atlas`
3. You should see 6 items: `index.html`, `README.md`, `DEPLOY.md`, `LICENSE`, `.gitignore`, `.nojekyll`
   *(if `.gitignore` and `.nojekyll` are hidden, that's fine - View > Show > Hidden items to see them)*
4. Click once in the **address bar** at the top so the path turns into editable text
5. Type `powershell` over it and press **Enter**

A blue PowerShell window opens, already pointing at that folder. The prompt line should end with `\ask-the-atlas>`.

**Confirm it:**

```powershell
dir
```

You should see the 6 files listed. If you do not, you are in the wrong folder - close it and redo step 0.

---

## Step 1 - is Git installed?

```powershell
git --version
```

**If you get something like `git version 2.47.0`** - good, skip to Step 2.

**If you get `The term 'git' is not recognized`** - Git is not installed:

1. Download from **https://git-scm.com/download/win** (the 64-bit Standalone Installer)
2. Run it. Click **Next** through every screen - every default is correct for you. Do not change anything.
3. **Close PowerShell completely** and redo Step 0. (PowerShell only learns about new programs when it restarts.)
4. Run `git --version` again.

---

## Step 2 - tell Git who you are

One time only, on this machine. Use the email address on your GitHub account.

```powershell
git config --global user.name "Brian Kingery"
```

```powershell
git config --global user.email "YOUR-GITHUB-EMAIL@example.com"
```

Neither prints anything. Silence means it worked.

---

## Step 3 - the six commands

Run these **one at a time**, in this order.

### 3a. Start tracking this folder

```powershell
git init
```

Expect: `Initialized empty Git repository in .../ask-the-atlas/.git/`

*What it did:* created a hidden `.git` folder. Nothing left your computer.

### 3b. Name the branch `main`

```powershell
git branch -M main
```

Expect: no output.

*What it did:* GitHub expects the main line of work to be called `main`. Older Git calls it `master`. This renames it either way.

### 3c. Stage all six files

```powershell
git add .
```

Expect: no output. (It may warn about `LF will be replaced by CRLF` - harmless, ignore it.)

*What it did:* marked all six files as "include these in the next save."

### 3d. Save the snapshot

```powershell
git commit -m "Ask the Atlas - initial release"
```

Expect: something like `[main (root-commit) a1b2c3d] Ask the Atlas - initial release` and `6 files changed`.

*What it did:* saved a snapshot locally. Still nothing on GitHub yet.

### 3e. Point at your GitHub repo

```powershell
git remote add origin https://github.com/briankingery87/ask-the-atlas.git
```

Expect: no output.

*What it did:* told Git where "up there" is.

### 3f. Upload

```powershell
git push -u origin main
```

**A window will pop up** titled something like *Connect to GitHub* or *Git Credential Manager*.

- Click **Sign in with your browser**
- Your browser opens GitHub, you sign in, click **Authorize**
- Come back to PowerShell - it continues on its own

Expect, after a few seconds:

```
Enumerating objects: 8, done.
...
To https://github.com/briankingery87/ask-the-atlas.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

**That's it. The files are on GitHub.**

---

## Step 4 - confirm

Go to **https://github.com/briankingery87/ask-the-atlas** and refresh.

You should now see the file list, and the README rendered underneath it.

---

## Step 5 - turn Pages on

Back to the screen in your screenshot: **Settings > Pages**

1. **Source:** Deploy from a branch *(already set)*
2. The **Branch** dropdown that said `None` will now offer **`main`** - pick it
3. Leave the folder dropdown on **`/ (root)`**
4. Click **Save**

Wait about a minute, then refresh the Pages screen. A green box appears at the top:

> Your site is live at **https://briankingery87.github.io/ask-the-atlas/**

Click it. That is the link you share.

*(First build can take 2-3 minutes. If you get a 404 at first, wait a minute and hard-refresh with Ctrl+Shift+R.)*

---

## If something goes wrong

| PowerShell says | What happened | Fix |
|---|---|---|
| `The term 'git' is not recognized` | Git not installed, or PowerShell was open before you installed it | Install Git, then **close and reopen** PowerShell |
| `remote origin already exists` | You ran 3e twice | `git remote set-url origin https://github.com/briankingery87/ask-the-atlas.git` then redo 3f |
| `Updates were rejected because the remote contains work that you do not have locally` | The GitHub repo was created with a README or license | `git pull origin main --allow-unrelated-histories` then redo 3f |
| `fatal: not a git repository` | You are in the wrong folder | Redo Step 0, check with `dir` |
| `Authentication failed` | Wrong account, or the browser popup got dismissed | Redo 3f - the sign-in window comes back |
| `src refspec main does not match any` | Step 3d did not actually commit | Run `git status`. If it says "nothing added to commit", redo 3c then 3d |

**Nothing here can break your local files.** Git only ever adds a hidden `.git` folder. If you want to start completely
over, delete that `.git` folder and begin again at 3a.

---

## From now on - publishing an update

Any time `index.html` changes, three commands from that same folder:

```powershell
git add .
```
```powershell
git commit -m "short note about what changed"
```
```powershell
git push
```

Live in under a minute. No `-u origin main` needed after the first time - Git remembers.

**A data refresh never needs a push.** The page reads the ArcGIS services live, so your Sunday pipeline updates the data
and the published site is current on the next visitor's page load. You only push when the app's code or wording changes.
