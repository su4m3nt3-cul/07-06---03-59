import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Banknote, CreditCard, Landmark, Trash2, Plus, Settings2 } from 'lucide-react';
import { Transacao, Config, Produto } from '../types';
import { obterDataHoje, obterHoraAtual, MOEDA, formatarDinheiro } from '../lib/utils';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  transacaoInicial: Transacao | null;
  onSalvar: (nova: any, produtoId?: string) => void;
  onCancelar: () => void;
  config: Config;
  produtos: Produto[];
  atualizarConfig: (novasConfigs: Partial<Config>) => Promise<void>;
  onApagar: () => void;
}

export function AdicionarTransacao({ transacaoInicial, onSalvar, onCancelar, config, produtos, atualizarConfig, onApagar }: Props) {
  const [tipo, setTipo] = useState<'entrada' | 'despesa'>(transacaoInicial?.tipo || 'entrada');
  const [valor, setValor] = useState(transacaoInicial?.valor.toString() || '');
  const [categoria, setCategoria] = useState(transacaoInicial?.categoria || '');
  const [metodo, setMetodo] = useState(transacaoInicial?.metodo || 'Dinheiro');
  const [descricao, setDescricao] = useState(transacaoInicial?.descricao || '');
  const [data, setData] = useState(transacaoInicial?.data || obterDataHoje());
  const [gerirCategorias, setGerirCategorias] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [mostrarProdutos, setMostrarProdutos] = useState(false);
  
  const metodosPagamento = [
    {id: 'Dinheiro', icon: Banknote},
    {id: 'Multicaixa', icon: CreditCard},
    {id: 'Transferência', icon: Landmark}
  ];
  
  const listaCategorias = tipo === 'entrada' ? config.categoriasEntrada : config.categoriasDespesa;

  useEffect(() => { setCategoria(''); setGerirCategorias(false); }, [tipo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (!valor || !categoria) return;
    onSalvar({ 
      tipo, 
      valor: parseFloat(valor), 
      categoria, 
      metodo, 
      descricao: descricao.trim(), 
      data, 
      hora: transacaoInicial?.hora || obterHoraAtual(),
      produtoId: produtoSelecionado?.id
    }, produtoSelecionado?.id);
  };

  const handleSalvarNovaCategoria = () => {
    if(!novaCatNome.trim()) return;
    const fieldName = tipo === 'entrada' ? 'categoriasEntrada' : 'categoriasDespesa';
    if (!listaCategorias.includes(novaCatNome.trim())) {
        atualizarConfig({ [fieldName]: [...listaCategorias, novaCatNome.trim()] });
    }
    setNovaCatNome('');
  };

  const removerCategoria = (catParaRemover: string) => {
    const fieldName = tipo === 'entrada' ? 'categoriasEntrada' : 'categoriasDespesa';
    atualizarConfig({ [fieldName]: listaCategorias.filter(c => c !== catParaRemover) });
    if (categoria === catParaRemover) setCategoria('');
  };

  if (gerirCategorias) {
    return (
      <div className="p-4 animate-in slide-in-from-right duration-300">
         <div className="flex items-center justify-between mb-6"><button type="button" onClick={() => setGerirCategorias(false)} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"><ChevronLeft size={20} /></button><h2 className="text-lg font-black tracking-widest text-white uppercase text-center flex-1">Gerir Categorias</h2><div className="w-10"></div></div>
         <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-5">
           <button type="button" onClick={() => setTipo('entrada')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${tipo === 'entrada' ? 'bg-emerald-500 text-gray-950 shadow-md' : 'text-gray-500'}`}>Receitas</button>
           <button type="button" onClick={() => setTipo('despesa')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${tipo === 'despesa' ? 'bg-red-500 text-gray-950 shadow-md' : 'text-gray-500'}`}>Despesas</button>
         </div>
         <div className="flex gap-2 mb-6"><input value={novaCatNome} onChange={e => setNovaCatNome(e.target.value)} placeholder="Nova categoria..." className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-orange-500 transition-colors" /><button type="button" onClick={handleSalvarNovaCategoria} disabled={!novaCatNome.trim()} className={`p-3 rounded-xl transition-colors ${novaCatNome.trim() ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}><Plus size={20}/></button></div>
         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 px-1 block">Categorias Atuais</p>
         <div className="flex flex-col gap-2">
             {listaCategorias.map(cat => (<div key={cat} className="flex justify-between items-center bg-gray-900 border border-gray-800 p-3 rounded-xl group hover:bg-gray-800/50 transition-colors"><span className="font-bold text-gray-300 text-sm">{cat}</span><button type="button" onClick={() => removerCategoria(cat)} className="text-red-500 bg-red-500/10 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16}/></button></div>))}
             {listaCategorias.length === 0 && <p className="text-center text-gray-500 text-xs py-4">Nenhuma categoria encontrada.</p>}
         </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between mb-6"><button type="button" onClick={onCancelar} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"><ChevronLeft size={20} /></button><h2 className="text-lg font-black tracking-widest text-white uppercase">{transacaoInicial ? 'Editar Registo' : 'Novo Registo'}</h2><div className="w-9"></div></div>
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-5">
        <button type="button" onClick={() => setTipo('entrada')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${tipo === 'entrada' ? 'bg-emerald-500 text-gray-950 shadow-md' : 'text-gray-500'}`}>Receita (+)</button>
        <button type="button" onClick={() => setTipo('despesa')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${tipo === 'despesa' ? 'bg-red-500 text-gray-950 shadow-md' : 'text-gray-500'}`}>Despesa (-)</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className={`p-5 rounded-2xl border transition-colors ${tipo === 'entrada' ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
          <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${tipo === 'entrada' ? 'text-emerald-500' : 'text-red-500'}`}>Valor ({MOEDA})</label>
          <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-transparent text-4xl font-black text-white outline-none placeholder-gray-700" placeholder="0" autoFocus required disabled={!!produtoSelecionado} />
        </div>

        {tipo === 'entrada' && (categoria === 'Consumo (Bar)' || categoria === 'Bar / Snacks') && (
          <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
             <button 
               type="button"
               onClick={() => setMostrarProdutos(!mostrarProdutos)}
               className="w-full p-4 flex items-center justify-between hover:bg-gray-900 transition-colors"
             >
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                      <ShoppingBag size={18} />
                   </div>
                   <div className="text-left">
                      <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest">Selecionar Produto</span>
                      <span className="text-sm font-black text-white uppercase">{produtoSelecionado ? produtoSelecionado.nome : 'Nenhum item selecionado'}</span>
                   </div>
                </div>
                {mostrarProdutos ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
             </button>

             <AnimatePresence>
                {mostrarProdutos && (
                  <div className="p-2 border-t border-gray-800 bg-gray-900/30 max-h-48 overflow-y-auto grid grid-cols-1 gap-1">
                     {produtos.map(p => (
                       <button 
                         key={p.id}
                         type="button"
                         disabled={p.stockAtual <= 0}
                         onClick={() => {
                            setProdutoSelecionado(p);
                            setValor(p.precoVenda.toString());
                            setDescricao(`Venda: ${p.nome}`);
                            setMostrarProdutos(false);
                         }}
                         className={`flex items-center justify-between p-3 rounded-xl border transition-all ${produtoSelecionado?.id === p.id ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'} ${p.stockAtual <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                       >
                          <div className="text-left">
                             <div className="text-xs font-black uppercase tracking-tight">{p.nome} <span className="opacity-60 font-medium ml-1">({p.stockAtual})</span></div>
                             <div className="text-[9px] font-bold opacity-60 uppercase">{p.categoria}</div>
                          </div>
                          <div className="text-[11px] font-black">{formatarDinheiro(p.precoVenda)}</div>
                       </button>
                     ))}
                     {produtos.length === 0 && <p className="text-center py-4 text-[10px] uppercase font-bold text-gray-600">Nenhum produto cadastrado</p>}
                  </div>
                )}
             </AnimatePresence>
          </div>
        )}

        <div>
          <div className="flex justify-between items-end mb-2 px-1"><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Categoria</label><button type="button" onClick={() => setGerirCategorias(true)} className="text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase flex items-center gap-1"><Settings2 size={12}/> Gerir</button></div>
          <div className="flex flex-wrap gap-2 items-center">
             {listaCategorias.map(cat => (<button key={cat} type="button" onClick={() => { setCategoria(cat); setProdutoSelecionado(null); }} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${categoria === cat ? (tipo === 'entrada' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400') : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}>{cat}</button>))}
             {listaCategorias.length === 0 && <p className="text-xs text-gray-500 font-medium">Nenhuma categoria criada.</p>}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl mt-1"><label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Descrição (Opcional)</label><input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Venda de 2 sumos" className="w-full bg-transparent text-white font-medium text-sm outline-none" /></div>

        {tipo === 'entrada' && (
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2 px-1 mt-1">Método de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {metodosPagamento.map(met => (<button key={met.id} type="button" onClick={() => setMetodo(met.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${metodo === met.id ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}><met.icon size={18} /><span className="text-[9px] font-bold uppercase">{met.id}</span></button>))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl mt-1"><label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Data</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full bg-transparent text-white font-medium text-sm outline-none" /></div>
        
        <div className="flex gap-2 mt-2">
          {transacaoInicial && (
            <button type="button" onClick={onApagar} className="px-5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">
              <Trash2 size={20} />
            </button>
          )}
          <button type="submit" disabled={!valor || !categoria} className={`flex-1 py-4 rounded-2xl font-black tracking-widest text-sm shadow-xl transition-transform active:scale-95 ${(!valor || !categoria) ? 'bg-gray-800 text-gray-500' : (tipo === 'entrada' ? 'bg-emerald-500 text-emerald-950' : 'bg-red-500 text-red-950')}`}>{transacaoInicial ? 'GUARDAR' : `CONFIRMAR ${tipo.toUpperCase()}`}</button>
        </div>
      </form>
    </div>
  );
}
