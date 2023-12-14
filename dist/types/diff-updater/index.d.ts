declare const DiffUpdater: {
    applyPatch: (filterUrl: string, filterContent: string) => Promise<string | null>;
};
export { DiffUpdater };
