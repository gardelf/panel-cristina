import { Widget } from "@/components/Widget";
import { trpc } from "@/lib/trpc";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function IncomeWidget() {
  const { data, isLoading, error, refetch } = trpc.income.summary.useQuery(undefined, {
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
      title="Ingresos"
      description="Contabilidad de Google Sheets"
      icon={<TrendingUp className="h-5 w-5" />}
      externalLink="https://docs.google.com/spreadsheets/d/1Xsc32K66vO0STP4r8Pl7zWEmknjpTotrNJCHQfxhhMA"
      externalLinkText="Abrir Hoja"
      onRefresh={() => refetch()}
      isLoading={isLoading}
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar datos de ingresos. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-secondary/50">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-4">
          {!data.enabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configura el ID de Google Sheets en las variables de entorno para ver datos reales.
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
            <p className="text-sm text-muted-foreground mb-1">Ingresos a hoy</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(data.currentIncome)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
            <p className="text-sm text-muted-foreground mb-1">
              Pendientes por cobrar
            </p>
            <p className="text-2xl font-semibold">
              {formatCurrency(data.pendingIncome)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
            <p className="text-sm text-muted-foreground mb-1">
              Ingresos previstos
            </p>
            <p className="text-2xl font-semibold text-primary">
              {formatCurrency(data.projectedIncome)}
            </p>
          </div>

          {data.enabled && (
            <div className="text-xs text-muted-foreground text-center py-2 border-t border-border">
              Nota: La estructura de cálculo debe ajustarse según tu hoja de Google Sheets
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}
