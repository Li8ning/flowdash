import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  sync: true, // Use synchronous logging in development
});

const logger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  process.env.NODE_ENV !== 'production' ? stream : pino.destination(1)
);

export default logger;