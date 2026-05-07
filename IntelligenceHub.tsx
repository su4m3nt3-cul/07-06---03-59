import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, BrainCircuit, TrendingUp, TrendingDown, Zap, BarChart3 } from 'lucide-react';
import { getSystemIntelligence } from '../services/aiService';
import { formatarDinheiro } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  transacoes: any[];
  maquinas: any[];
  funcionarios: any[];
  sessoes: any[];
  config: any;
  onAIAction: (call: any) => Promise<void>;
}

export function IntelligenceHub({ transacoes, maquinas, funcionarios, sessoes, config, onAIAction }: Props) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const appState = { transacoes, maquinas, funcionarios, sessoes, config };

  useEffect(() => {
    fetchInsights();
  }, [transacoes]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const res = await getSystemIntelligence(appState);
    setInsights(res);
    setLoadingInsights(false);
  };

  // Predictive Logic
  const calculateTrends = () => {
    const agora = new Date();
    const transacoesMes = transacoes.filter(t => {
      const parts = t.data.split('-');
      return parseInt(parts[1]) - 1 === agora.getMonth();
    });
    const faturasMes = transacoesMes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
    
    // Simple projection
    const diaMes = agora.getDate();
    const mediaDiaria = faturasMes / diaMes;
    const estimativaMensal = mediaDiaria * 30;

    const mesPassadoNum = agora.getMonth() - 1 === -1 ? 11 : agora.getMonth() - 1;
    const transacoesMesPassado = transacoes.filter(t => {
      const parts = t.data.split('-');
      return parseInt(parts[1]) - 1 === mesPassadoNum;
    });
    const faturasMesPassado = transacoesMesPassado.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
    
    const crescimento = faturasMesPassado > 0 ? ((faturasMes - faturasMesPassado) / faturasMesPassado) * 100 : 0;

    return { estimativaMensal, crescimento, faturasMes };
  };

  const trends = calculateTrends();

  const getExpensesByCategory = () => {
    const cats: Record<string, number> = {};
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    despesas.forEach(t => {
      cats[t.categoria] = (cats[t.categoria] || 0) + t.valor;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  };

  const expensesByCategory = getExpensesByCategory();
  const totalDespesas = expensesByCategory.reduce((acc, c) => acc + c[1], 0);

  return (
    <div className="p-4 flex flex-col gap-6 animate-in fade-in pb-24">
      {/* Smart Proactive Section */}
      <section className="bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border border-indigo-500/30 p-5 rounded-3xl relative overflow-hidden">
        <Sparkles className="absolute -right-4 -top-4 text-indigo-500/20" size={120} />
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/40">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <h2 className="text-white font-black uppercase tracking-widest text-sm">IA do Sistema</h2>
          {loadingInsights && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ml-auto" />}
        </div>

        <div className="flex flex-wrap gap-2">
          {insights.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900/60 backdrop-blur-sm border border-indigo-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3"
            >
              <Zap size={14} className="text-yellow-400" />
              <span className="text-xs text-indigo-100 font-medium">{msg}</span>
            </motion.div>
          ))}
          {insights.length === 0 && !loadingInsights && <p className="text-xs text-indigo-300/50">A analisar dados recentes...</p>}
        </div>
      </section>

      {/* Predictions Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} className="text-orange-500" />
            <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Previsão Mensal</h3>
          </div>
          <div className="flex items-end gap-3">
             <span className="text-3xl font-black text-white">{formatarDinheiro(trends.estimativaMensal)}</span>
             <div className={`flex items-center text-[10px] font-black pb-1 ${trends.crescimento >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trends.crescimento >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(trends.crescimento).toFixed(1)}% vs Mês Anterior
             </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Expectativa para o final do mês corrente com base no fluxo atual.</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-yellow-500" />
            <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Estado da Semana</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-200 font-medium">
               {trends.crescimento > 10 ? "O rendimento esta semana está excelente, muito acima do esperado!" :
                trends.crescimento > 0 ? "O rendimento está estável e com tendência de crescimento." :
                "O rendimento está ligeiramente abaixo da média, solicita recomendações."}
            </p>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${trends.crescimento >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                 style={{ width: `${Math.max(10, Math.min(100, 50 + trends.crescimento))}%` }} 
               />
            </div>
          </div>
        </div>
      </section>

      {/* NOVO: Analítica de Custos por Categoria */}
      <section className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
             <BarChart3 size={18} className="text-red-500" />
             <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Analítica de Custos</h3>
           </div>
           <div className="text-right">
              <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest">Total Gasto</span>
              <span className="text-sm font-black text-white">{formatarDinheiro(totalDespesas)}</span>
           </div>
        </div>

        <div className="space-y-4">
          {expensesByCategory.map(([cat, val]) => (
            <div key={cat} className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-300 font-bold uppercase tracking-tighter">{cat}</span>
                <span className="text-gray-400 font-black">
                  {formatarDinheiro(val)} 
                  <span className="text-[9px] text-gray-600 ml-1">({((val / (totalDespesas || 1)) * 100).toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(val / (totalDespesas || 1)) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-red-500/60 rounded-full"
                />
              </div>
            </div>
          ))}
          {expensesByCategory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-30">
               <BarChart3 size={40} className="text-gray-600" />
               <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Nenhuma despesa para analisar</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
