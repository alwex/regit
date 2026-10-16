import signale from 'signale';
import winston from 'winston';
export declare const loggerOld: winston.Logger;
export declare const logger: signale.SignaleBase<signale.DefaultMethods> & Record<signale.DefaultMethods, signale.LoggerFunc> & {
    Signale: signale.SignaleConstructor;
    SignaleConfig: signale.SignaleConfig;
    SignaleOptions: signale.SignaleOptions<signale.DefaultMethods>;
    DefaultMethods: signale.DefaultMethods;
};
