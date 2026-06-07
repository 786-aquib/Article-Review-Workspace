# EasySLR Article Review Workspace

A simplified systematic literature review workspace where researchers import PubMed-style Excel exports into projects, then screen articles with include/exclude/maybe decisions inside organization-scoped workspaces.

## Setup

**Requirements:** Node.js 20+, Docker (for local PostgreSQL), npm

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start PostgreSQL:

```bash
docker compose up -d
```

4. Push the schema and seed demo data:

```bash
npm run db:push
npm run db:seed
```

5. (Optional) Generate a local sample Excel file for import testing:

```bash
npm run fixture:generate
```

You can also use the assignment's `sample_article_import.xlsx` — place it anywhere locally and upload it through the import UI.

6. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

| Email | Role | Access |
|---|---|---|
| `lead@example.com` | Org owner, project lead | All demo projects |
| `reviewer@example.com` | Reviewer | COVID Screening Review |
| `viewer@example.com` | Org member | No project access |

Default password: `password123` (override with `SEED_PASSWORD` before seeding).

## Architecture

```text
Next.js App Router (UI)
        │
        ▼
   tRPC API ── access checks (org/project membership)
        │
        ▼
 Prisma ORM ── PostgreSQL
```

- **Organizations** contain **projects**; users join orgs and are assigned to projects.
- **Articles** always belong to a single project.
- Every article query/mutation requires authenticated **project membership**.
- Excel import is split into pure parsing/validation functions plus tRPC `preview` and `commit` mutations.

Key folders:

- `prisma/` — schema and seed data
- `src/server/import/` — Excel parsing and validation
- `src/server/api/routers/` — tRPC routers
- `src/app/orgs/` — organization/project/article UI

## Review workflow

Screening uses four states:

- **Pending** — not reviewed yet (default after import)
- **Include** — passes title/abstract screening
- **Exclude** — does not meet criteria
- **Maybe** — uncertain, flagged for a second pass or discussion

This mirrors common dual-stage SLR screening while keeping decisions lightweight for an MVP. Reviewers can add free-text notes per article; status changes record reviewer and timestamp.

## Import validation

| Rule | Behavior |
|---|---|
| Missing title | Row skipped, reported in preview summary |
| Missing other PubMed fields | Imported — incomplete exports are common |
| Duplicate within upload | First row kept, later rows skipped |
| Duplicate in project | Match priority: PMID → DOI → normalized title + year |
| Invalid publication year | Stored as null, row still imported if title exists |
| Invalid create date | Stored as null |

Preview runs server-side when a file is selected; commit writes only validated rows.

## Assumptions

- Credentials-based auth with seeded users (no OAuth/email verification).
- Client-side table search/sort/filter is sufficient for demo-sized imports (< ~500 rows).
- Any project **reviewer** or **lead** can import; **viewers** are read-only.
- One Excel sheet per upload; headers matched case-insensitively to PubMed export columns.

## Tradeoffs

- **No AWS deployment in this submission** — local Docker Postgres only (see below).
- No saved filters, CSV export, or bulk row actions to stay within the timebox.
- Import preview shows summary counts and issue list, not a full row-by-row grid.
- Duplicate detection uses application logic rather than strict DB unique constraints so nullable identifiers still work.

## Deployment status

Not deployed. A production path would use:

1. **SST** to provision Next.js on AWS (Lambda or ECS) with environment secrets.
2. **Amazon RDS PostgreSQL** (or Aurora) for persistent data.
3. **Prisma migrate deploy** in CI/CD before app rollout.
4. Replace credentials auth with SSO/OAuth and managed secrets for `AUTH_SECRET`.

## Tests

```bash
npm test
```

Coverage focuses on import validation/duplicate detection and project access helpers.

## AI usage

Built with Cursor AI assistance for scaffolding, boilerplate generation, and iterative implementation. Architecture decisions, validation rules, review workflow, and README content were reviewed and adjusted manually.

## Time spent (approximate)

| Area | Hours |
|---|---|
| Scaffold + database + seed | 1.5 |
| Auth + access control | 1.5 |
| Import pipeline | 2 |
| Article table + review UI | 2 |
| Polish, README, tests | 1.5 |
| **Total** | **~8.5** |
