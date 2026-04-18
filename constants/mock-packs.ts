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
  hsk1: {
    title: 'HSK 3.0 Lv. 1',
    subtitle: '華語水平 3.0（一級）',
    cover: require('../assets/images/deck_cover_hsk1.png'),
    wordCount: 10,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-cat.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          { id: 'hsk1-1',  word: '你好', pinyin: 'nǐ hǎo',   meaning: 'Hello',        partOfSpeech: 'phrase', illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#7dd3fc' },
          { id: 'hsk1-2',  word: '谢谢', pinyin: 'xièxie',   meaning: 'Thank you',    partOfSpeech: 'phrase', illustrationUrl: require('../assets/images/illustration-dog.png'),     audioUrl: '', cardColor: '#86efac' },
          { id: 'hsk1-3',  word: '再见', pinyin: 'zàijiàn',  meaning: 'Goodbye',      partOfSpeech: 'phrase', illustrationUrl: require('../assets/images/illustration-bird.png'),    audioUrl: '', cardColor: '#f6a275' },
          { id: 'hsk1-4',  word: '是',   pinyin: 'shì',      meaning: 'To be / Yes',  partOfSpeech: 'v.',     illustrationUrl: require('../assets/images/illustration-chicken.png'), audioUrl: '', cardColor: '#f472b6' },
          { id: 'hsk1-5',  word: '不',   pinyin: 'bù',       meaning: 'No / Not',     partOfSpeech: 'adv.',   illustrationUrl: require('../assets/images/illustration-pig.png'),     audioUrl: '', cardColor: '#262626' },
          { id: 'hsk1-6',  word: '我',   pinyin: 'wǒ',       meaning: 'I / Me',       partOfSpeech: 'pron.',  illustrationUrl: require('../assets/images/illustration-cow.png'),     audioUrl: '', cardColor: '#2dd4bf' },
          { id: 'hsk1-7',  word: '你',   pinyin: 'nǐ',       meaning: 'You',          partOfSpeech: 'pron.',  illustrationUrl: require('../assets/images/illustration-horse.png'),   audioUrl: '', cardColor: '#fef08a' },
          { id: 'hsk1-8',  word: '他',   pinyin: 'tā',       meaning: 'He / Him',     partOfSpeech: 'pron.',  illustrationUrl: require('../assets/images/illustration-mouse.png'),   audioUrl: '', cardColor: '#ce9c89' },
          { id: 'hsk1-9',  word: '她',   pinyin: 'tā',       meaning: 'She / Her',    partOfSpeech: 'pron.',  illustrationUrl: require('../assets/images/illustration-tiger.png'),   audioUrl: '', cardColor: '#312e81' },
          { id: 'hsk1-10', word: '我们', pinyin: 'wǒmen',    meaning: 'We / Us',      partOfSpeech: 'pron.',  illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#7D69AB' },
        ],
      },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-dog.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv3', level: 3, cardCount: 10, thumbnail: require('../assets/images/illustration-dog.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
    ],
  },
  hsk2: {
    title: 'HSK 3.0 Lv. 2',
    subtitle: '華語水平 3.0（二級）',
    cover: require('../assets/images/deck_cover_hsk2.png'),
    wordCount: 10,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-cat.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          { id: 'hsk2-1',  word: '学习', pinyin: 'xuéxí',    meaning: 'To study',     partOfSpeech: 'v.',  illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#7dd3fc' },
          { id: 'hsk2-2',  word: '工作', pinyin: 'gōngzuò',  meaning: 'Work / Job',   partOfSpeech: 'n.',  illustrationUrl: require('../assets/images/illustration-dog.png'),     audioUrl: '', cardColor: '#86efac' },
          { id: 'hsk2-3',  word: '吃饭', pinyin: 'chīfàn',   meaning: 'To eat',       partOfSpeech: 'v.',  illustrationUrl: require('../assets/images/illustration-pig.png'),     audioUrl: '', cardColor: '#f6a275' },
          { id: 'hsk2-4',  word: '喝水', pinyin: 'hēshuǐ',   meaning: 'To drink water',partOfSpeech: 'v.', illustrationUrl: require('../assets/images/illustration-bird.png'),    audioUrl: '', cardColor: '#7dd3fc' },
          { id: 'hsk2-5',  word: '睡觉', pinyin: 'shuìjiào', meaning: 'To sleep',     partOfSpeech: 'v.',  illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#312e81' },
          { id: 'hsk2-6',  word: '朋友', pinyin: 'péngyǒu',  meaning: 'Friend',       partOfSpeech: 'n.',  illustrationUrl: require('../assets/images/illustration-horse.png'),   audioUrl: '', cardColor: '#f472b6' },
          { id: 'hsk2-7',  word: '家',   pinyin: 'jiā',      meaning: 'Home / Family',partOfSpeech: 'n.',  illustrationUrl: require('../assets/images/illustration-dog.png'),     audioUrl: '', cardColor: '#fef08a' },
          { id: 'hsk2-8',  word: '学校', pinyin: 'xuéxiào',  meaning: 'School',       partOfSpeech: 'n.',  illustrationUrl: require('../assets/images/illustration-chicken.png'), audioUrl: '', cardColor: '#2dd4bf' },
          { id: 'hsk2-9',  word: '老师', pinyin: 'lǎoshī',   meaning: 'Teacher',      partOfSpeech: 'n.',  illustrationUrl: require('../assets/images/illustration-cow.png'),     audioUrl: '', cardColor: '#ce9c89' },
          { id: 'hsk2-10', word: '学生', pinyin: 'xuésheng', meaning: 'Student',      partOfSpeech: 'n.',  illustrationUrl: require('../assets/images/illustration-tiger.png'),   audioUrl: '', cardColor: '#7D69AB' },
        ],
      },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-dog.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv3', level: 3, cardCount: 10, thumbnail: require('../assets/images/illustration-dog.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
    ],
  },
  hsk3: {
    title: 'HSK 3.0 Lv. 3',
    subtitle: '華語水平 3.0（三級）',
    cover: require('../assets/images/deck_cover_hsk3.png'),
    wordCount: 10,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      { id: 'lv1', level: 1, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
    ],
  },
  hsk4: {
    title: 'HSK 3.0 Lv. 4',
    subtitle: '華語水平 3.0（四級）',
    cover: require('../assets/images/deck_cover_hsk4.png'),
    wordCount: 10,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      { id: 'lv1', level: 1, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
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
  t4: {
    title: 'Clothe & Accessories',
    subtitle: '衣服配飾',
    cover: require('../assets/images/deck_cover_clothe_accessories.png'),
    wordCount: 40,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-cat.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          { id: 't4-1',  word: '衬衫', pinyin: 'chènshān',  meaning: 'Shirt',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#7dd3fc' },
          { id: 't4-2',  word: '裤子', pinyin: 'kùzi',      meaning: 'Pants',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-dog.png'),     audioUrl: '', cardColor: '#312e81' },
          { id: 't4-3',  word: '鞋子', pinyin: 'xiézi',     meaning: 'Shoes',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pig.png'),     audioUrl: '', cardColor: '#f6a275' },
          { id: 't4-4',  word: '帽子', pinyin: 'màozi',     meaning: 'Hat',      partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-bird.png'),    audioUrl: '', cardColor: '#86efac' },
          { id: 't4-5',  word: '裙子', pinyin: 'qúnzi',     meaning: 'Skirt',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-chicken.png'), audioUrl: '', cardColor: '#f472b6' },
          { id: 't4-6',  word: '手套', pinyin: 'shǒutào',   meaning: 'Gloves',   partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-horse.png'),   audioUrl: '', cardColor: '#ce9c89' },
          { id: 't4-7',  word: '外套', pinyin: 'wàitào',    meaning: 'Coat',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cow.png'),     audioUrl: '', cardColor: '#2dd4bf' },
          { id: 't4-8',  word: '领带', pinyin: 'lǐngdài',   meaning: 'Tie',      partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-mouse.png'),   audioUrl: '', cardColor: '#fef08a' },
          { id: 't4-9',  word: '袜子', pinyin: 'wàzi',      meaning: 'Socks',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-fish.png'),    audioUrl: '', cardColor: '#7D69AB' },
          { id: 't4-10', word: '包',   pinyin: 'bāo',       meaning: 'Bag',      partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-tiger.png'),   audioUrl: '', cardColor: '#262626' },
        ],
      },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv3', level: 3, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
    ],
  },
  t5: {
    title: 'Body Parts',
    subtitle: '身體部位',
    cover: require('../assets/images/deck_cover_body_parts.png'),
    wordCount: 40,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-cat.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          { id: 't5-1',  word: '头',   pinyin: 'tóu',      meaning: 'Head',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#f6a275' },
          { id: 't5-2',  word: '眼睛', pinyin: 'yǎnjing',  meaning: 'Eyes',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-dog.png'),     audioUrl: '', cardColor: '#7dd3fc' },
          { id: 't5-3',  word: '鼻子', pinyin: 'bízi',     meaning: 'Nose',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pig.png'),     audioUrl: '', cardColor: '#f472b6' },
          { id: 't5-4',  word: '嘴巴', pinyin: 'zuǐba',    meaning: 'Mouth',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-bird.png'),    audioUrl: '', cardColor: '#86efac' },
          { id: 't5-5',  word: '耳朵', pinyin: 'ěrduo',    meaning: 'Ear',      partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cow.png'),     audioUrl: '', cardColor: '#fef08a' },
          { id: 't5-6',  word: '手',   pinyin: 'shǒu',     meaning: 'Hand',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-chicken.png'), audioUrl: '', cardColor: '#ce9c89' },
          { id: 't5-7',  word: '脚',   pinyin: 'jiǎo',     meaning: 'Foot',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-horse.png'),   audioUrl: '', cardColor: '#2dd4bf' },
          { id: 't5-8',  word: '腿',   pinyin: 'tuǐ',      meaning: 'Leg',      partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-mouse.png'),   audioUrl: '', cardColor: '#312e81' },
          { id: 't5-9',  word: '肚子', pinyin: 'dùzi',     meaning: 'Stomach',  partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-fish.png'),    audioUrl: '', cardColor: '#7D69AB' },
          { id: 't5-10', word: '背',   pinyin: 'bèi',      meaning: 'Back',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-tiger.png'),   audioUrl: '', cardColor: '#262626' },
        ],
      },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv3', level: 3, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
    ],
  },
  t6: {
    title: 'Furniture & Appliances',
    subtitle: '家具家電',
    cover: require('../assets/images/deck_cover_furniture_appliances.png'),
    wordCount: 40,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-cat.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          { id: 't6-1',  word: '桌子', pinyin: 'zhuōzi',   meaning: 'Table',           partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#ce9c89' },
          { id: 't6-2',  word: '椅子', pinyin: 'yǐzi',     meaning: 'Chair',           partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-dog.png'),     audioUrl: '', cardColor: '#7dd3fc' },
          { id: 't6-3',  word: '床',   pinyin: 'chuáng',   meaning: 'Bed',             partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#312e81' },
          { id: 't6-4',  word: '冰箱', pinyin: 'bīngxiāng',meaning: 'Refrigerator',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-bird.png'),    audioUrl: '', cardColor: '#7dd3fc' },
          { id: 't6-5',  word: '电视', pinyin: 'diànshì',  meaning: 'TV',              partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pig.png'),     audioUrl: '', cardColor: '#262626' },
          { id: 't6-6',  word: '沙发', pinyin: 'shāfā',    meaning: 'Sofa',            partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cow.png'),     audioUrl: '', cardColor: '#f6a275' },
          { id: 't6-7',  word: '窗户', pinyin: 'chuānghu', meaning: 'Window',          partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-horse.png'),   audioUrl: '', cardColor: '#86efac' },
          { id: 't6-8',  word: '门',   pinyin: 'mén',      meaning: 'Door',            partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-chicken.png'), audioUrl: '', cardColor: '#fef08a' },
          { id: 't6-9',  word: '洗衣机',pinyin: 'xǐyījī',  meaning: 'Washing machine', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-mouse.png'),   audioUrl: '', cardColor: '#2dd4bf' },
          { id: 't6-10', word: '空调', pinyin: 'kōngtiáo', meaning: 'Air conditioner', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-tiger.png'),   audioUrl: '', cardColor: '#f472b6' },
        ],
      },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv3', level: 3, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
    ],
  },
  t7: {
    title: 'Sports',
    subtitle: '運動',
    cover: require('../assets/images/deck_cover_animals.png'),
    wordCount: 40,
    packBagImage: require('../assets/images/pack_bag_animals.png'),
    packs: [
      {
        id: 'lv1', level: 1, cardCount: 10,
        thumbnail: require('../assets/images/illustration-cat.png'),
        energyCost: 0, isLocked: false, isPremium: false,
        cards: [
          { id: 't7-1',  word: '足球',  pinyin: 'zúqiú',     meaning: 'Football',   partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cat.png'),     audioUrl: '', cardColor: '#86efac' },
          { id: 't7-2',  word: '篮球',  pinyin: 'lánqiú',    meaning: 'Basketball', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-dog.png'),     audioUrl: '', cardColor: '#f6a275' },
          { id: 't7-3',  word: '游泳',  pinyin: 'yóuyǒng',   meaning: 'Swimming',   partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-fish.png'),    audioUrl: '', cardColor: '#7dd3fc' },
          { id: 't7-4',  word: '跑步',  pinyin: 'pǎobù',     meaning: 'Running',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-horse.png'),   audioUrl: '', cardColor: '#fef08a' },
          { id: 't7-5',  word: '网球',  pinyin: 'wǎngqiú',   meaning: 'Tennis',     partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-bird.png'),    audioUrl: '', cardColor: '#f472b6' },
          { id: 't7-6',  word: '乒乓球',pinyin: 'pīngpāngqiú',meaning: 'Ping pong', partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-chicken.png'), audioUrl: '', cardColor: '#2dd4bf' },
          { id: 't7-7',  word: '棒球',  pinyin: 'bàngqiú',   meaning: 'Baseball',   partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-cow.png'),     audioUrl: '', cardColor: '#ce9c89' },
          { id: 't7-8',  word: '羽毛球',pinyin: 'yǔmáoqiú',  meaning: 'Badminton',  partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-pig.png'),     audioUrl: '', cardColor: '#312e81' },
          { id: 't7-9',  word: '瑜伽',  pinyin: 'yújiā',     meaning: 'Yoga',       partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-tiger.png'),   audioUrl: '', cardColor: '#7D69AB' },
          { id: 't7-10', word: '自行车',pinyin: 'zìxíngchē', meaning: 'Cycling',    partOfSpeech: 'n.', illustrationUrl: require('../assets/images/illustration-mouse.png'),   audioUrl: '', cardColor: '#262626' },
        ],
      },
      { id: 'lv2', level: 2, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: false, cards: [] },
      { id: 'lv3', level: 3, cardCount: 10, thumbnail: require('../assets/images/illustration-cat.png'), energyCost: 1, isLocked: false, isPremium: true,  cards: [] },
    ],
  },
};
