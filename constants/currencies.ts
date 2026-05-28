export type Currency = {
  code: string;
  flag: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'USD', flag: '🇺🇸', name: 'Dollar US' },
  { code: 'GBP', flag: '🇬🇧', name: 'Livre sterling' },
  { code: 'JPY', flag: '🇯🇵', name: 'Yen japonais' },
  { code: 'CHF', flag: '🇨🇭', name: 'Franc suisse' },
  { code: 'CAD', flag: '🇨🇦', name: 'Dollar canadien' },
  { code: 'AUD', flag: '🇦🇺', name: 'Dollar australien' },
  { code: 'NZD', flag: '🇳🇿', name: 'Dollar néo-zélandais' },
  { code: 'CNY', flag: '🇨🇳', name: 'Yuan chinois' },
  { code: 'HKD', flag: '🇭🇰', name: 'Dollar de Hong Kong' },
  { code: 'SGD', flag: '🇸🇬', name: 'Dollar singapourien' },
  { code: 'SEK', flag: '🇸🇪', name: 'Couronne suédoise' },
  { code: 'NOK', flag: '🇳🇴', name: 'Couronne norvégienne' },
  { code: 'DKK', flag: '🇩🇰', name: 'Couronne danoise' },
  { code: 'MXN', flag: '🇲🇽', name: 'Peso mexicain' },
  { code: 'BRL', flag: '🇧🇷', name: 'Réal brésilien' },
  { code: 'ZAR', flag: '🇿🇦', name: 'Rand sud-africain' },
  { code: 'INR', flag: '🇮🇳', name: 'Roupie indienne' },
  { code: 'KRW', flag: '🇰🇷', name: 'Won coréen' },
  { code: 'TRY', flag: '🇹🇷', name: 'Livre turque' },
  { code: 'PLN', flag: '🇵🇱', name: 'Zloty polonais' },
  { code: 'CZK', flag: '🇨🇿', name: 'Couronne tchèque' },
  { code: 'HUF', flag: '🇭🇺', name: 'Forint hongrois' },
  { code: 'RON', flag: '🇷🇴', name: 'Leu roumain' },
  { code: 'BGN', flag: '🇧🇬', name: 'Lev bulgare' },
  { code: 'ISK', flag: '🇮🇸', name: 'Couronne islandaise' },
  { code: 'PHP', flag: '🇵🇭', name: 'Peso philippin' },
  { code: 'IDR', flag: '🇮🇩', name: 'Roupiah indonésienne' },
  { code: 'MYR', flag: '🇲🇾', name: 'Ringgit malaisien' },
  { code: 'THB', flag: '🇹🇭', name: 'Baht thaïlandais' },
  { code: 'XPF', flag: '🇵🇫', name: 'Franc pacifique (CFP)' },
];

export const NO_DECIMAL_CURRENCIES = ['JPY', 'KRW', 'IDR', 'HUF', 'ISK'];
