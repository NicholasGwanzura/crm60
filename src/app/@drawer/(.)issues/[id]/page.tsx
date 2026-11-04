import { IssueDetail } from "@/components/issue-detail";
import { RouteDrawer } from "@/components/route-drawer";

export default async function IssueDrawer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RouteDrawer href={`/issues/${id}`} label="Issue details"><IssueDetail id={id} drawer /></RouteDrawer>;
}
