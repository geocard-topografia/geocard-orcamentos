import React, { useEffect, useMemo, useState } from 'react';

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
  etapas: { '1': 0, '2': 0.2, '3': 0.35 },
  precisao: { padrao: 0, rtk: 0.1, ppp: 0.2 },
  deslocamento: { cidade: 0, proximo: 0.1, fora: 0.15, longa: 0.25 },
};

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const todayBr = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

type Categoria = 'simples' | 'media' | 'complexa' | 'levantamento' | 'geodesico';

type HistoricoItem = {
  id: string;
  cliente: string;
  servico: string;
  local: string;
  valor: number;
  data: string;
};

export default function GeoCardOrcamentoApp() {
  const [cliente, setCliente] = useState('');
  const [servico, setServico] = useState('Locação de chácaras e via de acesso');
  const [local, setLocal] = useState('Irati-PR');
  const [data, setData] = useState(todayBr());
  const [categoria, setCategoria] = useState<Categoria>('complexa');
  const [vegetacao, setVegetacao] = useState<'baixo' | 'medio' | 'alto'>('medio');
  const [acesso, setAcesso] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [complexidade, setComplexidade] = useState<'baixa' | 'media' | 'alta'>('alta');
  const [etapas, setEtapas] = useState<'1' | '2' | '3'>('2');
  const [precisao, setPrecisao] = useState<'padrao' | 'rtk' | 'ppp'>('ppp');
  const [deslocamento, setDeslocamento] = useState<'cidade' | 'proximo' | 'fora' | 'longa'>('fora');
  const [lotes, setLotes] = useState(7);
  const [marcos, setMarcos] = useState(0);
  const [dias, setDias] = useState(2);
  const [art, setArt] = useState(false);
  const [valorManual, setValorManual] = useState('');
  const [obs, setObs] = useState('Serviço realizado com estacas/piquetes (marcação provisória). Não inclui limpeza de área nem implantação de marcos definitivos.');
  const [darkMode, setDarkMode] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [fatorMercado, setFatorMercado] = useState<'padrao' | 'competitivo' | 'premium'>('padrao');

  useEffect(() => {
    const saved = localStorage.getItem('geocard-historico');
    if (saved) setHistorico(JSON.parse(saved));
    const theme = localStorage.getItem('geocard-theme');
    if (theme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('geocard-historico', JSON.stringify(historico));
  }, [historico]);

  useEffect(() => {
    localStorage.setItem('geocard-theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const calculo = useMemo(() => {
    const base = valorManual ? Number(valorManual.replace(',', '.')) || 0 : BASE_PRICES[categoria];
    const fator =
      FACTORS.vegetacao[vegetacao] +
      FACTORS.acesso[acesso] +
      FACTORS.complexidade[complexidade] +
      FACTORS.etapas[etapas] +
      FACTORS.precisao[precisao] +
      FACTORS.deslocamento[deslocamento];

    const ajuste = base * fator;
    const adicionais = Math.max(lotes - 1, 0) * 150 + marcos * 120 + Math.max(dias - 1, 0) * 350 + (art ? 95 : 0);

    let sugerido = Math.round((base + ajuste + adicionais) * 100) / 100;
    if (fatorMercado === 'competitivo') sugerido = Math.round(sugerido * 0.94 * 100) / 100;
    if (fatorMercado === 'premium') sugerido = Math.round(sugerido * 1.08 * 100) / 100;

    const minimo = Math.round(sugerido * 0.93 * 100) / 100;
    const maximo = Math.round(sugerido * 1.08 * 100) / 100;
    return { base, ajuste, adicionais, sugerido, minimo, maximo };
  }, [categoria, vegetacao, acesso, complexidade, etapas, precisao, deslocamento, lotes, marcos, dias, art, valorManual, fatorMercado]);

  const textoWhatsApp = useMemo(() => {
    return `Bom dia! Segue orçamento:\n\nSERVIÇOS DE LOCAÇÃO TOPOGRÁFICA\n\nCliente: ${cliente || '________________'}\nServiço: ${servico}\nLocal: ${local}\nData: ${data}\n\nValor do serviço: ${currency(calculo.sugerido)}\n\nObservações: ${obs}`;
  }, [cliente, servico, local, data, calculo.sugerido, obs]);

  const textoOrcamento = useMemo(() => {
    return `SERVIÇOS DE LOCAÇÃO TOPOGRÁFICA\n\nCliente: ${cliente || '________________'}\nServiço: ${servico}\nLocal: ${local}\nData: ${data}\n\nEscopo do Serviço\n1) Implantação de bases topográficas com rastreio GNSS;\n2) Processamento e ajuste de coordenadas via IBGE (PPP);\n3) Execução da locação em campo;\n4) Conferência geométrica e validação das marcações.\n\nValor do Serviço\n${currency(calculo.sugerido)}\n\nCondições\n- O serviço poderá ser executado em etapas;\n- Pagamento a combinar;\n- ${obs}\n\nGeoCard Topografia - Profissionalismo e precisão em cada levantamento.`;
  }, [cliente, servico, local, data, calculo.sugerido, obs]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const abrirWhatsApp = () => {
    const text = encodeURIComponent(textoWhatsApp);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const salvarHistorico = () => {
    const item: HistoricoItem = {
      id: String(Date.now()),
      cliente: cliente || 'Sem nome',
      servico,
      local,
      valor: calculo.sugerido,
      data,
    };
    setHistorico((prev) => [item, ...prev].slice(0, 20));
  };

  const carregarHistorico = (item: HistoricoItem) => {
    setCliente(item.cliente);
    setServico(item.servico);
    setLocal(item.local);
    setData(item.data);
    setValorManual(String(item.valor));
  };

  const limparFormulario = () => {
    setCliente('');
    setServico('Locação de chácaras e via de acesso');
    setLocal('Irati-PR');
    setData(todayBr());
    setCategoria('complexa');
    setVegetacao('medio');
    setAcesso('medio');
    setComplexidade('alta');
    setEtapas('2');
    setPrecisao('ppp');
    setDeslocamento('fora');
    setLotes(7);
    setMarcos(0);
    setDias(2);
    setArt(false);
    setValorManual('');
    setObs('Serviço realizado com estacas/piquetes (marcação provisória). Não inclui limpeza de área nem implantação de marcos definitivos.');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-4 md:p-8 transition-colors`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className={`rounded-3xl border ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} p-6 shadow-sm`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {!logoError ? (
                <img
                  src="/geocard_logo.png"
                  alt="GeoCard"
                  onError={() => setLogoError(true)}
                  className="h-24 w-auto rounded-2xl object-contain shadow"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-2xl font-bold text-white shadow">
                  GC
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">GeoCard • Sistema Premium de Orçamentos</h1>
                <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Cálculo automático, histórico, WhatsApp e impressão em um só lugar.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setDarkMode(!darkMode)} className="rounded-2xl border px-4 py-2 font-semibold">
                {darkMode ? 'Modo claro' : 'Modo escuro'}
              </button>
              <button onClick={limparFormulario} className="rounded-2xl border px-4 py-2 font-semibold">
                Novo orçamento
              </button>
              <button onClick={() => window.print()} className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                Imprimir / PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card darkMode={darkMode} className="xl:col-span-2">
            <h2 className="mb-4 text-xl font-bold">Dados do orçamento</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField label="Cliente" value={cliente} onChange={setCliente} />
              <InputField label="Data" value={data} onChange={setData} />
              <InputField label="Serviço" value={servico} onChange={setServico} className="md:col-span-2" />
              <InputField label="Local" value={local} onChange={setLocal} className="md:col-span-2" />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <CampoSelect darkMode={darkMode} label="Categoria" value={categoria} onValueChange={setCategoria} items={[
                ['simples','Locação simples'],
                ['media','Locação média'],
                ['complexa','Locação complexa'],
                ['levantamento','Levantamento topográfico'],
                ['geodesico','Apoio geodésico / PPP'],
              ]} />
              <CampoSelect darkMode={darkMode} label="Vegetação" value={vegetacao} onValueChange={setVegetacao} items={[
                ['baixo','Baixo'], ['medio','Médio'], ['alto','Alto']
              ]} />
              <CampoSelect darkMode={darkMode} label="Acesso" value={acesso} onValueChange={setAcesso} items={[
                ['facil','Fácil'], ['medio','Médio'], ['dificil','Difícil']
              ]} />
              <CampoSelect darkMode={darkMode} label="Complexidade" value={complexidade} onValueChange={setComplexidade} items={[
                ['baixa','Baixa'], ['media','Média'], ['alta','Alta']
              ]} />
              <CampoSelect darkMode={darkMode} label="Etapas" value={etapas} onValueChange={setEtapas} items={[
                ['1','1 etapa'], ['2','2 etapas'], ['3','3 etapas']
              ]} />
              <CampoSelect darkMode={darkMode} label="Precisão" value={precisao} onValueChange={setPrecisao} items={[
                ['padrao','Padrão'], ['rtk','RTK com conferência'], ['ppp','PPP / alta precisão']
              ]} />
              <CampoSelect darkMode={darkMode} label="Deslocamento" value={deslocamento} onValueChange={setDeslocamento} items={[
                ['cidade','Na cidade'], ['proximo','Próximo'], ['fora','Fora da cidade'], ['longa','Longa distância']
              ]} />
              <CampoSelect darkMode={darkMode} label="Posicionamento" value={fatorMercado} onValueChange={setFatorMercado} items={[
                ['competitivo','Competitivo'], ['padrao','Padrão'], ['premium','Premium']
              ]} />
              <NumberField label="Nº lotes/chácaras" value={lotes} onChange={setLotes} />
              <NumberField label="Nº marcos" value={marcos} onChange={setMarcos} />
              <NumberField label="Nº dias de campo" value={dias} onChange={setDias} />
              <CampoSelect darkMode={darkMode} label="ART" value={art ? 'sim' : 'nao'} onValueChange={(v) => setArt(v === 'sim')} items={[
                ['nao','Não'], ['sim','Sim']
              ]} />
              <InputField label="Valor base manual (opcional)" value={valorManual} onChange={setValorManual} className="md:col-span-2" />
            </div>

            <div className="mt-5 grid gap-2">
              <label className="text-sm font-semibold">Observações</label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={4}
                className={`rounded-2xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`}
              />
            </div>
          </Card>

          <div className="grid gap-6">
            <Card darkMode={darkMode}>
              <h2 className="mb-4 text-xl font-bold">Resultado</h2>
              <Linha darkMode={darkMode} titulo="Base" valor={currency(calculo.base)} />
              <Linha darkMode={darkMode} titulo="Ajustes" valor={currency(calculo.ajuste)} />
              <Linha darkMode={darkMode} titulo="Adicionais" valor={currency(calculo.adicionais)} />
              <div className={`my-4 rounded-2xl p-5 text-center ${darkMode ? 'bg-emerald-950' : 'bg-emerald-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Valor sugerido</div>
                <div className="text-3xl font-bold">{currency(calculo.sugerido)}</div>
              </div>
              <Linha darkMode={darkMode} titulo="Faixa mínima" valor={currency(calculo.minimo)} />
              <Linha darkMode={darkMode} titulo="Faixa máxima" valor={currency(calculo.maximo)} />
              <div className="mt-4 grid gap-2">
                <button onClick={salvarHistorico} className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Salvar no histórico</button>
                <button onClick={abrirWhatsApp} className="rounded-2xl border px-4 py-3 font-semibold">Enviar para WhatsApp</button>
              </div>
            </Card>

            <Card darkMode={darkMode}>
              <h2 className="mb-4 text-xl font-bold">Texto pronto</h2>
              <textarea readOnly rows={10} value={textoOrcamento} className={`mb-3 rounded-2xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`} />
              <button onClick={() => copyText(textoOrcamento)} className="mb-3 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Copiar orçamento</button>
              <textarea readOnly rows={7} value={textoWhatsApp} className={`mb-3 rounded-2xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`} />
              <button onClick={() => copyText(textoWhatsApp)} className="rounded-2xl border px-4 py-3 font-semibold">Copiar WhatsApp</button>
            </Card>
          </div>
        </div>

        <Card darkMode={darkMode}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Histórico recente</h2>
            {historico.length > 0 && (
              <button onClick={() => setHistorico([])} className="rounded-2xl border px-4 py-2 font-semibold">Limpar histórico</button>
            )}
          </div>
          {historico.length === 0 ? (
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nenhum orçamento salvo ainda.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {historico.map((item) => (
                <button
                  key={item.id}
                  onClick={() => carregarHistorico(item)}
                  className={`rounded-2xl border p-4 text-left transition hover:scale-[1.01] ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div className="font-bold">{item.cliente}</div>
                  <div className="mt-1 text-sm opacity-80">{item.servico}</div>
                  <div className="mt-1 text-sm opacity-80">{item.local}</div>
                  <div className="mt-3 text-lg font-bold">{currency(item.valor)}</div>
                  <div className="text-xs opacity-70">{item.data}</div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ children, darkMode, className = '' }: { children: React.ReactNode; darkMode: boolean; className?: string }) {
  return <section className={`rounded-3xl border p-5 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} ${className}`}>{children}</section>;
}

function CampoSelect({ label, value, onValueChange, items, darkMode }: {
  label: string;
  value: string;
  onValueChange: (value: any) => void;
  items: [string, string][];
  darkMode: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`rounded-2xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`}
      >
        {items.map(([val, text]) => (
          <option key={val} value={val}>{text}</option>
        ))}
      </select>
    </div>
  );
}

function InputField({ label, value, onChange, className = '' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <label className="text-sm font-semibold">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value || 0))} className="rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" />
    </div>
  );
}

function Linha({ titulo, valor, darkMode }: { titulo: string; valor: string; darkMode: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border p-3 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
      <span className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

