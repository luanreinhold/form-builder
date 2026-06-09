import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { CanvasPanel } from '@/components/layout/CanvasPanel';
import { useFormStore } from '@/store/formStore';

function renderWithDnd(ui: React.ReactNode) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('CanvasPanel', () => {
  beforeEach(() => {
    useFormStore.getState().clearAll();
  });

  it('mostra placeholder quando vazio', () => {
    renderWithDnd(<CanvasPanel />);
    expect(screen.getByText(/Arraste inputs aqui/)).toBeInTheDocument();
  });

  it('renderiza fields existentes', () => {
    useFormStore.getState().addField('input-text');
    useFormStore.getState().addField('input-email');
    renderWithDnd(<CanvasPanel />);
    const previews = screen.getAllByRole('textbox', { hidden: true }).filter(() => true);
    expect(previews.length).toBeGreaterThanOrEqual(2);
  });

  it('clicar em campo seleciona no store', () => {
    const id = useFormStore.getState().addField('input-text');
    renderWithDnd(<CanvasPanel />);
    useFormStore.getState().selectField(null);
    const item = screen.getByText('texto', { selector: 'label, span, div, *' });
    fireEvent.click(item.closest('div')!);
    expect(useFormStore.getState().selectedFieldId).toBe(id);
  });
});