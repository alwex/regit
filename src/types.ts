import type { Hooks as AllHooks } from './services/hooks.js'

export type Hooks = Partial<AllHooks>

export type {
    FeaturePushContext,
    FeatureRemoveContext,
    FeatureStartContext,
    FeatureSummary,
    PreviewAddContext,
    PreviewRemoveContext,
    PreviewStartContext,
    ReleaseAddContext,
    ReleaseFinishContext,
    ReleaseFinishedContext,
    ReleaseRemoveContext,
    ReleaseStartContext,
    ReleaseTrigger,
} from './services/hooks.js'

export type { BranchInspection, BranchOrigin } from './services/gitHelpers.js'
