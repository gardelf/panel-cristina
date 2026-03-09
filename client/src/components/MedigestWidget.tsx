import { useState, useEffect } from "react";
import { ShoppingCart, AlertTriangle, Package, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface MedigestStock {
  totalMedicamentos: number;
  stockCritico: number;
  stockBajo: number;
  costeReposicion: number;
  costeMensual: number;
  listaCompra: Array<{
    nombre: string;
    dosis: string;
    stockActual: number;
    stockMinimo: number;
    precioCaja: number;
    estado: "sin_stock" | "critico";
  }>;
  ultimaActualizacion: string;
}

export function MedigestWidget() {
  const [data, setData] = useState<MedigestStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLista, setShowLista] = useState(false);

  useEffect(() => {
    fetch("/api/medigest/stock")
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

  const fmt = (n: number) =>
    n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground">No se pudo conectar con Medigest</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Medicación</span>
        </div>
        <a
          href="https://medigest-production.up.railway.app/stock"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Abrir Medigest
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {/* Stock crítico */}
        <div
          className="rounded-lg p-3 flex flex-col gap-1"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444" }} />
            <span className="text-xs text-muted-foreground">Stock crítico</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: "#ef4444" }}>
            {data.stockCritico}
          </span>
          <span className="text-xs text-muted-foreground">medicamentos</span>
        </div>

        {/* Stock bajo */}
        <div
          className="rounded-lg p-3 flex flex-col gap-1"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" style={{ color: "#f59e0b" }} />
            <span className="text-xs text-muted-foreground">Stock bajo</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
            {data.stockBajo}
          </span>
          <span className="text-xs text-muted-foreground">medicamentos</span>
        </div>

        {/* Coste reposición */}
        <div
          className="rounded-lg p-3 flex flex-col gap-1"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
        >
          <div className="flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" style={{ color: "#6366f1" }} />
            <span className="text-xs text-muted-foreground">Reposición</span>
          </div>
          <span className="text-lg font-bold leading-tight" style={{ color: "#6366f1" }}>
            {fmt(data.costeReposicion)}
          </span>
          <span className="text-xs text-muted-foreground">1 caja c/u</span>
        </div>
      </div>

      {/* Coste mensual */}
      <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/40">
        <span className="text-xs text-muted-foreground">Coste mensual estimado</span>
        <span className="text-sm font-semibold text-foreground">{fmt(data.costeMensual)}</span>
      </div>

      {/* Lista de compra desplegable */}
      {data.listaCompra.length > 0 && (
        <div>
          <button
            onClick={() => setShowLista(!showLista)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span className="flex items-center gap-1">
              <ShoppingCart className="w-3 h-3" />
              Lista de la compra ({data.listaCompra.length} items)
            </span>
            {showLista ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showLista && (
            <div className="mt-2 flex flex-col gap-1">
              {data.listaCompra.map((med, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-xs"
                  style={{
                    background:
                      med.estado === "sin_stock"
                        ? "rgba(239,68,68,0.06)"
                        : "rgba(245,158,11,0.06)",
                    border:
                      med.estado === "sin_stock"
                        ? "1px solid rgba(239,68,68,0.15)"
                        : "1px solid rgba(245,158,11,0.15)",
                  }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-foreground truncate">{med.nombre}</span>
                    <span className="text-muted-foreground">
                      {med.dosis} · {med.stockActual}/{med.stockMinimo} ud.
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                    <span
                      className="font-semibold"
                      style={{ color: med.estado === "sin_stock" ? "#ef4444" : "#f59e0b" }}
                    >
                      {med.estado === "sin_stock" ? "Sin stock" : "Crítico"}
                    </span>
                    <span className="text-muted-foreground">{fmt(med.precioCaja)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
