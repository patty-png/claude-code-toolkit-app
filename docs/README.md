# Docs

Reference material and diagrams for the Claude Code Toolkit app.

## Contents

- **`schema.png`** — Supabase schema visualizer snapshot (10 tables + relationships). Generated from Supabase Dashboard → Database → Schema Visualizer.
- **`../ARCHITECTURE.md`** — Full stack decisions, DDL, file structure, phase plan
- **`../CLAUDE.md`** — Rules for Claude Code sessions working on this repo

## Updating the schema diagram

Whenever the database schema changes:
1. Go to Supabase → Database → Schema Visualizer
2. Click "Auto layout" to clean up positions
3. Screenshot the visualizer area
4. Save/overwrite as `docs/schema.png`
5. Commit
