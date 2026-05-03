export interface ParsedAmount { value: number; unit: 'g' | 'ml' | 'tsp' | 'tbsp' | 'units' }

export function parseAmount(str: string): ParsedAmount {
  if (!str) return { value: 0, unit: 'units' };
  const s = str.toLowerCase();
  const num = parseFloat((str.match(/[\d.]+/) || ['1'])[0]);
  if (s.includes('kg')) return { value: num * 1000, unit: 'g' };
  if (s.match(/\d\s*g\b/) || s.endsWith('g)') || s.includes('g (')) return { value: num, unit: 'g' };
  if (s.includes('ml')) return { value: num, unit: 'ml' };
  if (s.match(/\b\d+\s*l\b/) || s.endsWith('l')) return { value: num * 1000, unit: 'ml' };
  if (s.includes('tsp')) return { value: num, unit: 'tsp' };
  if (s.includes('tbsp')) return { value: num, unit: 'tbsp' };
  if (s.includes('tin') || s.includes('bar') || s.includes('scoop') || s.includes('clove') ||
      s.includes('leaf') || s.includes('handful') || s.includes('wrap') || /^\d+$/.test(s)) {
    return { value: num, unit: 'units' };
  }
  const gMatch = str.match(/(\d+)\s*g/);
  if (gMatch) return { value: parseInt(gMatch[1], 10), unit: 'g' };
  return { value: num, unit: 'units' };
}
