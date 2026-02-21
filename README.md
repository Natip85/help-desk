# Help Desk

> Modern customer support, built for teams.

[![Node.js](https://img.shields.io/badge/node-%3E%3D22.13.1-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.5.2-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

A full-stack help desk platform for ticket management, contacts, email support, automations, and team collaboration. Built with Next.js, tRPC, Drizzle, and Better-Auth.

---

## Features

- **Tickets** — Multi-channel support (email, web, API) with status, priority, and filtering
- **Contacts & companies** — Centralized contact database
- **Productivity** — Canned responses, saved filters, tags, and ticket automations
- **Collaboration** — Multi-tenant organizations with role-based access and real-time updates
- **Email** — Inbound processing, file uploads, rich text replies

---

## Getting Started

**Prerequisites:** Node.js >= 22.13.1, pnpm >= 10.5.2, Docker

```bash
git clone <repository-url>
cd help-desk
pnpm install
```

Add `apps/web/.env` with your configuration. Open a [GitHub Issue](https://github.com/Natip85/help-desk/issues) for setup help.

```bash
./start-database.sh
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## License

Proprietary. All rights reserved.
