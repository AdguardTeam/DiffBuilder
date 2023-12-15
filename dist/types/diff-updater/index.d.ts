declare const DiffUpdater: {
    applyPatch: (filterUrl: string, filterContent: string, callStack?: number, verbose?: boolean) => Promise<string | null>;
};
export { DiffUpdater };
