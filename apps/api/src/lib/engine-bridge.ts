// Engine Bridge — adapts engine packages to API handlers
// Each function wraps an engine call with error handling and response formatting.
import type { Request, Response } from 'express';

export function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}
export function fail(res: Response, error: string, status = 400) {
  return res.status(status).json({ success: false, error });
}
export function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => fn(req, res).catch((e) => fail(res, e instanceof Error ? e.message : 'Internal error', 500));
}
