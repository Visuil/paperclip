/**
 * Shape a tool gateway execution as an MCP `tools/call` result.
 *
 * Plugin tools come back from the plugin tool dispatcher wrapped as
 * `{ pluginId, toolName, result: ToolResult }`, so the plugin's `content`,
 * `data` and `error` sit one level down; they are unwrapped here so they reach
 * the client. MCP clients validate `structuredContent` as an object (Claude
 * Code rejects the whole reply when it is `null`), so it is only sent when the
 * tool returned an object.
 */

type JsonObject = Record<string, unknown>;

const asObject = (value: unknown): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : null;

export interface McpToolCallResult {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: JsonObject;
  isError: boolean;
}

export function toMcpToolCallResult(executionResult: unknown): McpToolCallResult {
  const record = asObject(executionResult);
  const pluginResult =
    record && typeof record.pluginId === "string" && typeof record.toolName === "string"
      ? asObject(record.result)
      : null;
  const inner = pluginResult ?? record;
  const data = inner?.data;
  const structuredContent = asObject(data) ?? undefined;
  const pluginError = pluginResult && typeof pluginResult.error === "string" && pluginResult.error ? pluginResult.error : null;
  const text =
    typeof inner?.content === "string"
      ? inner.content
      : pluginError ?? JSON.stringify(data ?? executionResult ?? null);
  return {
    content: [{ type: "text", text }],
    ...(structuredContent ? { structuredContent } : {}),
    isError: pluginError !== null,
  };
}
