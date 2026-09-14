import { ApplicationTracker } from "@/components/applications/application-tracker";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationTracker applicationId={id} />;
}
