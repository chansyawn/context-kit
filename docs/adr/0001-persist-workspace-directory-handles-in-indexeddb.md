# ADR 0001: Persist Workspace Directory Handles In IndexedDB

## Status

Accepted

## Context

tagskills needs to remember user-added skills directories across reloads. A workspace stores app metadata and points to one local skills root directory. Browsers do not expose stable absolute local paths to web apps, and `FileSystemDirectoryHandle` values cannot be stored in `localStorage`.

## Decision

Persist workspace metadata and the associated `FileSystemDirectoryHandle` in IndexedDB.

## Consequences

- The app can restore workspace records after refresh without a backend.
- The app must request or re-request permissions on the saved directory handle before scanning.
- Workspace records remain Chromium-focused because persisted File System Access API handles are required.
- Deleting a workspace removes only the IndexedDB record and never deletes local files.
