import { t as createSubsystemLogger } from "./subsystem-D5Ceunbp.js";
import { t as parseBooleanValue } from "./boolean-CE7i9tBR.js";

//#region src/infra/env.ts
const log = createSubsystemLogger("env");
function isTruthyEnvValue(value) {
	return parseBooleanValue(value) === true;
}

//#endregion
export { isTruthyEnvValue as t };