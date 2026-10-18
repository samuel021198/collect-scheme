"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { validateReplyBody } from "@/lib/catalog";
import type { ErrorCode } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

const ERRORS = new Set<ErrorCode>(["nick", "body", "not_found", "full", "generic"]);

export function ReplyForm({ postId, authorName }: { postId: string; authorName: string }) {
  const t = useTranslations("trade");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const code = validateReplyBody(body);
    if (code) {
      setError(code);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trades/${postId}/replies`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
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
      <p className="text-sm text-muted-foreground">{t("replyAs", { name: authorName })}</p>
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
