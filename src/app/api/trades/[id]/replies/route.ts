import { currentUser } from "@/lib/auth";
import { addReply } from "@/lib/trades";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "generic" }, { status: 401 });
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "generic" }, { status: 400 });
  }
  const result = await addReply(id, body, user.name);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 400 });
  return Response.json({ id: result.id }, { status: 201 });
}
