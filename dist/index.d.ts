/**
 * 例文を表すインターフェース
 */
interface Example {
    /** 原文 */
    original: string;
    /** 翻訳 */
    translation: string;
}
/**
 * 意味（訳語・語義）を表すインターフェース
 */
interface Meaning {
    /** 訳語・語義 */
    gloss: string;
    /** 埋込タグ (例: { "類": ["match"], "対": ["practice"] }) */
    tags: Record<string, string[]>;
    /** 例文 */
    examples: Example[];
}
/**
 * 品詞ブロックを表すインターフェース
 */
interface Definition {
    /** 品詞 (例: "名", "動") */
    pos: string;
    /** 意味の配列 */
    meanings: Meaning[];
}
/**
 * 辞書エントリを表すインターフェース
 */
interface DictionaryEntry {
    /** 見出し語 */
    term: string;
    /** 品詞ごとの定義 */
    definitions: Definition[];
}

/**
 * 辞書テキストをパースしてDictionaryEntry配列を返す
 * @param text パースする辞書テキスト
 * @param options パースオプション
 * @returns パース結果のDictionaryEntry配列
 * @throws パースエラーが発生した場合
 */
declare function parseDictionary(text: string): DictionaryEntry[];

export { type Definition, type DictionaryEntry, type Example, type Meaning, parseDictionary };
