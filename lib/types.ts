export type Theme = 'dark' | 'light';

export interface Preferences {
  fontSize: number;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  theme: Theme;
}

export const defaultPreferences: Preferences = {
  fontSize: 18,
  decimalPlaces: 2,
  theme: 'dark',
  decimalSeparator: '.',
  thousandsSeparator: ',',
};
