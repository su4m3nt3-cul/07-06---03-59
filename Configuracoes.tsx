import React, { useState } from 'react';
import { Settings, Crown, UploadCloud, Settings2, Trash2 } from 'lucide-react';
import { Config, Assinatura } from '../types';
import { formatarDinheiro, DADOS_PAGAMENTO } from '../lib/utils';

interface Props {
  config: Config;
  atualizarConfig: (novasConfigs: Partial<Config>) => Promise<void>;
  assinatura: Assinatura | null;
  onUpload: (base64: string, meses: number) => Promise<void>;
  processarComprovativo: (file: File) => Promise<string>;
  mostrarAlerta: (titulo: string, mensagem: string) => void;
  registarAuditoria: (acao: string, detalhe: string) => Promise<void>;
  apagarContaNegocio: () => void;
}

export function Configuracoes({ config, atualizarConfig, assinatura, onUpload, processarComprovativo, mostrarAlerta, registarAuditoria, apagarContaNegocio }: Props) {
  const [preco, setPreco] = useState(config.precoHora);
  const [pin, setPin] = useState(config.adminPin);
  const [aberto, setAberto] = useState(config.sistemaAberto);
  const [uploading, setUploading] = useState(false);
  const [mesesSelecionados, setMesesSelecionados] = useState(1);
  const dataExpiracao = assinatura?.expiracao ? new Date(assinatura.expiracao).toLocaleDateString('pt-AO') : '...';

  const guardar = () => { 
    atualizarConfig({ precoHora: Number(preco), adminPin: pin, sistemaAberto: aberto }); 
    mostrarAlerta("Sucesso", "Configurações guardadas!"); 
    registarAuditoria("CONFIG_UPDATE", "Alterou configurações"); 
  };

  const handleRenovacao = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0]; if(!file) return;
     setUploading(true);
     try {
        const base64 = await processarComprovativo(file);
        await onUpload(base64, mesesSelecionados); 
     } catch(e) {
        mostrarAlerta("Erro", "Falha ao processar comprovativo.");
     } finally {
        setUploading(false);
        e.target.value = '';
     }
  };

  return (
    <div className="p-4 pb-20 animate-in fade-in">
      <h2 className="text-xl font-black tracking-widest text-white mb-6 flex gap-2 items-center uppercase"><Settings className="text-orange-500"/> Configurações</h2>
      
      <div className="bg-gradient-to-tr from-gray-900 to-gray-800 border border-gray-700 p-5 rounded-2xl mb-6 shadow-xl relative overflow-hidden">
         <div className="absolute -right-4 -top-4 opacity-10"><Crown size={120}/></div>
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><Crown size={16} className="text-orange-400"/> Licença Cloud</h3>
         <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
            <div><p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Plano</p><p className="text-sm font-black text-white">{assinatura?.plano || 'Standard'}</p></div>
            <div><p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Validade</p><p className={`text-sm font-black ${assinatura?.ativa ? 'text-emerald-400' : 'text-red-400'}`}>{dataExpiracao}</p></div>
         </div>
         {assinatura?.pendente ? (
            <div className="bg-orange-500/20 text-orange-400 p-3 rounded-xl border border-orange-500/30 text-[10px] font-bold uppercase tracking-widest text-center">Renovação Pendente</div>
         ) : (
            <div className="relative z-10">
               <div className="flex justify-between items-center mb-4 bg-gray-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Duração</span>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setMesesSelecionados(p => Math.max(1, p-1))} className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-lg font-black border border-gray-700 shadow-sm transition-active active:scale-90">-</button>
                     <span className="text-xs font-black text-white w-10 text-center">{mesesSelecionados}</span>
                     <button onClick={() => setMesesSelecionados(p => p+1)} className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-lg font-black border border-gray-700 shadow-sm transition-active active:scale-90">+</button>
                  </div>
               </div>

               <div className="flex justify-between items-center mb-3 p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
                  <span className="text-[10px] text-orange-400 font-bold uppercase">Total a pagar:</span>
                  <span className="text-sm font-black text-white">{formatarDinheiro(DADOS_PAGAMENTO.precoMensalBase * mesesSelecionados)}</span>
               </div>

               <p className="text-[10px] text-gray-400 mb-2">Transfira p/ <strong className="text-emerald-400">{DADOS_PAGAMENTO.telefoneMCX}</strong>. Faça screenshot do comprovativo e carregue aqui:</p>
               <label className={`w-full bg-orange-600 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20 active:scale-95 transition-all ${uploading ? 'opacity-50' : ''}`}>
                 {uploading ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : <><UploadCloud size={18}/> CARREGAR COMPROVATIVO</>}
                 <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleRenovacao} disabled={uploading} />
               </label>
            </div>
         )}
      </div>

      <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Settings2 size={16} className="text-gray-500"/> Parâmetros</h3>
         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex flex-col gap-2">Preço por Hora<input type="number" value={preco} onChange={e=>setPreco(Number(e.target.value))} className="bg-gray-950 text-white p-3 rounded-xl border border-gray-800 outline-none font-black text-lg" /></label>
         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex flex-col gap-2">PIN Administrador<input type="text" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g, ''))} className="bg-gray-950 text-white p-3 rounded-xl border border-gray-800 outline-none font-black tracking-[0.5em] text-center text-lg" /></label>
         
         <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl mt-2">
            <label className="flex items-center justify-between text-sm text-white font-bold cursor-pointer">
               <span className="uppercase tracking-widest text-xs">Sistema Aberto</span>
               <input type="checkbox" checked={aberto} onChange={e=>setAberto(e.target.checked)} className="h-5 w-5 accent-emerald-500"/>
            </label>
         </div>

         <button onClick={guardar} className="bg-orange-600 text-white font-black tracking-widest text-sm py-4 rounded-xl mt-2 shadow-lg">GUARDAR ALTERAÇÕES</button>
      </div>

      <div className="bg-red-900/10 border border-red-500/30 p-5 rounded-2xl mt-6">
         <h3 className="text-red-500 font-black text-sm mb-2 uppercase tracking-widest">Zona Perigosa</h3>
         <button onClick={apagarContaNegocio} className="w-full bg-red-600 text-white font-black text-[10px] py-4 rounded-xl flex items-center justify-center gap-2"><Trash2 size={16}/> APAGAR CONTA PERMANENTEMENTE</button>
      </div>
    </div>
  );
}
