import { Widget } from "@/components/Widget";
import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ClassesWidget() {
  const [iframeHeight, setIframeHeight] = useState(600);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.data &&
        event.data.type === "iframeHeight" &&
        typeof event.data.height === "number"
      ) {
        // Añadir un pequeño margen para evitar scroll residual
        setIframeHeight(event.data.height + 20);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Widget
      title="Sistema de Clases"
      description="Gestión de horarios y plazas de pilates"
      icon={<Calendar className="h-5 w-5" />}
      externalLink="http://localhost:3000"
      externalLinkText="Abrir en Nueva Ventana"
      className="xl:col-span-3"
    >
      <div className="w-full" style={{ height: `${iframeHeight}px` }}>
        <iframe
          ref={iframeRef}
          src="http://localhost:3000"
          className="w-full h-full border-0 rounded-lg"
          title="Sistema de Gestión de Clases"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </Widget>
  );
}
