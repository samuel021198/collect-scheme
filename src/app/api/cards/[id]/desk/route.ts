import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listBinders } from "@/lib/binders";
import { collectionForCard } from "@/lib/collection";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ signedIn: false, items: [], binders: [] });
  const { id } = await context.params;
  const [items, binders] = await Promise.all([collectionForCard(user.id, id), listBinders(user.id)]);
  return NextResponse.json({
    signedIn: true,
    items: items.map((item) => ({
      id: item.id,
      condition: item.condition,
      grade: item.grade,
      quantity: item.quantity,
    })),
    binders: binders.map((item) => ({ id: item.id, name: item.name })),
  });
}
