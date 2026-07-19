import { getSession, ROLE_HOME } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);
  redirect("/login");
}
