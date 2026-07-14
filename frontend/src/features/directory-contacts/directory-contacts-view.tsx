import { useEffect, useState } from "react";
import { Phone, MessageCircle, Flag, BookUser } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { CONTACT_CATEGORIES } from "@/types";
import { ContactSubmitDialog } from "@/features/directory-contacts/contact-submit-dialog";
import { toDirectoryContactDTO, type DirectoryContactDTO, type DirectoryContactRaw } from "@/features/directory-contacts/directory-contacts-dto";

const ANY = "__any__";

function ReportButton({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/directory-contacts/${contactId}/report`, { reason });
      toast.success("Thanks — we'll review this");
      setOpen(false);
      setReason("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to report contact");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Flag className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this contact</DialogTitle>
        </DialogHeader>
        <Textarea placeholder="What's wrong with this contact?" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        <DialogFooter>
          <Button onClick={submit} disabled={submitting || !reason.trim()}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function saveAsVCard(contact: DirectoryContactDTO) {
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL;TYPE=CELL:${contact.phone}\nNOTE:${contact.category} — ${contact.city}\nEND:VCARD`;
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${contact.name}.vcf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function DirectoryContactsView({ defaultCity }: { defaultCity: string }) {
  const [city, setCity] = useState(defaultCity);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<DirectoryContactDTO[]>([]);

  async function fetchContacts() {
    if (!city.trim()) return;
    const params = new URLSearchParams({ city });
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    try {
      const { contacts: raw } = await api.get<{ contacts: DirectoryContactRaw[] }>(`/api/directory-contacts?${params.toString()}`);
      setContacts(raw.map(toDirectoryContactDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load contacts");
    }
  }

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, category, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="max-w-[160px]" />
        <Select value={category || ANY} onValueChange={(v) => setCategory(v === ANY ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
            {CONTACT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[160px]" />
        <ContactSubmitDialog defaultCity={city} onSubmitted={fetchContacts} />
      </div>

      {contacts.length === 0 ? (
        <EmptyState icon={BookUser} title="No contacts yet" description="Be the first to add a useful contact for this city." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {contact.category} · {contact.city}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {contact.verified && <Badge variant="success">Verified</Badge>}
                  <ReportButton contactId={contact.id} />
                </div>
              </div>
              {contact.description && <p className="text-muted-foreground text-sm">{contact.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="size-4" /> Call
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`https://wa.me/${(contact.whatsapp ?? contact.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => saveAsVCard(contact)}>
                  Save
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
