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
 * `subagents` and `sample_agent` are the graphs from the Sub-Agents and
 * Subgraphs guides, published in backend/langgraph.json as `subagents` and
 * `subgraphs`. `subagents` is the id the Angular Showcase uses for the
 * sub-agents demo; `sample_agent` is the id the Subgraphs guide's
 * `injectAgentStore("sample_agent")` snippet reads, so here it is bound to the
 * `subgraphs` graph, not to the graph that backend/langgraph.json calls
 * `sample_agent`.
 *
 * `a2ui: {}` enables A2UIMiddleware for every registered agent, per
 * https://docs.copilotkit.ai/angular/langgraph-typescript/guides/a2ui
 */
import { createServer } from "node:http";
import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { LangGraphAgent } from "@ag-ui/langgraph";

// The LangGraph dev server binds port 8123. Start it from backend/ with:
//   npm run dev        (langgraphjs dev --port 8123)
const deploymentUrl =
  process.env["LANGGRAPH_DEPLOYMENT_URL"] ?? "http://localhost:8123";

// Graph id from backend/langgraph.json — `"sample_agent": "./main.ts:graph"`.
const graphId = process.env["LANGGRAPH_GRAPH_ID"] ?? "sample_agent";

// Create the Intelligence client with your project API key. Keep this key on the server.
const intelligence = new CopilotKitIntelligence({
  apiKey: process.env["CPK_INTELLIGENCE_API_KEY"]!,
});

async function authenticateApplicationUser(
  _request: Request,
): Promise<{ id: string; name: string } | null> {
  return { id: "local-user", name: "Local user" };
}

const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphAgent({ deploymentUrl, graphId }),
    support: new LangGraphAgent({ deploymentUrl, graphId }),
    subagents: new LangGraphAgent({ deploymentUrl, graphId: "subagents" }),
    sample_agent: new LangGraphAgent({ deploymentUrl, graphId: "subgraphs" }),
  },
  a2ui: {},
  intelligence,
  // Identify the user from a verified session or token
  identifyUser: async (request) => {
    const user = await authenticateApplicationUser(request);
    if (!user) throw new Error("Unauthorized");
    return { id: user.id, name: user.name };
  },
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
