"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export function WishButton({ cardId, wished: initial }: { cardId: string; wished?: boolean }) {
  const t = useTranslations("wish");
  const router = useRouter();
  const [wished, setWished] = useState<boolean | null>(initial ?? null);
  const [signedIn, setSignedIn] = useState<boolean | null>(initial == null ? null : true);
  const className =
    "absolute top-2 right-2 z-20 grid size-10 place-items-center rounded-full bg-background/85 text-foreground shadow-md";

  useEffect(() => {
    if (initial != null) return;
    const controller = new AbortController();
    fetch(`/api/wishlist?card=${encodeURIComponent(cardId)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body: { signedIn?: boolean; wished?: boolean }) => {
        setSignedIn(Boolean(body.signedIn));
        setWished(Boolean(body.wished));
      })
      .catch(() => {
        setSignedIn(false);
        setWished(false);
      });
    return () => controller.abort();
  }, [cardId, initial]);

  if (signedIn === false) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/encyclopedia/${cardId}`)}`} aria-label={t("add")} className={className}>
        <Heart className="size-5" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={Boolean(wished)}
      aria-label={wished ? t("remove") : t("add")}
      disabled={signedIn === null}
      className={className}
      onClick={() => {
        const next = !wished;
        setWished(next);
        void fetch("/api/wishlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cardId }),
        })
          .then(async (response) => {
            if (!response.ok) {
              setWished(!next);
              return;
            }
            const body = (await response.json()) as { wished?: boolean };
            setWished(Boolean(body.wished));
            router.refresh();
          })
          .catch(() => setWished(!next));
      }}
    >
      <Heart className={wished ? "size-5 fill-rose-500 text-rose-500" : "size-5"} />
    </button>
  );
}
