import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SplitEditor } from "@/components/SplitEditor";
import { getSessionPayload } from "@/lib/session";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSessionPayload(id);
  if (!session) notFound();

  return (
    <main className="session-page">
      <SiteNav />
      <SplitEditor initial={session} />
    </main>
  );
}
