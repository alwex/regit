import signale from 'signale';
import winston from 'winston';
export const loggerOld = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
});
export const logger = signale;
