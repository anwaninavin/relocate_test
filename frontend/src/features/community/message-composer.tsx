import { useState } from "react";
import { toast } from "sonner";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { MessageDTO } from "@/types";

export function MessageComposer({
  onSend,
  onTyping,
  allowAnonymous,
  replyTo,
  onCancelReply,
}: {
  onSend: (body: string, opts: { parentMessageId?: string | null; isAnonymous?: boolean }) => Promise<void>;
  onTyping: () => void;
  allowAnonymous?: boolean;
  replyTo?: MessageDTO | null;
  onCancelReply?: () => void;
}) {
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await onSend(trimmed, {
        parentMessageId: replyTo?.id ?? null,
        isAnonymous,
      });
      setBody("");
      onCancelReply?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-border/70 bg-background p-3">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
          <span className="truncate text-muted-foreground">
            Replying to{" "}
            <span className="font-medium text-foreground">
              {replyTo.anonymousAlias ?? (replyTo.author?.username ? `@${replyTo.author.username}` : "message")}
            </span>
          </span>
          <button onClick={onCancelReply} aria-label="Cancel reply">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message..."
          className="min-h-11 flex-1 resize-none py-2.5"
        />
        <Button size="icon" className="shrink-0" onClick={handleSend} disabled={sending} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </div>

      {allowAnonymous && (
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} className="scale-75" />
          Post anonymously
        </label>
      )}
    </div>
  );
}
