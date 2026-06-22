import { Request, Response, NextFunction } from 'express';
import * as contactService from './contact.service.js';
import { ok } from '../../lib/response.js';

export async function submitContact(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await contactService.submitContact(req.body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}
