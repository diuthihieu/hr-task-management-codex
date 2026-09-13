import { WorkspaceApp } from "@/components/workspace/workspace-app";
import { auth, authReady, authRequired } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  if (!authRequired) return <WorkspaceApp user={{ name: "Hieu Nguyen" }} />;
  if (!authReady) redirect("/sign-in");
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return <WorkspaceApp user={{ name: session.user.name || session.user.email || "Workspace user", email: session.user.email ?? undefined, image: session.user.image ?? undefined }} />;
}
