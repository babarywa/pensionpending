# PensionPending.com

  Canada's public sector job board — exclusively featuring roles with **defined benefit pension plans**.

  ## About

  PensionPending.com aggregates job postings from Canadian public sector employers across municipalities, provinces, police services, school boards, and health authorities. Every listing comes with pension plan identification (OMERS, RREGOP, Municipal Pension Plan BC, LAPP, and more).

  ## Tech Stack

  - **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
  - **Backend**: Express 5 + Drizzle ORM + PostgreSQL  
  - **Auth**: Clerk
  - **ETL**: Custom scraper targeting Job Bank Canada + municipal ATS systems
  - **Monorepo**: pnpm workspaces

  ## Getting Started

  ```bash
  pnpm install
  pnpm --filter @workspace/api-server run dev
  pnpm --filter @workspace/pension-jobs run dev
  ```

  ## ETL Scraper

  ```bash
  # Dry run (no DB writes)
  pnpm --filter @workspace/scripts run scrape:dry

  # Live run
  pnpm --filter @workspace/scripts run scrape -- --source="Job Bank"
  ```

  ## Pension Plans Covered

  OMERS, RREGOP, Municipal Pension Plan (BC), LAPP (Alberta), PEPP (Saskatchewan), OPSEU, AMAPCEO, HOOPP, and provincial plans for NS, NB, MB, NL, PEI.

  ## License

  MIT
  