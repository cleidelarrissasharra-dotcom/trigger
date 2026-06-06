import { Lote, SQLCommand } from '../types';

export const INITIAL_LOTES: Lote[] = [
  { id_lote: 1, produto: 'Tomate Cereja Higienizado', quantidade_kg: 45.50, status_validade: 'Seguro' },
  { id_lote: 2, produto: 'Abacaxi Picado Pote', quantidade_kg: 20.00, status_validade: 'Crítico' },
  { id_lote: 3, produto: 'Mamão Formosa Inteiro', quantidade_kg: 80.00, status_validade: 'Seguro' },
  { id_lote: 4, produto: 'Rúcula Hidropônica Maço', quantidade_kg: 15.20, status_validade: 'Vencido' },
  { id_lote: 5, produto: 'Morango Especial Caixa', quantidade_kg: 12.40, status_validade: 'Crítico' }
];

export const SQL_STEPS: SQLCommand[] = [
  {
    id: 'step-1',
    title: '1. Criação da Base de Dados e Tabela de Estoque',
    command: `CREATE DATABASE IF NOT EXISTS db_qualiflv_automacao;
USE db_qualiflv_automacao;

CREATE TABLE lotes_estoque (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    produto VARCHAR(100) NOT NULL,
    quantidade_kg DECIMAL(10, 2) NOT NULL,
    status_validade VARCHAR(20) NOT NULL
);`,
    explanation: 'Cria o banco de dados e a tabela principal de lotes para controle de estoque FLV (Frutas, Legumes e Verduras).',
    type: 'ddl'
  },
  {
    id: 'step-2',
    title: '2. Criação da Tabela de Auditoria de Descartes',
    command: `CREATE TABLE auditoria_descartes (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    id_lote_deletado INT,
    produto_deletado VARCHAR(100),
    quantidade_kg_deletada DECIMAL(10, 2),
    data_remocao DATETIME
);`,
    explanation: 'Esta tabela armazenará o histórico de todas os lotes removidos/descartados por motivos de qualidade ou validade.',
    type: 'ddl'
  },
  {
    id: 'step-3',
    title: '3. Criação do TRIGGER (Gatilho para DELETE)',
    command: `DELIMITER $$

CREATE TRIGGER tg_apos_deletar_lote
AFTER DELETE ON lotes_estoque
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_descartes (id_lote_deletado, produto_deletado, quantidade_kg_deletada, data_remocao)
    VALUES (OLD.id_lote, OLD.produto, OLD.quantidade_kg, NOW());
END$$

DELIMITER ;`,
    explanation: 'O gatilho (Trigger) é ativado automaticamente APÓS (AFTER) qualquer comando DELETE na tabela "lotes_estoque". O modificador "OLD" é usado para capturar as informações da linha que está sendo removida do banco, registrando tudo na auditoria com a data e hora exatas.',
    type: 'trigger'
  },
  {
    id: 'step-4',
    title: '4. Inserindo Dados com Diferentes Status',
    command: `INSERT INTO lotes_estoque (produto, quantidade_kg, status_validade) VALUES 
('Tomate Cereja Higienizado', 45.50, 'Seguro'),
('Abacaxi Picado Pote', 20.00, 'Crítico');`,
    explanation: 'Insere os primeiros lotes de teste no sistema. O lote do Abacaxi está com status "Crítico" (próximo do vencimento) e precisará ser descartado.',
    type: 'dml'
  },
  {
    id: 'step-5',
    title: '5. Simulando o Descarte do Abacaxi (DELETE)',
    command: `DELETE FROM lotes_estoque WHERE id_lote = 2;`,
    explanation: 'Simula a remoção física do lote crítico do estoque. Esta instrução dispara automaticamente o nosso Trigger interligando as tabelas.',
    type: 'dml'
  },
  {
    id: 'step-6',
    title: '6. Verificação do Resultado (SELECT)',
    command: `SELECT * FROM lotes_estoque;
SELECT * FROM auditoria_descartes;`,
    explanation: 'Ao consultar as duas tabelas, vemos que o lote do abacaxi sumiu da tabela de estoque e um registro correspondente foi gravado automaticamente na auditoria de descartes, sem a necessidade de uma segunda instrução de inserção manual!',
    type: 'select'
  }
];
