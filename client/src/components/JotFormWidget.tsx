import { useState, useEffect, useCallback } from "react";
import { Users, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Link2 } from "lucide-react";

interface Submission {
  id: string;
  createdAt: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  genero: string;
  localidad: string;
  comoNosConocio: string;
  urlTimp: string;
  isNew: boolean;
}

interface JotFormData {
  submissions: Submission[];
  newCount: number;
  lastSeenAt: string;
}

// Valida que una URL sea segura para usar en href
function safeUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "http:") return url;
    return null;
  } catch {
    return null;
  }
}

export function JotFormWidget() {
  const [data, setData] = useState<JotFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("https://jotform-cris-production.up.railway.app/api/jotform/submissions")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        setError(null);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const markSeen = async () => {
    setMarking(true);
    try {
      await fetch("https://jotform-cris-production.up.railway.app/api/jotform/mark-seen", { method: "POST" });
      await fetchData();
    } finally {
      setMarking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr.replace(" ", "T") + "Z");
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground">No se pudo conectar con JotForm</p>
      </div>
    );
  }

  const hasNew = data.newCount > 0;
  const visibleSubmissions = expanded ? data.submissions : data.submissions.slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-xl font-bold text-foreground">Nuevas Altas</span>
          <span className="text-sm text-muted-foreground ml-1">({data.submissions.length} registros)</span>
        </div>
        <div className="flex items-center gap-2">
          {hasNew && (
            <button
              onClick={markSeen}
              disabled={marking}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              {marking ? "Marcando..." : `${data.newCount} nuevo${data.newCount > 1 ? "s" : ""}`}
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="https://www.jotform.com/tables/252823884959375"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Abrir JotForm
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Fecha</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Nombre</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Email</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Teléfono</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Localidad</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Cómo nos conoció</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">Alta TIMP</th>
            </tr>
          </thead>
          <tbody>
            {visibleSubmissions.map((s, i) => {
              const timpUrl = safeUrl(s.urlTimp);
              const emailUrl = s.email ? `mailto:${s.email}` : null;
              return (
                <tr
                  key={s.id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    s.isNew
                      ? "bg-green-50 dark:bg-green-950/20"
                      : i % 2 === 0
                      ? "bg-background"
                      : "bg-muted/20"
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {s.isNew && (
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                      {formatDate(s.createdAt)}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                    {s.nombre} {s.apellidos}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {emailUrl ? (
                      <a href={emailUrl} className="hover:text-primary transition-colors">
                        {s.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                    {s.telefono || <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {s.localidad || <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {s.comoNosConocio || <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {timpUrl ? (
                      <a
                        href={timpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        Alta
                      </a>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mostrar más / menos */}
      {data.submissions.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Ver los {data.submissions.length - 5} registros restantes
            </>
          )}
        </button>
      )}
    </div>
  );
}
