import { octokit } from "./client.js";
import { retryWithBackoff } from "../utils/retry.js";
import { logger } from "../utils/logging.js";
import { memoryCache } from "../utils/cache.js";
import { rateLimiter } from "../utils/rateLimiter.js";
import * as Types from "../schemas/index.js";

export const gitHubOperations = {
  async preFlightCheck(owner: string, repo: string): Promise<void> {
    await rateLimiter.throttle();
    try {
      await octokit.repos.get({ owner, repo });
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error("SUGGESTION: Repositorio no encontrado. Si es de una organización sin permisos, sugiero crearlo en tu cuenta personal.");
      }
      throw err;
    }
  },

  async createRepository(data: Types.CreateRepositoryInput) {
    await rateLimiter.throttle();
    logger.info("Creando repositorio", data);
    return await retryWithBackoff(() => octokit.repos.createForAuthenticatedUser(data));
  },

  async listRepositories(data: Types.ListRepositoriesInput) {
    const page = data.page ?? 1;
    const per_page = data.per_page ?? 30;
    const key = `repos_${page}_${per_page}`;
    const cached = memoryCache.get(key);
    if (cached) return cached;

    await rateLimiter.throttle();
    const res = await retryWithBackoff(() => octokit.repos.listForAuthenticatedUser({ page, per_page }));
    
    const linkHeader = res.headers.link || "";
    const hasNextPage = linkHeader.includes('rel="next"');
    const payload = { data: res.data, hasNextPage };

    memoryCache.set(key, payload);
    return payload;
  },

  async createIssue(data: Types.CreateIssueInput) {
    await this.preFlightCheck(data.owner, data.repo);
    return await retryWithBackoff(() => octokit.issues.create(data));
  },

  async createCommit(data: Types.CreateCommitInput) {
    let { owner, repo, branch, files, message } = data;
    await this.preFlightCheck(owner, repo);

    let isEmptyRepo = false;
    let wasEmpty = false;
    let baseCommitSha: string | undefined;
    let baseTreeSha: string | undefined;

    try {
     
      const refResp = await retryWithBackoff(() => 
        octokit.git.getRef({ owner, repo, ref: `heads/${branch}` })
      );
      baseCommitSha = refResp.data.object.sha;

    
      const commitResp = await retryWithBackoff(() => 
        octokit.git.getCommit({ owner, repo, commit_sha: baseCommitSha! })
      );
      baseTreeSha = commitResp.data.tree.sha;
    } catch (err: any) {
      if (err.status === 404 || err.status === 409) {
        let repoIsEmpty = false;
        try {
          await retryWithBackoff(() => octokit.repos.listCommits({ owner, repo, per_page: 1 }));
        } catch (e: any) {
          if (e.status === 409) repoIsEmpty = true;
        }

        if (repoIsEmpty) {
          isEmptyRepo = true;
          wasEmpty = true;
        } else {
          throw new Error(`SUGGESTION: La rama '${branch}' no existe en el repositorio '${repo}'. Creala primero con 'create_branch'.`);
        }
      } else {
        throw err;
      }
    }

   
    if (isEmptyRepo && files.length > 0) {
      const firstFile = files[0];
      const initResp = await retryWithBackoff(() => 
        octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: firstFile.path,
          message: message,
          content: Buffer.from(firstFile.content, 'utf8').toString('base64'),
          branch: branch
        })
      );
      
      baseCommitSha = initResp.data.commit.sha;
      const commitData = await retryWithBackoff(() => 
        octokit.git.getCommit({ owner, repo, commit_sha: baseCommitSha! })
      );
      baseTreeSha = commitData.data.tree.sha;
      isEmptyRepo = false;
      
      files = files.slice(1);
      if (files.length === 0) {
        return { data: { commit: { sha: baseCommitSha }, isInitialCommit: wasEmpty } };
      }
    }

    // PASO 3: Crear todos los blobs en paralelo usando los servidores de GitHub
    const treeItems = await Promise.all(
      files.map(async (file) => {
        const blobResp = await retryWithBackoff(() => 
          octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content, 'utf8').toString('base64'),
            encoding: 'base64',
          })
        );
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blobResp.data.sha
        };
      })
    );

    // PASO 4: Crear el nuevo tree inyectando la lista completa de blobs procesados
    const treePayload: any = { owner, repo, tree: treeItems };
    if (!isEmptyRepo && baseTreeSha) {
      treePayload.base_tree = baseTreeSha;
    }
    const treeResp = await retryWithBackoff(() => octokit.git.createTree(treePayload));
    const newTreeSha = treeResp.data.sha;

    // PASO 5: Crear el commit definitivo enlazándolo con su antecesor
    const commitPayload: any = { owner, repo, message, tree: newTreeSha };
    if (!isEmptyRepo && baseCommitSha) {
      commitPayload.parents = [baseCommitSha];
    } else {
      commitPayload.parents = [];
    }
    const newCommitResp = await retryWithBackoff(() => octokit.git.createCommit(commitPayload));
    const newCommitSha = newCommitResp.data.sha;

    // PASO 6: Mover de posición el puntero de la rama hacia el nuevo commit público
    if (isEmptyRepo) {
      await retryWithBackoff(() => 
        octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha: newCommitSha
        })
      );
    } else {
      await retryWithBackoff(() => 
        octokit.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: newCommitSha,
          force: false,
        })
      );
    }

    return { data: { commit: { sha: newCommitSha }, isInitialCommit: wasEmpty } };
  },

  async listIssues(data: Types.ListIssuesInput) {
    await rateLimiter.throttle();
    return await retryWithBackoff(() => octokit.issues.listForRepo(data));
  },

  async createBranch(data: Types.CreateBranchInput) {
    await this.preFlightCheck(data.owner, data.repo);
    const base = await retryWithBackoff(() => octokit.git.getRef({ owner: data.owner, repo: data.repo, ref: `heads/${data.from_branch}` }));
    return await retryWithBackoff(() => octokit.git.createRef({ owner: data.owner, repo: data.repo, ref: `refs/heads/${data.branch_name}`, sha: base.data.object.sha }));
  },

  async createPullRequest(data: Types.CreatePullRequestInput) {
    await this.preFlightCheck(data.owner, data.repo);
    return await retryWithBackoff(() => octokit.pulls.create(data));
  },

  async addCollaborator(data: Types.AddCollaboratorInput) {
    await this.preFlightCheck(data.owner, data.repo);
    return await retryWithBackoff(() => octokit.repos.addCollaborator(data));
  },

  async getFileContent(data: Types.GetFileContentInput) {
    await this.preFlightCheck(data.owner, data.repo);
    const params: any = { owner: data.owner, repo: data.repo, path: data.path };
    if (data.branch) params.ref = data.branch;
    
    const response = await retryWithBackoff(() => octokit.repos.getContent(params));
    
    // Si la respuesta es un arreglo, significa que es un directorio, no un archivo
    if (Array.isArray(response.data)) {
      throw new Error(`La ruta '${data.path}' corresponde a un directorio, no a un archivo.`);
    }

    // La API de GitHub devuelve el contenido en base64
    if (response.data.type === "file" && response.data.content) {
      const decodedContent = Buffer.from(response.data.content, 'base64').toString('utf8');
      return {
        content: decodedContent,
        name: response.data.name,
        path: response.data.path,
        sha: response.data.sha,
        size: response.data.size
      };
    }

    throw new Error(`No se pudo leer el contenido del archivo '${data.path}'.`);
  }
};