import type { Request, Response, NextFunction } from "express";
import type { ZodType, ZodError } from "zod";

export const validate =
  <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = result.error as ZodError;
      return res
        .status(400)
        .json({ success: false, errors: result.error.errors });
    }
    next();
  };