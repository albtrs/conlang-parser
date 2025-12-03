"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  parseDictionary: () => parseDictionary
});
module.exports = __toCommonJS(index_exports);

// src/parser.ts
function createEntry(term) {
  return {
    term,
    definitions: []
  };
}
function createDefinition(pos) {
  return {
    pos,
    meanings: []
  };
}
function createMeaning(gloss, tags) {
  return {
    gloss,
    tags,
    examples: []
  };
}
function extractTags(line) {
  const tags = {};
  const tagRegex = /\[([^\]:]+)(?::\s*([^\]]*))?\]/g;
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const key = match[1].trim();
    const value = match[2]?.trim() || "";
    if (!tags[key]) {
      tags[key] = [];
    }
    if (value) {
      const values = value.split(",").map((v) => v.trim()).filter((v) => v.length > 0);
      tags[key].push(...values);
    }
  }
  const gloss = line.replace(tagRegex, "").trim();
  return { gloss, tags };
}
function parseExample(line) {
  const pipeIndex = line.indexOf("|");
  if (pipeIndex === -1) {
    return {
      original: line.trim(),
      translation: ""
    };
  }
  return {
    original: line.slice(0, pipeIndex).trim(),
    translation: line.slice(pipeIndex + 1).trim()
  };
}
function parsePosLine(line) {
  const match = line.match(/^<([^>]+)>$/);
  return match ? match[1].trim() : null;
}
function finalizeMeaning(state) {
  if (state.currentMeaning && state.currentDefinition) {
    state.currentDefinition.meanings.push(state.currentMeaning);
    state.currentMeaning = null;
  }
}
function finalizeDefinition(state) {
  finalizeMeaning(state);
  if (state.currentDefinition && state.currentEntry) {
    state.currentEntry.definitions.push(state.currentDefinition);
    state.currentDefinition = null;
  }
}
function finalizeEntry(state, entries) {
  finalizeDefinition(state);
  if (state.currentEntry) {
    entries.push(state.currentEntry);
    state.currentEntry = null;
  }
}
function createParseError(message, lineNumber, line) {
  return new Error(`Parse error at line ${lineNumber}: ${message}
  > "${line}"`);
}
function getLineType(line) {
  if (line === "") {
    return "empty";
  }
  if (line.startsWith("<") && line.endsWith(">")) {
    return "pos";
  }
  if (line.startsWith("-")) {
    return "meaning";
  }
  if (line.startsWith(">")) {
    return "example";
  }
  return "term";
}
function parseDictionary(text) {
  const lines = text.split("\n");
  const entries = [];
  const state = {
    currentEntry: null,
    currentDefinition: null,
    currentMeaning: null
  };
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineType = getLineType(line);
    switch (lineType) {
      case "empty":
        break;
      case "pos": {
        if (!state.currentEntry) {
          throw createParseError("POS (<...>) found before term", lineNumber, rawLine);
        }
        finalizeDefinition(state);
        const pos = parsePosLine(line);
        if (pos) {
          state.currentDefinition = createDefinition(pos);
        }
        break;
      }
      case "meaning": {
        if (!state.currentEntry) {
          throw createParseError("Meaning (-) found before term", lineNumber, rawLine);
        }
        if (!state.currentDefinition) {
          throw createParseError("Meaning (-) found before POS (<...>)", lineNumber, rawLine);
        }
        finalizeMeaning(state);
        const content = line.slice(1).trim();
        const { gloss, tags } = extractTags(content);
        state.currentMeaning = createMeaning(gloss, tags);
        break;
      }
      case "example": {
        if (!state.currentEntry) {
          throw createParseError("Example (>) found before term", lineNumber, rawLine);
        }
        if (!state.currentDefinition) {
          throw createParseError("Example (>) found before POS (<...>)", lineNumber, rawLine);
        }
        if (!state.currentMeaning) {
          throw createParseError("Example (>) found before meaning (-)", lineNumber, rawLine);
        }
        const exampleLine = line.slice(1).trim();
        const example = parseExample(exampleLine);
        state.currentMeaning.examples.push(example);
        break;
      }
      case "term": {
        finalizeEntry(state, entries);
        state.currentEntry = createEntry(line);
        break;
      }
    }
  }
  finalizeEntry(state, entries);
  return entries;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseDictionary
});
//# sourceMappingURL=index.cjs.map