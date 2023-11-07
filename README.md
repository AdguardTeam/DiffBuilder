# Diff Builder
A tool for generating differential updates for filter lists.

# How to Use

```bash
diff-builder build [-c|--checksum] [-d <seconds>|--delete-older-than <seconds>] <old_filter> <new_filter> <path_to_patches>
```

Where:
- `<old_filter>` - the relative path to the old filter.
- `<new_filter>` - the relative path to the new filter.
- `<path_to_patches>` - the relative path to the directory where the patch should be saved. The patch filename will be `<path_to_patches>/$PATCH_VERSION.patch`, where `$PATCH_VERSION` is the value of `Version` from `<old_filter>`.
-  `-d <seconds>` or `--delete-older-than=<seconds>` - an optional parameter, the time to live for the patch in *seconds*. By default, it will be `604800` (7 days). The utility will scan `<path_to_patches>` and delete patches whose `mtime` has expired.
- `-c` or `--checksum` - an optional flag, indicating whether it should calculate the SHA sum for the filter and add it to the `diff` directive with the filter name and the number of changed lines, following this format: `diff name:[name] checksum:[checksum] lines:[lines]`:
    - `name` - the name of the corresponding filter list. This key-value pair is optional - it will be included only if there is a `Diff-Name` tag in the `<old_filter>`.
    - `checksum` - the expected SHA1 checksum of the file after the patch is applied. This is used to validate the patch.
    - `lines` - the number of lines that follow, making up the RCS diff block. Note that `lines` are counted using the same algorithm as used by `wc -l`, essentially counting `\n`.

# Algorithm

## 1. Extract version from filters
If the old or new filter doesn't contain a `Version` tag, the command will return an error.
If the new filter contains a version newer than in the old filter, the command will return an error.

## 2. Calculate diff
Calculate the difference between `old_filter` and `new_filter` in [RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS).

## 3. (optional) Calculate checksum
Calculate a `diff` directive with the name of the `old_filter`, along with the checksum and number of lines in the diff.
The name will be parsed from the `Diff-Name` tag in the `old_filter`, if found. If not, the name will be skipped.

## 4. Save diff
Save the diff to `<path_to_patches>/$PATCH_VERSION.patch`, where `$PATCH_VERSION` is the value of `Version` from `old_filter`.
The utility will also update the `Diff-Path` tag to the `old_filter`.

## 5. Create patch for the newer version
Create an empty patch file for the newer version of the filter and save it to `<path_to_patches>/$PATCH_VERSION.patch`, where `$PATCH_VERSION` is the value of `Version` from `new_filter`.

## 6. Delete outdated patches
Scan `path_to_patches` and delete all patches with the `*.patch` extension whose `mtime` is older than the value passed in the `delete-older-than` parameter.


# Important
It is required that <old_filter> already has `Diff-Path` tag.
