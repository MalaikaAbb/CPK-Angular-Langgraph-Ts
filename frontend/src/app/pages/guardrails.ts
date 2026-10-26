import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, DocSample, Panel } from '../components/ui';

@Component({
  selector: 'app-guardrails-page',
  imports: [RouteHeader, Panel, Callout, DocSample],
  template: `
    <app-route-header path="/guardrails" />

    <div class="space-y-6">
      <ui-callout title="Reference only">
        This guide is published with Python code only — it is the same page as the LangGraph
        Python guide — and no TypeScript demo code exists for it, so there is nothing to run
        against this harness's LangGraph.js backend. Every sample is shown as published.
      </ui-callout>

      <ui-panel heading="Start with the built-in PII middleware">
        <ui-doc-sample caption="Guardrails guide — agent.py" language="python" [code]="piiMiddleware" />
      </ui-panel>

      <ui-panel heading="Input screening">
        <ui-doc-sample caption="Guardrails guide — guardrails.py" language="python" [code]="inputFirewall" />
      </ui-panel>

      <ui-panel heading="Output and DLP screening">
        <ui-doc-sample caption="Guardrails guide — guardrails.py" language="python" [code]="outputFirewall" />
      </ui-panel>

      <ui-callout tone="warn" title="Streaming bypasses a naive output filter">
        <code>wrap_model_call</code> sees the completed response. When the model streams, tokens
        have already reached the browser, so the user may briefly see the original.
        <code>PIIMiddleware</code> handles this with a stream transformer; a custom rule should be
        a <code>PIIMiddleware</code> custom detector, or the screened agent should not stream.
      </ui-callout>

      <ui-panel heading="Screening tool calls">
        <ui-doc-sample caption="Guardrails guide — tool call screening" language="python" [code]="toolFirewall" />
      </ui-panel>

      <ui-panel heading="Ordering against CopilotKitMiddleware">
        <p class="mb-3 text-sm text-slate-700">
          The first entry is the outermost layer. Put guardrails before
          <code>CopilotKitMiddleware</code>: it adds the browser's frontend tools to the request,
          and an output filter after it would run before CopilotKit finished the response.
        </p>
        <ui-doc-sample caption="Guardrails guide — middleware order" language="python" [code]="ordering" />
      </ui-panel>
    </div>
  `,
})
export default class GuardrailsPage {
  protected readonly piiMiddleware = `from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware
from copilotkit import CopilotKitMiddleware

agent = create_agent(
    model="openai:gpt-4o",
    tools=[...],
    middleware=[
        # Redact emails the user sends in.
        PIIMiddleware("email", strategy="redact"),
        # Mask card numbers wherever they appear, including in tool results.
        PIIMiddleware(
            "credit_card",
            strategy="mask",
            apply_to_output=True,
            apply_to_tool_results=True,
        ),
        # Refuse outright if an API key shows up.
        PIIMiddleware("api_key", detector=r"sk-[a-zA-Z0-9]{32}", strategy="block"),
        CopilotKitMiddleware(),
    ],
)`;

  protected readonly inputFirewall = `from typing import Any

from langchain.agents.middleware import AgentMiddleware, AgentState, hook_config
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.runtime import Runtime


class InputFirewall(AgentMiddleware):
    """Rejects user input that fails policy before it reaches the model."""

    def __init__(self, *, refusal: str = "I can't help with that request."):
        super().__init__()
        self.refusal = refusal

    # can_jump_to declares the edge; without it, "jump_to" is ignored.
    @hook_config(can_jump_to=["end"])
    def before_model(
        self, state: AgentState, runtime: Runtime[Any]
    ) -> dict[str, Any] | None:
        messages = state.get("messages", [])
        latest = next(
            (m for m in reversed(messages) if isinstance(m, HumanMessage)), None
        )
        if latest is None:
            return None

        verdict = screen_input(str(latest.content))  # your classifier or rules
        if not verdict.allowed:
            # Ending with an AIMessage means the user sees the refusal in chat
            # rather than an error toast.
            return {
                "jump_to": "end",
                "messages": [AIMessage(content=self.refusal)],
            }

        return None`;

  protected readonly outputFirewall = `from dataclasses import replace
from typing import Awaitable, Callable

from langchain.agents.middleware import (
    AgentMiddleware,
    ModelRequest,
    ModelResponse,
)
from langchain_core.messages import AIMessage


class OutputFirewall(AgentMiddleware):
    """Scrubs or blocks model output before it leaves the agent."""

    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        response = handler(request)

        scrubbed = []
        for message in response.result:
            if isinstance(message, AIMessage) and isinstance(message.content, str):
                clean = redact_sensitive(message.content)  # your DLP pass
                if clean != message.content:
                    message = message.model_copy(update={"content": clean})
            scrubbed.append(message)

        return replace(response, result=scrubbed)

    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelResponse:
        response = await handler(request)
        # ...same scrubbing as above
        return response`;

  protected readonly toolFirewall = `from langgraph.types import Command
from langchain_core.messages import ToolMessage
from langchain.agents.middleware import ToolCallRequest


class ToolFirewall(AgentMiddleware):
    def wrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command],
    ) -> ToolMessage | Command:
        if not tool_call_allowed(request):  # your policy
            return ToolMessage(
                content="This action is not permitted.",
                tool_call_id=request.tool_call["id"],
            )
        return handler(request)`;

  protected readonly ordering = `middleware=[
    InputFirewall(),        # outermost: screens before anything else runs
    OutputFirewall(),       # sees the final response last
    CopilotKitMiddleware(), # innermost: frontend tools, state exposure
]`;
}
