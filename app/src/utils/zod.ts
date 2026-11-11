// Zod for the data module: import `z` from here, not from 'zod'.
// Zod 3 on purpose: Zod 4's code calls `new Function` (its JIT), and Exact's
// bundler refuses any package that loads code from a string, even unused.

export { z } from 'zod';
