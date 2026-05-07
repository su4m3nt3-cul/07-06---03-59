import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Definitions of functions the AI can call
export const AI_FUNCTIONS: FunctionDeclaration[] = [
  {
    name: "registarTransacao",
    description: "Regista uma nova entrada ou saída (despesa) no sistema.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tipo: { type: Type.STRING, enum: ["entrada", "saida"], description: "Tipo da transação" },
        valor: { type: Type.NUMBER, description: "Valor monetário da transação" },
        descricao: { type: Type.STRING, description: "Descrição opcional do que se trata" },
        categoria: { type: Type.STRING, description: "Categoria (ex: Tempo, Bebida, Snack, Despesa)" },
        metodo: { type: Type.STRING, enum: ["Dinheiro", "Multicaixa", "Transferência"], description: "Método de pagamento" }
      },
      required: ["tipo", "valor", "descricao", "categoria", "metodo"]
    }
  },
  {
    name: "alterarConfiguracao",
    description: "Altera as configurações do sistema como preço por hora ou estado do sistema.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        precoHora: { type: Type.NUMBER, description: "Novo preço por hora" },
        sistemaAberto: { type: Type.BOOLEAN, description: "Define se o sistema está aberto ou fechado" }
      }
    }
  },
  {
    name: "bloquearFuncionario",
    description: "Bloqueia ou desbloqueia um funcionário pelo ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID do funcionário" },
        ativo: { type: Type.BOOLEAN, description: "Estado pretendido (true para ativo, false para bloqueado)" }
      },
      required: ["id", "ativo"]
    }
  }
];

export const getSystemIntelligence = async (appState: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analisa os seguintes dados do sistema EGMAN PLAY e fornece 3 recomendações curtas e diretas em formato JSON.
        Dados: ${JSON.stringify(appState)}
        
        O JSON deve ser um array de strings chamado "recomendas".
        Exemplos de tom: "Sábado é o dia com mais lucro", "A Máquina 3 está a ser pouco rentável", "O Funcionário X é o que mais faturou esta semana".
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recomendas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text).recomendas;
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};

export const chatWithManager = async (message: string, appState: any, history: any[] = []) => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    És o EGMAN MANAGER IA, o assistente inteligente oficial do sistema EGMAN PLAY.
    Tens acesso total aos dados (Transações, Máquinas, Funcionários, Sessões).
    Objetivo: Ajudar o administrador a gerir a empresa, dar insights e EXECUTAR ações através das ferramentas disponíveis.
    
    DADOS ATUAIS: ${JSON.stringify(appState)}
    
    Regras:
    1. Se o utilizador pedir para registar algo (ex: "vendi uma coca-cola por 500 em dinheiro"), usa a função 'registarTransacao'.
    2. Dá sempre uma resposta textual explicativa curta.
    3. NÃO USES ASTERISCOS (*) OU FORMATAÇÃO MARKDOWN NO TEXTO. Escreve de forma limpa e natural.
    4. Sê profissional, direto e focado no crescimento do negócio.
    5. Podes prever lucros e tendências com base nas transações fornecidas.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history,
      { parts: [{ text: message }] }
    ],
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: AI_FUNCTIONS }]
    }
  });

  return response;
};
