@echo off
REM Compatibility entry point only - the real work moved to server\community-launcher.vbs
REM (silent start, no black window, auto restart) plus server\community-guard.js.
REM Prefer the desktop shortcut "Unintended Reply Community" or the button inside the app.
start "" wscript.exe "%~dp0server\community-launcher.vbs"
