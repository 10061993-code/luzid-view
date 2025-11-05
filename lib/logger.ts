export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

function toLine(level: LogLevel, msg: string, fields?: LogFields): string {
  const base = { level, msg, ts: new Date().toISOString(), ...(fields || {}) };
  return JSON.stringify(base);
}

export const logger = {
  debug(msg: string, fields?: LogFields): void {
    console.debug(toLine("debug", msg, fields));
  },
  info(msg: string, fields?: LogFields): void {
    console.info(toLine("info", msg, fields));
  },
  warn(msg: string, fields?: LogFields): void {
    console.warn(toLine("warn", msg, fields));
  },
  error(msg: string, fields?: LogFields): void {
    console.error(toLine("error", msg, fields));
  },
};

