import { describe, it, expect } from 'vitest';
import { parseDictionary } from '../src/parser.js';

describe('parseDictionary', () => {
  describe('正常系', () => {
    it('サンプルデータが正しくパースできること', () => {
      const input = `
game

<名>
- 試合、勝ち負けを決める遊び [類: match] [対: practice]
> Play a game. | 試合をする
> The game is over. | 試合終了

- 獲物、狩りの対象 [関: hunt]
> big game | 大物の獲物

- （賭け）をする [源: ghem] [古]

<動>
- 狩猟する
- 遊ぶ [例: Play a game. | ゲームをする]
`;

      const result = parseDictionary(input);

      expect(result).toHaveLength(1);

      const entry = result[0];
      expect(entry.term).toBe('game');
      expect(entry.definitions).toHaveLength(2);

      // 名詞ブロック
      const noun = entry.definitions[0];
      expect(noun.pos).toBe('名');
      expect(noun.meanings).toHaveLength(3);

      // 名詞の1つ目の意味
      const meaning1 = noun.meanings[0];
      expect(meaning1.gloss).toBe('試合、勝ち負けを決める遊び');
      expect(meaning1.tags).toEqual({ '類': ['match'], '対': ['practice'] });
      expect(meaning1.examples).toEqual([
        { original: 'Play a game.', translation: '試合をする' },
        { original: 'The game is over.', translation: '試合終了' },
      ]);

      // 名詞の2つ目の意味
      const meaning2 = noun.meanings[1];
      expect(meaning2.gloss).toBe('獲物、狩りの対象');
      expect(meaning2.tags).toEqual({ '関': ['hunt'] });
      expect(meaning2.examples).toEqual([
        { original: 'big game', translation: '大物の獲物' },
      ]);

      // 名詞の3つ目の意味
      const meaning3 = noun.meanings[2];
      expect(meaning3.gloss).toBe('（賭け）をする');
      expect(meaning3.tags).toEqual({ '源': ['ghem'], '古': [] });
      expect(meaning3.examples).toEqual([]);

      // 動詞ブロック
      const verb = entry.definitions[1];
      expect(verb.pos).toBe('動');
      expect(verb.meanings).toHaveLength(2);

      // 動詞の1つ目の意味
      expect(verb.meanings[0].gloss).toBe('狩猟する');
      expect(verb.meanings[0].tags).toEqual({});
      expect(verb.meanings[0].examples).toEqual([]);

      // 動詞の2つ目の意味
      expect(verb.meanings[1].gloss).toBe('遊ぶ');
      expect(verb.meanings[1].tags).toEqual({ '例': ['Play a game. | ゲームをする'] });
      expect(verb.meanings[1].examples).toEqual([]);
    });

    it('シンプルな単語が正しくパースできること', () => {
      const input = `
hello

<間>
- こんにちは
`;

      const result = parseDictionary(input);

      expect(result).toHaveLength(1);
      expect(result[0].term).toBe('hello');
      expect(result[0].definitions[0].pos).toBe('間');
      expect(result[0].definitions[0].meanings[0].gloss).toBe('こんにちは');
    });

    it('複数のタグ値がカンマ区切りで指定できること', () => {
      const input = `
run

<動>
- 走る [類: sprint, dash, jog]
`;

      const result = parseDictionary(input);

      expect(result[0].definitions[0].meanings[0].tags).toEqual({
        '類': ['sprint', 'dash', 'jog'],
      });
    });

    it('値なしタグ（[古]など）が正しく処理されること', () => {
      const input = `
thee

<代>
- 汝を [古] [文語]
`;

      const result = parseDictionary(input);

      expect(result[0].definitions[0].meanings[0].tags).toEqual({
        '古': [],
        '文語': [],
      });
    });

    it('空行が無視されること', () => {
      const input = `

word


<名>


- 単語


`;

      const result = parseDictionary(input);

      expect(result).toHaveLength(1);
      expect(result[0].term).toBe('word');
    });
  });

  describe('インデント', () => {
    it('行頭にスペースがあっても正しくパースできること', () => {
      const input = `
  test
    <名>
      - テスト
        > a test | テスト
`;

      const result = parseDictionary(input);

      expect(result).toHaveLength(1);
      expect(result[0].term).toBe('test');
      expect(result[0].definitions[0].pos).toBe('名');
      expect(result[0].definitions[0].meanings[0].gloss).toBe('テスト');
      expect(result[0].definitions[0].meanings[0].examples).toEqual([
        { original: 'a test', translation: 'テスト' },
      ]);
    });
  });

  describe('エラー系', () => {
    it('見出し語より前に品詞がある場合にエラーをスローすること', () => {
      const input = `
<名>
- 単語
`;

      expect(() => parseDictionary(input)).toThrow(/POS.*before term/);
    });

    it('品詞より前に訳語がある場合にエラーをスローすること', () => {
      const input = `
word
- 単語
`;

      expect(() => parseDictionary(input)).toThrow(/Meaning.*before POS/);
    });

    it('訳語より前に例文がある場合にエラーをスローすること', () => {
      const input = `
word
<名>
> example | 例
`;

      expect(() => parseDictionary(input)).toThrow(/Example.*before meaning/);
    });

  });

  describe('複数エントリー', () => {
    it('1つのテキスト内に複数のエントリーがあっても配列として返ること', () => {
      const input = `
apple

<名>
- りんご

banana

<名>
- バナナ

cherry

<名>
- さくらんぼ
`;

      const result = parseDictionary(input);

      expect(result).toHaveLength(3);
      expect(result[0].term).toBe('apple');
      expect(result[0].definitions[0].meanings[0].gloss).toBe('りんご');
      expect(result[1].term).toBe('banana');
      expect(result[1].definitions[0].meanings[0].gloss).toBe('バナナ');
      expect(result[2].term).toBe('cherry');
      expect(result[2].definitions[0].meanings[0].gloss).toBe('さくらんぼ');
    });
  });

  describe('エッジケース', () => {
    it('空の入力に対して空の配列を返すこと', () => {
      const result = parseDictionary('');
      expect(result).toEqual([]);
    });

    it('例文に | が含まれない場合もそのまま格納されること', () => {
      const input = `
word

<名>
- 単語
> example without translation
`;

      const result = parseDictionary(input);

      expect(result[0].definitions[0].meanings[0].examples).toEqual([
        { original: 'example without translation', translation: '' },
      ]);
    });

    it('複数の品詞ブロックを持つエントリーが正しくパースできること', () => {
      const input = `
test

<名>
- テスト
- 試験

<動>
- 試す
- テストする
`;

      const result = parseDictionary(input);

      expect(result[0].definitions).toHaveLength(2);
      expect(result[0].definitions[0].pos).toBe('名');
      expect(result[0].definitions[0].meanings).toHaveLength(2);
      expect(result[0].definitions[1].pos).toBe('動');
      expect(result[0].definitions[1].meanings).toHaveLength(2);
    });

    it('タグが複数行にわたって追加されないこと（各行独立）', () => {
      const input = `
word

<名>
- 意味1 [類: syn1]
- 意味2
`;

      const result = parseDictionary(input);

      expect(result[0].definitions[0].meanings[0].tags).toEqual({ '類': ['syn1'] });
      expect(result[0].definitions[0].meanings[1].tags).toEqual({});
    });
  });
});
