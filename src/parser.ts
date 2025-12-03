import type { DictionaryEntry, Definition, Meaning, Example } from './types.js';

/**
 * パーサーオプション
 */


/**
 * パーサーの内部状態
 */
interface ParserState {
  currentEntry: DictionaryEntry | null;
  currentDefinition: Definition | null;
  currentMeaning: Meaning | null;
}

/**
 * 新しいDictionaryEntryを作成
 */
function createEntry(term: string): DictionaryEntry {
  return {
    term,
    definitions: [],
  };
}

/**
 * 新しいDefinition（品詞ブロック）を作成
 */
function createDefinition(pos: string): Definition {
  return {
    pos,
    meanings: [],
  };
}

/**
 * 新しいMeaning（訳語・語義）を作成
 */
function createMeaning(gloss: string, tags: Record<string, string[]>): Meaning {
  return {
    gloss,
    tags,
    examples: [],
  };
}

/**
 * 行から埋込タグ [類: match] [対: practice] を抽出
 * @returns { gloss: タグを除いた本文, tags: 抽出したタグ }
 */
function extractTags(line: string): { gloss: string; tags: Record<string, string[]> } {
  const tags: Record<string, string[]> = {};
  
  // [キー: 値] または [キー] のパターンを抽出
  const tagRegex = /\[([^\]:]+)(?::\s*([^\]]*))?\]/g;
  let match: RegExpExecArray | null;
  
  while ((match = tagRegex.exec(line)) !== null) {
    const key = match[1].trim();
    const value = match[2]?.trim() || '';
    
    if (!tags[key]) {
      tags[key] = [];
    }
    
    if (value) {
      // カンマ区切りで複数の値がある場合は分割
      const values = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
      tags[key].push(...values);
    }
    // 値がない場合（[古]など）は空配列のまま
  }
  
  // タグを除去した本文を返す
  const gloss = line.replace(tagRegex, '').trim();
  
  return { gloss, tags };
}

/**
 * 例文行をパースして Example オブジェクトを返す
 * @param line "> " を除去済みの例文行
 */
function parseExample(line: string): Example {
  const pipeIndex = line.indexOf('|');
  if (pipeIndex === -1) {
    return {
      original: line.trim(),
      translation: '',
    };
  }
  return {
    original: line.slice(0, pipeIndex).trim(),
    translation: line.slice(pipeIndex + 1).trim(),
  };
}

/**
 * 品詞行 <名> から品詞を抽出
 */
function parsePosLine(line: string): string | null {
  const match = line.match(/^<([^>]+)>$/);
  return match ? match[1].trim() : null;
}

/**
 * 現在のMeaningをDefinitionに確定
 */
function finalizeMeaning(state: ParserState): void {
  if (state.currentMeaning && state.currentDefinition) {
    state.currentDefinition.meanings.push(state.currentMeaning);
    state.currentMeaning = null;
  }
}

/**
 * 現在のDefinitionをEntryに確定
 */
function finalizeDefinition(state: ParserState): void {
  finalizeMeaning(state);
  if (state.currentDefinition && state.currentEntry) {
    state.currentEntry.definitions.push(state.currentDefinition);
    state.currentDefinition = null;
  }
}

/**
 * 現在のEntryを結果配列に確定
 */
function finalizeEntry(state: ParserState, entries: DictionaryEntry[]): void {
  finalizeDefinition(state);
  if (state.currentEntry) {
    entries.push(state.currentEntry);
    state.currentEntry = null;
  }
}

/**
 * パースエラーを生成
 */
function createParseError(message: string, lineNumber: number, line: string): Error {
  return new Error(`Parse error at line ${lineNumber}: ${message}\n  > "${line}"`);
}

/**
 * 行の種類を判定
 */
type LineType = 'empty' | 'pos' | 'meaning' | 'example' | 'term';

function getLineType(line: string): LineType {
  if (line === '') {
    return 'empty';
  }
  if (line.startsWith('<') && line.endsWith('>')) {
    return 'pos';
  }
  if (line.startsWith('-')) {
    return 'meaning';
  }
  if (line.startsWith('>')) {
    return 'example';
  }
  return 'term';
}

/**
 * 辞書テキストをパースしてDictionaryEntry配列を返す
 * @param text パースする辞書テキスト
 * @param options パースオプション
 * @returns パース結果のDictionaryEntry配列
 * @throws パースエラーが発生した場合
 */
export function parseDictionary(
  text: string
): DictionaryEntry[] {
  const lines = text.split('\n');
  const entries: DictionaryEntry[] = [];

  const state: ParserState = {
    currentEntry: null,
    currentDefinition: null,
    currentMeaning: null,
  };



  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = lines[i];
    const line = rawLine.trim();

    const lineType = getLineType(line);

    switch (lineType) {
      case 'empty':
        // 空行は無視
        break;

      case 'pos': {
        // 品詞行 <名>
        if (!state.currentEntry) {
          throw createParseError('POS (<...>) found before term', lineNumber, rawLine);
        }
        // 現在のDefinitionを確定
        finalizeDefinition(state);
        const pos = parsePosLine(line);
        if (pos) {
          state.currentDefinition = createDefinition(pos);
        }
        break;
      }

      case 'meaning': {
        // 訳語・語義行 - 訳語、説明 [タグ]
        if (!state.currentEntry) {
          throw createParseError('Meaning (-) found before term', lineNumber, rawLine);
        }
        if (!state.currentDefinition) {
          throw createParseError('Meaning (-) found before POS (<...>)', lineNumber, rawLine);
        }
        // 現在のMeaningを確定
        finalizeMeaning(state);
        
        // - を除去してタグを抽出
        const content = line.slice(1).trim();
        const { gloss, tags } = extractTags(content);
        state.currentMeaning = createMeaning(gloss, tags);
        break;
      }

      case 'example': {
        // 例文行 > 原文 | 訳文
        if (!state.currentEntry) {
          throw createParseError('Example (>) found before term', lineNumber, rawLine);
        }
        if (!state.currentDefinition) {
          throw createParseError('Example (>) found before POS (<...>)', lineNumber, rawLine);
        }
        if (!state.currentMeaning) {
          throw createParseError('Example (>) found before meaning (-)', lineNumber, rawLine);
        }
        // > を除去して例文をパース
        const exampleLine = line.slice(1).trim();
        const example = parseExample(exampleLine);
        state.currentMeaning.examples.push(example);
        break;
      }

      case 'term': {
        // 見出し語（先頭行 or 新しいエントリ）
        // 前のエントリを確定
        finalizeEntry(state, entries);
        state.currentEntry = createEntry(line);
        break;
      }
    }
  }

  // 最後のエントリを確定
  finalizeEntry(state, entries);

  return entries;
}
