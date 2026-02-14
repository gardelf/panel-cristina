import { useAuth } from "@/_core/hooks/useAuth";
import { Widget } from "@/components/Widget";
import { ExpensesWidget } from "@/components/ExpensesWidget";
import { IncomeWidget } from "@/components/IncomeWidget";
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Widget de Gastos */}
          <ExpensesWidget />

          {/* Widget de Ingresos */}
          <IncomeWidget />

          {/* Widget de Clases Vacías */}
          <Widget
            title="Clases Vacías"
            description="Plazas libres en horarios de pilates esta semana"
            icon={<Calendar className="h-5 w-5" />}
            externalLink="http://localhost:3000"
            externalLinkText="Abrir Sistema Local"
            className="xl:col-span-3"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">Lunes</p>
                  <p className="text-2xl font-semibold">-</p>
                  <p className="text-xs text-muted-foreground mt-1">Plazas libres</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">Miércoles</p>
                  <p className="text-2xl font-semibold">-</p>
                  <p className="text-xs text-muted-foreground mt-1">Plazas libres</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">Viernes</p>
                  <p className="text-2xl font-semibold">-</p>
                  <p className="text-xs text-muted-foreground mt-1">Plazas libres</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">Total semana</p>
                  <p className="text-2xl font-semibold text-primary">-</p>
                  <p className="text-xs text-muted-foreground mt-1">Plazas disponibles</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground text-center py-2 border-t border-border">
                Conecta con el servidor local (localhost:3000) para ver datos en tiempo real
              </div>
            </div>
          </Widget>
        </div>
      </main>
    </div>
  );
}
