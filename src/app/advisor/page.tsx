import { AdvisorForm } from "@/components/advisor/advisor-form";

export default async function AdvisorPage({
  searchParams,
}: {
  searchParams?: Promise<{ instrumentId?: string }>;
}) {
  const params = await searchParams;
  const instrumentId = params?.instrumentId;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Predictive Maintenance Advisor
        </h2>
        <p className="text-muted-foreground">
          Get AI-powered insights and recommendations for your instruments
        </p>
      </div>
      <AdvisorForm instrumentId={instrumentId} />
    </div>
  );
}
