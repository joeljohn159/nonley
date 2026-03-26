# Contributing to Nonley

Thank you for your interest in contributing to Nonley. This guide will help you get set up and familiar with our workflow.

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- Redis

### Getting Started

```bash
# Clone the repository
git clone https://github.com/nonley/nonley.git
cd nonley

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# Start all apps in development mode
pnpm dev
```

## Branch Naming

Use the following prefixes for branch names:

| Prefix     | Purpose                      |
| ---------- | ---------------------------- |
| `feature/` | New features or enhancements |
| `fix/`     | Bug fixes                    |
| `docs/`    | Documentation changes        |

Examples:

- `feature/ephemeral-chat-ttl`
- `fix/socket-reconnect-loop`
- `docs/update-api-reference`

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must use one of the following prefixes:

| Prefix     | Purpose                                    |
| ---------- | ------------------------------------------ |
| `feat`     | A new feature                              |
| `fix`      | A bug fix                                  |
| `docs`     | Documentation changes                      |
| `chore`    | Maintenance tasks (deps, config, CI)       |
| `test`     | Adding or updating tests                   |
| `refactor` | Code restructuring without behavior change |

Format:

```
<type>(<optional scope>): <short description>

<optional body>
```

Examples:

```
feat(presence-engine): add 3-ring presence model
fix(extension): resolve shadow DOM style leak
docs: update quick start instructions
chore: upgrade Socket.io to v4.8
test(presence-client): add reconnection tests
refactor(web): extract profile card into shared UI
```

## Pull Request Process

1. **Create a branch** from `main` using the naming conventions above.
2. **Make your changes.** Keep pull requests focused -- one feature or fix per PR.
3. **Run checks locally** before submitting:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```
4. **Submit a pull request** against `main`. Fill in the PR template with a clear description of what changed and why.
5. **Address review feedback.** A maintainer will review your PR and may request changes.

## Code Style

- **TypeScript strict mode** is enabled everywhere. Do not use `any`.
- **Tailwind CSS** for all styling. Use the `nonley-*` color tokens.
- **React components** must use function declarations, not arrow functions.
- **Import order**: builtins, external packages, internal packages, parent modules, sibling modules, index.
- **Type-only exports**: Use `export type` when exporting types that are not used as values.
- **No raw SQL.** All database queries go through Prisma.

## Testing Expectations

- Write tests for all new features and bug fixes.
- Unit tests live alongside the source files or in a `__tests__` directory.
- End-to-end tests live in the `e2e/` directory at the root.
- Run `pnpm test` for unit tests and `pnpm test:e2e` for end-to-end tests.

## Questions

If you have questions or need help, open a [GitHub Discussion](https://github.com/nonley/nonley/discussions) or reach out to the maintainers.
