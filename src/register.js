// Remaps .js -> .ts at require-time so Prisma's generated TypeScript source
// (which uses nodenext-style .js imports) resolves to the actual .ts files
// when running under @swc-node/register without a prior build step.
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && request.endsWith('.js')) {
      try {
        return originalResolveFilename.call(this, request.slice(0, -3) + '.ts', parent, isMain, options);
      } catch {}
    }
    throw err;
  }
};