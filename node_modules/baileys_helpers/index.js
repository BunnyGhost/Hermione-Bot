import pkg from './package.json' with { type: 'json' };

export * from './helpers/buttons.js';

export const getPackageInfo = () => ({
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  author: pkg.author,
  main: pkg.main,
});

export { pkg };
