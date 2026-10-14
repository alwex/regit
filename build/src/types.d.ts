import type { Hooks as AllHooks } from './services/hooks.js';
export type Hooks = Partial<AllHooks>;
export type { FeaturePushContext, FeatureStartContext, FeatureSummary, PreviewAddContext, PreviewStartContext, ReleaseAddContext, ReleaseFinishContext, ReleaseFinishedContext, ReleaseStartContext, ReleaseTrigger, } from './services/hooks.js';
export type { BranchInspection, BranchOrigin } from './services/gitHelpers.js';
