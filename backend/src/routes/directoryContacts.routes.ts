import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import {
  listDirectoryContacts,
  createDirectoryContact,
  reportDirectoryContact,
  deleteOwnDirectoryContact,
} from "@/services/directoryContactService";
import { directoryContactSchema, directoryContactQuerySchema, reportContactSchema } from "@/validations/directoryContacts";

export const directoryContactsRouter = Router();

directoryContactsRouter.use(requireAuth);

directoryContactsRouter.get("/", async (req, res) => {
  const parsed = directoryContactQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  const contacts = await listDirectoryContacts(parsed.data.city, parsed.data.category, parsed.data.search);
  res.json({ contacts });
});

directoryContactsRouter.post("/", async (req, res) => {
  const parsed = directoryContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const contact = await createDirectoryContact(req.user!._id.toString(), parsed.data);
  res.json({ contact });
});

directoryContactsRouter.post("/:id/report", async (req, res) => {
  const parsed = reportContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await reportDirectoryContact(req.user!._id.toString(), req.params.id, parsed.data.reason);
  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

directoryContactsRouter.delete("/:id", async (req, res) => {
  await deleteOwnDirectoryContact(req.user!._id.toString(), req.params.id);
  res.json({ success: true });
});
