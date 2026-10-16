export declare const getProjectRootDirectory: () => Promise<string>;
export declare const warmupGitRepo: () => Promise<void>;
export declare const getCurrentBranch: () => Promise<string>;
export declare const pushBranch: (branchName: string) => Promise<void>;
export declare const getOpenReleaseBranch: () => Promise<ListBranchResult>;
export declare const assertOnSameBranch: (branch: string) => Promise<void>;
export declare const assertNotOnSameBranch: (branch: string) => Promise<void>;
export declare const assertCurrentBranchIsClean: () => Promise<void>;
export declare const getLatestTag: () => Promise<string | undefined>;
export declare const getLatestTags: (tagCount: number) => Promise<string[]>;
export interface ReleaseHeaderResult {
    commit: string;
    author: string;
    date: string;
}
export declare const getBranchDetails: (branch: string) => Promise<ReleaseHeaderResult>;
export interface TagHeaderResult {
    tag: string;
    author: string;
    date: string;
}
export declare const getTagDetails: (tag: string) => Promise<TagHeaderResult>;
export declare const createTag: ({ tag, message, }: {
    tag: string;
    message: string;
}) => Promise<void>;
export declare const branchExists: (branchName: string) => Promise<boolean>;
export declare const localBranchExists: (branchName: string) => Promise<boolean>;
export declare const remoteBranchExists: (branchName: string) => Promise<boolean>;
export declare const initStableBranch: () => Promise<void>;
export declare const pushStableBranch: (version: string) => Promise<void>;
export interface ListBranchResult {
    name: string;
    ref: string;
    remoteName?: string;
    from: string;
    show: string[];
    isPresentLocally: boolean;
}
export declare const getBranchInfo: (branchName: string) => Promise<{
    name: string;
    ref: string;
    from: string;
    show: string[];
    remoteName: string;
    isPresentLocally: boolean;
}>;
export declare const listBranchStartingWith: (branchName: string) => Promise<ListBranchResult[]>;
export type BranchOrigin = 'new' | 'local' | 'remote';
export type BranchInspection = {
    branch: string;
    origin: BranchOrigin;
    baseTag: string;
    latestTag: string;
    isOutdated: boolean;
};
export declare const getRequiredLatestTag: () => Promise<string>;
export declare const inspectBranch: (branch: string) => Promise<BranchInspection>;
export declare const startInspectedBranch: ({ branch, origin, latestTag, }: BranchInspection) => Promise<void>;
export declare const startOrCheckoutBranch: (branchName: string) => Promise<void>;
export declare const mergeBranch: (branchName: string) => Promise<void>;
export interface ListBranchesInBranchResult extends ListBranchResult {
    upToDate: boolean;
}
export declare const listBranchesInBranch: (targetBranch: string) => Promise<ListBranchesInBranchResult[]>;
export declare const listBranchesBetweenTags: (tag1: string, tag2: string) => Promise<string[]>;
export declare const deleteBranch: (branchName: string) => Promise<void>;
