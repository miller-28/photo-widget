# GitHub Copilot Instructions - photo-widget

## Code Quality & Design Principles

All code in this project must adhere to the following principles:

### SOLID Principles
- **Single Responsibility** — each class, module, and function has one clear reason to change. UI components handle rendering and local state, services contain business logic and persistence, utilities provide pure helpers.
- **Open/Closed** — extend behavior through composition or small adapters rather than modifying existing working code.
- **Liskov Substitution** — where abstractions are used (services, adapters), implementations should be interchangeable.
- **Interface Segregation** — keep services focused; do not force consumers to depend on methods they do not use.
- **Dependency Inversion** — UI and higher-level modules depend on small service interfaces, not concrete implementation details.

### Separation of Concerns
Strict layering: **Layout/Components → Services → Utilities**. Components should avoid direct filesystem or platform APIs — use services instead.

### Code Smells & Readability
- Avoid god components, long methods, excessive branching and dead code.
- Prefer small, well-named functions and extract repeatable logic into services or utils.

### Naming Conventions For Future Work
- Classes: `CamelCase`
- Functions: `camelCase`
- Properties: `snake_case` (component and service class properties should use snake_case identifiers)
- Constants: `SCREAMING_SNAKE_CASE`

### Design Patterns
- Use Adapter pattern for platform APIs (Tauri) to isolate native calls behind a small service surface.
- Keep services singletons (`providedIn: 'root'`) for shared state like settings or cache.

### JSDoc
- Public classes and methods should have short JSDoc comments describing purpose and parameters.

---

Follow these rules when adding or refactoring code. If a change would require broad renames or breaks templates, prefer incrementally applying the rules and open a follow-up PR explaining the migration plan.
