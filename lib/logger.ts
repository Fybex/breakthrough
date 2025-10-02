import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

export interface LogConfig {
  level: string;
  serviceName: string;
  environment: string;
  logDir?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  maxFiles?: string;
  datePattern?: string;
}

const defaultConfig: LogConfig = {
  level: process.env.LOG_LEVEL || "info",
  serviceName: "breakthrough",
  environment: process.env.NODE_ENV || "development",
  logDir: "logs",
  enableConsole: true,
  enableFile: true,
  maxFiles: "14d",
  datePattern: "YYYY-MM-DD",
};

const createLogger = (config: LogConfig = defaultConfig) => {
  const {
    serviceName,
    environment,
    logDir,
    enableConsole,
    enableFile,
    level,
    maxFiles,
    datePattern,
  } = config;

  const format = winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        service: service || serviceName,
        environment,
        message,
        ...(Object.keys(meta).length && { meta }),
      });
    })
  );

  const transports: winston.transport[] = [];

  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ timestamp, level, message, service }) => {
            const serviceTag = service || serviceName;
            return `${timestamp} [${serviceTag}] ${level}: ${message}`;
          })
        ),
      })
    );
  }

  if (enableFile && logDir) {
    transports.push(
      new DailyRotateFile({
        filename: `${logDir}/%DATE%.log`,
        datePattern: datePattern,
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: maxFiles,
        format,
      }),
      new DailyRotateFile({
        filename: `${logDir}/%DATE%-error.log`,
        datePattern: datePattern,
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: maxFiles,
        level: "error",
        format,
      })
    );
  }

  return winston.createLogger({
    level,
    format,
    transports,
    defaultMeta: {
      service: serviceName,
      environment,
    },
  });
};

export const logger = createLogger();

export const createServiceLogger = (
  serviceName: string,
  config?: Partial<LogConfig>
) => {
  return createLogger({ ...defaultConfig, serviceName, ...config });
};

export default logger;
