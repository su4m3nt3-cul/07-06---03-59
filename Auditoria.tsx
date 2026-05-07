import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { AuditoriaLog } from '../types';

interface Props {
  logs: AuditoriaLog[];
}

export function Auditoria({ logs }: Props) {
  return (
    <div className="p-4 pb-20 animate-in fade-in duration-300">
      <h2 className="text-xl font-black text-white mb-6 flex gap-2 items-center"><ShieldAlert className="text-orange-500"/> Auditoria</h2>
      {logs.length === 0 ? (
        <div className="text-center p-8 bg-gray-900 rounded-2xl border border-gray-800"><ShieldAlert size={32} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm font-medium">Sem registos.</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.slice(0, 50).map(log => (
            <div key={log.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{log.acao}</span><span className="text-[9px] text-gray-500 font-bold uppercase">{log.data} às {log.hora}</span></div>
              <p className="text-sm text-gray-300 font-medium mt-1 leading-relaxed">{log.detalhe}</p>
              <span className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-black">Autor: <span className="text-white">{log.autor}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
