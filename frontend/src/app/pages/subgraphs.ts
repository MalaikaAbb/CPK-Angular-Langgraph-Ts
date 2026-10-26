import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-subgraphs-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/subgraphs" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo and send <em>Help me plan a trip to San Francisco</em>.
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> the state panel on the left updates while the run streams through
          the supervisor and into the flights subgraph, and the run then pauses on the flights
          subgraph's <code>interrupt()</code>. <strong>Fail:</strong> the state panel stays
          <code>{{ '{}' }}</code> while the chat responds.
        </p>
      </ui-try-it>

      <ui-callout tone="warn" title="The interrupt picker is not implemented">
        The demo graph asks the user to choose a flight and then a hotel with
        <code>interrupt()</code>. The Angular guide does not cover rendering those interrupts and
        the demo's picker exists only as React, so nothing here answers them: the run stops at the
        first one. Everything up to that point — supervisor routing, subgraph streaming, and state
        updates — is live.
      </ui-callout>

      <ui-panel heading="Subscribing to agent state">
        <p class="mb-3 text-sm text-slate-700">
          The guide's only code. Subgraph streaming needs no agent-side setup; the frontend reads
          the agent state, and nested graphs update it as they run.
        </p>
        <ui-source path="src/app/features/subgraphs/agent-status.component.ts" />
      </ui-panel>

      <ui-panel heading="The demo graph">
        <p class="mb-3 text-sm text-slate-700">
          The travel supervisor from the guide's Code tab (the AG-UI dojo's TypeScript
          <code>subgraphs/agent.ts</code>), unchanged. Flights, hotels, and experiences are each a
          compiled <code>StateGraph</code> added as a node of the supervisor graph.
        </p>
        <ui-source path="backend/agents/subgraphs.ts" />
      </ui-panel>

      <ui-panel heading="Serving it">
        <p class="mb-3 text-sm text-slate-700">
          <code>langgraph.json</code> publishes <code>subGraphsAgentGraph</code> as the graph id
          <code>subgraphs</code>. <code>server.ts</code> registers that graph under the agent id
          <code>sample_agent</code>, the id the guide's snippet reads.
        </p>
        <ui-source path="backend/langgraph.json" />
      </ui-panel>
    </div>
  `,
})
export default class SubgraphsPage {}
