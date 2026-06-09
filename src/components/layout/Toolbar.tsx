import { useState } from 'react';
import { useFormStore } from '@/store/formStore';
import { buildExport, downloadForm, copyFormToClipboard } from '@/utils/exportForm';
import { parseImport } from '@/utils/importForm';

export function Toolbar() {
  const exportJSON = useFormStore((s) => s.exportJSON);
  const importJSON = useFormStore((s) => s.importJSON);
  const clearAll = useFormStore((s) => s.clearAll);
  const fieldsCount = useFormStore((s) => s.fields.length);

  const [status, setStatus] = useState<string>('Salvo');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const result = buildExport(exportJSON());
    if (!result.ok || !result.data) {
      setStatus(`Erro: ${result.errors?.[0] ?? 'invalido'}`);
      return;
    }
    downloadForm(result.data);
    void copyFormToClipboard(result.data).then((ok) => {
      setStatus(ok ? 'Exportado (clipboard + download)' : 'Exportado (download)');
    });
  }

  function handleImport() {
    setImportError(null);
    const result = parseImport(importText);
    if (!result.ok) {
      setImportError(result.errors.join('\n'));
      return;
    }
    if (fieldsCount > 0 && typeof window !== 'undefined' && !window.confirm('Sobrescrever rascunho atual?')) return;
    const applied = importJSON(result.data);
    if (!applied.ok) {
      setImportError(applied.errors.join('\n'));
      return;
    }
    setImportOpen(false);
    setImportText('');
    setStatus('Importado');
  }

  function handleClear() {
    if (typeof window === 'undefined' || window.confirm('Limpar formulario e remover do localStorage?')) {
      clearAll();
      setStatus('Limpado');
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsText(file);
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
      <div className="text-sm font-semibold text-slate-700">Form Builder</div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setImportOpen((v) => !v)} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">
          Importar
        </button>
        <button type="button" onClick={handleExport} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
          Exportar JSON
        </button>
        <button type="button" onClick={handleClear} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50">
          Limpar
        </button>
        <span className="ml-2 text-xs text-slate-500" data-testid="autosave-status">{status}</span>
      </div>

      {importOpen && (
        <div className="absolute right-4 top-14 z-10 w-96 rounded border border-slate-300 bg-white p-3 shadow-lg">
          <h3 className="mb-2 text-sm font-semibold">Importar JSON</h3>
          <input type="file" accept="application/json" onChange={handleFile} className="mb-2 block text-xs" />
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            className="w-full rounded border border-slate-300 p-2 text-xs font-mono"
            placeholder="Cole o JSON aqui"
          />
          {importError && <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-red-600">{importError}</pre>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setImportOpen(false)} className="text-xs text-slate-500">Cancelar</button>
            <button type="button" onClick={handleImport} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Importar</button>
          </div>
        </div>
      )}
    </header>
  );
}

