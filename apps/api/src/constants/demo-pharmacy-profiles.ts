export const DEMO_REGIONS: Record<string, string> = Object.freeze({
  Kyiv: 'Kyiv City',
  Lviv: 'Lviv region',
  Odesa: 'Odesa region',
  Dnipro: 'Dnipropetrovsk region',
  Kharkiv: 'Kharkiv region',
  Vinnytsia: 'Vinnytsia region',
  Chernihiv: 'Chernihiv region',
  Poltava: 'Poltava region',
  Rivne: 'Rivne region',
  Ternopil: 'Ternopil region',
  'Ivano-Frankivsk': 'Ivano-Frankivsk region',
  Uzhhorod: 'Zakarpattia region',
  Cherkasy: 'Cherkasy region',
  Zhytomyr: 'Zhytomyr region',
});

//===============================================================

export function createDemoPharmacyShortDescription(name: string): string {
  return `${name} — trusted everyday care, friendly service, and easy pickup.`;
}

//===============================================================
