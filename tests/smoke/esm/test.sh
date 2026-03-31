#!/bin/bash

set -e

curr_path="tests/smoke/esm"
pkg="diff-builder.tgz"
nm_path="node_modules"

cleanup() {
    echo "Cleaning up..."
    rm -f "$pkg" && rm -rf "$nm_path"
    echo "Cleanup complete"
}

trap cleanup EXIT

(cd ../../.. && pnpm pack --out "$curr_path/$pkg")

pkg_node_modules="$nm_path/@adguard/diff-builder"
mkdir -p "$pkg_node_modules"
tar -xzf "$pkg" --strip-components=1 -C "$pkg_node_modules"

pnpm start
echo "ESM smoke test successfully completed."
