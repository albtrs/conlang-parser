/**
 * 例文を表すインターフェース
 */
export interface Example {
  /** 原文 */
  original: string;
  /** 翻訳 */
  translation: string;
}

/**
 * 意味（訳語・語義）を表すインターフェース
 */
export interface Meaning {
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
export interface Definition {
  /** 品詞 (例: "名", "動") */
  pos: string;
  /** 意味の配列 */
  meanings: Meaning[];
}

/**
 * 辞書エントリを表すインターフェース
 */
export interface DictionaryEntry {
  /** 見出し語 */
  term: string;
  /** 品詞ごとの定義 */
  definitions: Definition[];
}
