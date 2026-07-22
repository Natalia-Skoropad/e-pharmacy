import type { NextFunction, Request, Response } from 'express';

//===============================================================

type Controller<TLocals extends Record<string, unknown>> = (
  req: Request,
  res: Response<unknown, TLocals>,
  next: NextFunction
) => void | Promise<void>;

//===============================================================

export function ctrlWrapper<TLocals extends Record<string, unknown>>(
  controller: Controller<TLocals>
): Controller<TLocals> {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
