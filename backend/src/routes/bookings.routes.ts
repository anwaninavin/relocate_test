import { createAsyncRouter } from "@/lib/asyncRouter";

import { requireAuth } from "@/middleware/auth";
import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  dismissReminder,
  getDueRemindersForUser,
  getMissedBookings,
} from "@/services/bookingService";
import { createBookingSchema, updateBookingSchema } from "@/validations/bookings";

export const bookingsRouter = createAsyncRouter();

bookingsRouter.use(requireAuth);

bookingsRouter.get("/", async (req, res) => {
  const category = req.query.category === "travel" || req.query.category === "stay" ? req.query.category : undefined;
  res.json({ bookings: await listBookings(req.user!._id.toString(), category) });
});

bookingsRouter.get("/reminders/due", async (req, res) => {
  const [due, missed] = await Promise.all([
    getDueRemindersForUser(req.user!._id.toString()),
    getMissedBookings(req.user!._id.toString()),
  ]);
  res.json({ due, missed });
});

bookingsRouter.get("/:id", async (req, res) => {
  const booking = await getBooking(req.user!._id.toString(), req.params.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json({ booking });
});

bookingsRouter.post("/", async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const booking = await createBooking(req.user!._id.toString(), parsed.data);
  res.json({ booking });
});

bookingsRouter.patch("/:id", async (req, res) => {
  const parsed = updateBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const booking = await updateBooking(req.user!._id.toString(), req.params.id, parsed.data);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json({ booking });
});

bookingsRouter.delete("/:id", async (req, res) => {
  await deleteBooking(req.user!._id.toString(), req.params.id);
  res.json({ success: true });
});

bookingsRouter.post("/:id/reminders/:key/dismiss", async (req, res) => {
  const booking = await dismissReminder(req.user!._id.toString(), req.params.id, req.params.key);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json({ booking });
});
