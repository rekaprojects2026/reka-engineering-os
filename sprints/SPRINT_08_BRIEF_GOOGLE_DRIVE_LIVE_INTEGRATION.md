# Sprint 08 Brief — Google Drive Live Integration

## Goal
Add real Google Drive integration after the rest of V2 is stable.

## Why this sprint is late
Google Drive live integration introduces OAuth, provider complexity, token handling, and file-provider behavior.
It should not come before the freelance-first operational core is mature.

## Required outcomes
- live Google OAuth flow for Drive
- Picker integration if appropriate
- file linking into the existing Files model
- safe env usage
- no secret leakage to the client

## Important
This should plug into the existing Files architecture rather than replacing it.
