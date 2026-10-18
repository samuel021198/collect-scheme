"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function RemoveItem({ id }: { id: string }) {
  const t = useTranslations("collection");
  const router = useRouter();
  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      onClick={() => {
        void fetch(`/api/collection/${id}`, { method: "DELETE" }).then(() => router.refresh());
      }}
    >
      {t("remove")}
    </Button>
  );
}
