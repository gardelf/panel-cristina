import { Widget } from "@/components/Widget";
import { Calendar, RefreshCw, Clock, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

// Horarios fijos de 8:00 a 21:00 cada hora
const HORARIOS_FIJOS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00"
];

// Días de la semana
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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

  // Procesar datos y crear estructura completa de la semana
  const calendarioSemanal = useMemo(() => {
    // Obtener la semana actual (lunes a domingo)
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
    const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() + diasHastaLunes);
    lunesActual.setHours(0, 0, 0, 0);

    // Crear estructura de 7 días
    const semana = DIAS_SEMANA.map((nombreDia, index) => {
      const fecha = new Date(lunesActual);
      fecha.setDate(lunesActual.getDate() + index);
      
      const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      
      return {
        nombreDia,
        fecha: fechaStr,
        dia: fecha.getDate(),
        mes: fecha.toLocaleString('es-ES', { month: 'short' }),
        horarios: HORARIOS_FIJOS.map(hora => ({
          hora,
          clase: null as any, // Se llenará con datos reales si existen
        }))
      };
    });

    // Si hay datos, llenar con las clases reales
    if (data?.hasData && data.data && Array.isArray(data.data)) {
      const clases = data.data as Array<{
        fecha: string;
        hora: string;
        reservas: number;
        libres: number;
        aforo: number;
        alumnos?: string[];
      }>;

      clases.forEach(clase => {
        const diaEncontrado = semana.find(d => d.fecha === clase.fecha);
        if (diaEncontrado) {
          // Buscar el horario más cercano
          const horaBase = clase.hora.substring(0, 5); // "16:15" -> "16:15"
          const horarioEncontrado = diaEncontrado.horarios.find(h => 
            clase.hora.startsWith(h.hora.substring(0, 2)) // Comparar solo la hora
          );
          
          if (horarioEncontrado) {
            horarioEncontrado.clase = clase;
          }
        }
      });
    }

    return semana;
  }, [data]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    let totalClases = 0;
    let totalLibres = 0;

    calendarioSemanal.forEach(dia => {
      dia.horarios.forEach(horario => {
        if (horario.clase) {
          totalClases++;
          totalLibres += horario.clase.libres;
        }
      });
    });

    return { totalClases, totalLibres };
  }, [calendarioSemanal]);

  return (
    <Widget
      title="Calendario de Clases"
      description="Horarios de 8:00 a 21:00 - Semana actual"
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

        {!isLoading && !error && (
          <>
            {/* Información de última actualización */}
            {data?.uploadedAt && (
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {calendarioSemanal.map((dia) => {
                const clasesDelDia = dia.horarios.filter(h => h.clase).length;
                const libresDelDia = dia.horarios.reduce((sum, h) => sum + (h.clase?.libres || 0), 0);

                return (
                  <div
                    key={dia.fecha}
                    className="border rounded-lg p-3 bg-card hover:shadow-md transition-shadow"
                  >
                    {/* Cabecera del día */}
                    <div className="mb-3 pb-2 border-b">
                      <div className="font-semibold text-base">
                        {dia.nombreDia}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {dia.dia} {dia.mes}
                      </div>
                      {clasesDelDia > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {clasesDelDia} clases · {libresDelDia} plazas libres
                        </div>
                      )}
                    </div>

                    {/* Lista de horarios del día */}
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {dia.horarios.map((horario, idx) => {
                        const clase = horario.clase;
                        
                        if (!clase) {
                          // Horario sin clase
                          return (
                            <div
                              key={idx}
                              className="p-2 rounded text-sm bg-muted/30 text-muted-foreground"
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 opacity-50" />
                                <span className="text-xs">{horario.hora}</span>
                                <span className="text-xs opacity-50 ml-auto">Sin clase</span>
                              </div>
                            </div>
                          );
                        }

                        // Horario con clase
                        return (
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
                                <span className="font-medium text-xs">{clase.hora}</span>
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
                        );
                      })}
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
                    7
                  </div>
                  <div className="text-xs text-muted-foreground">Días</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {estadisticas.totalClases}
                  </div>
                  <div className="text-xs text-muted-foreground">Clases</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {estadisticas.totalLibres}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Plazas libres
                  </div>
                </div>
              </div>
            </div>

            {!data?.hasData && (
              <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay datos de clases cargados</p>
                <p className="text-xs mt-1">
                  Ejecuta el script de Playwright para cargar los horarios
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Widget>
  );
}
