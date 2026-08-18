# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-18

### 06:52 UTC — 1 page, highest severity high

**High — Shared state and agent context** · _local snapshot edit, not an upstream change_

`/angular/langgraph-typescript/guides/shared-state` · route `/shared-state` · under “Read agent state” · in a `ts` block

18 code lines changed.

````diff
- 
+ import { Component, computed } from "@angular/core";
+ import { injectAgentStore } from "@copilotkit/angular";
- 
+ @Component({
+ selector: "app-workspace",
+ template: `
+ <p>Priority: {{ state().priority }}</p>
````
