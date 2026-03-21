/**
 * Langsnap Card design tokens — sourced from LSC. Foundation 1.0 Figma.
 *
 * Brand purple:  #7D69AB  (brand/primary-500)
 * Cream bg:      #F8F5EF  (surface/cream)
 * Text dark:     #262626  (text/primary)
 */

export const Colors = {
  brand: {
    primary: '#7D69AB',
    primary50: '#F0EDF7',
    primary100: '#DDD7EF',
    primary200: '#C0B5E4',
    primary300: '#A492D8',
    primary400: '#8A77C1',
    primary500: '#7D69AB', // main brand purple
    primary600: '#6657A0',
    primary700: '#52468A',
    primary800: '#3F3474',
    primary900: '#2C235E',
    primary950: '#1A1348',
  },

  // Semantic surface colours (Light mode)
  surface: {
    primary: '#FFFFFF',
    cream: '#F8F5EF',
    creamSubtle: '#F4F0E8',
    brandPrimary: '#7D69AB',
    brandPrimarySubtle: '#F0EDF7',
    brandPrimaryHover: '#6657A0',
    brandPrimaryPressed: '#52468A',
    disabled: '#F2F4F7',
    danger: '#FEE4E2',
    dangerSubtle: '#FEF3F2',
    success: '#D1FADF',
    successSubtle: '#ECFDF3',
    warning: '#FEF0C7',
    warningSubtle: '#FFFAEB',
    info: '#E0F2FE',
    infoSubtle: '#F0F9FF',
  },

  // Semantic text colours (Light mode)
  text: {
    primary: '#262626',
    secondary: '#595959',
    tertiary: '#8C8C8C',
    primaryInverse: '#FFFFFF',
    brandPrimary: '#7D69AB',
    disabled: '#BFBFBF',
    danger: '#F04438',
    success: '#12B76A',
    warning: '#F79009',
    info: '#0BA5EC',
    link: '#7D69AB',
  },

  // Semantic border colours
  border: {
    primary: '#D0D5DD',
    primaryBold: '#98A2B3',
    brandPrimary: '#7D69AB',
    disabled: '#EAECF0',
    inverse: '#FFFFFF',
    focused: '#7D69AB',
    danger: '#FDA29B',
    success: '#6CE9A6',
    warning: '#FEC84B',
    info: '#7CD4FD',
  },

  // Neutral scale
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // Base
  base: {
    white: '#FFFFFF',
    black: '#000000',
  },
} as const;

export const Spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BorderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
  circle: 9999,
} as const;
