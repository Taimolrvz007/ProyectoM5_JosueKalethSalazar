import "dotenv/config";
import { Octokit } from "@octokit/rest";
import { AuthenticationError } from "../errors/index.js";

const token = process.env.GITHUB_TOKEN;

if (!token) {
  throw new AuthenticationError(
    "Falta la variable GITHUB_TOKEN en el archivo .env"
  );
}

export const octokit = new Octokit({ auth: token });