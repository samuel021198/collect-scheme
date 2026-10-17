import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatRelease, type TcgSet } from "@/lib/sets";

export function SetTile({
  set,
  locale,
  countLabel,
  languageLabel,
}: {
  set: TcgSet;
  locale: string;
  countLabel: string;
  languageLabel?: string;
}) {
  return (
    <Link
      href={`/sets/${set.id}`}
      className="grid gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/50"
    >
      <div className="flex h-16 items-center">
        {set.logo ? (
          <Image
            src={set.logo}
            alt=""
            width={220}
            height={80}
            unoptimized
            style={{ width: "auto", height: "auto" }}
            className="max-h-16 max-w-full object-contain"
          />
        ) : null}
      </div>
      <div className="grid gap-1">
        <h3 className="text-base leading-6">{set.name}</h3>
        <p className="text-xs text-muted-foreground">
          {[set.code, formatRelease(set.releaseDate, locale), countLabel].filter(Boolean).join(" · ")}
        </p>
        {languageLabel ? (
          <Badge variant="outline" className="mt-1 w-fit">
            {languageLabel}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
