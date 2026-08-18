# CopilotKit + LangGraph (TypeScript) — Angular Test Harness

A navigable, working test harness for the Angular section of the CopilotKit LangGraph documentation — each guide is a route that actually runs the thing it describes.

Tracks: **<https://docs.copilotkit.ai/angular/langgraph-typescript>**

| | |
|---|---|
| **Frontend** | Angular 22.1 · TypeScript 6.0 · Tailwind 4 · zoneless · port **4200** |
| **Runtime** | Copilot Runtime v2 Node listener · port **8200** |
| **Backend** | LangGraph.js graph on the LangGraph dev server · port **8123** |
| **CopilotKit packages** | `@copilotkit/angular` 0.3.1 · `@copilotkit/runtime` 1.67.1 |
| **AG-UI packages** | `@ag-ui/langgraph` 0.0.42 · `@ag-ui/client` 0.0.57 |
| **LangGraph packages** | `@langchain/langgraph` 1.4.9 · `@langchain/core` 1.2.6 · `@langchain/openai` 1.5.7 · `@langchain/langgraph-cli` 1.4.4 |
| **Model** | `gpt-4.1-mini` |

---

## Architecture

Three processes, not two.

```
Browser (Angular 22, zoneless)
  │  @copilotkit/angular — provideCopilotKit, <copilot-chat>, signal APIs
  │  POST http://localhost:8200/api/copilotkit
  ▼
Copilot Runtime  ·  localhost:8200        ← Node, frontend/server.ts
  │  agents: { default, support } → new LangGraphAgent({ deploymentUrl, graphId })
  │  a2ui: {}  → A2UIMiddleware
  │  POST http://localhost:8123/          ← LangGraph API, streamed
  ▼
LangGraph agent  ·  localhost:8123        ← Node, backend/main.ts
  │  new StateGraph(MessagesAnnotation) → mock_llm ⇄ tools, exported as "sample_agent"
  ▼
Model  (gpt-4.1-mini)
```

- **Why the runtime is its own process.** Unlike the React/Next quickstart — where the runtime lives inside the Next app as an API route — Angular has no server route to host it, so the Copilot Runtime runs as a standalone Node process.
- **Why the binding is `LangGraphAgent`, not `HttpAgent`.** The backend is not a single AG-UI endpoint. It is a LangGraph server, and a graph is addressed by *deployment URL plus graph id* rather than one URL. `LangGraphAgent` from `@ag-ui/langgraph` speaks the LangGraph API and translates it to AG-UI events for the browser.
- **Why two agent ids.** `default` and `support` both resolve to the same `sample_agent` graph. `default` is what CopilotKit's prebuilt components use with no configuration; `support` exists so the Chat UI and Threads guides' snippets — written as `agentId="support"` — run exactly as published. Each id gets its own `LangGraphAgent` instance, because the adapter keeps per-agent run state.
- **The model key never reaches the browser**, and never reaches the runtime either. Only the LangGraph process holds it.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ (built on 24.16.0) | `backend/langgraph.json` pins `node_version: "20"` for deployment. |
| npm | 10+ (built on 12.0.1) | Or pnpm/yarn. |
| Angular CLI | 20, 21, or 22 (built on 22.1.3) | `@copilotkit/angular` supports these three majors only. |
| OpenAI API key | — | **Required.** `backend/main.ts` uses `gpt-4.1-mini`. |
| CopilotKit license key | — | **Optional.** Only affects the Threads and Memory routes. |

`@angular/cdk` must share your Angular major version. If you hit a peer-dependency error, pin it explicitly (`@angular/cdk@^22` on Angular 22).

---

## Setup

**1. Install the agent's dependencies**

```bash
cd backend && npm install && cd ..
```

**2. Install the frontend's dependencies**

```bash
cd frontend && npm install && cd ..
```

**3. Give the agent a model key**

`backend/langgraph.json` declares `"env": ".env"`, so the LangGraph CLI loads `backend/.env` for you. Create it — the file is not in the repo:

```bash
echo 'OPENAI_API_KEY=sk-...' > backend/.env
```

### Environment variables

| Variable | Read by | What it does |
|---|---|---|
| `OPENAI_API_KEY` | agent (`backend/.env`) | **Required.** The model key. |
| `LANGGRAPH_DEPLOYMENT_URL` | runtime (`frontend/`) | Where the runtime finds the LangGraph dev server. Defaults to `http://localhost:8123`. |
| `LANGGRAPH_GRAPH_ID` | runtime (`frontend/`) | Which graph to run. Defaults to `sample_agent`, the key in `backend/langgraph.json`. |
| `PORT` | runtime (`frontend/`) | Runtime port. Defaults to `8200`. |
| `COPILOTKIT_TELEMETRY_DISABLED` | runtime (`frontend/`) | Opt out of anonymous runtime telemetry. |

> The Angular app's `runtimeUrl` is hardcoded to `http://localhost:8200/api/copilotkit` in `frontend/src/app/app.config.ts`, following the quickstart. If you change `PORT`, change that too.

---

## Running the project

Two terminals. The agent gets its own; the runtime and the Angular dev server share one.

**Terminal 1 — the LangGraph agent:**

```bash
cd backend
npm run dev
```

That runs `langgraphjs dev --port 8123`, which resolves `langgraph.json` from the current directory — so it has to run inside `backend/`. Success looks like a server on:

```
🚀 API: http://localhost:8123
```

The CLI opens LangGraph Studio in a browser tab by default. Append `-- --no-browser` to suppress it:

```bash
npm run dev -- --no-browser
```

**Terminal 2 — the runtime and the app together:**

```bash
cd frontend
npm run dev
```

`dev` runs the Copilot Runtime and `ng serve` side by side under `concurrently`, each line prefixed with the process that wrote it. Success looks like:

```
[runtime] Copilot Runtime listening at http://localhost:8200/api/copilotkit
[runtime] LangGraph agent: http://localhost:8123 (graph: sample_agent)
[angular]   ➜  Local:   http://localhost:4200/
```

Ctrl-C stops both. `--kill-others` means a crash in either takes the other down rather than leaving half a stack running — better than a chat that silently can't reach anything.

To run them separately, with independent restarts, the underlying scripts are still there:

```bash
npm run runtime   # Copilot Runtime only, :8200
npm start         # Angular dev server only, :4200
```

Open **<http://localhost:4200>**.

### Verifying the stack

The Introduction route (`/`) probes both backends and shows a live connection panel — check it first if anything misbehaves. Two green dots means both processes are up.

The one-command check the quickstart prescribes:

```bash
curl -s http://localhost:8200/api/copilotkit/info
```

It should list `default` and `support` under `agents`, with `"a2uiEnabled": true`:

```json
{"version":"1.67.1","agents":{"default":{"name":"default"},"support":{"name":"support"}},"a2uiEnabled":true}
```

And the graph itself:

```bash
curl -s http://localhost:8123/ok        # → {"ok":true}
```

### Building for production

```bash
cd frontend
npm run build                 # → dist/frontend
npm run serve:ssr:frontend    # serve the SSR build
```

`gen:sources` runs automatically as a `prestart` / `prebuild` step. It reads the harness's real implementation files off disk into `src/app/lib/generated-sources.ts`, so the code shown on a route page is byte-identical to the code that runs. Run it by hand with `npm run gen:sources` if a source panel goes stale.

---

## What to expect

Every route shows a status badge and a link to the doc page it tests. Routes with a live feature are split in two:

| | |
|---|---|
| **`<route>`** | Notes, pass/fail criteria, and the exact source of the implementation. No live chat. |
| **`<route>/demo`** | Just the running feature, no sidebar or page chrome — built for screen recording. Reached via **Open demo ↗** in the route header. |

Demo routes share the app-root provider, so a conversation started in one demo continues in another — Quickstart, Frontend tools, A2UI, and Headless all drive the `default` agent and show the *same* conversation through four different interfaces.

| Route | Doc page | Quick check |
|---|---|---|
| `/` | Introduction | Two green dots in the connection panel. |
| `/quickstart` | Quickstart | Ask *Can you tell me a joke?* — tokens stream in and render as markdown. |
| `/chat-ui` | Chat UI and customization | Four surfaces in tabs; popup and sidebar trap focus and close on Escape. |
| `/frontend-tools-generative-ui` | Frontend tools and generative UI | Ask *What's the weather in Tokyo?* — see Known issues #1 and #2. |
| `/a2ui` | A2UI schemas, styling, recovery | Inert until an `a2ui.catalog` is supplied — Known issue #3. |
| `/voice-multimodal` | Voice and multimodal input | Attachments work; transcription fails by design (no service configured). |
| `/human-in-the-loop` | Human-in-the-loop and interrupts | Ask it to delete your account with approval — see Known issue #2. |
| `/shared-state` | Shared state and agent context | Set a priority, then ask the agent what it is — see Known issue #4. |
| `/threads` · `/memory` | Threads, memory, attachments, headless | Premium. Unlicensed, the locked state / fallback message *is* the pass. |
| `/attachments` · `/headless` | Threads, memory, attachments, headless | Picker, drag-and-drop, paste; and a chat with no CopilotKit chrome. |
| `/status` | — | Every route and its status in one table. |

---

## Known issues / doc-vs-implementation discrepancies

**1. The weather tool's argument name does not match the frontend renderer.** `registerRenderToolCall({ name })` matches the agent's tool by exact string, and the frontend reads `call.args.city` (`features/tools/weather-card.component.ts`, `tools-chat.component.ts`). `backend/main.ts` declares `getWeather` with a **`location`** argument. The name matches, so the renderer mounts, but the card has no city to show. Confirmed in a live run — asking for Tokyo emits:

```json
{"name":"getWeather","arguments":"{\"location\":\"Tokyo\"}"}
```

Rename the backend argument to `city` to match the guide. Affects `/frontend-tools-generative-ui`.

**2. The backend graph does not bind frontend-declared tools.** `LangGraphAgent` forwards the browser's tools into the graph's run input (as `tools`, `ag-ui.tools`, and `copilotkit.actions`), but `backend/main.ts` uses plain `MessagesAnnotation` — which has only a `messages` channel — and its `mock_llm` node binds only its own local `tools` array. Tools that exist only in the browser are therefore never offered to the model. Affects the browser-executed tool on `/frontend-tools-generative-ui`, `requestApproval` on `/human-in-the-loop`, and the A2UI injected tool. To fix, extend the graph's state annotation to carry the forwarded tools and bind them alongside the agent's own.

**3. A2UI is inert until a catalog is supplied.** `/info` reports `a2uiEnabled: true` because the runtime middleware is on, but supplying `a2ui.catalog` in `app.config.ts` is what actually registers the `render_a2ui` renderer. The guide's catalog snippet is not self-contained, so none is set here and the route stays a reference. Affects `/a2ui`.

**4. The graph's state has no shared-state channel.** The shared-state guide's component expects `{ notes, priority }` in agent state. `backend/main.ts` compiles `StateGraph(MessagesAnnotation)`, which carries messages only, so writes from `injectAgentStore` have nowhere to land and the panel sits on its `EMPTY_STATE` defaults. Add the keys to a custom annotation to make the round trip work. Affects `/shared-state`.

**5. `SandboxFunction` is invariant in its parameter type.** `openGenerativeUI.sandboxFunctions` is typed `SandboxFunction[]`, i.e. `SandboxFunction<Record<string, unknown>>[]`, so the guide's `SandboxFunction<{ filter: string }>` is not assignable as written. `app.config.ts` casts at the array site — the same idiom the docs use for the equivalent `component` variance problem.

**6. Threads and memory need an Enterprise license.** Those endpoints come from the Enterprise Intelligence Platform, not from LangGraph. Unlicensed, the thread list stays empty and the drawer renders its locked state — that is the expected result here, not a bug.

**7. Transcription is not configured.** The microphone on `/voice-multimodal` renders and records, but this runtime registers no transcription service, so transcription fails by design.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| CLI exits with a config error | Run from the wrong directory | `langgraphjs dev` resolves `langgraph.json` from the cwd — run it inside `backend/`. |
| `langgraphjs: command not found` | Backend deps not installed | `npm install` in `backend/` — the CLI is a devDependency, not global. |
| Graph starts, first message errors | `OPENAI_API_KEY` unset | Create `backend/.env` with the key; `langgraph.json` declares `"env": ".env"` and the CLI loads it. |
| Chat sends, nothing streams back | Runtime or graph process down | Check the Introduction route's connection panel; `curl http://localhost:8200/api/copilotkit/info`. |
| `/info` returns nothing | Runtime not started | `npm run runtime` from `frontend/`. |
| `/info` lists agents but runs fail | Runtime up, LangGraph server down or on another port | `curl http://localhost:8123/ok`; set `LANGGRAPH_DEPLOYMENT_URL` if you moved it. |
| Runs fail with an unknown-graph error | Graph id mismatch | The id must equal a key in `backend/langgraph.json` — `sample_agent` by default. Override with `LANGGRAPH_GRAPH_ID`. |
| `EADDRINUSE` on 8200 | Another harness's runtime is already bound | Stop it, or start this one on a free port with `PORT=8201 npm run runtime` (and update `runtimeUrl`). |
| Tool runs but the weather card is blank | Renderer reads `city`, agent sends `location` | Known issue #1. |
| A browser-only tool is never called | Forwarded tools aren't bound in the graph | Known issue #2. |
| A run starts, then hangs forever | The agent called a browser tool with no registered handler, so no result ever returns | Every tool the agent can call needs a matching `registerFrontendTool` / `registerHumanInTheLoop` mounted. |
| Chat renders unstyled | Missing stylesheet | `@import "@copilotkit/angular/styles.css";` must be in `frontend/src/styles.css`. |
| CORS errors from the browser | Runtime CORS off | Keep `cors: true` in `createCopilotNodeListener`. |
| Connection errors mentioning `localhost` | DNS resolving to IPv6 while the server binds IPv4 | Use `127.0.0.1` in `LANGGRAPH_DEPLOYMENT_URL`. |
| Production build fails on size | CopilotKit pulls in markdown and syntax-highlighting deps | Budgets are already raised to 5 MB warning / 7 MB error in `angular.json`. |
| Peer-dependency error on install | `@angular/cdk` major mismatch | Install the matching major, e.g. `@angular/cdk@^22` on Angular 22. |
| Thread list empty, drawer shows a lock | No license key | Expected — Known issue #6. |
| Source panels say "Source not generated" | Generated map is stale | `npm run gen:sources` from `frontend/`. |

---

## Doc drift detection

`/doc-sync` keeps this repo honest about the docs it mirrors. Press **Sync docs now** (on the landing page or on `/doc-sync`) and it fetches the markdown source behind all 9 tracked doc pages, diffs each against the copy stored in `doc-snapshot/`, replaces that copy, and reports what moved — ranked by whether the change can actually break an implementation.

Doc pages are fetched by appending `.md` to their URL, which returns the authored MDX rather than the rendered HTML. Every response is checked for `text/markdown` before it is allowed near the snapshot: a URL that misses the markdown handler still answers `200` with the HTML app shell, and writing that in would destroy the baseline. A run commits all pages or none.

**Severity is decided by where the edit landed**, not how big it was:

| Level | Trigger |
|---|---|
| **High** | a changed line inside a fenced code block, a changed fence count, or a page that now 404s and is gone from the sitemap |
| **Medium** | a changed heading, changed frontmatter `title`/`description`, or prose in the same section as changed code |
| **Low** | other prose |

**Sections checked** lists every tracked page in nav order with a mark — `✓` unchanged, `!` changed, `+` stored, `✗` 404, `~` unstable, `·` not checked. Expanding a row shows the comparison: for a changed page the diff (`−` existing snapshot, `+` newly fetched), and for an unchanged one the two matching hashes, which is the evidence the check ran.

**`doc-snapshot/CHANGELOG.md`** is the record that survives a re-sync. Because syncing replaces the copy it just compared against, the run *after* a change reports nothing — so the changelog is written at the moment of discovery and never rewritten later. Only changed pages are recorded; a clean run does not touch the file. It keeps the three most recent dated entries, counted rather than aged.

**One sync date.** `syncedAt` in `doc-snapshot/manifest.json`, rewritten on every run. There is no hand-maintained date to keep in step with it.

### How it is wired on Angular

Angular has no server-action equivalent, so the boundary is plain HTTP. Everything that fetches docs or touches the snapshot lives in `frontend/src/app/lib/doc-sync/` and is imported **only** from `frontend/src/server.ts`, which exposes two endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/doc-sync` | current manifest summary + the latest report |
| `POST /api/doc-sync/run` | runs the sync, returns the result |

They sit on the SSR server rather than the Copilot Runtime because that is the Angular app's own server: `ng serve` routes through it in development (`ssr.entry` in `angular.json`) and it ships in `dist/`, so the button works in both without a second process. The browser half is `DocSyncClient`, a root-provided service holding signals — nothing in the browser bundle imports `node:fs`, which the build verifies by never resolving those modules into `dist/browser`.

**To test it**, edit any `doc-snapshot/pages/*.md` file and press the button — a line inside a code fence for High, a `##` heading for Medium, a sentence for Low. The comparison reads the stored file itself, so nothing else needs changing. Both `/doc-sync` and the changelog label the result as a local snapshot edit rather than upstream drift.

Commit `doc-snapshot/` — `pages/`, `manifest.json` and `CHANGELOG.md` are the baseline every diff is taken against. `reports/` is gitignored.

---

## Project structure

```
langgraph-ts/
├── README.md
│
├── frontend/                  # Angular 22 app + the Copilot Runtime process
│   ├── AGENTS.md              # Angular style rules this repo's own code follows
│   ├── server.ts              # ★ CopilotRuntime + LangGraphAgent binding  → :8200
│   ├── scripts/
│   │   └── generate-sources.ts  # ★ reads real files → generated-sources.ts
│   └── src/
│       ├── styles.css         # CopilotKit stylesheet + the guides' CSS verbatim
│       └── app/
│           ├── app.config.ts        # ★ provideCopilotKit, a2ui, openGenerativeUI
│           ├── app.routes.ts        # doc routes in chrome, demo routes outside it
│           ├── lib/
│           │   ├── nav-config.ts    # ★ single source of truth: routes, docs, status
│           │   └── generated-sources.ts   # GENERATED — do not edit
│           ├── components/          # harness chrome (nav, header, source, health)
│           ├── features/            # ★ the doc code that actually runs
│           │   ├── quickstart/  chat-ui/  tools/  a2ui/
│           │   └── media/  hitl/  shared-state/  threads/  memory/
│           │       attachments/  headless/
│           └── pages/               # one page per doc route + demos.ts + status
│
└── backend/                   # LangGraph.js graph on the LangGraph dev server  → :8123
    ├── langgraph.json         # ★ graphs: { sample_agent: "./main.ts:graph" }
    ├── package.json           # dev: langgraphjs dev --port 8123
    └── main.ts                # ★ StateGraph, getWeather tool, ToolNode, MemorySaver
```

The nav, every route header, the demo links, and the status table all derive from `frontend/src/app/lib/nav-config.ts`, so a route's status is stated once.

**`features/` vs everything else.** Files under `features/` are doc code, kept as published. Every deviation from a published snippet is called out in the file's header comment. Everything outside `features/` is this harness's own code and follows `frontend/AGENTS.md`.

---

## Verification status

No CI. Verified locally on Node 24.16.0:

- `npm run build` in `frontend/` ✅ (only pre-existing CommonJS bundling warnings)
- `tsc --noEmit` clean for the Angular app ✅
- `langgraphjs dev` registers the graph as `sample_agent`; `/ok` returns `{"ok":true}` ✅
- Runtime boots and reports `LangGraph agent: … (graph: sample_agent)`; `/api/copilotkit/info` lists `default` and `support` with `a2uiEnabled: true` ✅
- **Full chain, live:** a run POSTed to the runtime streamed `RUN_STARTED → STEP_STARTED(mock_llm) → TEXT_MESSAGE_* → MESSAGES_SNAPSHOT → RUN_FINISHED` with a real model reply ✅
- Known issue #1 reproduced in that run (`getWeather` called with `location`, not `city`) ✅

**Not verified:** the browser half — no Angular route was exercised in a real browser, so the per-route "quick check" column is expectation, not observation. Known issues #2, #3, and #4 are read off the source rather than reproduced.

> `threadId` must be a UUID. The LangGraph API rejects anything else with `Invalid uuid` on thread creation — relevant only if you drive the runtime with hand-written curl payloads; `@copilotkit/angular` generates conforming ids.

---

## References

**Getting Started** — [Angular + LangGraph (TypeScript) quickstart](https://docs.copilotkit.ai/angular/langgraph-typescript/quickstart)

**Guides** — [Chat UI and customization](https://docs.copilotkit.ai/angular/langgraph-typescript/guides/chat-ui) · [Frontend tools and generative UI](https://docs.copilotkit.ai/angular/langgraph-typescript/guides/frontend-tools-generative-ui) · [A2UI](https://docs.copilotkit.ai/angular/langgraph-typescript/guides/a2ui) · [Voice and multimodal](https://docs.copilotkit.ai/angular/langgraph-typescript/guides/voice-multimodal) · [Human-in-the-loop and interrupts](https://docs.copilotkit.ai/angular/langgraph-typescript/guides/human-in-the-loop) · [Shared state and agent context](https://docs.copilotkit.ai/angular/langgraph-typescript/guides/shared-state) · [Threads, memory, attachments, and headless UI](https://docs.copilotkit.ai/angular/langgraph-typescript/guides/threads-memory-attachments-headless)

**External** — [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) · [LangGraph CLI](https://langchain-ai.github.io/langgraphjs/cloud/reference/cli/) · [AG-UI protocol](https://ag-ui.com) · [Angular API reference](https://docs.copilotkit.ai/reference/angular)
