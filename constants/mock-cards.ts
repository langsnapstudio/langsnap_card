export type Card = {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  illustrationKey: string; // resolved to an image in flashcard.tsx
};

export const ANIMALS_CARDS: Card[] = [
  { id: '1',  word: '猫',   pinyin: 'māo',    meaning: 'Cat',     partOfSpeech: 'n.', illustrationKey: 'cat'     },
  { id: '2',  word: '狗',   pinyin: 'gǒu',    meaning: 'Dog',     partOfSpeech: 'n.', illustrationKey: 'dog'     },
  { id: '3',  word: '鸡',   pinyin: 'jī',     meaning: 'Chicken', partOfSpeech: 'n.', illustrationKey: 'chicken' },
  { id: '4',  word: '猪',   pinyin: 'zhū',    meaning: 'Pig',     partOfSpeech: 'n.', illustrationKey: 'pig'     },
  { id: '5',  word: '牛',   pinyin: 'niú',    meaning: 'Cow',     partOfSpeech: 'n.', illustrationKey: 'cow'     },
  { id: '6',  word: '鸟',   pinyin: 'niǎo',   meaning: 'Bird',    partOfSpeech: 'n.', illustrationKey: 'bird'    },
  { id: '7',  word: '鱼',   pinyin: 'yú',     meaning: 'Fish',    partOfSpeech: 'n.', illustrationKey: 'fish'    },
  { id: '8',  word: '马',   pinyin: 'mǎ',     meaning: 'Horse',   partOfSpeech: 'n.', illustrationKey: 'horse'   },
  { id: '9',  word: '老鼠', pinyin: 'lǎoshǔ', meaning: 'Mouse',   partOfSpeech: 'n.', illustrationKey: 'mouse'   },
  { id: '10', word: '老虎', pinyin: 'lǎohǔ',  meaning: 'Tiger',   partOfSpeech: 'n.', illustrationKey: 'tiger'   },
];

export const FRUITS_CARDS: Card[] = [
  { id: '1', word: '菠萝', pinyin: 'bōluó',     meaning: 'Pineapple',  partOfSpeech: 'n.', illustrationKey: 'pineapple' },
  { id: '2', word: '苹果', pinyin: 'píngguǒ',   meaning: 'Apple',      partOfSpeech: 'n.', illustrationKey: 'pineapple' },
  { id: '3', word: '香蕉', pinyin: 'xiāngjiāo', meaning: 'Banana',     partOfSpeech: 'n.', illustrationKey: 'pineapple' },
  { id: '4', word: '橙子', pinyin: 'chéngzi',   meaning: 'Orange',     partOfSpeech: 'n.', illustrationKey: 'pineapple' },
  { id: '5', word: '西瓜', pinyin: 'xīguā',     meaning: 'Watermelon', partOfSpeech: 'n.', illustrationKey: 'pineapple' },
];

export function getCards(deckId: string): Card[] {
  return deckId === 't2' ? FRUITS_CARDS : ANIMALS_CARDS;
}
