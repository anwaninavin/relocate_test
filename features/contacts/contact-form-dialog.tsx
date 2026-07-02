"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { emergencyContactSchema, type EmergencyContactInput } from "@/lib/validations/contact";
import { createContactAction, updateContactAction } from "@/actions/contacts";
import type { EmergencyContactDTO } from "@/features/contacts/contact-dto";

interface ContactFormDialogProps {
  contact?: EmergencyContactDTO;
  trigger?: React.ReactNode;
  /** When provided, open/close is driven by a parent (e.g. the FAB) instead of internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ContactFormDialog({
  contact,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ContactFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(contact);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const form = useForm<EmergencyContactInput>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: contact?.name ?? "",
      relation: contact?.relation ?? "",
      phone: contact?.phone ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: contact?.name ?? "",
        relation: contact?.relation ?? "",
        phone: contact?.phone ?? "",
      });
    }
  }, [open, contact, form]);

  async function onSubmit(values: EmergencyContactInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateContactAction({ id: contact!.id, ...values })
      : await createContactAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Contact updated" : "Contact added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="size-4" />
            Add contact
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "Add contact"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Mom, Dad, Warden…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation</FormLabel>
                  <FormControl>
                    <Input placeholder="Mother, Warden, Family Doctor…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add contact"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
