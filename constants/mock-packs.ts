// ── Types ──────────────────────────────────────────────────────────────────────
// These mirror exactly what the back office + Supabase will return.
// illustrationUrl / audioUrl / packBagImage will become string URLs when Supabase is ready.
// For now they hold local require() numbers.

export type ExampleSentence = {
  chinese: string;
  pinyin:  string;
  zhuyin?: string;
  meaning: string;
};

export type Card = {
  id: string;
  word: string;
  pinyin: string;
  zhuyin?: string;                  // Taiwan reading system
  meaning: string;
  partOfSpeech: string;
  illustrationUrl: number | string; // number = local require, string = Supabase URL
  audioUrl: number | string;        // number = local require, string = Supabase URL
  cardColor: string;                // hex, picked per card in back office
  tags?: string[];                  // sub-category tags (e.g. 'Mammals', 'Birds')
  exampleSentence1?: ExampleSentence;
  exampleSentence2?: ExampleSentence;
};

export type PackMeta = {
  id: string;
  level: number;
  cardCount: number;
  thumbnail: number | string;       // shown in deck-detail pack list
  energyCost: number;
  isLocked: boolean;
  isPremium: boolean;
  cards: Card[];
  // Optional: back office can pin exactly which 3 card IDs appear in the
  // success screen fan (left, middle, right). When absent, 3 random cards
  // from the pack are picked at runtime.
  featuredCardIds?: [string, string, string];
};

export type DeckMeta = {
  title: string;
  subtitle: string;
  cover: number | string;
  wordCount: number;
  packBagImage: number | string;    // torn-envelope image in pack-opening animation
  packs: PackMeta[];
};

// ── Card color palette (from Langsnap design system) ──────────────────────────
// All 14 presets — token names match the Figma variable names.
// Hex values resolved directly from DS Foundation file variables (figma_execute).
export const CARD_COLOR_PALETTE: Record<string, string> = {
  'white-card':      '#fafafa', // neutral/50
  'cream-card':      '#f4f0e8', // brand/secondary-500
  'yellow-card':     '#fef08a', // yellow/200
  'orange-card':     '#f6a275', // orange/400
  'rose-card':       '#fb7185', // rose/400
  'pink-card':       '#f472b6', // pink/400
  'green-card':      '#86efac', // green/300
  'emerald-card':    '#059669', // emerald/600
  'teal-card':       '#2dd4bf', // teal/400
  'sky-card':        '#7dd3fc', // sky/300
  'deep-blue-card':  '#056b96', // deep-blue/500
  'indigo-card':     '#312e81', // indigo/900
  'brown-card':      '#ce9c89', // brown/400
  'black-card':      '#262626', // neutral/800
};

// Returns '#ffffff' or '#1a1a1a' depending on the card's background luminance,
// so text is always readable regardless of which color is picked.
export function cardTextColor(hex: string): '#ffffff' | '#1a1a1a' {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // Relative luminance (WCAG formula)
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.35 ? '#1a1a1a' : '#ffffff';
}

// Blend hex color toward white by `factor` (0 = original, 1 = white)
export function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' + [r, g, b]
    .map(c => Math.round(c + (255 - c) * factor).toString(16).padStart(2, '0'))
    .join('');
}

// ── Mock data ──────────────────────────────────────────────────────────────────
// Replace this with Supabase API calls when back office is ready.
// Structure must stay the same — only the data source changes.

export const DECK_DATA: Record<string, DeckMeta> = {
  t1: {
    title: 'Animals',
    subtitle: '動物',
    cover: require('../assets/images/deck_cover_animals.png'),
    wordCount: 50,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-cat.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          {
            id: '1', word: '猫', pinyin: 'māo', zhuyin: 'ㄇㄠ', meaning: 'Cat', partOfSpeech: 'n.',
            illustrationUrl: require('../assets/images/illustration-cat.png'),
            audioUrl: require('../assets/audio/01 CN_Cat.MP3'),
            cardColor: '#f6a275', tags: ['Mammals'],
            exampleSentence1: { chinese: '这只猫很可爱。', pinyin: 'Zhè zhī māo hěn kě\'ài.', zhuyin: 'ㄓㄜˋ ㄓ ㄇㄠ ㄏㄣˇ ㄎㄜˇ ㄞˋ。', meaning: 'This cat is very cute.' },
            exampleSentence2: { chinese: '猫喜欢睡觉。', pinyin: 'Māo xǐhuān shuìjiào.', zhuyin: 'ㄇㄠ ㄒㄧˇ ㄏㄨㄢ ㄕㄨㄟˋ ㄐㄧㄠˋ。', meaning: 'Cats like to sleep.' },
          },
          {
            id: '2', word: '狗', pinyin: 'gǒu', zhuyin: 'ㄍㄡˇ', meaning: 'Dog', partOfSpeech: 'n.',
            illustrationUrl: require('../assets/images/illustration-dog.png'),
            audioUrl: require('../assets/audio/02 CN_Dog.MP3'),
            cardColor: '#fef08a', tags: ['Mammals'],
            exampleSentence1: { chinese: '我有一只狗。', pinyin: 'Wǒ yǒu yī zhī gǒu.', zhuyin: 'ㄨㄛˇ ㄧㄡˇ ㄧ ㄓ ㄍㄡˇ。', meaning: 'I have a dog.' },
          },
          {
            id: '3', word: '鸡', pinyin: 'jī', zhuyin: 'ㄐㄧ', meaning: 'Chicken', partOfSpeech: 'n.',
            illustrationUrl: require('../assets/images/illustration-chicken.png'),
            audioUrl: require('../assets/audio/03 CN_Chicken.MP3'),
            cardColor: '#7dd3fc', tags: ['Birds'],
            exampleSentence1: { chinese: '今天我们吃鸡。', pinyin: 'Jīntiān wǒmen chī jī.', zhuyin: 'ㄐㄧㄣ ㄊㄧㄢ ㄨㄛˇ ㄇㄣ ㄔ ㄐㄧ。', meaning: 'Today we eat chicken.' },
          },
          {
            id: '4', word: '猪', pinyin: 'zhū', zhuyin: 'ㄓㄨ', meaning: 'Pig', partOfSpeech: 'n.',
            illustrationUrl: require('../assets/images/illustration-pig.png'),
            audioUrl: require('../assets/audio/04 CN_Pig.MP3'),
            cardColor: '#f472b6', tags: ['Mammals'],
            exampleSentence1: { chinese: '那只猪很胖。', pinyin: 'Nà zhī zhū hěn pàng.', zhuyin: 'ㄋㄚˋ ㄓ ㄓㄨ ㄏㄣˇ ㄆㄤˋ。', meaning: 'That pig is very fat.' },
          },
          {
            id: '5', word: '牛', pinyin: 'niú', zhuyin: 'ㄋㄧㄡˊ', meaning: 'Cow', partOfSpeech: 'n.',
            illustrationUrl: require('../assets/images/illustration-cow.png'),
            audioUrl: require('../assets/audio/05 CN_Cow.MP3'),
            cardColor: '#2dd4bf', tags: ['Mammals'],
            exampleSentence1: { chinese: '这头牛很大。', pinyin: 'Zhè tóu niú hěn dà.', zhuyin: 'ㄓㄜˋ ㄊㄡˊ ㄋㄧㄡˊ ㄏㄣˇ ㄉㄚˋ。', meaning: 'This cow is very big.' },
            exampleSentence2: { chinese: '牛奶很好喝。', pinyin: 'Niúnǎi hěn hǎo hē.', zhuyin: 'ㄋㄧㄡˊ ㄋㄞˇ ㄏㄣˇ ㄏㄠˇ ㄏㄜ。', meaning: 'Milk is very tasty.' },
          },
          { id: '6',  word: '鸟',   pinyin: 'niǎo',   zhuyin: 'ㄋㄧㄠˇ', meaning: 'Bird',  partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-bird.png'),    audioUrl: require('../assets/audio/06 CN_Bird.MP3'),    cardColor: '#ce9c89', tags: ['Birds'] },
          { id: '7',  word: '鱼',   pinyin: 'yú',     zhuyin: 'ㄩˊ',     meaning: 'Fish',  partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-fish.png'),    audioUrl: require('../assets/audio/07 CN_Fish.MP3'),    cardColor: '#7dd3fc', tags: ['Aquatic'] },
          { id: '8',  word: '马',   pinyin: 'mǎ',     zhuyin: 'ㄇㄚˇ',   meaning: 'Horse', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-horse.png'),   audioUrl: require('../assets/audio/08 CN_Horse.MP3'),   cardColor: '#ce9c89', tags: ['Mammals'] },
          { id: '9',  word: '老鼠', pinyin: 'lǎoshǔ', zhuyin: 'ㄌㄠˇ ㄕㄨˇ', meaning: 'Mouse', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-mouse.png'), audioUrl: require('../assets/audio/09 CN_Mouse.MP3'),   cardColor: '#262626', tags: ['Mammals'] },
          { id: '10', word: '老虎', pinyin: 'lǎohǔ',  zhuyin: 'ㄌㄠˇ ㄏㄨˇ', meaning: 'Tiger', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-tiger.png'),  audioUrl: require('../assets/audio/10 CN_Tiger.MP3'),   cardColor: '#312e81', tags: ['Mammals'] },
        ],
      },
      {
        id: 'lv2', level: 2, cardCount: 10,
        thumbnail: require('../assets/images/illustration-dog.png'),
        energyCost: 1, isLocked: false, isPremium: false,
        cards: [], // to be filled when content is ready
      },
      {
        id: 'lv3', level: 3, cardCount: 10,
        thumbnail: require('../assets/images/illustration-dog.png'),
        energyCost: 1, isLocked: false, isPremium: true,
        cards: [],
      },
      {
        id: 'lv4', level: 4, cardCount: 10,
        thumbnail: require('../assets/images/illustration-dog.png'),
        energyCost: 1, isLocked: false, isPremium: true,
        cards: [],
      },
    ],
  },
  t2: {
    title: 'Fruits & Vegetables',
    subtitle: '水果蔬菜',
    cover: require('../assets/images/deck_cover_fruits_vegetables.png'),
    wordCount: 40,
    packBagImage: require('../assets/images/pack_bag_animals.png'), // replace with fruits bag when available
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 5,
        thumbnail: require('../assets/images/illustration-pineapple.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          { id: '1', word: '菠萝', pinyin: 'bōluó',     meaning: 'Pineapple',  partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pineapple.png'), audioUrl: '', cardColor: '#fef08a' }, // yellow-card
          { id: '2', word: '苹果', pinyin: 'píngguǒ',   meaning: 'Apple',      partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pineapple.png'), audioUrl: '', cardColor: '#fb7185' }, // rose-card
          { id: '3', word: '香蕉', pinyin: 'xiāngjiāo', meaning: 'Banana',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pineapple.png'), audioUrl: '', cardColor: '#fef08a' }, // yellow-card
          { id: '4', word: '橙子', pinyin: 'chéngzi',   meaning: 'Orange',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pineapple.png'), audioUrl: '', cardColor: '#f472b6' }, // pink-card
          { id: '5', word: '西瓜', pinyin: 'xīguā',     meaning: 'Watermelon', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pineapple.png'), audioUrl: '', cardColor: '#86efac' }, // green-card
        ],
      },
      {
        id: 'lv2', level: 2, cardCount: 10,
        thumbnail: require('../assets/images/illustration-pineapple.png'),
        energyCost: 1, isLocked: false, isPremium: false,
        cards: [],
      },
      {
        id: 'lv3', level: 3, cardCount: 10,
        thumbnail: require('../assets/images/illustration-pineapple.png'),
        energyCost: 1, isLocked: false, isPremium: true,
        cards: [],
      },
      {
        id: 'lv4', level: 4, cardCount: 10,
        thumbnail: require('../assets/images/illustration-pineapple.png'),
        energyCost: 1, isLocked: false, isPremium: true,
        cards: [],
      },
    ],
  },
  t3: {
    title: 'Food & Drinks',
    subtitle: '食物飲料',
    cover: require('../assets/images/deck_cover_food_drinks.png'),
    wordCount: 45,
    packBagImage: require('../assets/images/pack_bag_animals.png'), // replace when food bag is available
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-bubble-tea.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [],
      },
      {
        id: 'lv2', level: 2, cardCount: 10,
        thumbnail: require('../assets/images/illustration-bubble-tea.png'),
        energyCost: 1, isLocked: false, isPremium: false,
        cards: [],
      },
      {
        id: 'lv3', level: 3, cardCount: 10,
        thumbnail: require('../assets/images/illustration-bubble-tea.png'),
        energyCost: 1, isLocked: false, isPremium: false,
        cards: [],
      },
    ],
  },
};
