import { Widget } from "@/components/Widget";
import { trpc } from "@/lib/trpc";
import { TrendingDown, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
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

  const { data: yesterdayData, isLoading: yesterdayLoading, refetch: refetchYesterday } = 
    trpc.expenses.yesterday.useQuery(undefined, {
      refetchInterval: 5 * 60 * 1000,
    });

  const { data: extraordinaryData, isLoading: extraordinaryLoading, refetch: refetchExtraordinary } = 
    trpc.expenses.extraordinary.useQuery(undefined, {
      refetchInterval: 5 * 60 * 1000,
    });

  const [isStudioExpanded, setIsStudioExpanded] = useState(false);
  const [isYesterdayExpanded, setIsYesterdayExpanded] = useState(false);
  const [isExtraordinaryExpanded, setIsExtraordinaryExpanded] = useState(false);

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
    refetchYesterday();
    refetchExtraordinary();
  };

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

          {/* Sección de Gastos del Estudio - PRIMERO */}
          {studioData && studioData.enabled && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
              <button
                onClick={() => setIsStudioExpanded(!isStudioExpanded)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="text-left">
                  <p className="text-sm text-muted-foreground mb-1">
                    Gastos del Estudio (este mes)
                  </p>
                  <p className="text-2xl font-semibold text-accent-foreground">
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

            {/* Sección de Ayer - DESPLEGABLE */}
            <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
              <button
                onClick={() => setIsYesterdayExpanded(!isYesterdayExpanded)}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="text-sm text-muted-foreground mb-1">Ayer</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(data.yesterday)}
                  </p>
                </div>
                {yesterdayData && yesterdayData.transactions.length > 0 && (
                  <>
                    {isYesterdayExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </>
                )}
              </button>

              {isYesterdayExpanded && yesterdayData && yesterdayData.enabled && (
                <div className="mt-4 space-y-2 border-t border-secondary pt-4">
                  {yesterdayLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : yesterdayData.transactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No hay gastos de ayer
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {yesterdayData.transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {transaction.description}
                            </p>
                            {transaction.category && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {transaction.category}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <p className="text-xs font-semibold">
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
          </div>

          {/* Sección de Gastos Extraordinarios - DESPLEGABLE */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
            <button
              onClick={() => setIsExtraordinaryExpanded(!isExtraordinaryExpanded)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <p className="text-sm text-muted-foreground mb-1">
                  Gastos extraordinarios previstos (próximo mes)
                </p>
                <p className="text-2xl font-semibold text-primary">
                  {formatCurrency(data.nextMonthExtraordinary)}
                </p>
              </div>
              {extraordinaryData && extraordinaryData.transactions.length > 0 && (
                <>
                  {isExtraordinaryExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </>
              )}
            </button>

            {isExtraordinaryExpanded && extraordinaryData && extraordinaryData.enabled && (
              <div className="mt-4 space-y-2 border-t border-primary/20 pt-4">
                {extraordinaryLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : extraordinaryData.transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay gastos extraordinarios previstos
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {extraordinaryData.transactions.map((transaction) => (
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
                          <p className="text-sm font-semibold text-primary">
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
        </div>
      )}
    </Widget>
  );
}
