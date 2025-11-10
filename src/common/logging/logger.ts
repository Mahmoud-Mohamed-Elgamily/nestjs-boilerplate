import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          isProduction
            ? winston.format.json()
            : nestWinstonModuleUtilities.format.nestLike('Project_title', {
                colors: true,
                prettyPrint: true,
              }),
        ),
      }),
      // Add file transport for production
      ...(isProduction
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
          ]
        : []),
    ],
  });
};
