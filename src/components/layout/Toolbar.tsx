import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { useTheme } from "@/hooks/useTheme";
import { useFormStore } from "@/store/formStore";
import { buildExport, copyFormToClipboard, downloadForm } from "@/utils/exportForm";
import { parseImport } from "@/utils/importForm";

export function Toolbar() {
  const exportJSON = useFormStore((s) => s.exportJSON);
  const importJSON = useFormStore((s) => s.importJSON);
  const clearAll = useFormStore((s) => s.clearAll);
  const fieldsCount = useFormStore((s) => s.fields.length);
  const { theme, toggleTheme } = useTheme();

  const [status, setStatus] = useState<string>("Salvo");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const result = buildExport(exportJSON());
    if (!result.ok || !result.data) {
      setStatus(`Erro: ${result.errors?.[0] ?? "invalido"}`);
      return;
    }
    downloadForm(result.data);
    void copyFormToClipboard(result.data).then((ok) => {
      setStatus(ok ? "Exportado (clipboard + download)" : "Exportado (download)");
    });
  }

  function handleImport() {
    setImportError(null);
    const result = parseImport(importText);
    if (!result.ok) {
      setImportError(result.errors.join("\n"));
      return;
    }
    if (
      fieldsCount > 0 &&
      typeof window !== "undefined" &&
      !window.confirm("Sobrescrever rascunho atual?")
    )
      return;
    const applied = importJSON(result.data);
    if (!applied.ok) {
      setImportError(applied.errors.join("\n"));
      return;
    }
    setImportOpen(false);
    setImportText("");
    setStatus("Importado");
  }

  function handleClear() {
    if (
      typeof window === "undefined" ||
      window.confirm("Limpar formulario e remover do localStorage?")
    ) {
      clearAll();
      setStatus("Limpado");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-edge bg-surface px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon name="app-window" width={18} height={18} />
        </span>
        <span className="text-sm font-semibold tracking-tight text-foreground">Form Builder</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
          data-testid="autosave-status"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
          {status}
        </span>
        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-edge-input bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="upload" width={14} height={14} className="text-muted-foreground" />
          Importar
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Icon name="download" width={14} height={14} />
          Exportar JSON
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:border-danger-edge hover:bg-danger-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          <Icon name="trash" width={14} height={14} />
          Limpar
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-edge-input bg-card text-muted-foreground shadow-sm transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} width={16} height={16} />
        </button>
      </div>

      {importOpen && (
        <div className="absolute right-4 top-16 z-10 w-96 rounded-xl border border-edge-soft bg-popover p-4 shadow-xl">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Importar JSON</h3>
          <input
            type="file"
            accept="application/json"
            onChange={handleFile}
            className="mb-2 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent-foreground hover:file:bg-accent-hover"
          />
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-edge-input bg-card p-2.5 font-mono text-xs text-foreground transition-colors focus:border-primary-active focus:outline-none focus:ring-2 focus:ring-ring-soft"
            placeholder="Cole o JSON aqui"
          />
          {importError && (
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-danger-surface p-2 text-xs text-danger">
              {importError}
            </pre>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
            >
              Importar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
