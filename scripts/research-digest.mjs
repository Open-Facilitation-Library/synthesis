#!/usr/bin/env node

// OFL Research Digest
// Queries Semantic Scholar for new papers from watchlist researchers,
// then posts a digest to Discord #research-insights.
// Keyword discovery is handled separately via Google Scholar alerts (see scholar-alerts-setup.md).
//
// Usage:
//   node scripts/research-digest.mjs              # dry run (stdout)
//   node scripts/research-digest.mjs --days 30    # custom lookback
//   DISCORD_RESEARCH_WEBHOOK_URL=... node scripts/research-digest.mjs  # post to Discord

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATCHLIST_PATH = join(__dirname, '..', 'research', 'watchlist.yaml');

const S2_BASE = 'https://api.semanticscholar.org/graph/v1';
const S2_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || '';
const DISCORD_WEBHOOK = process.env.DISCORD_RESEARCH_WEBHOOK_URL || '';
const PAPER_FIELDS = 'title,authors,venue,year,publicationDate,url,openAccessPdf';

// Parse --days argument (default: 7)
const daysArg = process.argv.indexOf('--days');
const LOOKBACK_DAYS = daysArg !== -1 ? parseInt(process.argv[daysArg + 1], 10) : 7;

function getSinceDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

const REQUEST_DELAY = S2_API_KEY ? 1100 : 3000; // 1s with key, 3s without
const MAX_RETRIES = 3;

async function s2Fetch(path, retries = 0) {
  const url = `${S2_BASE}${path}`;
  const headers = { 'Accept': 'application/json' };
  if (S2_API_KEY) headers['x-api-key'] = S2_API_KEY;

  const res = await fetch(url, { headers });
  if (res.status === 429) {
    if (retries >= MAX_RETRIES) {
      console.error(`Rate limited on ${path}, giving up after ${MAX_RETRIES} retries.`);
      if (!S2_API_KEY) console.error('Tip: Set SEMANTIC_SCHOLAR_API_KEY for a dedicated rate limit.');
      return null;
    }
    const wait = 5000 * (retries + 1);
    console.error(`Rate limited on ${path}, retry ${retries + 1}/${MAX_RETRIES} in ${wait / 1000}s...`);
    await sleep(wait);
    return s2Fetch(path, retries + 1);
  }
  if (!res.ok) {
    console.error(`S2 API error ${res.status} on ${path}`);
    return null;
  }
  return res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAuthorPapers(authorId, since) {
  const params = new URLSearchParams({
    fields: PAPER_FIELDS,
    limit: '100',
    publicationDateOrYear: `${since}:`,
  });
  const data = await s2Fetch(`/author/${authorId}/papers?${params}`);
  return data?.data || [];
}


function formatAuthors(authors, maxCount = 3) {
  if (!authors || authors.length === 0) return 'Unknown';
  const names = authors.slice(0, maxCount).map(a => a.name);
  if (authors.length > maxCount) names.push(`+${authors.length - maxCount} more`);
  return names.join(', ');
}

function formatPaper(paper, context) {
  const venue = paper.venue || paper.year || '';
  const url = paper.url || '';
  const pdfUrl = paper.openAccessPdf?.url;
  let line = `**${paper.title}**\n${formatAuthors(paper.authors)}`;
  if (venue) line += `\n${venue}`;
  if (url) line += ` · [Link](${url})`;
  if (pdfUrl) line += ` · [PDF](${pdfUrl})`;
  if (context) line += `\n*${context}*`;
  return line;
}

function buildDiscordMessage(authorPapers) {
  if (authorPapers.length === 0) return null;

  const parts = [];
  parts.push(`**OFL Research Digest** — ${authorPapers.length} new paper${authorPapers.length !== 1 ? 's' : ''} from tracked researchers (past ${LOOKBACK_DAYS} days)\n`);

  for (const { paper, researcher } of authorPapers) {
    parts.push(formatPaper(paper, `Author: ${researcher}`));
  }

  return parts.join('\n');
}

async function postToDiscord(content) {
  // Split into chunks if > 2000 chars
  const chunks = [];
  const lines = content.split('\n');
  let current = '';

  for (const line of lines) {
    if ((current + '\n' + line).length > 1900) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    const res = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'OFL Research',
        content: chunk,
      }),
    });
    if (!res.ok) {
      console.error(`Discord error: ${res.status} ${await res.text()}`);
    }
    await sleep(500); // respect Discord rate limits
  }
}

async function main() {
  const since = getSinceDate(LOOKBACK_DAYS);
  console.log(`Checking for papers since ${since} (${LOOKBACK_DAYS} days)...\n`);

  const watchlist = yaml.load(readFileSync(WATCHLIST_PATH, 'utf8'));
  const seen = new Set();

  // Collect author papers
  const authorPapers = [];
  // Support both semantic_scholar_id (string) and semantic_scholar_ids (array)
  const researchers = watchlist.researchers.filter(r => r.semantic_scholar_id || r.semantic_scholar_ids);
  console.log(`Querying ${researchers.length} researchers...`);

  for (const r of researchers) {
    const ids = r.semantic_scholar_ids || [r.semantic_scholar_id];
    for (const id of ids) {
      const papers = await fetchAuthorPapers(id, since);
      for (const paper of papers) {
        if (!paper.paperId || seen.has(paper.paperId)) continue;
        seen.add(paper.paperId);
        authorPapers.push({ paper, researcher: r.name });
      }
      await sleep(REQUEST_DELAY);
    }
  }
  console.log(`Found ${authorPapers.length} papers from tracked authors.`);

  // Build and send/print digest
  const message = buildDiscordMessage(authorPapers);

  if (!message) {
    console.log('\nNo new papers found. Skipping digest.');
    return;
  }

  console.log('\n--- Digest ---\n');
  console.log(message);

  if (DISCORD_WEBHOOK) {
    console.log('\nPosting to Discord...');
    await postToDiscord(message);
    console.log('Done.');
  } else {
    console.log('\nNo DISCORD_RESEARCH_WEBHOOK_URL set. Dry run only.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
