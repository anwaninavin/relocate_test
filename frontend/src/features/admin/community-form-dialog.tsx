import { useEffect, useState, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminUpdateCommunity } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { CommunityDTO } from "@/types";

const communitySchema = z.object({
  name: z.string().trim().min(3, "Name is too short").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  visibility: z.enum(["public", "private", "invite_only"]),
  allowAnonymous: z.boolean(),
  isOfficial: z.boolean(),
});

type CommunityInput = z.infer<typeof communitySchema>;

export function CommunityFormDialog({ community, trigger }: { community: CommunityDTO; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildDefaults(): CommunityInput {
    return {
      name: community.name,
      description: community.description ?? "",
      visibility: community.visibility,
      allowAnonymous: community.allowAnonymous,
      isOfficial: community.isOfficial,
    };
  }

  const form = useForm<CommunityInput>({
    resolver: zodResolver(communitySchema) as Resolver<CommunityInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: CommunityInput) {
    setIsSubmitting(true);
    try {
      await adminUpdateCommunity(community._id, values);
      emitRefresh();
      toast.success("Community updated");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm" variant="outline">Edit</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit community</DialogTitle>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="invite_only">Invite only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isOfficial"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                  <FormLabel>Official community</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                  <FormLabel>Allow anonymous posting</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
