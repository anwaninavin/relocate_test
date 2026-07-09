import { useParams } from "react-router-dom";

import { BagDetailView } from "@/features/bags/bag-detail-view";
import NotFound from "@/pages/not-found";

export default function BagDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <NotFound />;
  return <BagDetailView bagId={id} />;
}
