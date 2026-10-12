// Estimated raw material per portion, matched by menu item name. Tune quantities to your kitchen.
// Every matching rule applies, so base dishes and modifiers (egg, chicken, paneer) add up.
const rules = [
  { test: /dosa/i, use: [['Dosa batter', 0.12, 'kg'], ['Cooking oil', 0.015, 'L']] },
  { test: /masala dosa/i, use: [['Potatoes', 0.08, 'kg']] },
  { test: /benne/i, use: [['Butter', 0.02, 'kg']] },
  { test: /idli/i, use: [['Dosa batter', 0.15, 'kg']] },
  { test: /poori/i, use: [['Wheat flour', 0.1, 'kg'], ['Potatoes', 0.1, 'kg'], ['Cooking oil', 0.05, 'L']] },
  { test: /pongal/i, use: [['Rice', 0.08, 'kg'], ['Moong dal', 0.03, 'kg'], ['Ghee', 0.01, 'kg']] },
  { test: /biryani|kobbari anam/i, use: [['Rice', 0.15, 'kg'], ['Cooking oil', 0.03, 'L'], ['Spice mix', 0.01, 'kg']] },
  { test: /bath|pulihora|gongura|bagara/i, use: [['Rice', 0.15, 'kg'], ['Cooking oil', 0.02, 'L'], ['Vegetables', 0.05, 'kg']] },
  { test: /fried rice/i, use: [['Rice', 0.15, 'kg'], ['Vegetables', 0.08, 'kg'], ['Cooking oil', 0.03, 'L']] },
  { test: /noodles/i, use: [['Noodles', 0.15, 'kg'], ['Vegetables', 0.08, 'kg'], ['Cooking oil', 0.03, 'L']] },
  { test: /maggi/i, use: [['Maggi packs', 1, 'pcs'], ['Vegetables', 0.04, 'kg']] },
  { test: /sandwich/i, use: [['Bread slices', 4, 'pcs'], ['Butter', 0.01, 'kg'], ['Vegetables', 0.05, 'kg']] },
  { test: /toast/i, use: [['Bread slices', 2, 'pcs'], ['Butter', 0.01, 'kg']] },
  { test: /fries/i, use: [['Potatoes', 0.2, 'kg'], ['Cooking oil', 0.1, 'L']] },
  { test: /65|555|manchuria|dragon|chilli|kung pao|pepper/i, use: [['Cooking oil', 0.08, 'L'], ['Vegetables', 0.05, 'kg'], ['Sauces', 0.02, 'L']] },
  { test: /\btea\b/i, use: [['Milk', 0.1, 'L'], ['Sugar', 0.01, 'kg'], ['Tea powder', 0.005, 'kg']] },
  { test: /coffee/i, use: [['Milk', 0.12, 'L'], ['Sugar', 0.01, 'kg'], ['Coffee powder', 0.008, 'kg']] },
  { test: /milkshake/i, use: [['Milk', 0.25, 'L'], ['Sugar', 0.03, 'kg'], ['Ice cream', 0.05, 'kg']] },
  { test: /cool drink|water/i, use: [['Bottled drinks / water', 1, 'pcs']] },
  { test: /egg/i, use: [['Eggs', 1, 'pcs']] },
  { test: /double egg/i, use: [['Eggs', 1, 'pcs']] },
  { test: /chicken/i, use: [['Chicken', 0.15, 'kg']] },
  { test: /paneer/i, use: [['Paneer', 0.1, 'kg']] }
];

const estimateIngredients = name => rules.filter(rule => rule.test.test(name)).flatMap(rule => rule.use);

module.exports = { estimateIngredients };
