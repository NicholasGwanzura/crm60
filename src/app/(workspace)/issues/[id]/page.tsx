import { IssueDetail } from "@/components/issue-detail";

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  return <IssueDetail id={(await params).id} />;
}
