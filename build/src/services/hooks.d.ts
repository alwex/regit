import { BranchInspection } from './gitHelpers.js';
export type FeatureStartContext = BranchInspection & {
    kind: 'feature';
    id: string;
};
export type ReleaseTrigger = {
    trigger: 'release-start';
} | {
    trigger: 'preview-release';
    preview: string;
};
export type ReleaseStartContext = BranchInspection & ReleaseTrigger & {
    kind: 'release';
    id: string;
    version: string;
};
export type FeatureSummary = {
    id: string;
    branch: string;
    baseTag: string;
};
export type ReleaseFinishContext = {
    version: string;
    tag: string;
    previousTag: string;
    releaseBranch: string;
    features: FeatureSummary[];
};
export type ReleaseFinishedContext = ReleaseFinishContext & {
    stableCommit: string;
    deletedBranches: string[];
};
export type FeaturePushContext = {
    id: string;
    branch: string;
};
export type ReleaseAddContext = {
    version: string;
    releaseBranch: string;
    features: FeatureSummary[];
};
export type PreviewStartContext = BranchInspection & {
    kind: 'preview';
    id: string;
};
export type PreviewAddContext = {
    preview: string;
    previewBranch: string;
    features: FeatureSummary[];
};
export interface Hooks {
    getFeatureName: (id: string) => Promise<string>;
    getTagMessage: (version: string, context: ReleaseFinishContext) => Promise<string>;
    preFeatureStart: (id: string, context: FeatureStartContext) => Promise<void>;
    postFeatureStart: (id: string, context: FeatureStartContext) => Promise<void>;
    postFeaturePush: (id: string, context: FeaturePushContext) => Promise<void>;
    preReleaseStart: (version: string, context: ReleaseStartContext) => Promise<void>;
    postReleaseStart: (version: string, context: ReleaseStartContext) => Promise<void>;
    preReleaseFinish: (version: string, context: ReleaseFinishContext) => Promise<void>;
    postReleaseFinish: (version: string, context: ReleaseFinishedContext) => Promise<void>;
    preReleaseAdd: (version: string, context: ReleaseAddContext) => Promise<void>;
    postReleaseAdd: (version: string, context: ReleaseAddContext) => Promise<void>;
    prePreviewStart: (preview: string, context: PreviewStartContext) => Promise<void>;
    postPreviewStart: (preview: string, context: PreviewStartContext) => Promise<void>;
    prePreviewAdd: (preview: string, context: PreviewAddContext) => Promise<void>;
    postPreviewAdd: (preview: string, context: PreviewAddContext) => Promise<void>;
}
export declare const runPostHook: ({ hook, completed, run, }: {
    hook: keyof Hooks;
    completed: string;
    run: () => Promise<void>;
}) => Promise<void>;
export declare const resolveTagMessage: ({ hooks, version, context, }: {
    hooks: Hooks;
    version: string;
    context: ReleaseFinishContext;
}) => Promise<string>;
export declare const getHooks: () => Promise<Hooks>;
