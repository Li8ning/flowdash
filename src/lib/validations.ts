import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

type ValidatedRequestHandler<T, P> = (
  req: NextRequest,
  body: T,
  context: { params: P }
) => Promise<NextResponse>;

export function withValidation<T, P>(
  schema: z.ZodSchema<T>,
  handler: ValidatedRequestHandler<T, P>
) {
  return async (req: NextRequest, context: { params: P }) => {
    try {
      const body = await req.json();
      const parsedData = schema.parse(body);
      return handler(req, parsedData, context);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { errors: error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
  };
}