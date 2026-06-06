export interface Lote {
  id_lote: number;
  produto: string;
  quantidade_kg: number;
  status_validade: 'Seguro' | 'Crítico' | 'Vencido';
}

export interface Auditoria {
  id_auditoria: number;
  id_lote_deletado: number;
  produto_deletado: string;
  quantidade_kg_deletada: number;
  data_remocao: string;
}

export interface SQLCommand {
  id: string;
  title: string;
  command: string;
  explanation: string;
  type: 'ddl' | 'dml' | 'trigger' | 'select' | 'test';
}
