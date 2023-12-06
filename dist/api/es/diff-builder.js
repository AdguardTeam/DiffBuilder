import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

function Diff() {}
Diff.prototype = {
  diff: function diff(oldString, newString) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var callback = options.callback;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    this.options = options;
    var self = this;
    function done(value) {
      if (callback) {
        setTimeout(function () {
          callback(undefined, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    }
    oldString = this.castInput(oldString);
    newString = this.castInput(newString);
    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));
    var newLen = newString.length,
        oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    if (options.maxEditLength) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    var bestPath = [{
      newPos: -1,
      components: []
    }];
    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      return done([{
        value: this.join(newString),
        count: newString.length
      }]);
    }
    function execEditLength() {
      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        var basePath = void 0;
        var addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
        if (addPath) {
          bestPath[diagonalPath - 1] = undefined;
        }
        var canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = undefined;
          continue;
        }
        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
          basePath = clonePath(removePath);
          self.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath;
          basePath.newPos++;
          self.pushComponent(basePath.components, true, undefined);
        }
        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);
        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
        } else {
          bestPath[diagonalPath] = basePath;
        }
      }
      editLength++;
    }
    if (callback) {
      (function exec() {
        setTimeout(function () {
          if (editLength > maxEditLength) {
            return callback();
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength) {
        var ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  },
  pushComponent: function pushComponent(components, added, removed) {
    var last = components[components.length - 1];
    if (last && last.added === added && last.removed === removed) {
      components[components.length - 1] = {
        count: last.count + 1,
        added: added,
        removed: removed
      };
    } else {
      components.push({
        count: 1,
        added: added,
        removed: removed
      });
    }
  },
  extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,
        commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }
    if (commonCount) {
      basePath.components.push({
        count: commonCount
      });
    }
    basePath.newPos = newPos;
    return oldPos;
  },
  equals: function equals(left, right) {
    if (this.options.comparator) {
      return this.options.comparator(left, right);
    } else {
      return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  },
  removeEmpty: function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  },
  castInput: function castInput(value) {
    return value;
  },
  tokenize: function tokenize(value) {
    return value.split('');
  },
  join: function join(chars) {
    return chars.join('');
  }
};
function buildValues(diff, components, newString, oldString, useLongestToken) {
  var componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;
  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });
        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;
      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }
  var lastComponent = components[componentLen - 1];
  if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }
  return components;
}
function clonePath(path) {
  return {
    newPos: path.newPos,
    components: path.components.slice(0)
  };
}
var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
var reWhitespace = /\S/;
var wordDiff = new Diff();
wordDiff.equals = function (left, right) {
  if (this.options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};
wordDiff.tokenize = function (value) {
  var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);
  for (var i = 0; i < tokens.length - 1; i++) {
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }
  return tokens;
};
var lineDiff = new Diff();
lineDiff.tokenize = function (value) {
  var retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];
    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }
      retLines.push(line);
    }
  }
  return retLines;
};
function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}
var sentenceDiff = new Diff();
sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};
var cssDiff = new Diff();
cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }
  return _typeof(obj);
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var objectPrototypeToString = Object.prototype.toString;
var jsonDiff = new Diff();
jsonDiff.useLongestToken = true;
jsonDiff.tokenize = lineDiff.tokenize;
jsonDiff.castInput = function (value) {
  var _this$options = this.options,
      undefinedReplacement = _this$options.undefinedReplacement,
      _this$options$stringi = _this$options.stringifyReplacer,
      stringifyReplacer = _this$options$stringi === void 0 ? function (k, v) {
    return typeof v === 'undefined' ? undefinedReplacement : v;
  } : _this$options$stringi;
  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
};
jsonDiff.equals = function (left, right) {
  return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
};
function canonicalize(obj, stack, replacementStack, replacer, key) {
  stack = stack || [];
  replacementStack = replacementStack || [];
  if (replacer) {
    obj = replacer(key, obj);
  }
  var i;
  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }
  var canonicalizedObj;
  if ('[object Array]' === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }
  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }
  if (_typeof(obj) === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [],
        _key;
    for (_key in obj) {
      if (obj.hasOwnProperty(_key)) {
        sortedKeys.push(_key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      _key = sortedKeys[i];
      canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}
var arrayDiff = new Diff();
arrayDiff.tokenize = function (value) {
  return value.slice();
};
arrayDiff.join = arrayDiff.removeEmpty = function (value) {
  return value;
};
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }
  if (typeof options.context === 'undefined') {
    options.context = 4;
  }
  var diff = diffLines(oldStr, newStr, options);
  if (!diff) {
    return;
  }
  diff.push({
    value: '',
    lines: []
  });
  function contextLines(lines) {
    return lines.map(function (entry) {
      return ' ' + entry;
    });
  }
  var hunks = [];
  var oldRangeStart = 0,
      newRangeStart = 0,
      curRange = [],
      oldLine = 1,
      newLine = 1;
  var _loop = function _loop(i) {
    var current = diff[i],
        lines = current.lines || current.value.replace(/\n$/, '').split('\n');
    current.lines = lines;
    if (current.added || current.removed) {
      var _curRange;
      if (!oldRangeStart) {
        var prev = diff[i - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;
        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      }
      (_curRange = curRange).push.apply(_curRange, _toConsumableArray(lines.map(function (entry) {
        return (current.added ? '+' : '-') + entry;
      })));
      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      if (oldRangeStart) {
        if (lines.length <= options.context * 2 && i < diff.length - 2) {
          var _curRange2;
          (_curRange2 = curRange).push.apply(_curRange2, _toConsumableArray(contextLines(lines)));
        } else {
          var _curRange3;
          var contextSize = Math.min(lines.length, options.context);
          (_curRange3 = curRange).push.apply(_curRange3, _toConsumableArray(contextLines(lines.slice(0, contextSize))));
          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };
          if (i >= diff.length - 2 && lines.length <= options.context) {
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;
            if (!oldEOFNewline && noNlBeforeAdds && oldStr.length > 0) {
              curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
            }
            if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
              curRange.push('\\ No newline at end of file');
            }
          }
          hunks.push(hunk);
          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }
      oldLine += lines.length;
      newLine += lines.length;
    }
  };
  for (var i = 0; i < diff.length; i++) {
    _loop(i);
  }
  return {
    oldFileName: oldFileName,
    newFileName: newFileName,
    oldHeader: oldHeader,
    newHeader: newHeader,
    hunks: hunks
  };
}

/**
 * Finds value of specified header tag in filter rules text.
 *
 * @param tagName Filter header tag name.
 * @param rules Lines of filter rules text.
 *
 * @returns Value of specified header tag or null if tag not found.
 */
const parseTag = (tagName, rules) => {
    // Lines of filter metadata to parse
    const AMOUNT_OF_LINES_TO_PARSE = 50;
    // Look up no more than 50 first lines
    const maxLines = Math.min(AMOUNT_OF_LINES_TO_PARSE, rules.length);
    for (let i = 0; i < maxLines; i += 1) {
        const rule = rules[i];
        if (!rule) {
            continue;
        }
        const search = `! ${tagName}: `;
        const indexOfSearch = rule.indexOf(search);
        if (indexOfSearch >= 0) {
            return rule.substring(indexOfSearch + search.length);
        }
    }
    return null;
};

const DIFF_PATH_TAG = 'Diff-Path';

// Type of diff change.
var TypesOfChanges;
(function (TypesOfChanges) {
    TypesOfChanges["Add"] = "a";
    TypesOfChanges["Delete"] = "d";
})(TypesOfChanges || (TypesOfChanges = {}));

/**
 * Calculates SHA1 checksum for patch.
 *
 * @param content Content to hash.
 *
 * @returns SHA1 checksum for patch.
 */
const calculateChecksum = (content) => {
    const hash = createHash('sha1');
    const data = hash.update(content, 'utf-8');
    return data.digest('hex');
};

/**
 * Creates `diff` directive with `Diff-Name` from filter (if found) and with
 * checksum of the new filter and number of lines of the patch.
 *
 * @param oldFilterContent Old filter content.
 * @param newFilterContent New filter content.
 * @param patchContent Patch content.
 *
 * @returns Created `diff` directive.
 */
const createDiffDirective = (oldFilterContent, newFilterContent, patchContent) => {
    const diffPath = parseTag(DIFF_PATH_TAG, oldFilterContent);
    const [, resourceName] = (diffPath || '').split('#');
    const checksum = calculateChecksum(newFilterContent);
    const lines = patchContent.split('\n').length - 1;
    const timestampMs = Date.now();
    return resourceName
        ? `diff name:${resourceName} checksum:${checksum} lines:${lines} timestamp:${timestampMs}`
        : `diff checksum:${checksum} lines:${lines} timestamp:${timestampMs}`;
};

const DEFAULT_PATCH_TTL_SECONDS = 60 * 60 * 24 * 7;
var Resolution;
(function (Resolution) {
    Resolution["Hours"] = "h";
    Resolution["Minutes"] = "m";
    Resolution["Seconds"] = "s";
})(Resolution || (Resolution = {}));
/**
 * Detects type of diff changes: add or delete.
 *
 * @param line Line of string to parse.
 *
 * @returns String type: 'Add' or 'Delete' or null if type cannot be parsed.
 */
const detectTypeOfChanges = (line) => {
    if (line.startsWith('+')) {
        return TypesOfChanges.Add;
    }
    if (line.startsWith('-')) {
        return TypesOfChanges.Delete;
    }
    return null;
};
/**
 * Creates patch in [RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS).
 *
 * @param oldFile Old file.
 * @param newFile New file.
 *
 * @returns Difference between old and new files in RCS format.
 */
const createPatch = (oldFile, newFile) => {
    const { hunks } = structuredPatch('oldFile', 'newFile', oldFile, newFile, '', '', {
        context: 0,
        ignoreCase: false,
    });
    const outDiff = [];
    let stringsToAdd = [];
    let nStringsToDelete = 0;
    const collectParsedDiffBlock = (curIndex, deleted, added) => {
        if (deleted > 0) {
            const deleteFromPosition = curIndex;
            const rcsLines = [`d${deleteFromPosition} ${deleted}`];
            return rcsLines;
        }
        if (added.length > 0) {
            const addFromPosition = curIndex - 1;
            const rcsLines = [
                `a${addFromPosition} ${added.length}`,
                ...added,
            ];
            return rcsLines;
        }
        return [];
    };
    hunks.forEach((hunk) => {
        const { oldStart, lines } = hunk;
        let fileIndexScanned = oldStart;
        // Library will print some debug info so we need to skip this line.
        const filteredLines = lines.filter((l) => l !== '\\ No newline at end of file');
        for (let index = 0; index < filteredLines.length; index += 1) {
            const line = filteredLines[index];
            // Detect type of diff operation
            const typeOfChange = detectTypeOfChanges(line);
            // Library will print some debug info so we need to skip this line.
            if (typeOfChange === null) {
                throw new Error(`Cannot parse line: ${line}`);
            }
            if (typeOfChange === TypesOfChanges.Delete) {
                // In RCS format we don't need content of deleted string.
                nStringsToDelete += 1;
            }
            if (typeOfChange === TypesOfChanges.Add) {
                // Slice "+" from the start of string.
                stringsToAdd.push(line.slice(1));
            }
            // Check type of next line for possible change diff type from 'add'
            // to 'delete' or from 'delete' to 'add'.
            const nextLineTypeOfChange = index + 1 < filteredLines.length
                ? detectTypeOfChanges(filteredLines[index + 1])
                : null;
            // If type will change - save current block
            const typeWillChangeOnNextLine = nextLineTypeOfChange && typeOfChange !== nextLineTypeOfChange;
            // Or if current line is the last - we need to save collected info.
            const isLastLine = index === filteredLines.length - 1;
            if (typeWillChangeOnNextLine || isLastLine) {
                const diffRCSLines = collectParsedDiffBlock(fileIndexScanned, nStringsToDelete, stringsToAdd);
                outDiff.push(...diffRCSLines);
                // Drop counters
                nStringsToDelete = 0;
                stringsToAdd = [];
                // Move scanned index
                fileIndexScanned += index + 1;
            }
        }
    });
    return outDiff.join('\n');
};
/**
 * Creates tag for filter list metadata.
 *
 * @param tagName Name of the tag.
 * @param value Value of the tag.
 *
 * @returns Created tag in `! ${tagName}: ${value}` format.
 */
const createTag = (tagName, value) => {
    return `! ${tagName}: ${value}`;
};
/**
 * Finds tag by tag name in filter content and if found - updates with provided
 * value, if not - creates new tag and insert to first line of the filter.
 *
 * @param tagName Name of the tag.
 * @param tagValue Value of the tag.
 * @param filterContent Array of filter's rules.
 *
 * @returns Filter content with updated or created tag.
 */
const findAndUpdateTag = (tagName, tagValue, filterContent) => {
    // Make copy
    const updatedFile = filterContent.slice();
    const updatedTag = createTag(tagName, tagValue);
    if (parseTag(tagName, updatedFile)) {
        const oldExpiresTagIdx = updatedFile.findIndex((line) => line.includes(tagName));
        updatedFile[oldExpiresTagIdx] = updatedTag;
    }
    else {
        updatedFile.unshift(updatedTag);
    }
    return updatedFile;
};
/**
 * Scans `pathToPatches` for files with the "*.patch" pattern and deletes those
 * whose `mtime` has expired.
 *
 * @param pathToPatches Directory for scan.
 * @param deleteOlderThanSeconds The time to live for the patch in *seconds*.
 *
 * @returns Returns number of deleted patches.
 */
const deleteOutdatedPatches = async (pathToPatches, deleteOlderThanSeconds) => {
    const PATCH_EXTENSION = '.patch';
    const files = await fs.promises.readdir(pathToPatches);
    const tasksToDeleteFiles = [];
    for (const file of files) {
        if (!file.endsWith(PATCH_EXTENSION)) {
            continue;
        }
        const filePath = path.resolve(pathToPatches, file);
        // eslint-disable-next-line no-await-in-loop
        const fileStat = await fs.promises.stat(filePath);
        const deleteOlderThanMs = deleteOlderThanSeconds * 1000;
        const deleteOlderThanDate = new Date(new Date().getTime() - deleteOlderThanMs);
        if (fileStat.mtime.getTime() < deleteOlderThanDate.getTime()) {
            // eslint-disable-next-line no-await-in-loop
            tasksToDeleteFiles.push(fs.promises.rm(filePath));
        }
    }
    const deleted = await Promise.all(tasksToDeleteFiles);
    return deleted.length;
};
/**
 * Generates a creation time timestamp based on the specified resolution.
 *
 * @param resolution The desired resolution for the timestamp (Minutes, Seconds,
 * or Hours).
 *
 * @returns A timestamp representing the creation time based on the specified
 * resolution.
 */
const generateCreationTime = (resolution) => {
    switch (resolution) {
        case Resolution.Minutes:
            return Math.round(Date.now() / (1000 * 60));
        case Resolution.Seconds:
            return Math.round(Date.now() / 1000);
        case Resolution.Hours:
        default:
            return Math.round(Date.now() / (1000 * 60 * 60));
    }
};
/**
 * Checks if a patch is empty based on certain criteria.
 *
 * @param patch The patch to be checked.
 *
 * @returns Returns `true` if the patch is empty, otherwise `false`.
 */
const checkIfPatchIsEmpty = (patch) => {
    const lines = patch.split('\n');
    if (lines.length === 3
        && lines[0] === 'd1 1'
        && lines[1] === 'a1 1'
        && lines[2].startsWith(` ${DIFF_PATH_TAG}`)) {
        return true;
    }
    return false;
};
/**
 * Creates a logger function with the specified "verbose" setting.
 *
 * @param verbose A flag indicating whether to output messages.
 *
 * @returns Function for logging messages.
 */
const createLogger = (verbose) => {
    return (message) => {
        if (verbose) {
            console.log(message);
        }
    };
};
/**
 * First verifies the version tags in the old and new filters, ensuring they are
 * present and in the correct order. Then calculates the difference between
 * the old and new filters in [RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS).
 * Optionally, calculates a diff directive with the name, checksum of new filter,
 * and line count, extracting the name from the `Diff-Name` tag in the old filter.
 * The resulting diff is saved to a patch file with the version number in the
 * specified path. Also updates the `Diff-Path` tag in the new filter.
 * Additionally, an empty patch file for the newer version is created.
 * Finally, scans the patch directory and deletes patches with the ".patch"
 * extension that have an mtime older than the specified threshold.
 *
 * @param oldFilterPath The relative path to the old filter.
 * @param newFilterPath The relative path to the new filter.
 * @param patchesPath The relative path to the directory where the patch should
 * be saved. The patch filename will be `<path_to_patches>/$PATCH_VERSION.patch`,
 * where `$PATCH_VERSION` is the value of `Version` from `<old_filter>`.
 * @param name Name of the patch file, an arbitrary string to identify the patch.
 * Must be a string of length 1-64 with no spaces or other special characters.
 * @param time Expiration time for the diff update (the unit depends on `resolution`).
 * @param resolution Is an optional flag, that specifies the resolution for
 * both `expirationPeriod` and `epochTimestamp` (timestamp when the patch was
 * generated). It can be either `h` (hours), `m` (minutes) or `s` (seconds).
 * If `resolution` is not specified, it is assumed to be `h`.
 * @param checksum An optional flag, indicating whether it should calculate
 * the SHA sum for the filter and add it to the `diff` directive with the filter
 * name and the number of changed lines, following this format:
 * `diff name:[name] checksum:[checksum] lines:[lines]`.
 * @param deleteOlderThanSec An optional parameter, the time to live for the patch
 * in *seconds*. By default, it will be `604800` (7 days). The utility will
 * scan `<path_to_patches>` and delete patches whose `mtime` has expired.
 * @param verbose Verbose mode.
 */
const buildDiff = async (oldFilterPath, newFilterPath, patchesPath, name, time, resolution = Resolution.Hours, checksum = false, deleteOlderThanSec = DEFAULT_PATCH_TTL_SECONDS, verbose = false) => {
    const log = createLogger(verbose);
    // Paths
    const prevListPath = path.resolve(process.cwd(), oldFilterPath);
    const newListPath = path.resolve(process.cwd(), newFilterPath);
    const pathToPatches = path.resolve(process.cwd(), patchesPath);
    // Filters' content
    const oldFile = await fs.promises.readFile(prevListPath, { encoding: 'utf-8' });
    let newFile = await fs.promises.readFile(newListPath, { encoding: 'utf-8' });
    // End of files
    const endOfOldFile = /\r\n$/gm.test(oldFile) ? '\r\n' : '\n';
    const endOfNewFile = /\r\n$/gm.test(newFile) ? '\r\n' : '\n';
    // Splitted filters' content
    const oldFileSplitted = oldFile.split(endOfOldFile);
    let newFileSplitted = newFile.split(endOfNewFile);
    const oldFileDiffName = parseTag(DIFF_PATH_TAG, oldFileSplitted);
    // Create folder for patches if it doesn't exists.
    if (!fs.existsSync(pathToPatches)) {
        await fs.promises.mkdir(pathToPatches, { recursive: true });
        log(`Folder for patches does not exists, created at '${pathToPatches}'.`);
    }
    // Scan patches folder and delete outdated patches.
    const deleted = await deleteOutdatedPatches(pathToPatches, deleteOlderThanSec);
    log(`Deleted outdated patches: ${deleted}`);
    // If files are the same - do nothing.
    if (calculateChecksum(oldFile) === calculateChecksum(newFile)) {
        log('Files are the same. Do nothing.');
        return;
    }
    // Generate name for new patch
    const epochTimestamp = generateCreationTime(resolution);
    const newFileDiffName = resolution && resolution !== Resolution.Hours
        ? `${name}-${resolution}-${epochTimestamp}-${time}.patch`
        : `${name}-${epochTimestamp}-${time}.patch`;
    if (oldFileDiffName === newFileDiffName) {
        // eslint-disable-next-line max-len
        throw new Error(`Old patch name "${oldFileDiffName}" and new patch name "${newFileDiffName}" are the same. Change the unit of measure to a smaller one or wait.`);
    }
    // Create empty patch for future version if it doesn't exists.
    const emptyPatchForNewVersion = path.join(pathToPatches, newFileDiffName);
    if (!fs.existsSync(emptyPatchForNewVersion)) {
        await fs.promises.writeFile(emptyPatchForNewVersion, '');
        log(`Created patch for new filter at ${emptyPatchForNewVersion}.`);
    }
    // Note: Update `Diff-Path` before calculating the diff to ensure
    // that changing `Diff-Path` will be correctly included in the resulting
    // diff patch.
    // But don't save changes in file yet, because we need to check that patch
    // will be not empty.
    const pathToPatchesRelativeToNewFilter = path.relative(path.dirname(newFilterPath), pathToPatches);
    newFileSplitted = await findAndUpdateTag(DIFF_PATH_TAG, path.join(pathToPatchesRelativeToNewFilter, newFileDiffName), newFileSplitted);
    newFile = newFileSplitted.join(endOfNewFile);
    // We cannot save diff, if diff in old file doesn't exists.
    if (!oldFileDiffName) {
        log('Not found "Diff-Path" in the old filter. Patch can not be created.');
        return;
    }
    // Calculate diff
    let patch = createPatch(oldFile, newFile);
    // Keep diff empty if patch contains only info about changing diff-path
    // FIXME: Change logic, because new filter wouldn't contain Diff-Path yet.
    if (checkIfPatchIsEmpty(patch)) {
        log('No changes detected between old and new files. Patch would not be created.');
        return;
    }
    // After checking that patch is not empty we can save path to new patch
    // in the new file.
    await fs.promises.writeFile(newListPath, newFile);
    // Add checksum to patch if requested
    if (checksum) {
        const diffDirective = createDiffDirective(oldFileSplitted, newFile, patch);
        patch = diffDirective.concat('\n', patch);
    }
    // Diff-Path contains path relative to the filter path, so we need
    // to resolve path.
    const oldFilePatch = path.resolve(path.dirname(prevListPath), oldFileDiffName);
    // Save diff to patch file.
    await fs.promises.writeFile(oldFilePatch, patch);
    log(`Wrote patch to: ${oldFilePatch}`);
};

export { buildDiff };
