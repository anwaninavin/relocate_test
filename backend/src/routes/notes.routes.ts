import { createAsyncRouter } from "@/lib/asyncRouter";

import { noteSchema, noteUpdateSchema } from "@/validations/note";
import { createNote, deleteNote, listNotes, updateNote } from "@/services/noteService";
import { requireAuth } from "@/middleware/auth";

export const notesRouter = createAsyncRouter();

notesRouter.use(requireAuth);

notesRouter.get("/", async (req, res) => {
  const notes = await listNotes(req.user!._id.toString());
  res.json({ notes });
});

notesRouter.post("/", async (req, res) => {
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const note = await createNote(req.user!._id.toString(), parsed.data);
  res.json({ note });
});

notesRouter.patch("/:id", async (req, res) => {
  const parsed = noteUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const note = await updateNote(req.user!._id.toString(), parsed.data);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ note });
});

notesRouter.delete("/:id", async (req, res) => {
  const result = await deleteNote(req.user!._id.toString(), req.params.id);
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ success: true });
});
