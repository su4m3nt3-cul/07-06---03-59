import React, { useMemo, useState, useRef } from 'react';
import { Activity, Calendar as CalendarIcon, Crown, CreditCard, Landmark, Coins, ChevronLeft, ChevronRight, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';
import { Transacao } from '../types';
import { formatarDinheiro } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface Props {
  transacoes: Transacao[];
  contaNegocio: string;
  mostrarAlerta: (titulo: string, msg: string) => void;
}

export function RelatoriosInteligentes({ transacoes, contaNegocio, mostrarAlerta }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);
  const [exportandoCSV, setExportandoCSV] = useState(false);
  const [offsetSemanas, setOffsetSemanas] = useState(0);

  const exportarPDF = async () => {
    setExportando(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Cabeçalho
      doc.setFillColor(25, 25, 25);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO EMPRESARIAL - EGMAN PLAY', 15, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Conta: ${contaNegocio.replace(/_/g, '.')}`, 15, 33);
      doc.text(`Data de Geração: ${new Date().toLocaleString('pt-AO')}`, pageWidth - 15, 33, { align: 'right' });

      // KPIs MENSAL (PRIORIDADE)
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(16);
      doc.text(`DESEMPENHO MENSAL (${new Date().toLocaleString('pt-AO', { month: 'long' }).toUpperCase()})`, 15, 55);
      
      const tendenciaMsg = analise.lucroMes > analise.lucroMesAnterior ? "CRESCIMENTO POSITIVO" : 
                         analise.lucroMes < analise.lucroMesAnterior ? "QUEDA DE RENDIMENTO" : "ESTÁVEL";

      autoTable(doc, {
        startY: 60,
        head: [['Métrica Mensal', 'Valor']],
        body: [
          ['Faturamento Total (Mês)', formatarDinheiro(analise.faturadoMes)],
          ['Despesas Totais (Mês)', formatarDinheiro(analise.despesasMes)],
          ['Lucro Mensal Líquido', formatarDinheiro(analise.lucroMes)],
          ['Média Diária Estimada', formatarDinheiro(analise.faturadoMes / 30)],
          ['Tendência de Crescimento', tendenciaMsg]
        ],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 11 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.row.index === 0) data.cell.styles.textColor = [16, 185, 129]; // Verde para faturamento
            if (data.row.index === 1) data.cell.styles.textColor = [239, 68, 68];  // Vermelho para despesas
            if (data.row.index === 2) data.cell.styles.textColor = data.cell.text[0].includes('-') ? [239, 68, 68] : [16, 185, 129];
            if (data.row.index === 4) data.cell.styles.textColor = tendenciaMsg.includes('CRESCIMENTO') ? [16, 185, 129] : [239, 68, 68];
          }
        }
      });

      // NOVO: DESEMPENHO ANUAL
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(14);
      doc.text(`DESEMPENHO ANUAL (${new Date().getFullYear()})`, 15, (doc as any).lastAutoTable.finalY + 15);

      const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const corpoAnual = analise.dadosAnuais.map(m => [
        mesesNomes[m.mes],
        formatarDinheiro(m.entrada),
        formatarDinheiro(m.despesa),
        formatarDinheiro(m.lucro)
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Mês', 'Receitas', 'Despesas', 'Lucro']],
        body: corpoAnual,
        theme: 'grid',
        headStyles: { fillColor: [31, 41, 55] },
        styles: { fontSize: 9 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.column.index === 1) data.cell.styles.textColor = [16, 185, 129]; // Verde Receita
            if (data.column.index === 2) data.cell.styles.textColor = [239, 68, 68];  // Vermelho Despesa
            if (data.column.index === 3) {
              const valor = data.cell.text[0];
              data.cell.styles.textColor = valor.includes('-') ? [239, 68, 68] : [59, 130, 246]; // Azul Lucro
            }
          }
        }
      });

      // ESTATÍSTICAS ANUAIS CONSOLIDADAS
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('RESUMO FINANCEIRO ANUAL CORRENTE', 15, (doc as any).lastAutoTable.finalY + 12);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Total Receita Anual', 'Total Despesa Anual', 'Lucro Líquido Anual']],
        body: [[
           formatarDinheiro(analise.totaisAnuais.entrada),
           formatarDinheiro(analise.totaisAnuais.despesa),
           formatarDinheiro(analise.totaisAnuais.lucro)
        ]],
        theme: 'plain',
        styles: { fontSize: 10, fontStyle: 'bold', halign: 'center' },
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] }
      });

      // NOVO: DETALHAMENTO DE DESPESAS POR CATEGORIA
      doc.addPage();
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(16);
      doc.text('ANÁLISE DE CUSTOS POR CATEGORIA', 15, 20);

      const dadosCategorias = (Object.entries(analise.despesasPorCategoria) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => [
          cat, 
          formatarDinheiro(val), 
          `${((val / (analise.despesasTotais || 1)) * 100).toFixed(1)}%`
        ]);

      autoTable(doc, {
        startY: 25,
        head: [['Categoria de Despesa', 'Valor Total', '% do Custo Total']],
        body: dadosCategorias,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 10 }
      });

      // KPIs GERAIS
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text('ESTATÍSTICAS GERAIS (HISTÓRICO ACUMULADO)', 15, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 18,
        head: [['Métrica', 'Valor']],
        body: [
          ['Lucro Total Acumulado', formatarDinheiro(analise.lucro)],
          ['Entradas Totais', formatarDinheiro(analise.entradasTotais)],
          ['Despesas Totais', formatarDinheiro(analise.despesasTotais)],
          ['Método Mais Usado', analise.metodoVencedor || 'Nenhum'],
          ['Total de Operações', transacoes.length.toString()]
        ],
        theme: 'grid',
        headStyles: { fillColor: [31, 41, 55] }
      });

      // Gráfico
      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, { 
            backgroundColor: '#0a0f16',
            scale: 2,
            logging: false,
            useCORS: true
          });
          const imgData = canvas.toDataURL('image/png');
          doc.addPage();
          doc.setFontSize(14);
          doc.setTextColor(249, 115, 22);
          doc.text('ANÁLISE GRÁFICA DE ONDAS (SEMANAL)', 15, 20);
          doc.addImage(imgData, 'PNG', 15, 30, pageWidth - 30, 80);
          
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text('* O gráfico acima representa a volatilidade das últimas transações registadas.', 15, 115);
        } catch (chartErr) {
          console.error("Erro ao capturar gráfico:", chartErr);
        }
      }

      // Estatísticas por Método
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('FLUXO POR MÉTODO DE PAGAMENTO', 15, (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 15 : 130);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 20 : 135,
        head: [['Método', 'Total Faturado', 'Qtd. Operações']],
        body: Object.entries(analise.statsMetodos).map(([m, s]: [string, any]) => [
          m, formatarDinheiro(s.total), s.count.toString()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [31, 41, 55] }
      });

      // Detalhamento de Transações (Todas)
      doc.addPage();
      doc.setFontSize(14);
      doc.text('HISTÓRICO COMPLETO DE TRANSAÇÕES', 15, 20);
      
      const transacoesFormatadas = transacoes
        .sort((a, b) => b.data.localeCompare(a.data))
        .map(t => [
          new Date(t.data).toLocaleDateString('pt-AO'),
          t.tipo.toUpperCase(),
          t.descricao,
          t.metodo || '-',
          formatarDinheiro(t.valor)
        ]);

      autoTable(doc, {
        startY: 25,
        head: [['Data', 'Tipo', 'Descrição', 'Método', 'Valor']],
        body: transacoesFormatadas,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [249, 115, 22] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const tipo = data.cell.text[0];
            if (tipo === 'ENTRADA') data.cell.styles.textColor = [16, 185, 129];
            if (tipo === 'SAÍDA') data.cell.styles.textColor = [239, 68, 68];
          }
          if (data.section === 'body' && data.column.index === 4) {
            const tipoRow = data.row.cells[1].text[0];
            if (tipoRow === 'ENTRADA') data.cell.styles.textColor = [16, 185, 129];
            if (tipoRow === 'SAÍDA') data.cell.styles.textColor = [239, 68, 68];
          }
        }
      });

      // Rodapé em todas as páginas
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('GERADO POR EGMAN PLAY MANAGER - SISTEMA DE GESTÃO PROFISSIONAL', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`Relatorio_EgmanPlay_${new Date().toISOString().split('T')[0]}.pdf`);
      mostrarAlerta("Relatório Gerado", "O PDF foi gerado com sucesso pelo EGMAN PLAY MANAGER.");
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Ocorreu um erro ao gerar o relatório.");
    } finally {
      setExportando(false);
    }
  };

  const exportarCSV = () => {
    setExportandoCSV(true);
    try {
      const headers = ['Data', 'Tipo', 'Categoria', 'Descricao', 'Metodo', 'Valor (AKZ)'];
      const rows = transacoes
        .sort((a, b) => b.data.localeCompare(a.data))
        .map(t => [
          new Date(t.data).toLocaleDateString('pt-AO'),
          t.tipo.toUpperCase(),
          t.categoria,
          `"${t.descricao.replace(/"/g, '""')}"`,
          t.metodo || '-',
          t.valor
        ]);

      // Excel prefere ; em regiões de língua portuguesa e o BOM (Byte Order Mark) ajuda na codificação UTF-8
      const bom = '\uFEFF';
      const csvContent = bom + [
        headers.join(';'),
        ...rows.map(e => e.join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Dados_EgmanPlay_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      mostrarAlerta("Exportação Excel", "Os dados foram exportados para CSV com sucesso.");
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Falha na exportação Excel.");
    } finally {
      setExportandoCSV(false);
    }
  };

  const getWeekRange = (offset: number) => {
    const hoje = new Date();
    const diaAtual = hoje.getDay(); // 0 (Dom) a 6 (Sáb)
    const diff = hoje.getDate() - diaAtual + (offset * 7);
    const inicio = new Date(hoje.setDate(diff));
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim };
  };

  const { inicioSemana, fimSemana, inicioSemanaAnterior, fimSemanaAnterior } = useMemo(() => {
    const { inicio, fim } = getWeekRange(offsetSemanas);
    const prev = getWeekRange(offsetSemanas - 1);
    return { 
      inicioSemana: inicio, 
      fimSemana: fim,
      inicioSemanaAnterior: prev.inicio,
      fimSemanaAnterior: prev.fim
    };
  }, [offsetSemanas]);

  const analise = useMemo(() => {
    let entradasTotais = 0, despesasTotais = 0, entradasCount = 0;
    const dias: Record<number, string> = { 0:'Dom', 1:'Seg', 2:'Ter', 3:'Qua', 4:'Qui', 5:'Sex', 6:'Sáb' };
    
    // Lucro por dia da semana SELECIONADA
    const lucroPorDiaSemana: Record<string, number> = { Dom:0, Seg:0, Ter:0, Qua:0, Qui:0, Sex:0, Sáb:0 };
    let faturadoSemana = 0;
    let faturadoSemanaAnterior = 0;
    
    // Novos contadores mensais
    let faturadoMes = 0;
    let despesasMes = 0;
    let faturadoMesAnterior = 0;
    let despesasMesAnterior = 0;

    // Novo: Dados Anuais
    const dadosAnuais = Array.from({ length: 12 }, (_, i) => ({ mes: i, entrada: 0, despesa: 0, lucro: 0 }));

    const statsMetodos: Record<string, { total: number, count: number }> = { 
      Dinheiro: { total: 0, count: 0 }, 
      Multicaixa: { total: 0, count: 0 }, 
      Transferência: { total: 0, count: 0 } 
    };

    // Para encontrar a melhor semana
    const lucroPorSemana: Record<string, number> = {};

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    // Contadores de categoria
    const despesasPorCategoria: Record<string, number> = {};
    const receitasPorCategoria: Record<string, number> = {};

    transacoes.forEach(t => {
      const parts = t.data.split('-');
      if (parts.length !== 3) return;
      
      const tAno = parseInt(parts[0]);
      const tMes = parseInt(parts[1]) - 1; // 0-indexed
      const tDiaNum = parseInt(parts[2]);

      const dataDoc = new Date(tAno, tMes, tDiaNum, 12, 0, 0); // Safe local date at noon
      const diaDaSemana = dataDoc.getDay();
      const isEntrada = t.tipo === 'entrada';

      // Agrupamento por categoria
      if (isEntrada) {
        receitasPorCategoria[t.categoria] = (receitasPorCategoria[t.categoria] || 0) + t.valor;
      } else {
        despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + t.valor;
      }

      // Estatísticas Mensais
      if (tMes === mesAtual && tAno === anoAtual) {
        if (isEntrada) faturadoMes += t.valor;
        else despesasMes += t.valor;
      }

      if (tMes === mesAnterior && tAno === anoAnterior) {
        if (isEntrada) faturadoMesAnterior += t.valor;
        else despesasMesAnterior += t.valor;
      }

      // NOVO: Cálculo Anual
      if (tAno === anoAtual) {
        if (isEntrada) dadosAnuais[tMes].entrada += t.valor;
        else dadosAnuais[tMes].despesa += t.valor;
      }
      
      // Cálculo de melhor semana (usamos o início da semana como chave)
      const d = new Date(tAno, tMes, tDiaNum, 12, 0, 0);
      const diff = d.getDate() - d.getDay();
      const startOfWeekDate = new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0);
      const startOfWeek = startOfWeekDate.toISOString().split('T')[0];
      
      if (isEntrada) {
        lucroPorSemana[startOfWeek] = (lucroPorSemana[startOfWeek] || 0) + t.valor;
      }

      // Estatísticas gerais
      if (isEntrada) { 
         entradasTotais += t.valor; 
         entradasCount++;
         const m = t.metodo || 'Dinheiro';
         if (!statsMetodos[m]) statsMetodos[m] = { total: 0, count: 0 };
         statsMetodos[m].total += t.valor; 
         statsMetodos[m].count += 1;
      } else { 
         despesasTotais += t.valor; 
      }

      // Filtro para a semana selecionada (Gráfico)
      if (dataDoc >= inicioSemana && dataDoc <= fimSemana) {
        if (isEntrada) {
          lucroPorDiaSemana[dias[diaDaSemana]] += t.valor;
          faturadoSemana += t.valor;
        } else {
          lucroPorDiaSemana[dias[diaDaSemana]] -= t.valor;
        }
      }

      // Filtro para a semana ANTERIOR (Comparativo de Tendência)
      if (dataDoc >= inicioSemanaAnterior && dataDoc <= fimSemanaAnterior) {
        if (isEntrada) {
          faturadoSemanaAnterior += t.valor;
        }
      }
    });

    const lucro = entradasTotais - despesasTotais;
    
    // Melhor dia da SEMANA SELECIONADA
    let melhorDia = 'Nenhum', maxL = -Infinity;
    for (let dia in lucroPorDiaSemana) { 
      if (lucroPorDiaSemana[dia] > maxL) { 
        maxL = lucroPorDiaSemana[dia]; 
        melhorDia = dia; 
      } 
    }

    // Melhor semana de SEMPRE
    let melhorSemanaValor = 0;
    let melhorSemanaData = 'N/A';
    Object.entries(lucroPorSemana).forEach(([data, valor]) => {
      if (valor > melhorSemanaValor) {
        melhorSemanaValor = valor;
        melhorSemanaData = data;
      }
    });

    // Cálculo da Tendência
    let tendenciaLabel = 'Estável';
    if (faturadoSemanaAnterior > 0) {
      const diff = ((faturadoSemana - faturadoSemanaAnterior) / faturadoSemanaAnterior) * 100;
      if (diff > 5) tendenciaLabel = `Crescimento (${Math.abs(diff).toFixed(0)}%)`;
      else if (diff < -5) tendenciaLabel = `Queda (${Math.abs(diff).toFixed(0)}%)`;
    } else if (faturadoSemana > 0) {
      tendenciaLabel = 'Novo Fluxo';
    }

    const metodosOrdenados = Object.entries(statsMetodos).sort((a, b) => b[1].count - a[1].count);
    const metodoVencedor = metodosOrdenados.length > 0 && metodosOrdenados[0][1].count > 0 ? metodosOrdenados[0][0] : null;
    
    // Finalização dados anuais
    const totaisAnuais = dadosAnuais.reduce((acc, curr) => {
      curr.lucro = curr.entrada - curr.despesa;
      return {
        entrada: acc.entrada + curr.entrada,
        despesa: acc.despesa + curr.despesa,
        lucro: acc.lucro + curr.lucro
      };
    }, { entrada: 0, despesa: 0, lucro: 0 });

    return { 
      lucro, entradasTotais, despesasTotais, 
      lucroPorDiaSemana, melhorDia, maxL, 
      statsMetodos, metodoVencedor, 
      faturadoSemana,
      faturadoMes,
      despesasMes,
      lucroMes: faturadoMes - despesasMes,
      faturadoMesAnterior,
      despesasMesAnterior,
      lucroMesAnterior: faturadoMesAnterior - despesasMesAnterior,
      dadosAnuais,
      totaisAnuais,
      receitasPorCategoria,
      despesasPorCategoria,
      melhorSemanaData,
      melhorSemanaValor,
      tendenciaLabel
    };
  }, [transacoes, inicioSemana, fimSemana, inicioSemanaAnterior, fimSemanaAnterior]);

  const getMetodoIcon = (m: string) => {
    if (m === 'Multicaixa') return <CreditCard size={18} />;
    if (m === 'Transferência') return <Landmark size={18} />;
    return <Coins size={18} />;
  };
  
  const diasChaves = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const maxGrafico = Math.max(...(Object.values(analise.lucroPorDiaSemana) as number[]), 100) * 1.3;
  const minGrafico = Math.min(...(Object.values(analise.lucroPorDiaSemana) as number[]), 0) * 1.3;
  const range = maxGrafico - minGrafico || 1;

  const pontosSVG = diasChaves.map((dia, index) => {
    const val = analise.lucroPorDiaSemana[dia];
    const x = (index / 6) * 100;
    const y = 85 - ((val - minGrafico) / range) * 70; // Espaço para labels acima
    return { x, y, val, dia, index };
  });

  const smoothLine = pontosSVG.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 3;
    const cp2x = p.x - (p.x - prev.x) / 3;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${smoothLine} L 100 100 L 0 100 Z`;

  return (
    <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-300 pb-10">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-xl font-black tracking-widest text-white flex items-center gap-2"><Activity className="text-orange-500" /> Dashboard Pro</h2>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={exportarCSV} 
            disabled={exportandoCSV}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            {exportandoCSV ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet size={14} />
            )}
            Excel
          </button>

          <button 
            onClick={exportarPDF} 
            disabled={exportando}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            {exportando ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            PDF
          </button>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-5 rounded-2xl relative overflow-hidden shadow-xl">
         <div className="absolute -right-4 -top-4 opacity-10"><Landmark size={100}/></div>
         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Lucro Total Acumulado</p>
         <h3 className={`text-4xl font-black ${analise.lucro >= 0 ? 'text-orange-400' : 'text-red-400'}`}>{formatarDinheiro(analise.lucro)}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
            <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Entradas Totais</p>
            <p className="text-xl font-black text-white">{formatarDinheiro(analise.entradasTotais)}</p>
         </div>
         <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
            <p className="text-[10px] text-red-500 font-bold uppercase mb-1">Despesas Totais</p>
            <p className="text-xl font-black text-white">{formatarDinheiro(analise.despesasTotais)}</p>
         </div>
      </div>

      {/* PAINEL DE MÉTODOS DE PAGAMENTO */}
      <div className="mt-1">
        <h3 className="text-[10px] text-gray-500 font-bold uppercase mb-3 tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
          Fluxo por Método (Total Acumulado)
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {['Dinheiro', 'Multicaixa', 'Transferência'].map(m => {
            const isVencedor = m === analise.metodoVencedor;
            const stats = analise.statsMetodos[m] || { total: 0, count: 0 };
            
            return (
              <div key={m} className={`relative flex justify-between items-center bg-gray-900 p-4 rounded-2xl border transition-all duration-500 ${isVencedor ? 'border-orange-500/50 bg-gradient-to-r from-gray-900 to-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.05)]' : 'border-gray-800'}`}>
                {isVencedor && (
                  <div className="absolute -top-2 right-2 bg-orange-500 text-white p-1 rounded-lg shadow-lg rotate-3 flex items-center gap-1 px-2 border-2 border-gray-950 z-10">
                    <Crown size={10} fill="currentColor" />
                    <span className="text-[8px] font-black uppercase">Mais Usado</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isVencedor ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-400'}`}>
                    {getMetodoIcon(m)}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{m === 'Multicaixa' ? 'MTX EXPRESS' : m}</p>
                    <p className="text-base font-black text-white">{formatarDinheiro(stats.total)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[9px] text-gray-600 font-bold uppercase">Operações</p>
                  <p className={`text-sm font-black ${isVencedor ? 'text-orange-500' : 'text-gray-400'}`}>{stats.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><CalendarIcon size={14}/> Desempenho Semanal</h3>
            <div className="flex items-center gap-2">
               <button onClick={() => { setOffsetSemanas(prev => prev - 1); setDiaSelecionado(null); }} className="p-1.5 hover:bg-gray-800 text-gray-400 rounded-lg transition-colors"><ChevronLeft size={16}/></button>
               <span className="text-[10px] font-black text-white bg-gray-800 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {offsetSemanas === 0 ? 'Esta Semana' : offsetSemanas === -1 ? 'S. Passada' : `${Math.abs(offsetSemanas)} Semanas`}
               </span>
               <button onClick={() => { setOffsetSemanas(prev => prev + 1); setDiaSelecionado(null); }} className="p-1.5 hover:bg-gray-800 text-gray-400 rounded-lg transition-colors"><ChevronRight size={16}/></button>
            </div>
         </div>

         <div className="mb-6 flex flex-col items-center">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Faturado na Semana</p>
            <h4 className="text-2xl font-black text-white">{formatarDinheiro(analise.faturadoSemana)}</h4>
            <div className="flex items-center gap-1 text-[9px] text-orange-500 font-black mt-1">
               <TrendingUp size={10} />
               <span>{inicioSemana.toLocaleDateString('pt-AO', {day:'2-digit', month:'short'})} - {fimSemana.toLocaleDateString('pt-AO', {day:'2-digit', month:'short', year:'numeric'})}</span>
            </div>
         </div>

         <div ref={chartRef} className="h-44 w-full relative mb-4 bg-gray-950/40 rounded-xl p-4 border border-gray-800/50">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
               <defs>
                 <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                   <feGaussianBlur stdDeviation="2.5" result="blur" />
                   <feComposite in="SourceGraphic" in2="blur" operator="over" />
                 </filter>
                 <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                 </linearGradient>
               </defs>

               <path d={areaPath} fill="url(#waveGrad)" className="transition-all duration-700" />
               <path d={smoothLine} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" filter="url(#neonGlow)" className="transition-all duration-700" />
               
               {pontosSVG.map((p, i) => (
                 <g key={i} className="cursor-pointer" onClick={() => setDiaSelecionado(diaSelecionado === i ? null : i)}>
                    {/* Active target area */}
                    <rect x={p.x - 6} y="0" width="12" height="100" fill="transparent" />
                    
                    {/* Day Point */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={diaSelecionado === i ? "4.5" : "2"} 
                      fill={diaSelecionado === i ? "#f97316" : "#111827"} 
                      stroke="#f97316" 
                      strokeWidth="1.5" 
                      className="transition-all duration-300"
                    />
                    
                    {/* Value Label - Only shown on CLICK */}
                    {diaSelecionado === i && (
                      <g className="animate-in fade-in zoom-in-95 duration-200">
                        {/* Shadow line */}
                        <line x1={p.x} y1={p.y} x2={p.x} y2="100" stroke="#f97316" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.3" />
                        
                        {/* Tooltip Background */}
                        <rect x={p.x - 16} y={p.y - 18} width="32" height="12" rx="3" fill="#1f2937" stroke="#fb923c" strokeWidth="0.5" shadow-xl="true" />
                        <text x={p.x} y={p.y - 12} fontSize="5" fontWeight="900" fill="white" textAnchor="middle" dominantBaseline="middle">
                          {formatarDinheiro(p.val)}
                        </text>
                      </g>
                    )}
                 </g>
               ))}
            </svg>
            <div className="flex justify-between w-full text-[10px] text-gray-600 font-bold mt-4 px-1">
               {diasChaves.map((dia, idx) => (
                 <span key={dia} className={`${diaSelecionado === idx ? 'text-orange-500 scale-125' : ''} transition-all duration-300`}>{dia}</span>
               ))}
            </div>
         </div>
         <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-gray-800">
             <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Melhor Dia</p><p className="text-sm font-black text-emerald-400">{analise.melhorDia}</p></div>
             <div>
               <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Melhor Semana</p>
               <p className="text-[11px] font-black text-orange-400">
                 {formatarDinheiro(analise.melhorSemanaValor)}
                 {analise.melhorSemanaData !== 'N/A' && (
                   <span className="block text-[7px] text-gray-600 font-medium tracking-tight">
                     Início: {new Date(analise.melhorSemanaData + 'T12:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' })}
                   </span>
                 )}
               </p>
             </div>
             <div className="text-right">
               <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Tendência</p>
               <p className={`text-[10px] font-black uppercase tracking-tighter ${analise.tendenciaLabel.includes('Crescimento') ? 'text-emerald-500' : analise.tendenciaLabel.includes('Queda') ? 'text-red-500' : 'text-orange-400'}`}>
                 {analise.tendenciaLabel}
               </p>
             </div>
         </div>
      </div>
    </div>
  );
}
