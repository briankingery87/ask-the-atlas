@echo off
rem ===========================================================
rem  Ask the Atlas - one-click publish
rem  Double-click this file. It stages, commits and pushes
rem  everything in this folder to GitHub Pages.
rem ===========================================================
title Publish Ask the Atlas
cd /d "%~dp0"

echo.
echo   ASK THE ATLAS - PUBLISH
echo   ---------------------------------------------------------
echo   Folder: %CD%
echo.

rem --- is git available? ---
git --version >nul 2>&1
if errorlevel 1 goto nogit

rem --- is this actually a repo? ---
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto norepo

rem --- anything to publish? ---
set "CHANGED="
for /f "delims=" %%i in ('git status --porcelain') do set "CHANGED=1"
if not defined CHANGED goto nochanges

echo   These files changed:
echo.
git status --short
echo.
echo   ---------------------------------------------------------
set "MSG="
set /p "MSG=  Describe this update (or press Enter to skip): "
if not defined MSG set "MSG=Content update %DATE% %TIME%"

echo.
echo   Staging...
git add -A
if errorlevel 1 goto failed

echo   Committing...
git commit -m "%MSG%"
if errorlevel 1 goto failed

echo   Pushing to GitHub...
git rev-parse --abbrev-ref --symbolic-full-name @{u} >nul 2>&1
if errorlevel 1 goto firstpush
git push
if errorlevel 1 goto failed
goto done

:firstpush
echo   (first push on this branch - setting upstream)
git push -u origin main
if errorlevel 1 goto failed
goto done

:done
echo.
echo   ---------------------------------------------------------
echo   PUBLISHED.
echo.
echo   Live in about a minute at:
echo   https://briankingery87.github.io/ask-the-atlas/
echo.
echo   A data refresh does NOT need a publish - the page reads
echo   the ArcGIS services live. Only code and wording changes
echo   need to come through here.
echo   ---------------------------------------------------------
echo.
pause
exit /b 0

:nochanges
echo   Nothing has changed since the last publish.
echo.
echo   If you expected changes, check you saved the file and that
echo   you are looking at the right folder.
echo.
pause
exit /b 0

:nogit
echo   [X] Git is not installed, or this window opened before it was.
echo.
echo   Install from https://git-scm.com/download/win  (accept every default),
echo   then close this window and double-click publish.bat again.
echo.
pause
exit /b 1

:norepo
echo   [X] This folder is not a Git repository.
echo.
echo   publish.bat has to sit inside the ask-the-atlas folder, next
echo   to index.html. See GITHUB-FIRST-PUSH.md for the initial setup.
echo.
pause
exit /b 1

:failed
echo.
echo   ---------------------------------------------------------
echo   [X] Something went wrong. The red text above says what.
echo.
echo   Most common causes:
echo     - the sign-in window was dismissed  ^-^> run it again
echo     - someone changed the repo on github.com ^-^> run:  git pull
echo.
echo   Nothing was lost. Your files are exactly as they were.
echo   ---------------------------------------------------------
echo.
pause
exit /b 1
