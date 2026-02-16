import { useAuth } from "@/_core/hooks/useAuth";
import { Widget } from "@/components/Widget";
import { ExpensesWidget } from "@/components/ExpensesWidget";
import { IncomeWidget } from "@/components/IncomeWidget";
import { CalendarWidget } from "@/components/CalendarWidget";
import { ClassesWidget } from "@/components/ClassesWidget";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  LogOut,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Panel de Control
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenida, {user?.name || "Cristina"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container py-8">
        <div className="space-y-6">
          {/* Fila 1: Gastos e Ingresos en 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpensesWidget />
            <IncomeWidget />
          </div>

          {/* Fila 2: Calendario de Clases - ancho completo */}
          <CalendarWidget />

          {/* Fila 3: Sistema de Clases - ancho completo */}
          <ClassesWidget />
        </div>
      </main>
    </div>
  );
}
