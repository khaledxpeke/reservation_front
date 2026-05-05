import { MatchDetail } from "@/components/matches/MatchDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnnonceDetailPage({ params }: Props) {
  const { id } = await params;
  return <MatchDetail id={id} />;
}
