import React, { useState, useEffect } from 'react';
import { MonitorPlay, Settings2, ChevronLeft, AlertCircle, Pause, Play, Square, Timer, Clock, X, Plus, Lock } from 'lucide-react';
import { Maquina, Sessao, Config, Role } from '../types';
import { formatTimeDisplay, formatarDinheiro } from '../lib/utils';
import { deleteDoc, doc } from 'firebase/firestore';

interface Props {
  config: Config;
  sessoes: Sessao[];
  maquinas: Maquina[];
  role: Role;
  podeOperar: boolean;
  iniciarSessaoConfirmada: (maquina: Maquina, modo: 'livre' | 'prepago' | 'pospago', mins: number, valor: number) => void;
  alternarPausaSessao: (sessao: Sessao) => void;
  terminarSessao: (sessao: Sessao) => void;
  registarAuditoria: (acao: string, detalhe: string) => Promise<void>;
  mostrarConfirmacao: (titulo: string, mensagem: string, onConfirm: () => void) => void;
  adicionarMaquinaGlobal: (nome: string) => Promise<void>;
  db: any;
  appId: string;
  contaNegocio: string;
}

function ModalSetupSessao({ maquina, precoHora, onClose, onStart }: { maquina: Maquina, precoHora: number, onClose: () => void, onStart: (modo: 'livre' | 'prepago' | 'pospago', mins: number, valor: number) => void }) {
  const [modo, setModo] = useState<'livre' | 'prepago' | 'pospago'>('livre');
  const [minutos, setMinutos] = useState(30);
  const [valorFixo, setValorFixo] = useState(Math.ceil((30 / 60) * precoHora));
  const [precoLivre, setPrecoLivre] = useState(precoHora);

  useEffect(() => { setValorFixo(Math.ceil((minutos / 60) * precoHora)); }, [minutos, precoHora]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-[320px] overflow-hidden shadow-2xl">
        <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700"><h3 className="font-black text-white uppercase tracking-widest text-sm">{maquina.nome}</h3><button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button></div>
        <div className="p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Modo de Sessão</p>
          <div className="flex bg-gray-800 rounded-xl p-1 mb-5">
            <button onClick={() => setModo('livre')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${modo === 'livre' ? 'bg-emerald-500 text-emerald-950' : 'text-gray-500'}`}>Livre</button>
            <button onClick={() => setModo('prepago')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${modo === 'prepago' ? 'bg-blue-500 text-blue-950' : 'text-gray-500'}`}>Pré-Pago</button>
            <button onClick={() => setModo('pospago')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${modo === 'pospago' ? 'bg-purple-500 text-purple-950' : 'text-gray-500'}`}>Pós-Pago</button>
          </div>
          {(modo === 'prepago' || modo === 'pospago') ? (
            <div className="animate-in fade-in slide-in-from-right-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Minutos {modo === 'pospago' ? 'a Jogar' : 'Pagos'}</label>
              <div className="flex gap-2 mb-4">{[15, 30, 60].map(m => <button key={m} onClick={() => setMinutos(m)} className={`flex-1 py-2 border rounded-xl font-bold text-sm ${minutos === m ? (modo === 'prepago' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-purple-500/20 border-purple-500 text-purple-400') : 'border-gray-700 text-gray-400'}`}>{m}m</button>)}</div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl flex items-center mb-5"><input type="number" value={minutos} onChange={e => setMinutos(Number(e.target.value))} className="bg-transparent w-full text-white font-black text-xl outline-none" min="1" /><span className="text-gray-500 font-bold ml-2">MIN</span></div>
              <div className={`${modo === 'prepago' ? 'bg-blue-950/30 border-blue-900/50' : 'bg-purple-950/30 border-purple-900/50'} border p-4 rounded-2xl mb-2 text-center`}>
                <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${modo === 'prepago' ? 'text-blue-400' : 'text-purple-400'}`}>Valor a Cobrar (Kz)</label>
                <div className="flex items-center justify-center"><input type="number" value={valorFixo} onChange={e => setValorFixo(Number(e.target.value))} className={`bg-transparent w-full text-center text-white font-black text-3xl outline-none border-b-2 pb-1 ${modo === 'prepago' ? 'border-blue-500/30' : 'border-purple-500/30'}`} /></div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 mb-2">
              <div className="text-center py-5 bg-gray-800 rounded-2xl border border-gray-700 mb-4"><Clock size={32} className="text-emerald-500 mx-auto mb-2 opacity-50"/><p className="text-xs text-gray-400 font-medium px-4">O tempo vai contar. Cobras apenas no fim.</p></div>
              <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-2xl text-center"><label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">Preço por Hora (Kz)</label><div className="flex items-center justify-center"><input type="number" value={precoLivre} onChange={e => setPrecoLivre(Number(e.target.value))} className="bg-transparent w-full text-center text-white font-black text-3xl outline-none border-b-2 border-emerald-500/30 pb-1" /></div></div>
            </div>
          )}
          <button onClick={() => onStart(modo, minutos, modo === 'livre' ? precoLivre : valorFixo)} className={`w-full mt-4 py-4 rounded-2xl font-black tracking-widest text-sm flex items-center justify-center gap-2 ${modo === 'livre' ? 'bg-emerald-500 text-emerald-950' : (modo === 'prepago' ? 'bg-blue-500 text-blue-950' : 'bg-purple-500 text-purple-950')}`}><Play size={16} fill="currentColor"/> {modo === 'pospago' ? 'INICIAR PÓS-PAGO' : 'INICIAR AGORA'}</button>
        </div>
      </div>
    </div>
  );
}

export function GestorSessoes({ config, sessoes, maquinas, podeOperar, iniciarSessaoConfirmada, alternarPausaSessao, terminarSessao, registarAuditoria, mostrarConfirmacao, adicionarMaquinaGlobal, db, appId, contaNegocio }: Props) {
  const [now, setNow] = useState(Date.now());
  const [gerirModo, setGerirModo] = useState(false);
  const [modalIniciar, setModalIniciar] = useState<Maquina | null>(null);
  const [nomeNovaMaquina, setNomeNovaMaquina] = useState('');

  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);

  const handleRemoverMaquina = (id: string, nome: string) => {
    mostrarConfirmacao('Apagar Máquina', `Queres apagar a máquina "${nome}"?`, async () => {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/maquinas_${contaNegocio}`, id));
        registarAuditoria('MÁQUINA_REM', `Removeu a máquina: ${nome}`);
      } catch (e) {}
    });
  };

  if (gerirModo) {
    return (
      <div className="p-4 animate-in slide-in-from-right duration-300">
        <div className="mb-6 flex items-center justify-between"><button onClick={() => setGerirModo(false)} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"><ChevronLeft size={20}/></button><h2 className="text-lg font-black tracking-widest text-white uppercase flex items-center gap-2"><Settings2 className="text-orange-500"/> GERIR MÁQUINAS</h2><div className="w-9"></div></div>
        <form onSubmit={(e) => { e.preventDefault(); if(nomeNovaMaquina.trim()) { adicionarMaquinaGlobal(nomeNovaMaquina); setNomeNovaMaquina(''); } }} className="flex gap-2">
            <input type="text" value={nomeNovaMaquina} onChange={e => setNomeNovaMaquina(e.target.value)} placeholder="Nova máquina (ex: Mesa 2)" className="flex-1 bg-gray-900 border border-gray-700 text-white text-sm font-bold px-4 py-3 rounded-xl outline-none focus:border-orange-500" required />
            <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-xl transition-colors"><Plus size={20}/></button>
        </form>
        <div className="mt-6 flex flex-col gap-3">
          {maquinas.map(maq => (<div key={maq.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 p-4 rounded-xl group"><span className="font-bold text-gray-200 text-sm">{maq.nome}</span>{podeOperar && <button onClick={() => handleRemoverMaquina(maq.id, maq.nome)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Square size={14} fill="currentColor"/></button>}</div>))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-in fade-in duration-300">
      <div className="mb-6 flex justify-between items-end">
        <div><h2 className="text-xl font-black tracking-widest text-white flex items-center gap-2 uppercase">Sessões Ativas</h2><p className="text-xs text-gray-500 font-medium mt-1">Preço base: {config.precoHora} Kz / hora</p></div>
        <button onClick={() => setGerirModo(true)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-colors"><Settings2 size={14}/> Gerir</button>
      </div>

      {maquinas.length === 0 ? (
        <div className="text-center p-8 bg-gray-900 border border-gray-800 rounded-2xl"><MonitorPlay size={40} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm font-medium mb-4">Ainda não configuraste máquinas.</p>{podeOperar && <button onClick={() => setGerirModo(true)} className="bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-xl">Adicionar Máquina</button>}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {maquinas.map(maq => {
            const sessaoAtiva = sessoes.find(s => s.maquinaId === maq.id);
            if (sessaoAtiva) {
              const isPausada = sessaoAtiva.emPausa;
              const tempoDecorridoMs = isPausada ? (sessaoAtiva.momentoPausa! - sessaoAtiva.inicio) : (now - sessaoAtiva.inicio);
              const isTemporizador = sessaoAtiva.modo === 'prepago' || sessaoAtiva.modo === 'pospago';
              const isPospago = sessaoAtiva.modo === 'pospago';
              let tempoMostradoMs = tempoDecorridoMs, isEsgotado = false;

              if (isTemporizador && sessaoAtiva.tempoPrePagoMin) {
                const tempoTotalMs = sessaoAtiva.tempoPrePagoMin * 60000;
                tempoMostradoMs = tempoTotalMs - tempoDecorridoMs;
                if (tempoMostradoMs <= 0) isEsgotado = true;
              }

              let colorTheme = isTemporizador ? (isEsgotado ? 'red' : (isPospago ? 'purple' : 'blue')) : 'emerald';
              if (isPausada && !isEsgotado) colorTheme = 'yellow';

              const bgCardClass = colorTheme === 'red' ? 'bg-red-500/10 border-red-500' : colorTheme === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/50' : colorTheme === 'blue' ? 'bg-blue-900/20 border-blue-500/30' : colorTheme === 'purple' ? 'bg-purple-900/20 border-purple-500/30' : 'bg-emerald-900/20 border-emerald-500/30';
              const textTempoClass = colorTheme === 'red' ? 'text-red-500 animate-pulse' : colorTheme === 'yellow' ? 'text-yellow-500' : 'text-white';
              const btnClass = colorTheme === 'red' ? 'bg-red-600 text-white' : colorTheme === 'yellow' ? 'bg-yellow-600 text-white' : colorTheme === 'blue' ? 'bg-blue-600 text-white' : colorTheme === 'purple' ? 'bg-purple-600 text-white' : 'bg-emerald-500 text-emerald-950';

              return (
                <div key={maq.id} className={`border p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all ${bgCardClass}`}>
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <p className={`font-bold text-sm leading-tight ${colorTheme === 'red' ? 'text-red-400' : colorTheme === 'yellow' ? 'text-yellow-500' : colorTheme === 'blue' ? 'text-blue-400' : colorTheme === 'purple' ? 'text-purple-400' : 'text-emerald-400'}`}>{maq.nome}</p>
                    {isEsgotado ? <AlertCircle size={16} className="text-red-500 animate-bounce"/> : (
                      isPausada ? <Pause size={14} className="text-yellow-500" /> : <div className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colorTheme === 'blue' ? 'bg-blue-500' : colorTheme === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>
                    )}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      {isTemporizador ? <Timer size={14} className={colorTheme === 'red' ? 'text-red-500' : colorTheme === 'yellow' ? 'text-yellow-500' : (colorTheme === 'purple' ? 'text-purple-400' : 'text-blue-400')}/> : <Clock size={14} className={colorTheme === 'yellow' ? 'text-yellow-500' : 'text-emerald-400'}/>}
                      <span className={`text-xl font-black ${textTempoClass} font-mono tracking-tighter`}>{formatTimeDisplay(tempoMostradoMs)}</span>
                    </div>
                    <p className="text-[9px] font-bold uppercase text-gray-400 mb-3 tracking-wider">
                      {isPausada ? 'SESSÃO EM PAUSA' : (isTemporizador ? (isEsgotado ? 'TEMPO ESGOTADO' : (isPospago ? 'RESTANTE (PÓS-PAGO)' : 'RESTANTE (PAGO)')) : `COBRAR: ${formatarDinheiro(Math.ceil((tempoDecorridoMs / 3600000) * (sessaoAtiva.precoHoraAplicado || config.precoHora)))}`)}
                    </p>
                    {podeOperar ? (
                      <div className="flex gap-2 w-full">
                        <button onClick={() => alternarPausaSessao(sessaoAtiva)} className={`flex-1 font-black text-[10px] uppercase py-3 rounded-xl flex items-center justify-center gap-1 bg-gray-800 text-gray-300 border border-gray-700`}>
                           {isPausada ? <Play size={14} fill="currentColor"/> : <Pause size={14} fill="currentColor"/>}
                           {isPausada ? 'Retomar' : 'Pausa'}
                        </button>
                        <button onClick={() => terminarSessao(sessaoAtiva)} className={`flex-[2] font-black text-[10px] uppercase py-3 rounded-xl flex items-center justify-center gap-2 ${btnClass}`}><Square size={14} fill="currentColor"/> Encerar</button>
                      </div>
                    ) : (
                      <div className="w-full bg-red-950/40 text-red-500 font-black text-[10px] uppercase py-3 rounded-xl flex items-center justify-center gap-2"><Lock size={14}/> FECHADO</div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={maq.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-between opacity-80">
                <p className="font-bold text-gray-300 text-sm mb-6 leading-tight">{maq.nome}</p>
                {podeOperar ? (
                  <button onClick={() => setModalIniciar(maq)} className="w-full bg-gray-800 text-gray-400 border border-gray-700 font-black text-[10px] uppercase py-3 rounded-xl hover:text-white flex items-center justify-center gap-2"><Play size={12} fill="currentColor"/> INICIAR</button>
                ) : (
                  <div className="w-full bg-gray-950 text-gray-600 border border-gray-800 font-black text-[10px] uppercase py-3 rounded-xl"><Lock size={12} fill="currentColor"/> BLOQUEADO</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalIniciar && <ModalSetupSessao maquina={modalIniciar} precoHora={config.precoHora} onClose={() => setModalIniciar(null)} onStart={(modo, mins, valor) => { setModalIniciar(null); iniciarSessaoConfirmada(modalIniciar!, modo, mins, valor); }} />}
    </div>
  );
}
