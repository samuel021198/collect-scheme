"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void fetch("/api/auth/logout", { method: "POST" }).then(() => {
          router.push("/");
          router.refresh();
        });
      }}
    >
      {t("logout")}
    </Button>
  );
}
