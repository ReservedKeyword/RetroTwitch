@echo off

title Retro Rewind Companion

:prompt_channel
set /p TWITCH_CHANNEL="Twitch Channel: "

if "%TWITCH_CHANNEL%" == "" (
    echo Twitch channel is required.
    goto prompt_channel
)

set /p JOIN_COMMAND="Join Command (e.g., !join): "

set TWITCH_CHANNEL=%TWITCH_CHANNEL%
set JOIN_COMMAND=%JOIN_COMMAND%

echo.

if "%JOIN_COMMAND%" == "" (
    echo Starting companion for #%TWITCH_CHANNEL% - all chatters will be queued
) else (
    echo Starting companion for #%TWITCH_CHANNEL% with command: %JOIN_COMMAND%
)

echo.

retro-rewind-companion.exe

pause