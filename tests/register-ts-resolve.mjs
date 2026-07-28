/**
 * Resolve extensionless / directory imports to .ts for node --test + strip-types.
 */
import { register } from 'node:module';

// Tests assert against the committed public seed. Ignore any private
// data/local/default-registry.json override on the developer machine.
process.env.WPW_USE_SHIPPED_REGISTRY = '1';

register('./ts-resolve-hook.mjs', import.meta.url);
