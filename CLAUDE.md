# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Knowledge base, evaluation frameworks, and research monitoring for the [Open Facilitation Library](https://github.com/Open-Facilitation-Library). This is the cross-cutting research repo that informs all other OFL projects (workflows, skills, evals, cross-pollination).

## Structure

```
knowledge-base/          # Core concepts, glossary, methodology comparisons
evals/                   # Why-How-Who evaluation framework
research/
  watchlist.yaml         # Researchers, conferences, search terms to monitor
  watchlist-candidates.md # Unvalidated researcher candidates
  scholar-alerts-setup.md # Google Scholar alert configuration guide
scripts/
  research-digest.mjs    # Semantic Scholar API → Discord digest
.github/workflows/
  research-digest.yml    # Weekly Monday 9 AM UTC cron + manual trigger
```

## Commands

```bash
npm install                                    # Install dependencies (js-yaml)
node scripts/research-digest.mjs               # Dry run (stdout only)
node scripts/research-digest.mjs --days 30     # Custom lookback period
DISCORD_RESEARCH_WEBHOOK_URL=... node scripts/research-digest.mjs  # Post to Discord
```

## Research Digest Pipeline

`scripts/research-digest.mjs` queries the Semantic Scholar API for new papers from tracked researchers in `research/watchlist.yaml`, then posts a formatted digest to the Discord `#research-insights` channel.

Key details:
- Reads `semantic_scholar_id` (string) or `semantic_scholar_ids` (array) from each researcher entry
- Researchers without S2 IDs are skipped (tracked via Google Scholar alerts instead)
- Rate limiting: 1 req/sec with API key, 3 sec without. Retries on 429 with exponential backoff (max 3).
- Discord messages are split into <1900 char chunks to stay under the 2000 char limit
- Deduplicates papers by `paperId` across all researchers

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_RESEARCH_WEBHOOK_URL` | For posting | Discord webhook for #research-insights |
| `SEMANTIC_SCHOLAR_API_KEY` | No (recommended) | Free key from semanticscholar.org for dedicated rate limit |

Both are set as GitHub secrets on this repo for the weekly Action.

## Watchlist Format

`research/watchlist.yaml` has four sections:

- **`researchers`** — Tiered (core/methods/domain/monitor) with S2 IDs, Google Scholar links, key papers. Only researchers with `semantic_scholar_id` or `semantic_scholar_ids` are queried by the digest.
- **`conferences`** — 11 venues tracked for CFP deadlines and relevant papers
- **`search_terms`** — Google Scholar alert queries and arxiv categories
- **`seed_papers`** — Landmark papers for forward citation tracking

## Relationship to OFL

This repo is the research backbone. The watchlist tracks researchers whose work informs:
- `workflows/` — new AI facilitation platform architectures
- `skills/` — abstract facilitation patterns
- `evals/` — evaluation methodology improvements
- `cross-pollination/` — opinion exposure algorithms

The Quartz documentation site (`synthesis-quartz/`) renders content from this repo's `knowledge-base/` into a browsable wiki.
