/**
 * Copilot Runtime for this harness.
 *
 * Shape comes from the Angular quickstart's Node runtime server
 * (https://docs.copilotkit.ai/angular/langgraph-typescript/quickstart), with the agent
 * bound to the LangGraph backend in `../backend` — the Angular/LangGraph
 * quickstart defers the backend step to "register this backend as the
 * `default` agent".
 *
 * That backend is a graph, not an HTTP server: the compiled `StateGraph` in
 * backend/main.ts is exported as `graph`, and backend/langgraph.json publishes
 * it under the graph id `sample_agent`. Serving it is the dev server's job, so
 * the binding here is `LangGraphAgent` from `@ag-ui/langgraph` — the LangGraph
 * adapter, which speaks the graph protocol (state, tool calls, interrupts) and
 * translates it to AG-UI events for the runtime.
 *
 * `default` and `support` resolve to the same LangGraph graph. `support`
 * exists so the doc snippets that use `agentId="support"` (Chat UI, Threads)
 * run verbatim.
 *
 * `a2ui: {}` enables A2UIMiddleware for every registered agent, per
 * https://docs.copilotkit.ai/angular/langgraph-typescript/guides/a2ui
 */
import { createServer } from "node:http";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { LangGraphAgent } from "@ag-ui/langgraph";

// The LangGraph dev server binds port 8123. Start it from backend/ with:
//   npm run dev        (langgraphjs dev --port 8123)
const deploymentUrl =
  process.env["LANGGRAPH_DEPLOYMENT_URL"] ?? "http://localhost:8123";

// Graph id from backend/langgraph.json — `"sample_agent": "./main.ts:graph"`.
const graphId = process.env["LANGGRAPH_GRAPH_ID"] ?? "sample_agent";

const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphAgent({ deploymentUrl, graphId }),
    support: new LangGraphAgent({ deploymentUrl, graphId }),
  },
  a2ui: {},
});

const port = Number(process.env["PORT"] ?? 8200);

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
  console.log(`LangGraph agent: ${deploymentUrl} (graph: ${graphId})`);
});
