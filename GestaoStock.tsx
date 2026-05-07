import React, { useState } from 'react';
import { 
  Package, Plus, Search, AlertTriangle, TrendingDown, 
  Trash2, Edit3, ChevronLeft, Save, Archive, ShoppingBag,
  ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import { Produto } from '../types';
import { formatarDinheiro } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

interface Props {
  produtos: Produto[];
  contaNegocio: string;
  onBack: () => void;
  mostrarAlerta: (t: string, m: string) => void;
  registarAuditoria: (acao: string, detalhe: string) => void;
}

export function GestaoStock({ produtos, contaNegocio, onBack, mostrarAlerta, registarAuditoria }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editando, setEditando] = useState<Partial<Produto> | null>(null);
  const [isNovo, setIsNovo] = useState(false);

  const filtered = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totaisPorCategoria = produtos.reduce((acc, p) => {
    const valor = p.stockAtual * p.precoVenda;
    acc[p.categoria] = (acc[p.categoria] || 0) + valor;
    return acc;
  }, {} as Record<string, number>);

  const valorTotalStock = Object.values(totaisPorCategoria).reduce((a, b) => a + b, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando?.nome || !editando?.precoVenda) return;

    try {
      const id = editando.id || Math.random().toString(36).substr(2, 9);
      const data: Produto = {
        id,
        nome: editando.nome!,
        descricao: editando.descricao || '',
        categoria: editando.categoria || 'Geral',
        precoVenda: Number(editando.precoVenda),
        stockAtual: Number(editando.stockAtual ?? 0),
        stockMinimo: Number(editando.stockMinimo ?? 5),
        unidadeMedida: editando.unidadeMedida || 'Unidade',
        ultimaReposicao: editando.ultimaReposicao || new Date().toISOString().split('T')[0]
      };

      await setDoc(doc(db, `artifacts/${appId}/public/data/produtos_${contaNegocio}`, id), data);
      registarAuditoria('GESTÃO_STOCK', `${isNovo ? 'Adicionou' : 'Editou'} produto: ${data.nome}`);
      setEditando(null);
      setIsNovo(false);
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Falha ao gravar produto.");
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tens a certeza que queres apagar ${nome}?`)) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/produtos_${contaNegocio}`, id));
        registarAuditoria('GESTÃO_STOCK', `Removeu produto: ${nome}`);
      } catch (err) {
        mostrarAlerta("Erro", "Falha ao apagar.");
      }
    }
  };

  const adjustStock = async (p: Produto, amount: number) => {
    const newStock = Math.max(0, p.stockAtual + amount);
    await setDoc(doc(db, `artifacts/${appId}/public/data/produtos_${contaNegocio}`, p.id), {
      ...p,
      stockAtual: newStock,
      ultimaReposicao: amount > 0 ? new Date().toISOString().split('T')[0] : p.ultimaReposicao
    });
  };

  return (
    <div className="p-4 flex flex-col gap-6 animate-in fade-in pb-24">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-2">
          <Package className="text-orange-500" /> Stock & Loja
        </h2>
        <button 
          onClick={() => { setEditando({ stockAtual: 0, stockMinimo: 5, unidadeMedida: 'Unidade' }); setIsNovo(true); }}
          className="bg-orange-600 px-4 py-2 rounded-xl text-white hover:bg-orange-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all border border-orange-400/30 active:scale-95"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Procurar produto..."
          className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:border-orange-500 outline-none transition-colors"
        />
      </div>

      {/* Resumo Financeiro do Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 p-5 rounded-3xl">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="text-emerald-400" size={16} />
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Valor Total de Venda</h3>
            </div>
            <span className="text-2xl font-black text-white">{formatarDinheiro(valorTotalStock)}</span>
            <p className="text-[9px] text-emerald-400/60 font-medium mt-1">Potencial de faturação do stock atual.</p>
         </div>
         <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl overflow-hidden relative">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Valor por Categoria</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
               {Object.entries(totaisPorCategoria).map(([cat, val]) => (
                 <div key={cat} className="flex justify-between items-center text-[11px]">
                   <span className="text-gray-400 font-bold uppercase">{cat}</span>
                   <span className="text-white font-black">{formatarDinheiro(val)}</span>
                 </div>
               ))}
               {Object.keys(totaisPorCategoria).length === 0 && <p className="text-[10px] text-gray-600 font-bold italic">Sem dados financeiros.</p>}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(p => (
          <motion.div 
            key={p.id}
            layout
            className="bg-gray-900 border border-gray-800 p-4 rounded-3xl flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${p.stockAtual <= p.stockMinimo ? 'bg-red-500/10 text-red-500' : 'bg-gray-800 text-gray-400'}`}>
                    <Archive size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-sm tracking-tight">{p.nome}</h3>
                    <div className="flex gap-2 items-center">
                       <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{p.categoria}</span>
                       {p.descricao && <span className="text-[8px] text-gray-600 font-medium italic border-l border-gray-800 pl-2 max-w-[150px] truncate">{p.descricao}</span>}
                    </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditando(p); setIsNovo(false); }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800/50"
                  >
                    <Edit3 size={14}/>
                    <span className="text-[9px] font-black uppercase">Editar</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id, p.nome)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/10"
                  >
                    <Trash2 size={14}/>
                    <span className="text-[9px] font-black uppercase">Apagar</span>
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-950/50 p-3 rounded-2xl border border-gray-800/50">
               <div>
                  <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Preço Venda</span>
                  <span className="text-sm font-black text-emerald-400">{formatarDinheiro(p.precoVenda)}</span>
               </div>
               <div className="text-right">
                  <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status Stock</span>
                  <div className="flex items-center justify-end gap-2">
                    <span className={`text-sm font-black ${p.stockAtual <= p.stockMinimo ? 'text-red-500' : 'text-gray-300'}`}>
                      {p.stockAtual} <span className="text-[9px] font-bold text-gray-500 uppercase">{p.unidadeMedida}</span>
                    </span>
                    {p.stockAtual <= p.stockMinimo && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                  </div>
               </div>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => adjustStock(p, 1)}
                 className="flex-1 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-emerald-400 flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-colors"
               >
                 <ArrowUpCircle size={14} /> Repor
               </button>
               <button 
                 onClick={() => adjustStock(p, -1)}
                 className="flex-1 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl text-red-400 flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-colors"
               >
                 <ArrowDownCircle size={14} /> Saída
               </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-[2rem] flex flex-col items-center gap-4">
             <div className="p-5 bg-gray-800 rounded-full text-gray-600">
               <Package size={48} />
             </div>
             <div className="space-y-1">
               <p className="text-xs font-black uppercase tracking-widest text-gray-400">Nenhum produto em stock</p>
               <p className="text-[10px] text-gray-600 font-medium">Começa a cadastrar os teus itens para controlo automático.</p>
             </div>
             <button 
               onClick={() => { setEditando({ stockAtual: 0, stockMinimo: 5, unidadeMedida: 'Unidade' }); setIsNovo(true); }}
               className="mt-2 bg-orange-600 px-6 py-3 rounded-2xl text-white hover:bg-orange-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
             >
               <Plus size={18} /> Adicionar Primeiro Item
             </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editando && (
          <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
             >
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">{isNovo ? 'Novo Produto' : 'Editar Produto'}</h3>
                  <button onClick={() => setEditando(null)} className="p-2 text-gray-400 hover:text-white"><X size={20}/></button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nome do Produto</label>
                    <input 
                      required
                      value={editando.nome || ''} 
                      onChange={e => setEditando({...editando, nome: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                      placeholder="Ex: Coca-cola 330ml"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descrição / Observações</label>
                    <textarea 
                      value={editando.descricao || ''} 
                      onChange={e => setEditando({...editando, descricao: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500 min-h-[80px]"
                      placeholder="Detalhes do produto ou stock..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preço Venda (AKZ)</label>
                      <input 
                        type="number"
                        required
                        value={editando.precoVenda || ''} 
                        onChange={e => setEditando({...editando, precoVenda: Number(e.target.value)})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                        placeholder="700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</label>
                      <select 
                        value={editando.categoria || 'Bebidas'} 
                        onChange={e => setEditando({...editando, categoria: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                      >
                        <option value="Bebidas">Bebidas</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Acessórios">Acessórios</option>
                        <option value="Geral">Geral</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stock Atual</label>
                      <input 
                        type="number"
                        value={editando.stockAtual ?? 0} 
                        onChange={e => setEditando({...editando, stockAtual: Number(e.target.value)})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stock Mínimo</label>
                      <input 
                        type="number"
                        value={editando.stockMinimo ?? 5} 
                        onChange={e => setEditando({...editando, stockMinimo: Number(e.target.value)})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Unidade</label>
                      <input 
                        value={editando.unidadeMedida || 'Unidade'} 
                        onChange={e => setEditando({...editando, unidadeMedida: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                        placeholder="Lata"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Gravar Produto
                  </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
