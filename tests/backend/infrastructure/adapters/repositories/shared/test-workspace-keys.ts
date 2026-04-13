import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";

/** Stable workspace scope for repository contract tests. */
export const contractTestWorkspace = WorkspaceVO.globalShared();

/** Second workspace for cross-workspace filter / AND-clause contract tests. */
export const contractTestWorkspaceB = WorkspaceVO.org("repo-contract-ws-b");

/** Persisted key shape for adapters/tests that assert on string keys. */
export const contractTestWorkspaceKey = contractTestWorkspace.toKey();

export const contractTestWorkspaceKeyB = contractTestWorkspaceB.toKey();
