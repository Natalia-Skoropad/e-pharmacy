import type { NextFunction, Request, Response } from 'express';

//===============================================================

type Controller = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

//===============================================================

export function ctrlWrapper(controller: Controller): Controller {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
