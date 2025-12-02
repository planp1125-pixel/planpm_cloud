import { AdvisorForm } from "@/components/advisor/advisor-form";

export default function AdvisorPage({
  searchParams,
}: {
  searchParams?: { instrumentId?: string };
}) {
  const instrumentId = searchParams?.instrumentId;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Predictive Maintenance Advisor
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Leverage AI to analyze instrument data and predict potential failures. 
          Select an instrument and provide its usage patterns to get proactive maintenance recommendations.
        </p>
      </div>
      <AdvisorForm instrumentId={instrumentId} />
    </div>
  );
}
