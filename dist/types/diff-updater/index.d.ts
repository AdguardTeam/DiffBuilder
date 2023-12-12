declare const DiffUpdater: {
    applyPatch: (filterUrl: string, filterContent: string) => Promise<string>;
};
export default DiffUpdater;
