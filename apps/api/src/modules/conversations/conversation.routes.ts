
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { createConversationSchema, sendMessageSchema } from "./conversation.schema";
import * as conversationController from "./conversation.controller";

const router = Router();

router.post("/", requireAuth, validate({ body: createConversationSchema }), conversationController.createConversation);
router.get("/", requireAuth, conversationController.listMyConversations);
router.get("/:id", requireAuth, conversationController.getConversation);
router.get("/:id/messages", requireAuth, conversationController.getMessages);
router.post("/:id/messages", requireAuth, validate({ body: sendMessageSchema }), conversationController.sendMessage);
router.patch("/:id/read", requireAuth, conversationController.markRead);
router.get("/:id/export", requireAuth, conversationController.exportTranscript);
router.post("/:id/export-email", requireAuth, conversationController.emailTranscript);
router.post("/:id/end", requireAuth, conversationController.endConversation);

export default router;

