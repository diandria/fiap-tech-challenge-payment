import { Request, Response } from 'express';
import pino from 'pino';
import { Writable } from 'node:stream';
import { errorMiddleware } from '../../../src/frameworks/http/errorMiddleware';
import { AppError } from '../../../src/entities/errors/AppError';

function fakeResponse(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

function capturingLogger(): { logger: pino.Logger; lines: string[] } {
  const lines: string[] = [];
  const stream = new Writable({ write(chunk, _enc, done) { lines.push(chunk.toString()); done(); } });
  return { logger: pino({}, stream), lines };
}

describe('errorMiddleware', () => {
  it('answers an application error with its own status and message', () => {
    const res = fakeResponse();

    errorMiddleware(pino({ enabled: false }))(new AppError('Checkout already paid', 409), {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: 'Checkout already paid' });
  });

  it('answers an unexpected error with 500 without exposing its message, and logs it', () => {
    const res = fakeResponse();
    const { logger, lines } = capturingLogger();

    errorMiddleware(logger)(new Error('connection refused at 10.0.0.1'), {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(lines.join('')).toContain('connection refused at 10.0.0.1');
  });
});
