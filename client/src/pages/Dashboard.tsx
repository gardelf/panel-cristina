import { ExpensesWidget } from "@/components/ExpensesWidget";
import { IncomeWidget } from "@/components/IncomeWidget";

export default function Dashboard() {
  const currentMonth = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                MybalancePilates · {currentMonth}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenida, Cristina
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container py-4 sm:py-8">
        <div className="space-y-3 sm:space-y-6">
          {/* Fila 1: Ingresos (1/3) y Gastos (2/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            <div className="lg:col-span-1">
              <IncomeWidget />
            </div>
            <div className="lg:col-span-2">
              <ExpensesWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
