# Diff builder
Tool for building differential updates of filter lists.

## How it works
Here's how it should work:

```
./filters-diff-builder
	--new-list-path="./filter.txt"
	--prev-list-path="./filter.old.txt"
	--diff-expires="1 hour"
	--diff-url="https://xxxxx.com/filter.diff.json"
	--diff-path="./filter.diff.json"
	--max-diff-size=200000
	--max-diff-history=30
```
where:
- `new-list-path` - path to the new version of the filter list. The list will be modified in result, `Diff-URL` and `Diff-Expires` will be added (or replaced if they're already there).
- `prev-list-path` - path to the previous version of the filter list.
- `diff-expires` - value of `Diff-Expires` to be used.
- `diff-url` - URL where the diff.json file will be published.
- `max-diff-size` - maximum size of a diff file in bytes. If the resulting diff.json is larger than the specified value, it becomes empty effectively disabling differential updates.
- `max-diff-history` - maximum number of diffs stored in the diff.json file.
