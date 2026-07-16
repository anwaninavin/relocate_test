import { createAsyncRouter } from "@/lib/asyncRouter";

import { documentItemSchema, documentItemUpdateSchema } from "@/validations/document";
import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from "@/services/documentService";
import { requireAuth } from "@/middleware/auth";

export const documentsRouter = createAsyncRouter();

documentsRouter.use(requireAuth);

documentsRouter.get("/", async (req, res) => {
  const documents = await listDocuments(req.user!._id.toString());
  res.json({ documents });
});

documentsRouter.post("/", async (req, res) => {
  const parsed = documentItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const document = await createDocument(req.user!._id.toString(), parsed.data);
  res.json({ document });
});

documentsRouter.patch("/:id", async (req, res) => {
  const parsed = documentItemUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const document = await updateDocument(req.user!._id.toString(), parsed.data);
  if (!document) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json({ document });
});

documentsRouter.delete("/:id", async (req, res) => {
  const result = await deleteDocument(req.user!._id.toString(), req.params.id);
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json({ success: true });
});
