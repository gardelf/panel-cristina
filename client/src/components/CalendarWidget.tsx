import { Widget } from "@/components/Widget";
import { Calendar, Clock, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";


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

  // Calcular fecha inicial (primera clase disponible)
  const initialDate = useMemo(() => {
    if (!data?.hasData || !data.data || !Array.isArray(data.data)) {
      return undefined;
    }
    const clases = data.data as Array<{ fecha: string }>;
    if (clases.length === 0) return undefined;
    // Ordenar por fecha y tomar la primera
    const fechas = clases.map(c => c.fecha).sort();
    return fechas[0];
  }, [data]);

  // Convertir datos de agenda a eventos de FullCalendar
  const events = useMemo(() => {
    if (!data?.hasData || !data.data || !Array.isArray(data.data)) {
      return [];
    }

    const clases = data.data as Array<{
      fecha: string;
      hora: string;
      reservas: number;
      libres: number;
      aforo: number;
      alumnos?: string[];
    }>;

    return clases.map((clase) => {
      // Parsear hora: "16:15 - 17:05" -> start: "16:15", end: "17:05"
      const [horaInicio, horaFin] = clase.hora.split(' - ').map(h => h.trim());
      
      // Determinar color según disponibilidad
      let backgroundColor = '#10b981'; // verde (plazas disponibles)
      let borderColor = '#059669';
      
      if (clase.libres === 0) {
        backgroundColor = '#ef4444'; // rojo (completo)
        borderColor = '#dc2626';
      } else if (clase.libres <= 2) {
        backgroundColor = '#f59e0b'; // amarillo (pocas plazas)
        borderColor = '#d97706';
      }

      return {
        id: `${clase.fecha}-${horaInicio}`,
        title: `${clase.reservas}/${clase.aforo} - ${clase.libres} libre${clase.libres !== 1 ? 's' : ''}`,
        start: `${clase.fecha}T${horaInicio}:00`,
        end: `${clase.fecha}T${horaFin}:00`,
        backgroundColor,
        borderColor,
        extendedProps: {
          reservas: clase.reservas,
          libres: clase.libres,
          aforo: clase.aforo,
          alumnos: clase.alumnos || [],
        },
      };
    });
  }, [data]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (!data?.hasData || !data.data || !Array.isArray(data.data)) {
      return { totalClases: 0, totalLibres: 0, fechasUnicas: 0 };
    }

    const clases = data.data as Array<{
      fecha: string;
      libres: number;
    }>;

    const fechasUnicas = new Set(clases.map(c => c.fecha)).size;
    const totalClases = clases.length;
    const totalLibres = clases.reduce((sum, c) => sum + c.libres, 0);

    return { totalClases, totalLibres, fechasUnicas };
  }, [data]);

  return (
    <Widget
      title="Calendario de Clases"
      description="Horarios de 8:00 a 21:00"
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

            {/* Calendario FullCalendar */}
            {events.length > 0 ? (
              <div className="fullcalendar-container">
                <FullCalendar
                  key={refreshKey}
                  plugins={[timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  initialDate={initialDate}
                  locale={esLocale}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay'
                  }}
                  slotMinTime="08:00:00"
                  slotMaxTime="21:00:00"
                  slotDuration="01:00:00"
                  allDaySlot={false}
                  height="auto"
                  events={events}
                  eventClick={(info) => {
                    const { reservas, libres, aforo, alumnos } = info.event.extendedProps;
                    const alumnosText = alumnos.length > 0 
                      ? `\n\nAlumnos:\n${alumnos.join('\n')}`
                      : '';
                    
                    alert(
                      `Clase: ${info.event.title}\n` +
                      `Horario: ${info.event.start?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${info.event.end?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n` +
                      `Reservas: ${reservas}/${aforo}\n` +
                      `Plazas libres: ${libres}` +
                      alumnosText
                    );
                  }}
                  eventContent={(eventInfo) => {
                    return (
                      <div className="p-1 text-xs">
                        <div className="font-semibold">{eventInfo.event.title}</div>
                      </div>
                    );
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay datos de clases cargados</p>
                <p className="text-sm mt-2">
                  Ejecuta el script de Playwright para cargar los horarios
                </p>
              </div>
            )}

            {/* Resumen total */}
            {events.length > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {estadisticas.fechasUnicas}
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
            )}

            {/* Leyenda de colores */}
            {events.length > 0 && (
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span>Plazas disponibles</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span>Pocas plazas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span>Completo</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .fullcalendar-container {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent));
        }
        
        .fullcalendar-container .fc {
          font-family: inherit;
        }
        
        .fullcalendar-container .fc-theme-standard td,
        .fullcalendar-container .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        
        .fullcalendar-container .fc-col-header-cell {
          background-color: hsl(var(--muted));
          padding: 8px 4px;
        }
        
        .fullcalendar-container .fc-timegrid-slot {
          height: 3em;
        }
        
        .fullcalendar-container .fc-event {
          cursor: pointer;
        }
        
        .fullcalendar-container .fc-event:hover {
          opacity: 0.9;
        }
      `}</style>
    </Widget>
  );
}
