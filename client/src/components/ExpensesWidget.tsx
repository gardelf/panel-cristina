import { Widget } from "@/components/Widget";
import { trpc } from "@/lib/trpc";
import { TrendingDown, AlertCircle, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function ExpensesWidget() {
  const { data, isLoading, error, refetch } = trpc.expenses.summary.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });

  const { data: studioData, isLoading: studioLoading, refetch: refetchStudio } = 
    trpc.expenses.studio.useQuery(undefined, {
      refetchInterval: 5 * 60 * 1000,
    });

  // Obtener datos de ingresos para calcular márgenes
  const { data: incomeData, refetch: refetchIncome } = trpc.income.summary.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

  const [isStudioExpanded, setIsStudioExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleRefresh = () => {
    refetch();
    refetchStudio();
    refetchIncome();
  };

  // Calcular Margen Estudio = Ingresos previstos - Gastos del Estudio
  const margenEstudio = incomeData && studioData 
    ? incomeData.projectedIncome - studioData.total 
    : 0;

  return (
    <Widget
      title="Gastos"
      description="Resumen de gastos de Firefly III"
      icon={<TrendingDown className="h-5 w-5" />}
      externalLink="https://firefly-core-production-2d81.up.railway.app"
      externalLinkText="Abrir Firefly"
      onRefresh={handleRefresh}
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
        <div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 sm:p-4 rounded-lg bg-secondary/50">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && data && (
        <div>
          {!data.enabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configura tu token de Firefly III en las variables de entorno para ver datos reales.
              </AlertDescription>
            </Alert>
          )}

          {/* Fila con Gastos del Estudio y Margen Estudio */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Sección de Gastos del Estudio */}
            {studioData && studioData.enabled && (
              <div className="p-3 sm:p-4 rounded-lg bg-accent/10 border border-accent/30">
                <button
                  onClick={() => setIsStudioExpanded(!isStudioExpanded)}
                  className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground mb-1">
                      Gastos del Estudio (este mes)
                    </p>
                    <p className="text-xl sm:text-2xl font-semibold text-accent-foreground">
                      {formatCurrency(studioData.total)}
                    </p>
                  </div>
                  {isStudioExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {isStudioExpanded && (
                  <div className="mt-4 space-y-2 border-t border-accent/20 pt-4">
                    {studioLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : studioData.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay gastos del Estudio este mes
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {studioData.transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {transaction.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{formatDate(transaction.date)}</span>
                                {transaction.category && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{transaction.category}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm font-semibold">
                                {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sección de Margen Estudio */}
            {incomeData && studioData && (
              <div className="p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground mb-1">
                      Margen Estudio
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Ingresos previstos - Gastos Estudio
                    </p>
                    <p className={`text-xl sm:text-2xl font-semibold ${margenEstudio >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(margenEstudio)}
                    </p>
                  </div>
                  <TrendingUp className={`hidden sm:block h-8 w-8 ${margenEstudio >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </Widget>
  );
}
