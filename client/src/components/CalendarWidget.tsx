import { Card } from "@/components/ui/card";
import { Calendar, Clock, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";


export function CalendarWidget() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Obtener eventos de clases
  const { data: clasesData, isLoading: clasesLoading, error: clasesError, refetch: refetchClases } = trpc.agenda.getLatest.useQuery(
    undefined,
    {
      refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
      staleTime: 5 * 60 * 1000,
    }
  );

  // Obtener eventos personales de iCloud
  // Empezar desde las 00:00 de hoy para incluir eventos que ya pasaron hoy
  const startDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }, []);
  const endDate = useMemo(() => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), []);
  
  const { data: personalEvents, isLoading: personalLoading, refetch: refetchPersonal } = trpc.agenda.getPersonalEvents.useQuery(
    { startDate, endDate },
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    refetchClases();
    refetchPersonal();
  };

  const isLoading = clasesLoading || personalLoading;
  const error = clasesError;

  // Calcular fecha inicial (primera clase disponible)
  const initialDate = useMemo(() => {
    if (!clasesData?.hasData || !clasesData.data || !Array.isArray(clasesData.data)) {
      return undefined;
    }
    const clases = clasesData.data as Array<{ fecha: string }>;
    if (clases.length === 0) return undefined;
    // Ordenar por fecha y tomar la primera
    const fechas = clases.map(c => c.fecha).sort();
    return fechas[0];
  }, [clasesData]);

  // Convertir datos de agenda a eventos de FullCalendar
  const clasesEvents = useMemo(() => {
    if (!clasesData?.hasData || !clasesData.data || !Array.isArray(clasesData.data)) {
      return [];
    }

    const clases = clasesData.data as Array<{
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

      const valorLibres = clase.libres * 15;
      
      return {
        id: `clase-${clase.fecha}-${horaInicio}`,
        title: `${clase.reservas}/${clase.aforo} - ${valorLibres}€`,
        start: `${clase.fecha}T${horaInicio}:00`,
        end: `${clase.fecha}T${horaFin}:00`,
        backgroundColor,
        borderColor,
        extendedProps: {
          type: 'clase',
          reservas: clase.reservas,
          libres: clase.libres,
          aforo: clase.aforo,
          alumnos: clase.alumnos || [],
          valorLibres,
        },
      };
    });
  }, [clasesData]);

  // Convertir eventos personales a formato FullCalendar
  const personalCalendarEvents = useMemo(() => {
    if (!personalEvents || !Array.isArray(personalEvents)) {
      return [];
    }

    // El backend ya parsea correctamente las fechas con TZID
    // Solo filtrar eventos con fechas válidas (2020 en adelante)
    const cutoffDate = new Date('2020-01-01');

    return personalEvents
      .filter((event) => {
        const eventDate = new Date(event.start);
        // Solo mostrar eventos con fechas válidas (2020+)
        return eventDate >= cutoffDate;
      })
      .map((event) => {
        return {
          id: `personal-${event.id}`,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          backgroundColor: '#9333ea', // morado para eventos personales
          borderColor: '#7e22ce',
          extendedProps: {
            type: 'personal',
            description: event.description,
            location: event.location,
          },
        };
      });
  }, [personalEvents]);

  // Combinar eventos de clases y personales
  const allEvents = useMemo(() => {
    return [...clasesEvents, ...personalCalendarEvents];
  }, [clasesEvents, personalCalendarEvents]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Calendario de Clases</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
          <span>Clases disponibles</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>Pocas plazas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Completo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#9333ea' }}></div>
          <span>Eventos personales</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-destructive">
          Error al cargar el calendario
        </div>
      )}

      {!isLoading && !error && (
        <div className="calendar-container">
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
            slotMaxTime="22:00:00"
            allDaySlot={false}
            height="auto"
            events={allEvents}
            eventClick={(info) => {
              const props = info.event.extendedProps;
              if (props.type === 'clase') {
                alert(
                  `Clase: ${info.event.title}\n` +
                  `Reservas: ${props.reservas}/${props.aforo}\n` +
                  `Plazas libres: ${props.libres}\n` +
                  `Valor: ${props.valorOcupadas}€\n` +
                  `Alumnos: ${props.alumnos.join(', ') || 'Ninguno'}`
                );
              } else if (props.type === 'personal') {
                alert(
                  `Evento: ${info.event.title}\n` +
                  `Inicio: ${new Date(info.event.start!).toLocaleString('es-ES')}\n` +
                  `Fin: ${new Date(info.event.end!).toLocaleString('es-ES')}\n` +
                  `Descripción: ${props.description || 'Sin descripción'}\n` +
                  `Ubicación: ${props.location || 'Sin ubicación'}`
                );
              }
            }}
          />
        </div>
      )}
    </Card>
  );
}
