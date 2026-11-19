const UNIT_ALIASES = new Map([
  ['pack', 'pack'],
  ['packs', 'pack'],
  ['box', 'box'],
  ['boxes', 'box'],
  ['bottle', 'bottle'],
  ['bottles', 'bottle'],
  ['strip', 'strip'],
  ['strips', 'strip'],
  ['tablet', 'tablet'],
  ['tablets', 'tablet'],
  ['tab', 'tablet'],
  ['tabs', 'tablet'],
  ['capsule', 'capsule'],
  ['capsules', 'capsule'],
  ['cap', 'capsule'],
  ['caps', 'capsule'],
  ['vial', 'vial'],
  ['vials', 'vial'],
  ['unit', 'unit'],
  ['units', 'unit'],
]);

function parseQuantity(value) {
  const match = /^\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/.exec(String(value || ''));
  if (!match) return null;
  const rawUnit = match[2]?.toLowerCase() || '';
  return {
    amount: Number(match[1]),
    unit: UNIT_ALIASES.get(rawUnit) || rawUnit,
  };
}

function formatQuantity(amount, unit) {
  const displayAmount = Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return `${displayAmount}${unit ? ` ${unit}${amount === 1 ? '' : 's'}` : ''}`;
}

module.exports = { parseQuantity, formatQuantity };
