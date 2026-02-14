import { Widget } from "@/components/Widget";
import { Calendar } from "lucide-react";

export function ClassesWidget() {
  return (
    <Widget
      title="Sistema de Clases"
      description="Gestión de horarios y plazas de pilates"
      icon={<Calendar className="h-5 w-5" />}
      externalLink="http://localhost:3000"
      externalLinkText="Abrir en Nueva Ventana"
      className="xl:col-span-3"
    >
      <div className="w-full" style={{ height: '600px' }}>
        <iframe
          src="http://localhost:3000"
          className="w-full h-full border-0 rounded-lg"
          title="Sistema de Gestión de Clases"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </Widget>
  );
}
