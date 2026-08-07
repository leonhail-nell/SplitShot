import { notFound } from "next/navigation";
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
      <SplitEditor initial={session} />
    </main>
  );
}
