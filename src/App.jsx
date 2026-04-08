import React, { useMemo, useState } from "react";

const BASE_PRICES = {
  simples: 1500,
  media: 2200,
  complexa: 3200,
  levantamento: 2200,
  geodesico: 2800,
};

const FACTORS = {
  vegetacao: { baixo: 0, medio: 0.15, alto: 0.25 },
  acesso: { facil: 0, medio: 0.1, dificil: 0.2 },
  complexidade: { baixa: 0, media: 0.1, alta: 0.2 },
  etapas: { "1": 0, "2": 0.2, "3": 0.35 },
  precisao: { padrao: 0, rtk: 0.1, ppp: 0.2 },
  deslocamento: { cidade: 0, proximo: 0.1, fora: 0.15, longa: 0.25 },
};

const currency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([val, text]) => (
          <option key={val} value={val}>{text}</option>
        ))}
      </select>
    </Field>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function App() {
  const [cliente, setCliente] = useState("");
  const [servico, setServico] = useState("Locação de chácaras e via de acesso");
  const [local, setLocal] = useState("Irati-PR");
  const [data, setData] = useState("08/04/2026");
  const [categoria, setCategoria] = useState("complexa");
  const [vegetacao, setVegetacao] = useState("medio");
  const [acesso, setAcesso] = useState("medio");
  const [complexidade, setComplexidade] = useState("alta");
  const [etapas, setEtapas] = useState("2");
  const [precisao, setPrecisao] = useState("ppp");
  const [deslocamento, setDeslocamento] = useState("fora");
  const [lotes, setLotes] = useState(7);
  const [marcos, setMarcos] = useState(0);
  const [dias, setDias] = useState(2);
  const [art, setArt] = useState(false);
  const [valorManual, setValorManual] = useState("");
  const [obs, setObs] = useState(
    "Serviço realizado com estacas/piquetes (marcação provisória). Não inclui limpeza de área nem implantação de marcos definitivos."
  );

  const calculo = useMemo(() => {
    const base = valorManual ? Number(String(valorManual).replace(",", ".")) || 0 : BASE_PRICES[categoria];
    const fator =
      FACTORS.vegetacao[vegetacao] +
      FACTORS.acesso[acesso] +
      FACTORS.complexidade[complexidade] +
      FACTORS.etapas[etapas] +
      FACTORS.precisao[precisao] +
      FACTORS.deslocamento[deslocamento];

    const ajuste = base * fator;
    const adicionais =
      Math.max(lotes - 1, 0) * 150 +
      marcos * 120 +
      Math.max(dias - 1, 0) * 350 +
      (art ? 95 : 0);

    const sugerido = Math.round((base + ajuste + adicionais) * 100) / 100;
    const minimo = Math.round(sugerido * 0.93 * 100) / 100;
    const maximo = Math.round(sugerido * 1.08 * 100) / 100;

    return { base, ajuste, adicionais, sugerido, minimo, maximo };
  }, [categoria, vegetacao, acesso, complexidade, etapas, precisao, deslocamento, lotes, marcos, dias, art, valorManual]);

  const textoOrcamento = useMemo(() => {
    return `SERVIÇOS DE LOCAÇÃO TOPOGRÁFICA\n\nCliente: ${cliente || "________________"}\nServiço: ${servico}\nLocal: ${local}\nData: ${data}\n\nEscopo do Serviço\n1) Implantação de bases topográficas com rastreio GNSS;\n2) Processamento e ajuste de coordenadas via IBGE (PPP);\n3) Execução da locação em campo;\n4) Conferência geométrica e validação das marcações.\n\nValor do Serviço\n${currency(calculo.sugerido)}\n\nCondições\n- O serviço poderá ser executado em etapas;\n- Pagamento a combinar;\n- ${obs}\n\nGeoCard Topografia - Profissionalismo e precisão em cada levantamento.`;
  }, [cliente, servico, local, data, calculo.sugerido, obs]);

  const textoWhatsApp = useMemo(() => {
    return `Bom dia! Segue orçamento:\n\nCliente: ${cliente || "________________"}\nServiço: ${servico}\nLocal: ${local}\nValor: ${currency(calculo.sugerido)}\n\n${obs}`;
  }, [cliente, servico, local, calculo.sugerido, obs]);

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text);
    alert("Texto copiado.");
  };

  return (
    <div className="page">
      <div className="container">
        <div className="brand">
          <img src="/geocard_logo.png" alt="GeoCard" />
          <div>
            <h1>GeoCard • Sistema de Orçamentos</h1>
            <p>Calculadora automática para propostas topográficas</p>
          </div>
        </div>

        <div className="grid">
          <section className="card main">
            <h2>Dados do orçamento</h2>
            <div className="grid-2">
              <Field label="Cliente"><input value={cliente} onChange={(e) => setCliente(e.target.value)} /></Field>
              <Field label="Data"><input value={data} onChange={(e) => setData(e.target.value)} /></Field>
              <Field label="Serviço"><input value={servico} onChange={(e) => setServico(e.target.value)} /></Field>
              <Field label="Local"><input value={local} onChange={(e) => setLocal(e.target.value)} /></Field>
            </div>

            <div className="grid-3">
              <SelectField label="Categoria" value={categoria} onChange={setCategoria} options={[
                ["simples","Locação simples"],
                ["media","Locação média"],
                ["complexa","Locação complexa"],
                ["levantamento","Levantamento topográfico"],
                ["geodesico","Apoio geodésico / PPP"],
              ]} />
              <SelectField label="Vegetação" value={vegetacao} onChange={setVegetacao} options={[["baixo","Baixo"],["medio","Médio"],["alto","Alto"]]} />
              <SelectField label="Acesso" value={acesso} onChange={setAcesso} options={[["facil","Fácil"],["medio","Médio"],["dificil","Difícil"]]} />
              <SelectField label="Complexidade" value={complexidade} onChange={setComplexidade} options={[["baixa","Baixa"],["media","Média"],["alta","Alta"]]} />
              <SelectField label="Etapas" value={etapas} onChange={setEtapas} options={[["1","1 etapa"],["2","2 etapas"],["3","3 etapas"]]} />
              <SelectField label="Precisão" value={precisao} onChange={setPrecisao} options={[["padrao","Padrão"],["rtk","RTK com conferência"],["ppp","PPP / alta precisão"]]} />
              <SelectField label="Deslocamento" value={deslocamento} onChange={setDeslocamento} options={[["cidade","Na cidade"],["proximo","Próximo"],["fora","Fora da cidade"],["longa","Longa distância"]]} />
              <Field label="Nº lotes/chácaras"><input type="number" value={lotes} onChange={(e) => setLotes(Number(e.target.value || 0))} /></Field>
              <Field label="Nº marcos"><input type="number" value={marcos} onChange={(e) => setMarcos(Number(e.target.value || 0))} /></Field>
              <Field label="Nº dias de campo"><input type="number" value={dias} onChange={(e) => setDias(Number(e.target.value || 0))} /></Field>
              <Field label="ART">
                <select value={art ? "sim" : "nao"} onChange={(e) => setArt(e.target.value === "sim")}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </Field>
              <Field label="Valor base manual (opcional)">
                <input value={valorManual} onChange={(e) => setValorManual(e.target.value)} placeholder="Ex.: 3500" />
              </Field>
            </div>

            <Field label="Observações">
              <textarea rows="4" value={obs} onChange={(e) => setObs(e.target.value)} />
            </Field>
          </section>

          <aside className="side">
            <section className="card">
              <h2>Resultado</h2>
              <SummaryRow label="Base" value={currency(calculo.base)} />
              <SummaryRow label="Ajustes" value={currency(calculo.ajuste)} />
              <SummaryRow label="Adicionais" value={currency(calculo.adicionais)} />
              <div className="featured">
                <span>Valor sugerido</span>
                <strong>{currency(calculo.sugerido)}</strong>
              </div>
              <SummaryRow label="Faixa mínima" value={currency(calculo.minimo)} />
              <SummaryRow label="Faixa máxima" value={currency(calculo.maximo)} />
            </section>

            <section className="card">
              <h2>Texto pronto</h2>
              <textarea rows="11" value={textoOrcamento} readOnly />
              <button onClick={() => copyText(textoOrcamento)}>Copiar orçamento</button>
              <textarea rows="7" value={textoWhatsApp} readOnly />
              <button className="secondary" onClick={() => copyText(textoWhatsApp)}>Copiar WhatsApp</button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
