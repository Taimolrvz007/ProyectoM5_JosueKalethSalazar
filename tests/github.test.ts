process.env.GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_mock_token_for_testing_purposes";

import { describe, test, expect, vi, beforeEach } from "vitest";
import { gitHubOperations } from "../src/github/operations.js";


vi.mock("../src/github/client.js", () => {
  return {
    octokit: {
      repos: {
        get: vi.fn(),
        createForAuthenticatedUser: vi.fn(),
        listForAuthenticatedUser: vi.fn(),
        getContent: vi.fn()
      },
      issues: {
        create: vi.fn()
      }
    }
  };
});


import { octokit } from "../src/github/client.js";

describe("🧪 PRUEBAS DE OPERACIONES DE GITHUB con MOCKS", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("4. listRepositories debería retornar la colección simulada desde el mock de Octokit", async () => {
    vi.mocked(octokit.repos.listForAuthenticatedUser).mockResolvedValue({
      data: [{ id: 123, name: "repo-mockeado-henry", private: false }],
     
      headers: {
        link: "" 
      }
    } as any);

    const result = await gitHubOperations.listRepositories({ per_page: 5, page: 1 });
    
    expect(result.data[0].name).toBe("repo-mockeado-henry");
    expect(octokit.repos.listForAuthenticatedUser).toHaveBeenCalledOnce();
  });

  test("5. createIssue debería procesar exitosamente la apertura de un ticket", async () => {
    vi.mocked(octokit.repos.get).mockResolvedValue({} as any); 
    vi.mocked(octokit.issues.create).mockResolvedValue({
      data: { number: 99, html_url: "https://github.com" }
    } as any);

    const result = await gitHubOperations.createIssue({
      owner: "henry-student",
      repo: "mcp-project",
      title: "Fix memory leak",
      body: "High priority"
    });

    expect(result.data.number).toBe(99);
    expect(octokit.issues.create).toHaveBeenCalledOnce();
  });

  test("6. preFlightCheck debería arrojar una excepción controlada (SUGGESTION) si el repo devuelve 404", async () => {
    vi.mocked(octokit.repos.get).mockRejectedValue({ status: 404 });

    await expect(gitHubOperations.preFlightCheck("org-invalida", "repo-fantasma"))
      .rejects.toThrow("SUGGESTION: Repositorio no encontrado");
  });
});