import { Widget } from "@/components/Widget";
import { trpc } from "@/lib/trpc";
import { TrendingDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function ExpensesWidget() {
  const { data, isLoading, error, refetch } = trpc.expenses.summary.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <Widget
      title="Gastos"
      description="Resumen de gastos de Firefly III"
      icon={<TrendingDown className="h-5 w-5" />}
      externalLink="https://firefly-core-production-55c1.up.railway.app"
      externalLinkText="Abrir Firefly"
      onRefresh={() => refetch()}
      isLoading={isLoading}
      className="xl:col-span-2"
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar datos de gastos. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/50">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
          <div className="p-4 rounded-lg bg-secondary/50">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-4">
          {!data.enabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configura tu token de Firefly III en las variables de entorno para ver datos reales.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
              <p className="text-sm text-muted-foreground mb-1">Este mes</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(data.currentMonth)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
              <p className="text-sm text-muted-foreground mb-1">Última semana</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(data.lastWeek)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
              <p className="text-sm text-muted-foreground mb-1">Ayer</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(data.yesterday)}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
            <p className="text-sm text-muted-foreground mb-1">
              Gastos extraordinarios previstos (próximo mes)
            </p>
            <p className="text-2xl font-semibold text-primary">
              {formatCurrency(data.nextMonthExtraordinary)}
            </p>
          </div>
        </div>
      )}
    </Widget>
  );
}
