import { presetPalettes, PalettesProps, Palette } from '@ant-design/colors';

const brand: Palette = [
  '#EEFCE3',
  '#E1FACF',
  '#BDF6A2',
  '#8CE36F',
  '#5DC949',
  '#24A519',
  '#128D12',
  '#075F16',
  '#044F17',
  '#033A11',
];

const neutral: Palette = [
  '#000000',
  '#141414',
  '#1F1F1F',
  '#262626',
  '#434343',
  '#595959',
  '#8C8C8C',
  '#BFBFBF',
  '#D9D9D9',
  '#F0F0F0',
  '#F5F5F5',
  '#FAFAFA',
  '#FFFFFF',
];
const blue: Palette = ['#E6F7FF', '#91D5FF'];
blue.primary = '#1890FF';
brand.primary = '#4a55ae';

const colors: PalettesProps = {
  brand: brand,
  neutral: neutral,
  ...presetPalettes,
  blue: blue,
};

export default colors;
