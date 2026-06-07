# EasySLR Article Review Workspace

EasySLR is a simplified systematic literature review workspace. It lets research teams import PubMed-style Excel exports into organization-scoped projects, then screen articles using include, exclude, maybe, and pending review decisions.

Live demo: https://article-review-workspace-s5tx.vercel.app

## Demo Login

| Email | Role | Access |
|---|---|---|
| `lead@example.com` | Org owner and project lead | Full access to demo projects |
| `reviewer@example.com` | Reviewer | Can review/import in assigned project |
| `viewer@example.com` | Org member | Read-only/no assigned project access |

Default password:

```text
password123
```

## Current Functionality

- Credentials-based login using seeded demo users.
- Organization workspace with project-level access control.
- Role-based permissions for project leads, reviewers, and viewers.
- Article table for screening imported literature records.
- Review status workflow: `PENDING`, `INCLUDE`, `EXCLUDE`, `MAYBE`.
- Reviewer notes and review metadata tracking.
- Excel import preview for PubMed-style article exports.
- Import validation for missing titles, duplicate rows, invalid dates, and invalid years.
- Duplicate detection within upload and against existing project records.
- Seed script for demo organization, projects, memberships, users, and sample articles.
- Unit tests for import validation and project access helpers.
- Production deployment on Vercel with Neon PostgreSQL.

## Deployment

The application is deployed using:

```text
Frontend/runtime: Vercel
Database: Neon PostgreSQL
ORM: Prisma
Framework: Next.js App Router
```

Production URL:

```text
https://article-review-workspace-s5tx.vercel.app
```

Required production environment variables:

```env
DATABASE_URL="Neon PostgreSQL connection string"
AUTH_SECRET="random secure secret"
SEED_PASSWORD="password123"
```

Database setup for production was completed with:

```bash
npm run db:push
npm run db:seed
```

## Why Vercel + Neon Instead Of AWS

AWS was considered for deployment, but it was not selected for this submission because AWS account setup usually requires a payment card, and the goal was to provide a working public demo without introducing billing risk or extra cloud infrastructure overhead.

Vercel + Neon was selected because it better fits this assignment:

- No card-dependent AWS setup was required for the demo path.
- Vercel has first-class support for Next.js deployments.
- Neon provides a managed PostgreSQL database with a free tier suitable for this project.
- The stack is close to a real production setup: hosted app, hosted database, environment variables, and CI-style deployment from GitHub.
- Deployment stays simple enough to review while still demonstrating cloud readiness.
- The same Prisma schema and seed workflow works locally and in production.

If this were moved to AWS later, the closest production path would be Next.js on SST/OpenNext or ECS, PostgreSQL on RDS/Aurora, secrets in AWS Secrets Manager, and schema deployment through CI/CD.

## Local Setup

Requirements:

- Node.js 20+
- npm
- Docker

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Start local PostgreSQL:

```bash
docker compose up -d
```

Push schema and seed data:

```bash
npm run db:push
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Optional fixture generation:

```bash
npm run fixture:generate
```

## Architecture

```text
Next.js App Router
        |
        v
tRPC API routers
        |
        v
Access checks and validation
        |
        v
Prisma ORM
        |
        v
PostgreSQL
```

Key folders:

| Path | Purpose |
|---|---|
| `prisma/` | Prisma schema and seed data |
| `src/app/` | Next.js App Router pages and API routes |
| `src/app/orgs/` | Organization, project, article, and import screens |
| `src/app/login/` | Credentials login UI |
| `src/components/` | Shared UI components |
| `src/server/api/routers/` | tRPC routers for organizations, projects, articles, and imports |
| `src/server/import/` | Excel parsing and row validation |
| `src/server/auth/` | NextAuth credentials configuration |
| `src/server/db.ts` | Prisma client setup |
| `fixtures/` | Sample import workbook |

## Data Model

Core entities:

| Entity | Main Fields | Purpose |
|---|---|---|
| `User` | `id`, `name`, `email`, `passwordHash` | Authenticated users and reviewers |
| `Organization` | `id`, `name`, `slug` | Top-level workspace |
| `OrganizationMember` | `userId`, `organizationId`, `role` | Organization membership and role |
| `Project` | `id`, `name`, `slug`, `organizationId` | Review project inside an organization |
| `ProjectMember` | `userId`, `projectId`, `role` | Project-level access control |
| `Article` | `title`, `pmid`, `doi`, `journal`, `publicationYear`, `reviewStatus`, `reviewNotes` | Imported literature record and review state |
| `Session`, `Account`, `VerificationToken` | NextAuth fields | Auth persistence compatibility |

Enums:

| Enum | Values |
|---|---|
| `OrgRole` | `OWNER`, `ADMIN`, `MEMBER` |
| `ProjectRole` | `LEAD`, `REVIEWER`, `VIEWER` |
| `ReviewStatus` | `PENDING`, `INCLUDE`, `EXCLUDE`, `MAYBE` |

Important keys and indexes:

- `Organization.slug` is unique.
- `Project` is unique by `organizationId + slug`.
- `OrganizationMember` is unique by `userId + organizationId`.
- `ProjectMember` is unique by `userId + projectId`.
- `Article` is indexed by `projectId`, `projectId + reviewStatus`, `projectId + pmid`, and `projectId + doi`.

## Review Workflow

Articles start as:

```text
PENDING
```

Reviewers can move them to:

```text
INCLUDE
EXCLUDE
MAYBE
```

Each status change can store reviewer notes, reviewed timestamp, and reviewer identity. This keeps the workflow lightweight while still matching the core needs of title/abstract screening.

## Import Validation

| Rule | Behavior |
|---|---|
| Missing title | Row is skipped and reported in preview |
| Missing optional PubMed fields | Row can still be imported |
| Duplicate inside upload | First matching row is kept |
| Duplicate already in project | Skipped using PMID, DOI, or normalized title + year |
| Invalid publication year | Stored as `null` |
| Invalid create date | Stored as `null` |

The import flow is split into pure parsing/validation helpers and tRPC mutations. This keeps the risky data-handling logic easier to test.

## Tests

Run:

```bash
npm test
```

Coverage focuses on:

- Import row validation.
- Duplicate detection behavior.
- Project access and role helper behavior.

Build check:

```bash
npm run build
```

## Assumptions And Tradeoffs

- Credentials auth is used for the assignment demo instead of OAuth/SSO.
- Demo users are seeded instead of supporting public registration.
- Client-side search/sort/filter is enough for demo-sized article imports.
- Any project `LEAD` or `REVIEWER` can import; `VIEWER` users are read-only.
- Import preview shows summary and issues, not a full editable staging table.
- Duplicate detection is handled in application logic because PubMed identifiers can be nullable or inconsistent.
- Neon Auth tables may exist in the database, but this app uses its own Prisma/NextAuth public schema tables.

## AI Usage

AI was used as an engineering assistant, not as a replacement for implementation ownership.

The useful parts were:

- Creating an implementation plan from the assignment requirements.
- Identifying the simplest stack that fits the project: Next.js, tRPC, Prisma, PostgreSQL, and credentials auth.
- Breaking the domain into clear entities: users, organizations, organization members, projects, project members, articles, and review status metadata.
- Reviewing what fields and keys should exist for the MVP, especially project scoping, membership constraints, article identifiers, review state, and duplicate detection.
- Suggesting a code structure that separates UI, API routers, auth, database access, import parsing, and validation logic.
- Helping compare deployment options and explain why Vercel + Neon is more practical for this submission than AWS.
- Assisting with debugging deployment issues, including Vercel serving an older successful build and Neon missing the Prisma schema.
- Improving README wording and making the submission easier to evaluate.

The decisions I kept and manually reviewed:

- Organization/project scoping as the core access boundary.
- Project-level roles instead of only organization roles.
- Credentials login for a predictable demo.
- PubMed-style Excel import as the main workflow.
- Duplicate matching order: PMID, DOI, then normalized title + year.
- Application-level duplicate handling instead of strict unique constraints on nullable identifiers.
- Neon PostgreSQL for deployed demo data and Docker PostgreSQL for local development.

The final code, schema, validation rules, deployment setup, and README were reviewed and adjusted manually to match the assignment goals.

## Time Spent

| Area | Approx. Time |
|---|---:|
| Project setup, schema, and seed data | 1.5h |
| Auth and access control | 1.5h |
| Import parsing and validation | 2h |
| Article table and review workflow | 2h |
| Tests and fixture generation | 1h |
| Deployment and README polish | 1.5h |
| **Total** | **~9.5h** |
