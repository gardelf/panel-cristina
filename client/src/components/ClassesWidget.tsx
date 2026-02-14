import { Widget } from "@/components/Widget";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ClaseVacia {
  hora: string;
  libres: number;
  aforo: number;
  reservas: number;
  alumnos: string[];
}

interface ClasesPorDia {
  [fecha: string]: ClaseVacia[];
}

interface EstadisticasClases {
  totalClasesConPlazas: number;
  totalPlazasLibres: number;
  ultimaActualizacion: string;
}

interface ResponseClasesVacias {
  success: boolean;
  estadisticas: EstadisticasClases;
  clasesPorDia: ClasesPorDia;
  todasLasClases: (ClaseVacia & { fecha: string })[];
}

export function ClassesWidget() {
  const [data, setData] = useState<ResponseClasesVacias | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchClasesVacias = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/clases-vacias');
      
      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor local');
      }

      const result: ResponseClasesVacias = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasesVacias();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchClasesVacias, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchClasesVacias();
  };

  const handleOpenLocal = () => {
    window.open('http://localhost:3000', '_blank');
  };

  // Calcular plazas por día de la semana
  const getDayName = (fecha: string): string => {
    const date = new Date(fecha + 'T00:00:00');
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()] || fecha;
  };

  const plazasPorDia: { [dia: string]: number } = {};
  
  if (data) {
    Object.entries(data.clasesPorDia).forEach(([fecha, clases]) => {
      const dia = getDayName(fecha);
      plazasPorDia[dia] = clases.reduce((sum, clase) => sum + clase.libres, 0);
    });
  }

  // Días destacados (Lunes, Miércoles, Viernes)
  const diasDestacados = ['Lunes', 'Miércoles', 'Viernes'];

  return (
    <Widget
      title="Clases Vacías"
      description="Plazas disponibles esta semana"
      icon={<Calendar className="h-5 w-5" />}
      onRefresh={handleRefresh}
      isLoading={loading}
      externalLink="http://localhost:3000"
      externalLinkText="Abrir Sistema Local"
      className="xl:col-span-3"
    >
      {error ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                No se pudo conectar con el servidor local
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Asegúrate de que el servidor está corriendo en localhost:3000
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-center py-4 border-t border-border">
            <p className="mb-2">Para iniciar el servidor local:</p>
            <code className="bg-secondary px-3 py-1 rounded text-xs">
              node servidor-clases-local.js
            </code>
          </div>
        </div>
      ) : loading && !data ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {diasDestacados.map((dia) => (
              <div
                key={dia}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <p className="text-sm text-muted-foreground mb-1">{dia}</p>
                <p className="text-2xl font-semibold">
                  {plazasPorDia[dia] || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Plazas libres
                </p>
              </div>
            ))}
            
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
              <p className="text-sm text-muted-foreground mb-1">Total semana</p>
              <p className="text-2xl font-semibold text-primary">
                {data.estadisticas.totalPlazasLibres}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Plazas disponibles
              </p>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="text-xs text-muted-foreground text-center py-2 border-t border-border">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
            </div>
          )}
        </div>
      ) : null}
    </Widget>
  );
}
