
import { type Request, type Response, type NextFunction } from "express";
import { ok, created, forbidden } from "../../lib/response.js";
import * as conversationService from "./conversation.service.js";

export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const { vendorId } = req.body;

    if ((req as any).user.role !== "customer") {
      return forbidden(res, "Only customers can create conversations");
    }

    const conversation = await conversationService.findOrCreateConversation(userId, vendorId);
    return created(res, { conversation });
  } catch (err) {
    next(err);
    return;
  }
}

export async function listMyConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const conversations = await conversationService.listMyConversations(userId, role);
    return ok(res, { conversations });
  } catch (err) {
    next(err);
    return;
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const id = req.params.id as string;
    const result = await conversationService.getConversation(userId, id, role);
    return ok(res, result);
  } catch (err) {
    next(err);
    return;
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const id = req.params.id as string;
    const result = await conversationService.getConversation(userId, id, role);
    return ok(res, { messages: result.messages });
  } catch (err) {
    next(err);
    return;
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const id = req.params.id as string;
    const message = await conversationService.sendMessage(userId, id, req.body, role);
    return created(res, { message });
  } catch (err) {
    next(err);
    return;
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const id = req.params.id as string;
    const result = await conversationService.markRead(userId, id, role);
    return ok(res, result);
  } catch (err) {
    next(err);
    return;
  }
}

export async function exportTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const id = req.params.id as string;
    const format = ((req.query.format as string) || "txt").toLowerCase();
    const transcript = await conversationService.exportTranscript(userId, id, role);

    if (format === "pdf") {
      const { buildTextPdf } = await import("../../lib/pdf");
      const lines = transcript.split("\n");
      const buf = buildTextPdf(`Chat transcript ${id}`, lines);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="transcript-${id}.pdf"`);
      return res.send(buf);
    }
    if (format === "html") {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Transcript ${id}</title>` +
        `<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2em auto;padding:0 1em;line-height:1.5;white-space:pre-wrap;background:#fff;color:#111;}` +
        `h1{color:#b8860b;} .meta{color:#666;font-size:0.9em;border-bottom:1px solid #eee;padding-bottom:1em;margin-bottom:1em;}</style>` +
        `</head><body><h1>Casa Corona — Chat Transcript</h1><div class="meta">Exported ${new Date().toISOString()} · Conversation ${id}</div><pre>${transcript.replace(/[<>]/g, (c) => c === "<" ? "&lt;" : "&gt;")}</pre></body></html>`;
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="transcript-${id}.html"`);
      return res.send(html);
    }
    // default: txt
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="transcript-${id}.txt"`);
    return res.send(transcript);
  } catch (err) {
    next(err);
    return;
  }
}

export async function emailTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const id = req.params.id as string;
    const { to } = req.body as { to?: string };
    if (!to || !/^[^@]+@[^@]+\.[^@]+$/.test(to)) {
      return res.status(400).json({ success: false, error: { code: "BAD_EMAIL", message: "A valid 'to' email is required" } });
    }
    const transcript = await conversationService.exportTranscript(userId, id, role);
    const { sendEmail } = await import("../../lib/email");
    const html = `<p>Attached is the chat transcript you requested.</p>` +
      `<pre style="font-family:monospace;font-size:12px;background:#f6f6f6;padding:1em;border-radius:8px;max-width:100%;overflow:auto;white-space:pre-wrap;">${transcript.replace(/[<>]/g, (c) => c === "<" ? "&lt;" : "&gt;")}</pre>`;
    await sendEmail(to, `Chat transcript ${id}`, html);
    return res.json({ success: true });
  } catch (err) {
    next(err);
    return;
  }
}

export async function endConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const id = req.params.id as string;
    const result = await conversationService.endConversation(userId, id, role);
    return ok(res, result);
  } catch (err) {
    next(err);
    return;
  }
}

