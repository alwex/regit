import { ListBranchResult, ReleaseHeaderResult } from './gitHelpers.js';
import { ReleaseTrigger } from './hooks.js';
export declare const startRelease: (options: {
    version: string;
} & ReleaseTrigger) => Promise<{
    name: string;
}>;
export declare const openRelease: () => Promise<{
    from: string;
    name: string;
    show: string[];
}>;
export declare const removeRelease: () => Promise<void>;
export declare const validateVersion: (version: string) => Promise<void>;
export declare const promptSelectNextVersion: (message: string) => Promise<string>;
export declare const promptSelectNextVersionWithConfirmation: () => Promise<string>;
export declare const displayReleaseHeader: (releaseHeader: ReleaseHeaderResult, releaseBranch: ListBranchResult) => void;
