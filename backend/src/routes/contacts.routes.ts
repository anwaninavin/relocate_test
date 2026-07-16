import { createAsyncRouter } from "@/lib/asyncRouter";

import { emergencyContactSchema, emergencyContactUpdateSchema } from "@/validations/contact";
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "@/services/contactService";
import { requireAuth } from "@/middleware/auth";

export const contactsRouter = createAsyncRouter();

contactsRouter.use(requireAuth);

contactsRouter.get("/", async (req, res) => {
  const contacts = await listContacts(req.user!._id.toString());
  res.json({ contacts });
});

contactsRouter.post("/", async (req, res) => {
  const parsed = emergencyContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const contact = await createContact(req.user!._id.toString(), parsed.data);
  res.json({ contact });
});

contactsRouter.patch("/:id", async (req, res) => {
  const parsed = emergencyContactUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const contact = await updateContact(req.user!._id.toString(), parsed.data);
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json({ contact });
});

contactsRouter.delete("/:id", async (req, res) => {
  const result = await deleteContact(req.user!._id.toString(), req.params.id);
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json({ success: true });
});
