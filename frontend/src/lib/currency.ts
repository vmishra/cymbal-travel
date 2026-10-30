// Mock but plausible FX (units of foreign currency per ₹1) + city→currency.
const RATES: Record<string, { symbol: string; perINR: number }> = {
  JPY: { symbol: '¥', perINR: 1.78 }, EUR: { symbol: '€', perINR: 0.0111 }, USD: { symbol: '$', perINR: 0.012 },
  GBP: { symbol: '£', perINR: 0.0095 }, CHF: { symbol: 'Fr', perINR: 0.0105 }, AED: { symbol: 'د.إ', perINR: 0.044 },
  SGD: { symbol: 'S$', perINR: 0.0162 }, THB: { symbol: '฿', perINR: 0.42 }, IDR: { symbol: 'Rp', perINR: 188 }, AUD: { symbol: 'A$', perINR: 0.0185 },
}
const CITY_CCY: Record<string, string> = {
  Tokyo: 'JPY', Hakone: 'JPY', Kyoto: 'JPY', Osaka: 'JPY',
  Paris: 'EUR', Rome: 'EUR', Milan: 'EUR', Nice: 'EUR', Venice: 'EUR',
  Zurich: 'CHF', Bali: 'IDR', Ubud: 'IDR', Dubai: 'AED', Singapore: 'SGD',
  Bangkok: 'THB', Phuket: 'THB', London: 'GBP', Sydney: 'AUD', 'New York': 'USD',
}

export function currencyFor(city: string): { code: string; symbol: string; perINR: number } | null {
  const code = CITY_CCY[city]
  if (!code || !RATES[code]) return null
  return { code, ...RATES[code] }
}
