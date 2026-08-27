function isString(value) {return typeof value === 'string' || value instanceof String;}
function isInt(value) {return Number.isInteger(value)}

export { isString, isInt };
