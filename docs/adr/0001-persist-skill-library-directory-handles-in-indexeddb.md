# ADR 0001: Persist Skill Library Directory Handles In IndexedDB

## Status

Accepted

## Context

ContextKit needs to remember user-added skills directories across reloads. A skill library stores app metadata and points to one local skills root directory. Browsers do not expose stable absolute local paths to web apps, and `FileSystemDirectoryHandle` values cannot be stored in `localStorage`.

## Decision

Persist skill library metadata and the associated `FileSystemDirectoryHandle` in IndexedDB.

## Consequences

- The app can restore skill library records after refresh without a backend.
- The app must request or re-request permissions on the saved directory handle before scanning.
- Skill library records remain Chromium-focused because persisted File System Access API handles are required.
- Deleting a skill library removes only the IndexedDB record and never deletes local files.
