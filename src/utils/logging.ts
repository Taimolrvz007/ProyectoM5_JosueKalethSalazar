export enum LogLevel {
  DEBUG, INFO, WARN, ERROR
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  private log(lvl: LogLevel, prefix: string, msg: string, meta?: any) {
    if (lvl >= this.level) {
      const time = new Date().toISOString();
      const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
      process.stderr.write(`[${time}] [${prefix}] ${msg}${metaStr}\n`);
    }
  }

  debug(msg: string, meta?: any) { this.log(LogLevel.DEBUG, "DEBUG", msg, meta); }
  info(msg: string, meta?: any) { this.log(LogLevel.INFO, "INFO", msg, meta); }
  warn(msg: string, meta?: any) { this.log(LogLevel.WARN, "WARN", msg, meta); }
  error(msg: string, meta?: any) { this.log(LogLevel.ERROR, "ERROR", msg, meta); }
}

export const logger = new Logger();