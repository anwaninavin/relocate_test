import { Router, type RequestHandler, type Router as ExpressRouter } from "express";

/** Express 4 does not forward a rejected promise from an `async` route handler to the error
 * middleware — an uncaught rejection (e.g. a Mongoose CastError from a malformed ObjectId in
 * any `:id` route) becomes an unhandled rejection, which by default terminates the whole
 * process. Wrapping every handler passed to get/post/put/patch/delete here catches that
 * rejection and forwards it to `next(err)` instead, so one bad request 500s instead of taking
 * down every connected user. `.use()` (router-level middleware like requireAuth/requireAdmin)
 * is intentionally left unwrapped — those middlewares in this codebase already handle their
 * own errors internally and never reject uncaught. */
function wrapHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    try {
      // Express's RequestHandler type declares a `void` return even though an async handler
      // actually returns a Promise at runtime — cast through `unknown` to inspect it safely.
      const result = handler(req, res, next) as unknown;
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        (result as Promise<unknown>).catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}

const WRAPPED_METHODS = ["get", "post", "put", "patch", "delete"] as const;

export function createAsyncRouter(): ExpressRouter {
  const router = Router();
  for (const method of WRAPPED_METHODS) {
    const original = router[method].bind(router);
    router[method] = ((path: string, ...handlers: RequestHandler[]) =>
      original(path, ...handlers.map(wrapHandler))) as typeof router[typeof method];
  }
  return router;
}
