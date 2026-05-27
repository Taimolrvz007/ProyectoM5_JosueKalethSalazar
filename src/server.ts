import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { formatErrorForLLM } from "./errors/index.js";
import { logger } from "./utils/logging.js";
import type { MCPToolDefinition } from "./utils/types.js";

import { createRepositoryTool } from "./tools/create-repository.js";
import { createIssueTool } from "./tools/create-issue.js";
import { listRepositoriesTool } from "./tools/list-repositories.js";
import { createCommitTool } from "./tools/create-commit.js";
import { listIssuesTool } from "./tools/list-issues.js";
import { createBranchTool } from "./tools/create-branch.js";
import { createPullRequestTool } from "./tools/create-pull-request.js";
import { addCollaboratorTool } from "./tools/add-collaborator.js";
import { getFileContentTool } from "./tools/get-file-content.js";

const server = new Server({ name: "automatehub-core-mcp", version: "2.0.0" }, { capabilities: { tools: {} } });

const toolsRegistry: Record<string, MCPToolDefinition> = {
  [createRepositoryTool.name]: createRepositoryTool,
  [createIssueTool.name]: createIssueTool,
  [listRepositoriesTool.name]: listRepositoriesTool,
  [createCommitTool.name]: createCommitTool,
  [listIssuesTool.name]: listIssuesTool,
  [createBranchTool.name]: createBranchTool,
  [createPullRequestTool.name]: createPullRequestTool,
  [addCollaboratorTool.name]: addCollaboratorTool,
  [getFileContentTool.name]: getFileContentTool
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(toolsRegistry).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  };
});


server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  logger.info(`[Router MCP] Procesando llamada para: ${name}`);

  const targetTool = toolsRegistry[name];
  if (!targetTool) {
    throw new Error(`La herramienta solicitada no existe: ${name}`);
  }

  try {
    return await targetTool.handler(args);
  } catch (err: any) {
    logger.error(`Error procesando la Tool ${name}`, { error: err.message });

  
    if (err.message.startsWith("SUGGESTION:")) {
      return { isError: true, content: [{ type: "text", text: err.message }] };
    }

    return {
      isError: true,
      content: [{ type: "text", text: formatErrorForLLM(err, name.replace("_", " ")) }]
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
logger.info("AutomateHub MCP Server corriendo exitosamente via stdio.");