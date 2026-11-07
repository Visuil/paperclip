import { describe, expect, it } from "vitest";

import { toMcpToolCallResult } from "../routes/tool-gateway-result.js";

describe("toMcpToolCallResult", () => {
  it("unwraps a plugin tool's result so its content and data reach the MCP client", () => {
    const out = toMcpToolCallResult({
      pluginId: "plugin-1",
      toolName: "decide",
      result: { content: "Overall gate: act", data: { ok: true, overall_gate: "act" } },
    });
    expect(out).toEqual({
      content: [{ type: "text", text: "Overall gate: act" }],
      structuredContent: { ok: true, overall_gate: "act" },
      isError: false,
    });
  });

  it("reports a plugin tool error as an MCP error result", () => {
    const out = toMcpToolCallResult({
      pluginId: "plugin-1",
      toolName: "decide",
      result: { error: "invalid_input: facts is required", data: { ok: false, error_type: "invalid_input" } },
    });
    expect(out.isError).toBe(true);
    expect(out.content[0].text).toBe("invalid_input: facts is required");
    expect(out.structuredContent).toEqual({ ok: false, error_type: "invalid_input" });
  });

  it("never sends structuredContent: null (MCP clients reject the reply)", () => {
    const plain = toMcpToolCallResult({ pluginId: "plugin-1", toolName: "ping", result: { content: "pong" } });
    expect(plain).toEqual({ content: [{ type: "text", text: "pong" }], isError: false });
    expect("structuredContent" in toMcpToolCallResult(null)).toBe(false);
    expect("structuredContent" in toMcpToolCallResult({ content: "x", data: ["not", "an", "object"] })).toBe(false);
  });

  it("keeps the shape of non-plugin results", () => {
    expect(toMcpToolCallResult({ content: "done", data: { id: "issue-1" } })).toEqual({
      content: [{ type: "text", text: "done" }],
      structuredContent: { id: "issue-1" },
      isError: false,
    });
    expect(toMcpToolCallResult({ data: { id: "issue-1" } }).content[0].text).toBe('{"id":"issue-1"}');
  });
});
