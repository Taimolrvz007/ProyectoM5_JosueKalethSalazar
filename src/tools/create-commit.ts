import { ToolsSchemas } from "../schemas/index.js";
import { gitHubOperations } from "../github/operations.js";
import { ValidationError } from "../errors/index.js";
import type { MCPToolDefinition } from "../utils/types.js";

export const createCommitTool: MCPToolDefinition = {
  name: "create_commit",
  description: `Sube o edita uno o varios archivos de forma simultánea en un único commit atómico.

💡 GUÍA DE FORMATO PARA 'FILES'
• Para 1 archivo: 
  [{"path": "README.md", "content": "# Título"}]
• Para varios archivos (Lote): 
  [{"path": "src/app.js", "content": "..."}, {"path": "src/utils.js", "content": "..."}]`,
  inputSchema: {
    type: "object",
    properties: {
      owner: { type: "string", description: "Propietario del repositorio." },
      repo: { type: "string", description: "Nombre del repositorio." },
      message: { type: "string", description: "Mensaje explicativo del commit." },
      branch: { type: "string", description: "Rama donde impactar el commit. Por defecto: main." },
      files: {
        type: "array",
        description: "Format JSON",
        items: {
          type: "object",
          properties: {
            path: { type: "string", description: "Ruta del archivo." },
            content: { type: "string", description: "Contenido del archivo." }
          },
          required: ["path", "content"]
        }
      }
    },
    required: ["owner", "repo", "message", "files"]
  },

  handler: async (args: unknown) => {
    const parsed = ToolsSchemas.CreateCommitSchema.safeParse(args);
    if (!parsed.success) throw new ValidationError(parsed.error.errors.map(e => e.message).join(", "));
    
    const res = await gitHubOperations.createCommit(parsed.data);
    const totalFiles = parsed.data.files.length;
    
    let infoMsg = "";
    if (res.data.isInitialCommit) {
      infoMsg = "💡 Nota: El repositorio estaba completamente vacío, por lo que el primer archivo se utilizó automáticamente para inicializarlo y crear la rama base. El resto de los archivos se agregaron mediante un commit atómico.";
    } else {
      infoMsg = "💡 Nota: El repositorio ya contenía historial, por lo que se utilizó la API de bajo nivel (Trees y Blobs) para agregar los cambios de forma directa y atómica.";
    }

    return { 
      content: [{ 
        type: "text", 
        text: `¡Commit impactado con éxito! Se procesaron ${totalFiles} archivo(s) en la rama '${parsed.data.branch}'.\nSHA: ${res.data.commit.sha}\n\n${infoMsg}` 
      }] 
    };
  }
};