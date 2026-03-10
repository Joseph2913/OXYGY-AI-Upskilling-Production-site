/**
 * Client-side n8n workflow JSON validator.
 *
 * Runs after AI generates JSON and before offering the download.
 * Returns structured errors that can be fed back to the AI for retry.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Strip markdown code fences that the AI sometimes wraps JSON in.
 */
export function extractJson(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * Validate an n8n workflow JSON string for structural correctness.
 * Checks top-level shape, node fields, trigger count, ID uniqueness,
 * and connection integrity.
 */
export function validateN8nWorkflow(jsonString: string): ValidationResult {
  const errors: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, errors: ['Response is not valid JSON'] };
  }

  // Top-level structure
  if (!parsed.nodes || !Array.isArray(parsed.nodes))
    errors.push("Missing 'nodes' array");
  if (!parsed.connections || typeof parsed.connections !== 'object')
    errors.push("Missing 'connections' object");
  if (!parsed.name || typeof parsed.name !== 'string')
    errors.push("Missing workflow 'name'");

  if (parsed.nodes) {
    const nodeIds = new Set<string>();

    // Exactly one trigger node
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const triggerNodes = parsed.nodes.filter((n: any) =>
      n.type && (
        n.type.includes('Trigger') ||
        n.type.includes('trigger') ||
        n.type === 'n8n-nodes-base.webhook'
      )
    );
    if (triggerNodes.length === 0)
      errors.push('No trigger node found — workflow must start with a trigger');
    if (triggerNodes.length > 1)
      errors.push(`Multiple trigger nodes found (${triggerNodes.length}) — only one is allowed`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.nodes.forEach((node: any, i: number) => {
      const label = node.name || `Node at index ${i}`;

      // Required fields per node
      if (!node.id) errors.push(`${label}: missing 'id'`);
      if (!node.name) errors.push(`${label}: missing 'name'`);
      if (!node.type) errors.push(`${label}: missing 'type'`);
      if (typeof node.typeVersion !== 'number')
        errors.push(`${label}: 'typeVersion' must be a number`);
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2)
        errors.push(`${label}: 'position' must be [x, y] array`);
      if (typeof node.parameters !== 'object')
        errors.push(`${label}: 'parameters' must be an object`);

      // Duplicate IDs
      if (node.id) {
        if (nodeIds.has(node.id))
          errors.push(`Duplicate node id: '${node.id}'`);
        nodeIds.add(node.id);
      }
    });

    // Validate connections reference real node names
    if (parsed.connections) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeNames = new Set(parsed.nodes.map((n: any) => n.name));
      Object.keys(parsed.connections).forEach(sourceName => {
        if (!nodeNames.has(sourceName))
          errors.push(`Connection references unknown source node: '${sourceName}'`);
        const outputs = parsed.connections[sourceName];
        if (outputs.main) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outputs.main.forEach((branch: any[]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            branch.forEach((conn: any) => {
              if (!nodeNames.has(conn.node))
                errors.push(`Connection references unknown target node: '${conn.node}'`);
            });
          });
        }
        // Also check ai_languageModel connections
        if (outputs.ai_languageModel) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outputs.ai_languageModel.forEach((branch: any[]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            branch.forEach((conn: any) => {
              if (!nodeNames.has(conn.node))
                errors.push(`AI connection references unknown target node: '${conn.node}'`);
            });
          });
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}