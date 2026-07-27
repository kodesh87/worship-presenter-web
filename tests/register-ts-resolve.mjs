/**
 * Resolve extensionless / directory imports to .ts for node --test + strip-types.
 */
import { register } from 'node:module';

register('./ts-resolve-hook.mjs', import.meta.url);
