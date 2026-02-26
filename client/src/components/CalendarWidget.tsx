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
      
      // Determinar color según disponibilidad (colores exactos de ExpensesWidget)
      let backgroundColor = 'rgba(34, 197, 94, 0.1)'; // verde de Margen Estudio (plazas disponibles)
      let borderColor = 'rgba(34, 197, 94, 0.3)';
      let textColor = '#16a34a'; // text-green-600
      
      if (clase.libres === 0) {
        backgroundColor = 'rgba(239, 68, 68, 0.15)'; // rojo suave (completo)
        borderColor = 'rgba(239, 68, 68, 0.4)';
        textColor = '#dc2626'; // text-red-600
      } else if (clase.libres <= 2) {
        backgroundColor = 'rgba(59, 130, 246, 0.1)'; // azul de Margen Personal (pocas plazas)
        borderColor = 'rgba(59, 130, 246, 0.3)';
        textColor = '#2563eb'; // text-blue-600
      }

      const valorOcupadas = clase.reservas * 15;
      
      return {
        id: `clase-${clase.fecha}-${horaInicio}`,
        title: `${clase.reservas}/${clase.aforo} - ${valorOcupadas}€`,
        start: `${clase.fecha}T${horaInicio}:00`,
        end: `${clase.fecha}T${horaFin}:00`,
        backgroundColor,
        borderColor,
        textColor,
        extendedProps: {
          type: 'clase',
          reservas: clase.reservas,
          libres: clase.libres,
          aforo: clase.aforo,
          alumnos: clase.alumnos || [],
          valorOcupadas,
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
          backgroundColor: 'rgba(168, 85, 247, 0.1)', // morado de Nómina Cristina (eventos personales)
          borderColor: 'rgba(168, 85, 247, 0.3)',
          textColor: '#9333ea', // text-purple-600
          extendedProps: {
            type: 'personal',
            description: event.description,
            location: event.location,
          },
        };
      });
  }, [personalEvents]);

  // Calcular potencial a recuperar (plazas libres de la semana × 15€)
  const potencialSemanal = useMemo(() => {
    if (!clasesData || !clasesData.hasData || !clasesData.data) return 0;
    
    // Obtener fecha de inicio y fin de la semana actual
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Sumar plazas libres de clases de esta semana
    const totalLibres = clasesData.data.reduce((sum: number, clase: any) => {
      const claseDate = new Date(clase.fecha);
      if (claseDate >= startOfWeek && claseDate <= endOfWeek) {
        return sum + clase.libres;
      }
      return sum;
    }, 0);
    
    return totalLibres * 15;
  }, [clasesData]);

  // Combinar eventos de clases y personales
  const allEvents = useMemo(() => {
    return [...clasesEvents, ...personalCalendarEvents];
  }, [clasesEvents, personalCalendarEvents]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Calendario de Clases</h3>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            Potencial a recuperar: <span className="font-semibold text-green-600">{potencialSemanal}€</span>
          </p>
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
