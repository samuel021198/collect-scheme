import { currentUser } from "@/lib/auth";
import { createPost } from "@/lib/trades";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "generic" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "generic" }, { status: 400 });
  }
  const result = await createPost(body, user.name);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ id: result.id }, { status: 201 });
}
