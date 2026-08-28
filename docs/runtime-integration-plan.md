# HPOS Runtime Architecture Integration

Goal: Alpha 4.4.2 consumes Constitution + Thesis Registry + local Current State instead of duplicating rule/thesis logic in JavaScript.

Runtime precedence:
1. Constitution: durable hard rules and governance
2. Local Current State: private holdings, cash, overrides, open orders, savings plans
3. Thesis Registry: versioned per-asset thesis/falsification
4. Market/news feeds: current external evidence
5. Decision Engine: derives action; never mutates source-of-truth layers

Fallback behavior: if architecture files cannot load, no buy/add permission may be invented. Confidence falls and the UI exposes degraded mode.
