# Kilocode Prompt File (.kprompt)
# Purpose: Safely edit and improve Node.js project code without breaking functionality.

name: "Improve Node.js Project"
description: >
  This prompt helps refine, refactor, and document a Node.js project safely.
  It ensures that edits maintain functionality, improve code clarity, 
  and follow best practices while preventing breaking changes.

rules:
  - Always preserve existing behavior and API contracts.
  - Maintain backward compatibility for all public functions, modules, and routes.
  - Ensure all asynchronous logic remains correct (await/async, Promises).
  - Keep imports, exports, and dependencies consistent with package.json.
  - Never remove or rename files unless explicitly instructed.
  - Always verify syntax correctness after edits.
  - Retain environment variable usage (process.env.*) as is.
  - Preserve error handling and logging behavior.

style:
  - Follow ESLint and Prettier conventions (2-space indent, semicolons, single quotes).
  - Prefer const/let over var.
  - Use descriptive variable names.
  - Add JSDoc comments for all public functions and classes.
  - Favor async/await over raw Promises or callbacks where applicable.
  - Ensure consistent module style (CommonJS or ESM) — do not mix unless specified.

improvement_goals:
  - Simplify complex functions.
  - Remove unused code or imports.
  - Improve readability and maintainability.
  - Optimize performance where safe.
  - Add missing documentation or comments.
  - Suggest unit test improvements if applicable.

safety_checks:
  - Run `npm run lint` and ensure no new errors.
  - Run `npm test` (if available) to confirm all tests pass after edits.
  - Validate that package.json dependencies remain consistent.

examples:
  - input: |
      function getUser(id) {
        return db.query('SELECT * FROM users WHERE id = ' + id);
      }
    output: |
      /**
       * Retrieves a user by ID.
       * @param {number} id - The user ID.
       * @returns {Promise<object>} The user record.
       */
      async function getUser(id) {
        return db.query('SELECT * FROM users WHERE id = ?', [id]);
      }

notes:
  - Be cautious with database and network operations.
  - Avoid refactoring build or deployment scripts unless explicitly asked.
  - Do not introduce new dependencies unless specified.

