"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { validateReply } from "@/lib/catalog";
import type { ErrorCode } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { useNick } from "./nick";

const ERRORS = new Set<ErrorCode>(["nick", "body", "not_found", "full", "generic"]);

export function ReplyForm({ postId }: { postId: string }) {
  const t = useTranslations("trade");
  const errors = useTranslations("errors");
  const router = useRouter();
  const { nick, setNick } = useNick();
  const [authorDraft, setAuthorDraft] = useState<string | null>(null);
  const author = authorDraft ?? nick;
  const [body, setBody] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const code = validateReply({ author, body });
    if (code) {
      setError(code);
      return;
    }
    setPending(true);
    setError(null);
    setNick(author.trim());
    try {
      const response = await fetch(`/api/trades/${postId}/replies`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author: author.trim(), body }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        const next = payload.error && ERRORS.has(payload.error as ErrorCode) ? (payload.error as ErrorCode) : "generic";
        setError(next);
        setPending(false);
        return;
      }
      setBody("");
      setPending(false);
      router.refresh();
    } catch {
      setError("generic");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="reply-author">{t("nick")}</Label>
        <input
          id="reply-author"
          value={author}
          onChange={(event) => setAuthorDraft(event.target.value)}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">{t("nickHint")}</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reply-body">{t("replyLabel")}</Label>
        <Textarea
          id="reply-body"
          value={body}
          placeholder={t("replyPlaceholder")}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-24"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {errors(error)}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={cn(buttonVariants(), "h-10 w-fit px-4")}>
        {pending ? t("sending") : t("replySubmit")}
      </button>
    </form>
  );
}
