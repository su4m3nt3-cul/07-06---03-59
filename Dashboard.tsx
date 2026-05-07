import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Banknote, Coffee, ChevronRight } from 'lucide-react';
import { Transacao, Maquina, Role } from '../types';
import { formatarDinheiro, obterDataHoje } from '../lib/utils';

interface Props {
  transacoes: Transacao[];
  setTelaAtual: (tela: any) => void;
  role: Role;
  podeOperar: boolean;
  apagarTransacao: (id: string, valor: number, categoria: string) => void;
  editarTransacao: (t: Transacao) => void;
  maquinas: Maquina[];
}

interface TransacaoItemProps {
  t: Transacao;
  podeOperar: boolean;
  editarTransacao: (t: Transacao) => void;
  key?: string | number;
}

function TransacaoItem({ t, podeOperar, editarTransacao }: TransacaoItemProps) {
  return (
    <div onClick={() => podeOperar && editarTransacao(t)} className={`bg-gray-900 border border-gray-800 p-3 rounded-2xl flex justify-between items-center group transition-all ${podeOperar ? 'cursor-pointer hover:bg-gray-800/80 hover:border-orange-500/50 active:scale-[0.98]' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${t.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{t.tipo === 'entrada' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}</div>
        <div>
          <p className="font-bold text-gray-200 text-sm leading-tight">{t.categoria}</p>
          <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-gray-500">{t.hora}</span><span className="w-1 h-1 bg-gray-700 rounded-full"></span><span className="text-[10px] text-gray-500 font-medium">{t.metodo || 'Dinheiro'}</span></div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right"><p className={`font-black text-sm ${t.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>{t.tipo === 'entrada' ? '+' : '-'}{formatarDinheiro(t.valor)}</p></div>
        {podeOperar && <ChevronRight size={18} className="text-gray-600 group-hover:text-orange-400 transition-colors" />}
      </div>
    </div>
  );
}

export function Dashboard({ transacoes, setTelaAtual, podeOperar, editarTransacao }: Props) {
  const dataHoje = obterDataHoje();
  const transacoesHoje = transacoes.filter(t => t.data === dataHoje);
  const entradasHoje = transacoesHoje.filter(t => t.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0);
  const despesasHoje = transacoesHoje.filter(t => t.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
  const lucroHoje = entradasHoje - despesasHoje;
  
  const entradasCount = transacoesHoje.filter(t => t.tipo === 'entrada').length;
  const ticketMedio = entradasCount > 0 ? (entradasHoje / entradasCount) : 0;

  const seteDiasAtras = new Date(); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const data7Dias = seteDiasAtras.toISOString().split('T')[0];
  const transacoes7d = transacoes.filter(t => t.data >= data7Dias);
  const lucro7d = transacoes7d.filter(t => t.tipo === 'entrada').reduce((a, b) => a + b.valor, 0) - transacoes7d.filter(t => t.tipo === 'despesa').reduce((a, b) => a + b.valor, 0);
  const mediaSemanal = lucro7d / 7;

  return (
    <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-300 pb-10">
      <div className="flex justify-between items-end mb-2"><div><h2 className="text-xl font-black tracking-widest text-white uppercase">Resumo Diário</h2><p className="text-xs text-gray-500 font-medium">{dataHoje}</p></div></div>
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
         {/* Abstract Geometric Pattern Background */}
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <path d="M0,100 C30,80 70,120 100,100 L100,0 L0,0 Z" fill="url(#fadeGrad)" />
            </svg>
         </div>

         {/* Decorative Blur Elements */}
         <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700 animate-pulse"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-black/30 rounded-full blur-2xl"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-emerald-100 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-80 mb-1">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(110,231,183,0.8)]"></div>
                  Lucro Real Diário
                </p>
                <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
                  {formatarDinheiro(lucroHoje)}
                </h2>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                <Wallet className="text-emerald-200" size={24} />
              </div>
            </div>

            {/* Visual Balance Bar */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[9px] font-black text-emerald-200/60 uppercase tracking-widest">Performance do Dia</span>
                <span className="text-[10px] font-bold text-white bg-black/20 px-2 py-0.5 rounded-full border border-white/5">
                  {entradasHoje > 0 ? Math.round((lucroHoje / entradasHoje) * 100) : 0}% Margem
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000" 
                  style={{ width: `${entradasHoje > 0 ? Math.min(100, Math.max(0, (lucroHoje / entradasHoje) * 100)) : 0}%` }}
                ></div>
              </div>
            </div>
         </div>
      </div> 
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Entradas</p><p className="text-lg font-black text-emerald-400">{formatarDinheiro(entradasHoje)}</p></div>
         <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Despesas</p><p className="text-lg font-black text-red-400">{formatarDinheiro(despesasHoje)}</p></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Ticket Médio (Hoje)</p><p className="text-sm font-black text-white">{formatarDinheiro(ticketMedio)}</p></div>
         <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Média Semanal</p><p className="text-sm font-black text-orange-400">{formatarDinheiro(mediaSemanal)}</p></div>
      </div>

      <div className="mt-2"> 
        <div className="flex justify-between items-center mb-3"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Banknote size={14}/> Movimentos do Dia</h3><span className="text-[10px] bg-gray-800 px-2 py-1 rounded-md text-gray-300 font-bold">{transacoesHoje.length} op</span></div> 
        {transacoesHoje.length === 0 ? (<div className="text-center p-8 bg-gray-900 rounded-2xl border border-gray-800"><Coffee size={32} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm font-medium">Caixa vazio hoje.</p></div>) : (<div className="flex flex-col gap-2">{transacoesHoje.map(t => (<TransacaoItem key={t.id} t={t} podeOperar={podeOperar} editarTransacao={editarTransacao} />))}</div>)} 
      </div> 
    </div>
  );
}
