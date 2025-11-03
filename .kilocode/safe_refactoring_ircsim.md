\# Kilocode Prompt File (.kprompt)

\# Purpose: Safely edit and improve a Node.js chat simulator that uses AI-assisted message and content generation.



name: "Improve AI Chat Simulator (Node.js)"

description: >

&nbsp; Safely refine, refactor, and document a Node.js chat simulator project with AI-assisted

&nbsp; message and content generation. All edits must preserve chat flow, API contracts, 

&nbsp; and conversation logic integrity.



rules:

&nbsp; - Preserve existing behavior and chat flow logic.

&nbsp; - Maintain compatibility with current AI API integrations (e.g., OpenAI, Anthropic, etc.).

&nbsp; - Keep message sequencing, user state, and session management stable.

&nbsp; - Never remove or rename core files or endpoints unless explicitly instructed.

&nbsp; - Always ensure async/await or Promise handling is correct.

&nbsp; - Maintain consistent data structures for messages (e.g., { role, content, timestamp }).

&nbsp; - Preserve environment variable usage (process.env.\*) for API keys and configs.

&nbsp; - Do not hardcode API keys or sensitive information.

&nbsp; - Ensure edits pass linting, build, and runtime checks.

&nbsp; - Preserve error handling and logging; improve readability if possible.



style:

&nbsp; - Follow ESLint + Prettier conventions (2-space indent, semicolons, single quotes).

&nbsp; - Use modern ES syntax (import/export if ESM, require/module.exports if CommonJS).

&nbsp; - Add JSDoc comments for all functions, especially message handling and AI calls.

&nbsp; - Prefer const/let over var.

&nbsp; - Ensure consistent and descriptive variable naming (e.g., aiResponse, userMessage).

&nbsp; - Use async/await over callback patterns for all AI-related calls.



improvement\_goals:

&nbsp; - Simplify or modularize complex chat logic (e.g., state handling, conversation memory).

&nbsp; - Improve clarity of AI response handling (streaming, retries, error fallback).

&nbsp; - Remove redundant or unreachable code.

&nbsp; - Enhance documentation and inline comments.

&nbsp; - Improve performance (reduce unnecessary API calls, caching).

&nbsp; - Suggest test coverage improvements for message handlers or AI modules.
&nbsp; - Make the AI thinking window less intrusive by using a typing indicator to hide the thinking process.



ai\_integration\_guidelines:

&nbsp; - Maintain current API endpoints and configuration options.

&nbsp; - When editing AI call functions (e.g., OpenAI completions or chat endpoints):

&nbsp;   - Ensure temperature, max\_tokens, and model parameters remain configurable.

&nbsp;   - Validate that user prompts are sanitized and logged safely.

&nbsp;   - Preserve any message history or context-passing mechanisms.

&nbsp; - Do not alter business logic around message flow without clear instruction.



safety\_checks:

&nbsp; - Run `npm run lint` to verify no syntax or style issues.

&nbsp; - Run `npm test` to confirm message flow and API integration tests pass.

&nbsp; - Validate chat message schemas (especially roles and timestamps).

&nbsp; - Ensure no AI API rate limit or error-handling regressions.



examples:

&nbsp; - input: |

&nbsp;     async function getAIResponse(prompt) {

&nbsp;       const completion = await openai.createCompletion({

&nbsp;         model: 'gpt-3.5-turbo',

&nbsp;         prompt: prompt,

&nbsp;       });

&nbsp;       return completion.data.choices\[0].text;

&nbsp;     }

&nbsp;   output: |

&nbsp;     /\*\*

&nbsp;      \* Generates an AI-assisted response for a given prompt.

&nbsp;      \* @param {string} prompt - The user or system prompt.

&nbsp;      \* @returns {Promise<string>} The AI-generated text response.

&nbsp;      \*/

&nbsp;     async function getAIResponse(prompt) {

&nbsp;       const response = await openai.chat.completions.create({

&nbsp;         model: 'gpt-3.5-turbo',

&nbsp;         messages: \[{ role: 'user', content: prompt }],

&nbsp;       });

&nbsp;       return response.choices?.\[0]?.message?.content?.trim() || '';

&nbsp;     }



notes:

&nbsp; - Preserve message history structures (user/system/assistant).

&nbsp; - Be cautious with rate-limiting, token counting, and retries.

&nbsp; - Keep logging clear and consistent (especially for debugging AI behavior).

&nbsp; - Avoid introducing new dependencies unless explicitly requested.

&nbsp; - Suggest performance optimizations only if they don’t alter message logic.





