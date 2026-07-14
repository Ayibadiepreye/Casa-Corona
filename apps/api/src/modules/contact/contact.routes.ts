import { Router } from 'express';
import * as contactController from './contact.controller.js';
import { validate } from '../../middlewares/validate.js';
import { contactSchema } from './contact.schema.js';
import { contentCreationLimiter } from '../../middlewares/rateLimit.js';

const router = Router();

router.post('/', contentCreationLimiter, validate({ body: contactSchema }), contactController.submitContact);

export default router;
