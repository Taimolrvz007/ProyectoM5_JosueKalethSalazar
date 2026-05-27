import { describe, test, expect } from "vitest";
import { ToolsSchemas } from "../src/schemas/index.js";

describe("🧪 PRUEBAS DE VALIDACIÓN DE SCHEMAS (ZOD)", () => {
  
  test("1. Debería aprobar un nombre de repositorio válido con guiones y números", () => {
    const payload = {
      name: "automatehub-mvp-2026",
      description: "Proyecto integrador de Henry",
      private: true
    };
    const result = ToolsSchemas.CreateRepositorySchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  test("2. Debería rechazar nombres de repositorios con espacios o caracteres prohibidos", () => {
    const payload = {
      name: "mi repositorio invalido!"
    };
    const result = ToolsSchemas.CreateRepositorySchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("Solo alfanuméricos, guiones, puntos y guiones bajos");
    }
  });

  test("3. Debería rechazar la creación de un issue si falta el título obligatorio", () => {
    const payload = {
      owner: "automatehub-org",
      repo: "mcp-server",
      body: "Detalle del error"
     
    };
    const result = ToolsSchemas.CreateIssueSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});