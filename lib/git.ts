import { simpleGit, type SimpleGit } from 'simple-git';

export const git: SimpleGit = simpleGit(process.cwd());

export async function gitStatus() {
  const status = await git.status();
  const changed = [
    ...status.modified,
    ...status.not_added,
    ...status.deleted,
    ...status.created,
    ...status.renamed.map((r) => r.to),
  ].filter((p) => p.startsWith('notes/'));
  return {
    branch: status.current,
    ahead: status.ahead,
    behind: status.behind,
    changed,
  };
}
