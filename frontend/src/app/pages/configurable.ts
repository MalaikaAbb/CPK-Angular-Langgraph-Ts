import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, DocSample, Panel } from '../components/ui';

@Component({
  selector: 'app-configurable-page',
  imports: [RouteHeader, Panel, Callout, DocSample],
  template: `
    <app-route-header path="/configurable" />

    <div class="space-y-6">
      <ui-callout title="Reference only">
        The guide's backend snippets take a verified tenant id from an authentication step, but
        neither it nor the Authentication guide shows where that happens, and this harness has no
        auth. Both language tabs are shown as published rather than wired with an invented tenant
        id.
      </ui-callout>

      <ui-panel heading="Choose the right channel">
        <table class="w-full text-left text-sm text-slate-700">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="py-2 pr-4 font-semibold">Value</th>
              <th class="py-2 font-semibold">Supported channel</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-slate-100">
              <td class="py-2 pr-4">UI preferences the model should see</td>
              <td class="py-2">
                Publish them with the frontend's agent-context API —
                <code>connectAgentContext</code> in Angular, as on the Shared state route.
              </td>
            </tr>
            <tr class="border-b border-slate-100">
              <td class="py-2 pr-4">Authentication and authorization</td>
              <td class="py-2">
                An <code>Authorization</code> header, validated for every request.
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Graph execution settings</td>
              <td class="py-2">The trusted backend that invokes or serves the graph.</td>
            </tr>
          </tbody>
        </table>
      </ui-panel>

      <ui-callout tone="warn" title="Do not send credentials as run properties">
        Browser-supplied <code>forwardedProps.config</code> may be merged into LangGraph's
        <code>RunnableConfig</code>, but it stays untrusted. Never use it for credentials, tenant
        identity, authorization, or server execution controls.
      </ui-callout>

      <ui-panel heading="Trusted graph execution settings — Python tab">
        <p class="mb-3 text-sm text-slate-700">
          For a self-hosted AG-UI endpoint, construct a request-local
          <code>LangGraphAGUIAgent</code> with backend-owned configuration:
        </p>
        <ui-doc-sample caption="Configurable guide — main.py" language="python" [code]="buildAgent" />
        <p class="mt-4 mb-3 text-sm text-slate-700">
          A node then reads the validated value from the configuration the server supplied:
        </p>
        <ui-doc-sample caption="Configurable guide — reading the config" language="python" [code]="agentNode" />
      </ui-panel>

      <ui-panel heading="Trusted graph execution settings — TypeScript tab">
        <p class="mb-3 text-sm text-slate-700">
          Set runtime context and execution controls where your trusted backend invokes the graph.
          <code>recursionLimit</code> is a top-level execution setting; application values belong
          in <code>context</code>:
        </p>
        <ui-doc-sample caption="Configurable guide — agent.ts" [code]="graphInvoke" />
      </ui-panel>

      <ui-panel heading="What not to do">
        <ul class="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Do not put raw credentials in model-visible context or graph state.</li>
          <li>Do not persist credentials merely to make them available on later turns.</li>
          <li>Do not trust a value merely because an adapter placed it in <code>RunnableConfig</code>.</li>
          <li>
            Do not let a browser choose recursion limits, callbacks, metadata, or other server
            execution controls.
          </li>
          <li>Do not reuse request-scoped identity between runs. Validate every request.</li>
        </ul>
      </ui-panel>
    </div>
  `,
})
export default class ConfigurablePage {
  protected readonly graphInvoke = `const result = await graph.invoke(input, {
  context: { tenantId: verifiedTenantId },
  recursionLimit: 50,
});`;

  protected readonly buildAgent = `from copilotkit import LangGraphAGUIAgent

def build_agent(tenant_id: str) -> LangGraphAGUIAgent:
    return LangGraphAGUIAgent(
        name="sample_agent",
        description="Tenant-scoped agent",
        graph=graph,
        config={
            "configurable": {"tenant_id": tenant_id},
            "recursion_limit": 50,
        },
    )`;

  protected readonly agentNode = `from langchain_core.runnables import RunnableConfig

async def agent_node(state: AgentState, config: RunnableConfig):
    tenant_id = config["configurable"]["tenant_id"]
    return state`;
}
