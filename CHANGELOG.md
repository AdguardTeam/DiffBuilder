# Diff Builder Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2023-12-29

### Fixed
- Handle backslashes '\' for Windows file paths.


## [1.0.6] - 2023-12-26

### Fixed
- Handle user agent headers in the filter content.


## [1.0.5] - 2023-12-25

### Fixed
- Bug with cutting filter content to first 50 lines.


## [1.0.4] - 2023-12-25

### Changed
- The algorithm has been modified to ignore changes in the 'Diff-Path' and
  'Checksum' tags, but it now accounts for the presence of the 'Checksum' tag
  in the new file and recalculates it if necessary. Additionally, cases where
  two checksums are present in a file have been considered, and the algorithm
  has been simplified accordingly.


## [1.0.3] - 2023-12-20

### Fixed
- Recalculate only first found checksum.


## [1.0.2] - 2023-12-20

### Fixed
- Recalculating checksum of the new filter after adding Diff-Path tag.
