import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-subagents-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/subagents" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo and send
          <em
            >Produce a short blog post about the benefits of cold exposure training. Research
            first, then write, then critique.</em
          >
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> a Researcher, Writer, and Critic card appears in the transcript as
          each sub-agent runs, and the delegation log on the left grows to 3 entries, each carrying
          that sub-agent's output. <strong>Fail:</strong> the cards render but the log stays empty
          — the tools are not writing the <code>delegations</code> slot of shared state.
        </p>
      </ui-try-it>

      <ui-panel heading="Supervisor and sub-agents as tools">
        <p class="mb-3 text-sm text-slate-700">
          The guide's module. The supervisor's state extends
          <code>CopilotKitStateAnnotation</code>; each delegation tool returns a
          <code>Command</code> that appends one entry to <code>delegations</code> and feeds the
          result back as a <code>ToolMessage</code>.
        </p>
        <ui-source path="backend/agents/subagents.ts" />
      </ui-panel>

      <ui-panel heading="Serving the supervisor">
        <p class="mb-3 text-sm text-slate-700">
          <code>langgraph.json</code> publishes the module's <code>graph</code> export as the graph
          id <code>subagents</code>, and <code>server.ts</code> registers it under the agent id
          <code>subagents</code>.
        </p>
        <ui-source path="backend/langgraph.json" />
      </ui-panel>

      <ui-panel heading="Rendering a live delegation log">
        <ui-source path="src/app/features/subagents/subagents-chat.component.ts" />
      </ui-panel>

      <ui-panel heading="Reading the delegations slot">
        <ui-source path="src/app/features/subagents/subagent-model.ts" />
      </ui-panel>

      <ui-panel heading="One renderer per sub-agent tool">
        <ui-source path="src/app/features/subagents/subagent-renderer-config.ts" />
      </ui-panel>

      <ui-panel heading="Transcript card and delegation log">
        <ui-source path="src/app/features/subagents/subagent-cards.ts" />
      </ui-panel>

      <ui-callout title="Not in the guide — where the gaps were filled">
        The guide shows the module's first four sections but not the supervisor chat node or graph.
        The backend module is the whole CopilotKit showcase <code>subagents.ts</code> the guide is
        cut from, with one change: its header-forwarding variant (<code>makeChatOpenAI</code> and
        the <code>showcaseGraph</code> export) is removed, since it only forwards aimock test
        headers and imports a showcase-only module.
      </ui-callout>

      <ui-callout tone="warn" title="The guide's model settings fail against OpenAI">
        The guide creates every model as
        <code>new ChatOpenAI({{ '{' }} temperature: 0, model: "gpt-5-mini" {{ '}' }})</code>. OpenAI
        rejects that combination — <code>gpt-5-mini</code> supports only the default temperature —
        so every run fails with a 400. <code>temperature: 0</code> is dropped here; the model is
        unchanged.
      </ui-callout>

      <ui-callout title="Where the frontend pieces come from">
        The <code>subagents</code> agent id,
        <code>readDelegations</code>, <code>subAgentRendererConfig</code>, and both card
        components come from the Angular Showcase the guide's frontend snippet is taken from.
      </ui-callout>

      <ui-callout tone="warn" title="Failed delegations do not reach the log">
        The backend records a sub-agent error as a delegation with <code>status: "failed"</code>.
        The Angular Showcase's <code>readDelegations</code> keeps only
        <code>"completed"</code> entries, so a failed delegation shows in the transcript but not in
        the log. Both are used as published.
      </ui-callout>
    </div>
  `,
})
export default class SubagentsPage {}
