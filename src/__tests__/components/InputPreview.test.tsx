import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InputPreview } from "@/components/inputs/InputPreview";
import type { Field, FieldType } from "@/schemas/inputs.schema";

function makeField(type: FieldType, props: Record<string, unknown> = {}): Field {
  return {
    id: "field-1",
    type,
    class: "",
    hide: false,
    colSpan: 12,
    props,
  } as Field;
}

describe("InputPreview", () => {
  describe("label e metadados", () => {
    it("usa props.label quando presente", () => {
      render(<InputPreview field={makeField("input-text", { label: "Nome completo" })} />);
      expect(screen.getByText("Nome completo")).toBeInTheDocument();
    });

    it("cai para props.name quando label esta vazio", () => {
      render(<InputPreview field={makeField("input-text", { label: "", name: "cidade" })} />);
      expect(screen.getByText("cidade")).toBeInTheDocument();
    });

    it("cai para o label do registry quando label e name estao vazios", () => {
      render(<InputPreview field={makeField("input-text", { label: "", name: "" })} />);
      expect(screen.getByText("Texto")).toBeInTheDocument();
    });

    it("exibe asterisco quando required=true", () => {
      render(<InputPreview field={makeField("input-text", { label: "CPF", required: true })} />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("nao exibe asterisco quando required nao e true", () => {
      render(<InputPreview field={makeField("input-text", { label: "CPF", required: false })} />);
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("exibe hint quando presente", () => {
      render(<InputPreview field={makeField("input-text", { label: "X", hint: "Digite algo" })} />);
      expect(screen.getByText("Digite algo")).toBeInTheDocument();
    });

    it("nao exibe hint quando ausente", () => {
      const { container } = render(
        <InputPreview field={makeField("input-text", { label: "X" })} />,
      );
      expect(container.querySelector("p")).toBeNull();
    });

    it("repassa placeholder para o controle", () => {
      render(
        <InputPreview
          field={makeField("input-text", { label: "X", placeholder: "Digite aqui" })}
        />,
      );
      expect(screen.getByPlaceholderText("Digite aqui")).toBeInTheDocument();
    });
  });

  describe("controles por tipo", () => {
    it("input-text renderiza input type=text desabilitado (branch default)", () => {
      const { container } = render(
        <InputPreview field={makeField("input-text", { label: "X" })} />,
      );
      const input = container.querySelector('input[type="text"]');
      expect(input).toBeTruthy();
      expect(input).toBeDisabled();
    });

    it("input-textarea renderiza textarea", () => {
      const { container } = render(
        <InputPreview field={makeField("input-textarea", { label: "X" })} />,
      );
      expect(container.querySelector("textarea")).toBeDisabled();
    });

    it("input-color renderiza input type=color", () => {
      const { container } = render(
        <InputPreview field={makeField("input-color", { label: "X" })} />,
      );
      expect(container.querySelector('input[type="color"]')).toBeDisabled();
    });

    it("input-date renderiza input type=date", () => {
      const { container } = render(
        <InputPreview field={makeField("input-date", { label: "X" })} />,
      );
      expect(container.querySelector('input[type="date"]')).toBeDisabled();
    });

    it("input-time renderiza input type=time", () => {
      const { container } = render(
        <InputPreview field={makeField("input-time", { label: "X" })} />,
      );
      expect(container.querySelector('input[type="time"]')).toBeDisabled();
    });

    it("input-attach renderiza input type=file", () => {
      const { container } = render(
        <InputPreview field={makeField("input-attach", { label: "X" })} />,
      );
      expect(container.querySelector('input[type="file"]')).toBeDisabled();
    });

    it.each([
      "select-multiple",
      "select-search",
      "dynamic-select",
    ] as const)("%s renderiza select com placeholder padrao 'Selecione...'", (type) => {
      render(<InputPreview field={makeField(type, { label: "X" })} />);
      const select = screen.getByRole("combobox", { hidden: true });
      expect(select).toBeDisabled();
      expect(screen.getByText("Selecione...")).toBeInTheDocument();
    });

    it("select usa placeholder customizado quando informado", () => {
      render(
        <InputPreview
          field={makeField("select-search", { label: "X", placeholder: "Escolha um item" })}
        />,
      );
      expect(screen.getByText("Escolha um item")).toBeInTheDocument();
    });

    it("input-json renderiza textarea com fonte mono e placeholder de exemplo", () => {
      const { container } = render(
        <InputPreview field={makeField("input-json", { label: "X" })} />,
      );
      const textarea = container.querySelector("textarea");
      expect(textarea?.className).toContain("font-mono");
      expect(textarea).toHaveAttribute("placeholder", '{ "exemplo": true }');
    });

    it("input-money renderiza prefixo R$ e placeholder padrao 0,00", () => {
      render(<InputPreview field={makeField("input-money", { label: "X" })} />);
      expect(screen.getByText("R$")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("0,00")).toBeInTheDocument();
    });

    it("input-money usa placeholder customizado quando informado", () => {
      render(
        <InputPreview field={makeField("input-money", { label: "X", placeholder: "10,00" })} />,
      );
      expect(screen.getByPlaceholderText("10,00")).toBeInTheDocument();
    });

    it.each([
      "input-modal",
      "input-cep-modal",
    ] as const)("%s renderiza input com botao Buscar desabilitado", (type) => {
      render(<InputPreview field={makeField(type, { label: "X" })} />);
      expect(screen.getByRole("button", { name: "Buscar", hidden: true })).toBeDisabled();
    });

    it("input-password renderiza input type=password", () => {
      const { container } = render(
        <InputPreview field={makeField("input-password", { label: "X" })} />,
      );
      expect(container.querySelector('input[type="password"]')).toBeDisabled();
    });

    it("input-email renderiza input type=email", () => {
      const { container } = render(
        <InputPreview field={makeField("input-email", { label: "X" })} />,
      );
      expect(container.querySelector('input[type="email"]')).toBeDisabled();
    });

    it.each([
      "input-number",
      "input-decimal",
    ] as const)("%s renderiza input type=number", (type) => {
      const { container } = render(<InputPreview field={makeField(type, { label: "X" })} />);
      expect(container.querySelector('input[type="number"]')).toBeDisabled();
    });

    it.each([
      "input-cpf",
      "input-cnpj",
      "input-phone",
      "input-mask",
    ] as const)("%s cai no branch default (input text)", (type) => {
      const { container } = render(<InputPreview field={makeField(type, { label: "X" })} />);
      expect(container.querySelector('input[type="text"]')).toBeDisabled();
    });
  });

  describe("divider-component", () => {
    it("renderiza o label sem wrapper de label/asterisco", () => {
      const { container } = render(
        <InputPreview
          field={makeField("divider-component", { label: "Dados Pessoais", required: true })}
        />,
      );
      expect(screen.getByText("Dados Pessoais")).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("usa 'Divisória' como label padrao", () => {
      render(<InputPreview field={makeField("divider-component", {})} />);
      expect(screen.getByText("Divisória")).toBeInTheDocument();
    });

    it("aplica fontSize via style quando informado", () => {
      render(
        <InputPreview
          field={makeField("divider-component", { label: "Secao", fontSize: "20px" })}
        />,
      );
      expect(screen.getByText("Secao")).toHaveStyle({ fontSize: "20px" });
    });

    it("nao aplica style quando fontSize ausente", () => {
      render(<InputPreview field={makeField("divider-component", { label: "Secao" })} />);
      expect(screen.getByText("Secao").getAttribute("style")).toBeNull();
    });

    it("concatena labelClass quando informado", () => {
      render(
        <InputPreview
          field={makeField("divider-component", { label: "Secao", labelClass: "text-lg" })}
        />,
      );
      expect(screen.getByText("Secao").className).toContain("text-lg");
    });
  });

  describe("radio-component", () => {
    it("renderiza opcoes padrao quando source esta vazio", () => {
      render(<InputPreview field={makeField("radio-component", { label: "X", source: [] })} />);
      expect(screen.getByText("Opção 1")).toBeInTheDocument();
      expect(screen.getByText("Opção 2")).toBeInTheDocument();
      expect(screen.getAllByRole("radio", { hidden: true })).toHaveLength(2);
    });

    it("renderiza opcoes do source quando presente", () => {
      const source = [
        { label: "Sim", value: "s" },
        { label: "Não", value: "n" },
        { label: "Talvez", value: "t" },
      ];
      render(<InputPreview field={makeField("radio-component", { label: "X", source })} />);
      expect(screen.getByText("Sim")).toBeInTheDocument();
      expect(screen.getByText("Não")).toBeInTheDocument();
      expect(screen.getAllByRole("radio", { hidden: true })).toHaveLength(3);
    });

    it("marca a opcao correspondente a props.selected (comparacao por string)", () => {
      const source = [
        { label: "Um", value: 1 },
        { label: "Dois", value: 2 },
      ];
      render(
        <InputPreview
          field={makeField("radio-component", { label: "X", source, selected: "2" })}
        />,
      );
      const radios = screen.getAllByRole("radio", { hidden: true });
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });

    it("usa opt.selected quando props.selected esta vazio", () => {
      const source = [
        { label: "A", value: "a" },
        { label: "B", value: "b", selected: true },
      ];
      render(
        <InputPreview field={makeField("radio-component", { label: "X", source, selected: "" })} />,
      );
      const radios = screen.getAllByRole("radio", { hidden: true });
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });

    it("nenhuma opcao marcada sem selected e sem opt.selected", () => {
      const source = [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ];
      render(<InputPreview field={makeField("radio-component", { label: "X", source })} />);
      for (const radio of screen.getAllByRole("radio", { hidden: true })) {
        expect(radio).not.toBeChecked();
      }
    });

    it("aplica flex-col quando vertical=true", () => {
      const { container } = render(
        <InputPreview field={makeField("radio-component", { label: "X", vertical: true })} />,
      );
      expect(container.querySelector(".flex-col")).toBeTruthy();
    });

    it("aplica layout horizontal quando vertical nao e true", () => {
      const { container } = render(
        <InputPreview field={makeField("radio-component", { label: "X" })} />,
      );
      expect(container.querySelector(".flex-wrap")).toBeTruthy();
      expect(container.querySelector(".flex-col")).toBeNull();
    });
  });

  describe("checkbox-component", () => {
    it("renderiza a caixa desmarcada por padrao", () => {
      render(<InputPreview field={makeField("checkbox-component", { label: "Equipe" })} />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("renderiza a caixa marcada quando checked=true", () => {
      render(
        <InputPreview
          field={makeField("checkbox-component", { label: "Equipe", checked: true })}
        />,
      );
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("exibe o label ao lado da caixa", () => {
      render(<InputPreview field={makeField("checkbox-component", { label: "Equipe" })} />);
      expect(screen.getByText("Equipe")).toBeInTheDocument();
    });

    it("cai para o label do registry quando label e name estao vazios", () => {
      render(<InputPreview field={makeField("checkbox-component", { label: "", name: "" })} />);
      expect(screen.getByText("Checkbox")).toBeInTheDocument();
    });

    it("exibe asterisco quando required=true", () => {
      render(
        <InputPreview
          field={makeField("checkbox-component", { label: "Equipe", required: true })}
        />,
      );
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("exibe hint quando presente", () => {
      render(
        <InputPreview
          field={makeField("checkbox-component", { label: "Equipe", hint: "Marque se aplicável" })}
        />,
      );
      expect(screen.getByText("Marque se aplicável")).toBeInTheDocument();
    });
  });
});
