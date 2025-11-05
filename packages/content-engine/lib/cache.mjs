const MAP = new Map();
export function keyOf(obj) { return JSON.stringify(obj); }
export function get(key) { return MAP.get(key); }
export function set(key, val) { MAP.set(key, val); }

