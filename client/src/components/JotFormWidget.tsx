import { useState, useEffect, useCallback } from "react";
import { Users, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Link2, UserPlus, CheckCircle, XCircle, Loader2 } from "lucide-react";

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

// Estado de alta por submission id
type AltaStatus = "idle" | "loading" | "ok" | "error";

// URL del servidor local Playwright
const LOCAL_SERVER = "http://localhost:3000";

export function JotFormWidget() {
  const [data, setData] = useState<JotFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [marking, setMarking] = useState(false);

  // Estado de alta por alumna: { [submissionId]: { status, mensaje } }
  const [altaStatus, setAltaStatus] = useState<Record<string, { status: AltaStatus; mensaje?: string }>>({});

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("https://jotform-cris-production.up.railway.app/api/jotform/submissions")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
    // Polling cada 5 minutos
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

  // ── Alta en TIMP.pro via servidor local ──────────────────────────────────────
  const altaEnTimp = async (s: Submission) => {
    setAltaStatus((prev) => ({ ...prev, [s.id]: { status: "loading" } }));

    try {
      const res = await fetch(`${LOCAL_SERVER}/api/alta-timp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:    s.nombre,
          apellidos: s.apellidos,
          email:     s.email,
          telefono:  s.telefono,
          genero:    s.genero,
        }),
      });

      const json = await res.json();

      if (res.ok && json.ok) {
        setAltaStatus((prev) => ({
          ...prev,
          [s.id]: { status: "ok", mensaje: `Alta completada · ${json.urlPerfil || ""}` },
        }));
        // Abrir el perfil en TIMP si se devuelve la URL
        if (json.urlPerfil) {
          window.open(json.urlPerfil, "_blank");
        }
      } else {
        setAltaStatus((prev) => ({
          ...prev,
          [s.id]: { status: "error", mensaje: json.error || "Error desconocido" },
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo conectar con el servidor local";
      setAltaStatus((prev) => ({
        ...prev,
        [s.id]: {
          status: "error",
          mensaje: msg.includes("Failed to fetch")
            ? "Servidor local no disponible. Asegúrate de que localhost:3000 está corriendo."
            : msg,
        },
      }));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr.replace(" ", "T") + "Z");
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          {/* Botón "Nuevos datos" con punto rojo */}
          {hasNew && (
            <button
              onClick={markSeen}
              disabled={marking}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {/* Punto rojo parpadeante */}
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

      {/* Tabla de respuestas */}
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
            {(expanded ? data.submissions : data.submissions.slice(0, 5)).map((s, i) => {
              const sta = altaStatus[s.id];
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
                    {s.email ? (
                      <a href={`mailto:${s.email}`} className="hover:text-primary transition-colors">
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

                  {/* ── Columna Alta TIMP ─────────────────────────────────── */}
                  <td className="px-3 py-2 text-center">
                    {sta?.status === "ok" ? (
                      // Alta completada
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Dada de alta
                        </span>
                        {s.urlTimp && (
                          <a
                            href={s.urlTimp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Link2 className="w-2.5 h-2.5" />
                            Ver perfil
                          </a>
                        )}
                      </div>
                    ) : sta?.status === "error" ? (
                      // Error
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Error
                        </span>
                        <span
                          className="text-xs text-muted-foreground max-w-[120px] text-center leading-tight cursor-help"
                          title={sta.mensaje}
                        >
                          {sta.mensaje && sta.mensaje.length > 40
                            ? sta.mensaje.slice(0, 40) + "…"
                            : sta.mensaje}
                        </span>
                        <button
                          onClick={() => altaEnTimp(s)}
                          className="text-xs text-primary hover:underline mt-0.5"
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : sta?.status === "loading" ? (
                      // Cargando
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Dando de alta…
                      </span>
                    ) : (
                      // Botón inicial
                      <button
                        onClick={() => altaEnTimp(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                        title={`Dar de alta a ${s.nombre} ${s.apellidos} en TIMP.pro`}
                      >
                        <UserPlus className="w-3 h-3" />
                        Alta TIMP
                      </button>
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
