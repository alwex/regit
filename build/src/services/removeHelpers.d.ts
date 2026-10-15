import { Hooks } from './hooks.js';
export declare const removeBranchWithHooks: ({ branch, completed, pre, post, }: {
    branch: string;
    completed: string;
    pre: () => Promise<void>;
    post: {
        hook: keyof Hooks;
        run: () => Promise<void>;
    };
}) => Promise<void>;
