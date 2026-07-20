import { describe, expect, it } from "vitest";

import { parseInvoiceText } from "@/lib/invoiceParser";

describe("parseInvoiceText", () => {
  it("extrai produtos em linhas no padrão comum de NF-e", () => {
    const text = [
      "ITEM DESCRICAO UN QTD VALOR TOTAL",
      "1 RESINA Z350 3M UN 10 52,00 520,00",
      "2 ANESTESICO LIDOCAINA CX 3 18,50 55,50",
    ].join("\n");

    const products = parseInvoiceText(text);

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({
      nome: "RESINA Z350 3M",
      quantidade: "10",
      custoUnitario: "52.00",
      unidade: "un",
    });
    expect(products[1]).toMatchObject({
      nome: "ANESTESICO LIDOCAINA",
      quantidade: "3",
      custoUnitario: "18.50",
      unidade: "cx",
    });
  });

  it("gera uma prévia parcial em vez de retornar vazio para formatos irregulares", () => {
    const text = [
      "Produtos adquiridos",
      "Resina flow A2 qtd 2 valor unit 39,90",
      "Luva nitrilica azul caixa 1 total 49,90",
    ].join("\n");

    const products = parseInvoiceText(text);

    expect(products.length).toBeGreaterThan(0);
    expect(products[0].nome).toContain("Resina flow A2");
    expect(products[0].quantidade).toBe("2");
    expect(products[0].custoUnitario).toBe("39.90");
  });

  it("ignora linhas com dados fiscais, endereço e informações da empresa", () => {
    const text = [
      "ITEM DESCRICAO UN QTD VALOR TOTAL",
      "CNPJ 12.345.678/0001-99",
      "Rua das Flores 123 Bairro Centro",
      "CEP 01234-567 São Paulo SP",
      "ICMS Base de Calculo 520,00",
      "Valor Total da Nota 575,50",
      "Serie 001 Numero 12345",
      "Data de Emissao 01/01/2024",
      "1 RESINA Z350 3M UN 10 52,00 520,00",
      "2 ANESTESICO LIDOCAINA CX 3 18,50 55,50",
    ].join("\n");

    const products = parseInvoiceText(text);

    expect(products).toHaveLength(2);
    const names = products.map((p) => p.nome);
    expect(names.some((n) => n.includes("CNPJ"))).toBe(false);
    expect(names.some((n) => n.includes("Rua"))).toBe(false);
    expect(names.some((n) => n.includes("CEP"))).toBe(false);
    expect(names.some((n) => n.includes("ICMS"))).toBe(false);
    expect(names.some((n) => n.includes("Serie"))).toBe(false);
  });

  it("distingue corretamente quantidade e valor unitário quando há valor total", () => {
    const text = [
      "ITEM DESCRICAO UN QTD VL UNIT VL TOTAL",
      "1 RESINA Z350 3M UN 10 52,00 520,00",
    ].join("\n");

    const products = parseInvoiceText(text);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      nome: "RESINA Z350 3M",
      quantidade: "10",
      custoUnitario: "52.00",
    });
  });

  it("não confunde datas ou códigos longos com quantidade/valor", () => {
    const text = [
      "ITEM DESCRICAO UN QTD VALOR TOTAL",
      "1 LUVA NITRILICA CX 5 29,90 149,50",
    ].join("\n");

    const products = parseInvoiceText(text);

    expect(products).toHaveLength(1);
    expect(products[0].quantidade).toBe("5");
    expect(products[0].custoUnitario).toBe("29.90");
  });
});