# conlang-dict-parser

## 使い方

```typescript
import { parseDictionary } from 'conlang-dict-parser';

const text = `
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
- 遊ぶ [例: Play a game ]
`;

const entries = parseDictionary(text);
console.log(JSON.stringify(entries, null, 2));
```

## 出力例

```json
[
  {
    "term": "game",
    "definitions": [
      {
        "pos": "名",
        "meanings": [
          {
            "gloss": "試合、勝ち負けを決める遊び",
            "tags": { "類": ["match"], "対": ["practice"] },
            "examples": [
              { "original": "Play a game.", "translation": "試合をする" },
              { "original": "The game is over.", "translation": "試合終了" }
            ]
          },
          {
            "gloss": "獲物、狩りの対象",
            "tags": { "関": ["hunt"] },
            "examples": [
              { "original": "big game", "translation": "大物の獲物" }
            ]
          },
          {
            "gloss": "（賭け）をする",
            "tags": { "源": ["ghem"], "古": [] },
            "examples": []
          }
        ]
      },
      {
        "pos": "動",
        "meanings": [
          {
            "gloss": "狩猟する",
            "tags": {},
            "examples": []
          },
          {
            "gloss": "遊ぶ",
            "tags": { "例": ["Play a game"] },
            "examples": []
          }
        ]
      }
    ]
  }
]
```

## DTD仕様

| 階層 | 要素         | 記号 | 記述ルール                       |
|------|--------------|------|----------------------------------|
| L1   | 見出し語     | (なし) | ファイルの先頭行                 |
| L2   | 品詞ブロック | < >  | <名> など                        |
| L3   | 訳語・語義   | -    | - 訳語、説明、タグもここに書く   |
| L4   | 例文         | >    | > 原文 | 訳文（任意、複数可）         |
| Inline | 埋込タグ   | [ ]  | [類: match]（-行の末尾推奨）     |


## ライセンス
MIT
