import { Widget } from "@/components/Widget";
import { Calendar, RefreshCw, Clock, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CalendarWidget() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data, isLoading, error, refetch } = trpc.agenda.getLatest.useQuery(
    undefined,
    {
      refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    refetch();
  };

  // Agrupar clases por fecha
  const clasesPorFecha = data?.hasData && data.data && Array.isArray(data.data)
    ? (data.data as Array<{
        fecha: string;
        hora: string;
        reservas: number;
        libres: number;
        aforo: number;
        alumnos?: string[];
      }>).reduce((acc, clase) => {
        if (!acc[clase.fecha]) {
          acc[clase.fecha] = [];
        }
        acc[clase.fecha].push(clase);
        return acc;
      }, {} as Record<string, Array<{
        fecha: string;
        hora: string;
        reservas: number;
        libres: number;
        aforo: number;
        alumnos?: string[];
      }>>)
    : {};

  // Ordenar fechas
  const fechasOrdenadas = Object.keys(clasesPorFecha).sort();

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return {
      diaSemana: dias[fecha.getDay()],
      dia: fecha.getDate(),
      mes: meses[fecha.getMonth()],
    };
  };

  return (
    <Widget
      title="Calendario de Clases"
      description="Horarios y plazas disponibles para la semana"
      icon={<Calendar className="h-5 w-5" />}
      className="xl:col-span-3"
      onRefresh={handleRefresh}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Cargando calendario...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            Error al cargar el calendario
          </div>
        )}

        {!isLoading && !error && !data?.hasData && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay datos de agenda disponibles</p>
            <p className="text-sm mt-2">
              Ejecuta el script de Playwright para generar y subir los datos
            </p>
          </div>
        )}

        {!isLoading && !error && data?.hasData && (
          <>
            {/* Información de última actualización */}
            {data.uploadedAt && (
              <div className="text-xs text-muted-foreground text-right">
                Última actualización:{" "}
                {new Date(data.uploadedAt).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}

            {/* Vista de calendario semanal */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fechasOrdenadas.map((fecha) => {
                const fechaFormateada = formatearFecha(fecha);
                const clases = clasesPorFecha[fecha];
                const totalLibres = clases.reduce((sum, c) => sum + c.libres, 0);

                return (
                  <div
                    key={fecha}
                    className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                  >
                    {/* Cabecera del día */}
                    <div className="mb-3 pb-3 border-b">
                      <div className="font-semibold text-lg">
                        {fechaFormateada.diaSemana}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {fechaFormateada.dia} {fechaFormateada.mes}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {totalLibres} plazas libres
                      </div>
                    </div>

                    {/* Lista de clases del día */}
                    <div className="space-y-2">
                      {clases
                        .sort((a, b) => a.hora.localeCompare(b.hora))
                        .map((clase, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded text-sm ${
                              clase.libres === 0
                                ? "bg-destructive/10 text-destructive"
                                : clase.libres <= 2
                                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                : "bg-green-500/10 text-green-700 dark:text-green-400"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">{clase.hora}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Users className="h-3 w-3" />
                                <span>
                                  {clase.reservas}/{clase.aforo}
                                </span>
                              </div>
                            </div>
                            {clase.libres > 0 && (
                              <div className="text-xs mt-1 opacity-80">
                                {clase.libres} {clase.libres === 1 ? "plaza" : "plazas"} libre
                                {clase.libres === 1 ? "" : "s"}
                              </div>
                            )}
                            {clase.libres === 0 && (
                              <div className="text-xs mt-1 font-medium">
                                Completo
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen total */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {fechasOrdenadas.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Días</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {Object.values(clasesPorFecha).flat().length}
                  </div>
                  <div className="text-xs text-muted-foreground">Clases</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Object.values(clasesPorFecha)
                      .flat()
                      .reduce((sum, c) => sum + c.libres, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Plazas libres
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Widget>
  );
}
