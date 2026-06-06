import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Trash2, 
  Plus, 
  Play, 
  RotateCcw, 
  Code, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookOpen, 
  Sparkles, 
  Terminal, 
  ArrowRight,
  TrendingDown,
  Activity,
  Layers,
  HelpCircle,
  Award
} from 'lucide-react';
import { Lote, Auditoria, SQLCommand } from '../types';
import { INITIAL_LOTES, SQL_STEPS } from '../data/initialData';

export default function TriggerSimulator() {
  // DB State
  const [dbCreated, setDbCreated] = useState<boolean>(false);
  const [lotesTableCreated, setLotesTableCreated] = useState<boolean>(false);
  const [auditoriaTableCreated, setAuditoriaTableCreated] = useState<boolean>(false);
  const [triggerCreated, setTriggerCreated] = useState<boolean>(false);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);

  // Simulation State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'Servidor de Banco de Dados MySQL iniciado na porta 3306.',
    'Aguardando comandos DDL/DML para inicializar...'
  ]);
  const [activeTab, setActiveTab] = useState<'visual' | 'code-expl' | 'guide'>('visual');

  // Trigger Animation Triggering State
  const [triggeredBatch, setTriggeredBatch] = useState<Lote | null>(null);
  const [triggerPhase, setTriggerPhase] = useState<'idle' | 'deleting' | 'firing' | 'inserting'>('idle');

  // Custom Batch Input State
  const [customProduto, setCustomProduto] = useState<string>('');
  const [customKg, setCustomKg] = useState<number>(25.0);
  const [customValidade, setCustomValidade] = useState<'Seguro' | 'Crítico' | 'Vencido'>('Seguro');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);

  // Sound Synth Helper
  const playSound = (type: 'click' | 'delete' | 'success' | 'create' | 'trigger') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1 / 1000);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'delete') {
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'create') {
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2); // A4
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'trigger') {
        // Futuristic double pulse
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
        osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Ignora erro de áudio
    }
  };

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setConsoleLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  };

  // Run a specific step of the SQL guide
  const executeStep = (stepIdx: number) => {
    if (stepIdx < 0 || stepIdx >= SQL_STEPS.length) return;
    playSound('click');

    const step = SQL_STEPS[stepIdx];
    addLog(`mysql> Executando comando ${stepIdx + 1}: ${step.title}`);

    switch (stepIdx) {
      case 0: // CREATE DATABASE & TABLE lotes_estoque
        setDbCreated(true);
        setLotesTableCreated(true);
        addLog('Database "db_qualiflv_automacao" criada com sucesso.');
        addLog('Tabela "lotes_estoque" criada com colunas: id_lote, produto, quantidade_kg, status_validade.');
        playSound('success');
        break;

      case 1: // CREATE TABLE auditoria_descartes
        if (!dbCreated) {
          addLog('ERRO: Banco de dados não selecionado/criado! Execute o Passo 1 primeiro.');
          playSound('delete');
          return;
        }
        setAuditoriaTableCreated(true);
        addLog('Tabela "auditoria_descartes" criada com colunas: id_auditoria, id_lote_deletado, produto_deletado, quantidade_kg_deletada, data_remocao.');
        playSound('success');
        break;

      case 2: // CREATE TRIGGER
        if (!lotesTableCreated || !auditoriaTableCreated) {
          addLog('ERRO: Tabelas "lotes_estoque" e/ou "auditoria_descartes" não existem. Crie as tabelas primeiro!');
          playSound('delete');
          return;
        }
        setTriggerCreated(true);
        addLog('TRIGGER "tg_apos_deletar_lote" registrado com sucesso! Monitorando eventos "AFTER DELETE" em "lotes_estoque".');
        playSound('success');
        break;

      case 3: // INSERT DATA
        if (!lotesTableCreated) {
          addLog('ERRO: Tabela "lotes_estoque" não existe.');
          playSound('delete');
          return;
        }
        // Inserir os dois primeiros lotes da carga inicial
        setLotes(prev => {
          // Evitar duplicados se já existirem
          const clean = prev.filter(l => l.id_lote !== 1 && l.id_lote !== 2);
          return [
            ...clean,
            INITIAL_LOTES[0], // Tomate
            INITIAL_LOTES[1]  // Abacaxi
          ].sort((a, b) => a.id_lote - b.id_lote);
        });
        addLog('2 registros inseridos na tabela "lotes_estoque".');
        addLog('Lote 1: Tomate Cereja Higienizado (45.50 kg) - Seguro');
        addLog('Lote 2: Abacaxi Picado Pote (20.00 kg) - Crítico');
        playSound('create');
        break;

      case 4: // DELETE Abacaxi
        if (!lotesTableCreated) {
          addLog('ERRO: Tabela "lotes_estoque" não existe.');
          playSound('delete');
          return;
        }
        const findAbacaxi = lotes.find(l => l.id_lote === 2);
        if (!findAbacaxi) {
          addLog('AVISO: Lote com id_lote = 2 (Abacaxi Picado Pote) não encontrado para exclusão! Adicione-o ou use outro.');
          playSound('delete');
          return;
        }
        // Disparar o fluxo do Trigger!
        triggerDeleteFlow(2);
        break;

      case 5: // SELECT *
        addLog(`mysql> SELECT * FROM lotes_estoque;`);
        addLog(`Retornados ${lotes.length} registro(s) da tabela de estoque.`);
        addLog(`mysql> SELECT * FROM auditoria_descartes;`);
        addLog(`Retornados ${auditoria.length} registro(s) da tabela de auditoria.`);
        playSound('success');
        break;
    }

    if (stepIdx === currentStepIndex) {
      setCurrentStepIndex(prev => Math.min(prev + 1, SQL_STEPS.length - 1));
    }
  };

  // Run full script at once to jump to fully active system
  const runFullScript = () => {
    playSound('success');
    setDbCreated(true);
    setLotesTableCreated(true);
    setAuditoriaTableCreated(true);
    setTriggerCreated(true);
    
    // Alimenta todos os lotes iniciais
    setLotes(INITIAL_LOTES);
    setAuditoria([]);
    
    setCurrentStepIndex(SQL_STEPS.length - 1);
    
    setConsoleLogs([]);
    addLog('mysql> EXECUTANDO SCRIPT SQL AUTOMATIZADO COMPLETO...');
    addLog('Database "db_qualiflv_automacao" inicializada.');
    addLog('Tabela "lotes_estoque" criada com sucesso.');
    addLog('Tabela "auditoria_descartes" criada com sucesso.');
    addLog('TRIGGER "tg_apos_deletar_lote" registrado e monitorando descartes.');
    addLog('Dados de estoque iniciais carregados (5 lotes FLV cadastrados).');
    addLog('Prontinho! Você pode excluir qualquer lote para ver o Trigger disparar.');
  };

  const resetAll = () => {
    playSound('delete');
    setDbCreated(false);
    setLotesTableCreated(false);
    setAuditoriaTableCreated(false);
    setTriggerCreated(false);
    setLotes([]);
    setAuditoria([]);
    setCurrentStepIndex(0);
    setConsoleLogs([
      'Servidor de Banco de Dados MySQL resetado.',
      'Aguardando inicialização dos comandos...'
    ]);
    addLog('Estado limpo. Tabelas e Triggers removidos (DROP DATABASE db_qualiflv_automacao).');
  };

  // Trigger Action Processing
  const triggerDeleteFlow = (idLote: number) => {
    const target = lotes.find(l => l.id_lote === idLote);
    if (!target) return;

    playSound('delete');
    setTriggeredBatch(target);
    setTriggerPhase('deleting');
    addLog(`mysql> DELETE FROM lotes_estoque WHERE id_lote = ${idLote};`);
    addLog(`Removendo fisicamente lote do estoque (ID: ${idLote}, Produto: ${target.produto}).`);

    // In step 2, we simulate delete:
    setTimeout(() => {
      if (triggerCreated && auditoriaTableCreated) {
        setTriggerPhase('firing');
        playSound('trigger');
        addLog(`⚡ TRIGGER DISPARADO: AFTER DELETE ON lotes_estoque`);
        addLog(`Instrução interna disparada pelo Trigger:`);
        addLog(`INSERT INTO auditoria_descartes(id_lote_deletado, produto_deletado, quantidade_kg_deletada, data_remocao) VALUES (${target.id_lote}, "${target.produto}", ${target.quantidade_kg.toFixed(2)}, NOW());`);

        setTimeout(() => {
          setTriggerPhase('inserting');
          setLotes(prev => prev.filter(l => l.id_lote !== idLote));
          
          const newAuditoriaRecord: Auditoria = {
            id_auditoria: auditoria.length > 0 ? Math.max(...auditoria.map(a => a.id_auditoria)) + 1 : 1,
            id_lote_deletado: target.id_lote,
            produto_deletado: target.produto,
            quantidade_kg_deletada: target.quantidade_kg,
            data_remocao: new Date().toISOString()
          };

          setAuditoria(prev => [newAuditoriaRecord, ...prev]);
          addLog(`✔ Auditoria salva com sucesso! ID Registro de Auditoria: ${newAuditoriaRecord.id_auditoria}`);
          playSound('success');

          setTimeout(() => {
            setTriggerPhase('idle');
            setTriggeredBatch(null);
          }, 800);

        }, 1200);
      } else {
        // No trigger installed! Just delete!
        setLotes(prev => prev.filter(l => l.id_lote !== idLote));
        addLog(`Lote removido do estoque. Nenhuma auditoria registrada porque o TRIGGER não foi criado ainda!`);
        playSound('success');
        setTriggerPhase('idle');
        setTriggeredBatch(null);
      }
    }, 850);
  };

  // Custom Item Submission
  const handleAddCustomLote = (e: FormEvent) => {
    e.preventDefault();
    if (!customProduto.trim()) return;

    if (!lotesTableCreated) {
      addLog('ERRO: Não é possível inserir registros. A tabela "lotes_estoque" não existe ainda!');
      playSound('delete');
      return;
    }

    const nextId = lotes.length > 0 ? Math.max(...lotes.map(l => l.id_lote)) + 1 : 1;
    const newLote: Lote = {
      id_lote: nextId,
      produto: customProduto.trim(),
      quantidade_kg: Number(customKg),
      status_validade: customValidade
    };

    setLotes(prev => [...prev, newLote]);
    addLog(`mysql> INSERT INTO lotes_estoque (produto, quantidade_kg, status_validade) VALUES ("${newLote.produto}", ${newLote.quantidade_kg.toFixed(2)}, "${newLote.status_validade}");`);
    addLog(`Registro adicionado com sucesso! Lote ID: ${nextId}`);
    
    playSound('create');

    // Reset Form
    setCustomProduto('');
    setCustomKg(25.0);
    setCustomValidade('Seguro');
    setIsAddingCustom(false);
  };

  // Calculate stats
  const totalStockKg = lotes.reduce((sum, l) => sum + l.quantidade_kg, 0);
  const criticalCount = lotes.filter(l => l.status_validade === 'Crítico' || l.status_validade === 'Vencido').length;
  const totalDiscardedRecords = auditoria.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Upper Brand Nav */}
      <header className="bg-emerald-950 text-white shadow-md border-b border-emerald-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/30 flex items-center justify-center">
              <Database className="h-6 w-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs tracking-widest font-mono font-semibold text-emerald-400 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700/35 uppercase">
                  QualiFLV Automação
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans mt-0.5">
                Simulador Interativo de SQL Triggers
              </h1>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button 
              onClick={runFullScript}
              className="lg:px-4 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 transition text-emerald-950 font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-900/10"
              id="btn-run-full"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Executar Tudo (Completo)
            </button>
            <button 
              onClick={resetAll}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer border border-slate-700"
              id="btn-reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar DB
            </button>
          </div>
        </div>
      </header>

      {/* Main Stats Header */}
      <div className="bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Estado do DB</p>
              <p className="text-sm font-bold text-slate-800">
                {!dbCreated ? (
                  <span className="text-slate-400">Não Inicializado</span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    db_qualiflv <CheckCircle2 className="h-3.5 w-3.5 inline text-emerald-600" />
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Total Estoque</p>
              <p className="text-sm font-mono font-bold text-slate-800">
                {lotesTableCreated ? `${totalStockKg.toFixed(2)} kg` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Atenção (FLV)</p>
              <p className="text-sm font-bold text-slate-800">
                {lotesTableCreated ? (
                  <span className={criticalCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                    {criticalCount} lotes críticos / vencidos
                  </span>
                ) : (
                  'N/A'
                )}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Trigger de Auditoria</p>
              <p className="text-sm font-bold flex items-center gap-1">
                {triggerCreated ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    Ativo <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  </span>
                ) : (
                  <span className="text-amber-500 font-semibold">Não registrado</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: SQL Step Guide, Code, explanations (4 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Navigation Tab */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex gap-1">
            <button
              onClick={() => { playSound('click'); setActiveTab('visual'); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'visual' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Guia Passo a Passo
            </button>
            <button
              onClick={() => { playSound('click'); setActiveTab('code-expl'); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'code-expl' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Explicação do Código
            </button>
          </div>

          {/* TAB 1: Visual Step-by-Step Guide */}
          <AnimatePresence mode="wait">
            {activeTab === 'visual' && (
              <motion.div
                key="step-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex-1 flex flex-col min-h-[460px]"
              >
                {/* Title */}
                <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    <span>Roteiro de Automação MySQL</span>
                  </div>
                  <span className="text-xs text-emerald-300 font-mono font-medium">
                    Passo {currentStepIndex + 1} de {SQL_STEPS.length}
                  </span>
                </div>

                {/* Steps Accordion Layout */}
                <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[360px] lg:max-h-[380px]">
                  {SQL_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;
                    return (
                      <div 
                        key={step.id}
                        onClick={() => idx <= currentStepIndex && executeStep(idx)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all relative overflow-hidden ${
                          isActive 
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300 shadow-sm'
                            : isCompleted
                              ? 'bg-slate-100/60 border-slate-200 opacity-90 hover:bg-slate-100 cursor-pointer'
                              : 'bg-white border-slate-200/50 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {/* Checkmark or number icon */}
                        <div className="flex items-start gap-2.5">
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                            isActive 
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : isCompleted
                                ? 'bg-emerald-200 text-emerald-800'
                                : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </span>
                          <div className="flex-1">
                            <h4 className={`font-bold text-[13px] ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                              {step.title}
                            </h4>
                            <p className="text-slate-500 leading-relaxed mt-1 text-[11.5px]">
                              {step.explanation}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                executeStep(idx);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs shadow-emerald-900/10"
                            >
                              <Play className="h-3 w-3 fill-white" />
                              Executar Comando
                            </button>
                          </div>
                        )}
                        
                        {/* Type indicator */}
                        <div className="absolute right-2 top-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            step.type === 'ddl' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : step.type === 'trigger'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : step.type === 'select'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {step.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 transition-all duration-300 rounded-full" 
                      style={{ width: `${((currentStepIndex + (currentStepIndex === SQL_STEPS.length - 1 && lotes.length > 0 && auditoria.length > 0 ? 1 : 0)) / SQL_STEPS.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px]">
                    {Math.round(((currentStepIndex + (currentStepIndex === SQL_STEPS.length - 1 && lotes.length > 0 && auditoria.length > 0 ? 1 : 0)) / SQL_STEPS.length) * 100)}%
                  </span>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Codigo do Trigger & Detalhes */}
            {activeTab === 'code-expl' && (
              <motion.div
                key="code-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex-1 flex flex-col min-h-[460px]"
              >
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
                  <Code className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-50">Explicação Teórica (MySQL Trig)</span>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed max-h-[380px]">
                  <div>
                    <h5 className="text-emerald-400 font-bold mb-1 font-mono text-[13px]">O que é um TRIGGER?</h5>
                    <p className="text-slate-300">
                      Um trigger (gatilho) é um bloco de código que roda <strong>automaticamente</strong> de forma reativa a um evento no banco (como `INSERT`, `UPDATE` ou `DELETE`). No fluxo da QualiFLV, evita perdas silenciosas criando um backup antes da exclusão.
                    </p>
                  </div>

                  <div>
                    <h5 className="text-emerald-400 font-bold mb-1 font-mono text-[13px]">Entendendo o Código do Usuário</h5>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 space-y-2 overflow-x-auto whitespace-pre">
{`DELIMITER $$
CREATE TRIGGER tg_apos_deletar_lote
AFTER DELETE ON lotes_estoque
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_descartes ...
    VALUES (OLD.id_lote, OLD.produto...);
END$$
DELIMITER ;`}
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-mono font-bold shrink-0">DELIMITER $$</span>
                      <span>Muda temporariamente o caractere finalizador padrão de ponto-e-vírgula (;) para ($$), permitindo que o MySQL diferencie onde o corpo completo do trigger termina em relação aos comandos internos.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-mono font-bold shrink-0">AFTER DELETE</span>
                      <span>O gatilho só dispara após o registro ser efetivamente retirado da tabela <code>lotes_estoque</code>. Excelente para garantir que auditorias de remoção ocorram apenas quando operações bem-sucedidas.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-mono font-bold shrink-0">FOR EACH ROW</span>
                      <span>Garante que o gatilho será executado para cada linha afetada, mesmo se o comando DELETE deletar vários registros de uma vez.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 font-mono font-bold shrink-0">OLD.&lt;coluna&gt;</span>
                      <span>A palavra-chave especial <code>OLD</code> permite referenciar informações que estavam na linha segundos antes dela ser apagada. É assim que transmitimos os valores para o relatório de descarte!</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    Princípio de Auditoria Automática Transparente (Nível 10D)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simulated MySQL Terminal Console Log */}
          <div className="bg-slate-950 text-slate-300 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] h-48 flex flex-col shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[10px] text-slate-400 font-bold tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-600 block" />
                CONSOLE DE SAÍDA - SERV_MYSQL_EMULATOR
              </span>
              <span>UTF-8</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 select-none flex flex-col invert-0">
              {consoleLogs.map((log, lIdx) => (
                <div key={lIdx} className={log.includes('ERRO') ? 'text-rose-400' : log.includes('⚡') || log.includes('✔') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: The Active Database Engine (8 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Active Database Visual Monitor Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col flex-1 gap-6 relative min-h-[500px]">

            {/* Animation overlay for TRIGGER FIRING */}
            <AnimatePresence>
              {triggerPhase !== 'idle' && triggeredBatch && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs rounded-2xl z-40 flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div 
                    initial={{ scale: 0.8, rotate: 0 }}
                    animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative mb-5"
                  >
                    <div className="h-20 w-20 rounded-full bg-teal-500/20 border border-teal-400 flex items-center justify-center animate-pulse-ring">
                      <Activity className="h-10 w-10 text-teal-300" />
                    </div>
                    <motion.div 
                      className="absolute -top-1 -right-1 bg-amber-500 text-teal-950 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      ATIVADO!
                    </motion.div>
                  </motion.div>

                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {triggerPhase === 'deleting' && 'Removendo Lote...'}
                    {triggerPhase === 'firing' && '⚡ Executando tg_apos_deletar_lote Trigger'}
                    {triggerPhase === 'inserting' && 'Escrevendo na Auditoria...'}
                  </h3>

                  {/* Laser pipeline visualization progress bars */}
                  <div className="w-full max-w-md bg-slate-800 h-2 rounded-full overflow-hidden my-4 relative">
                    <motion.div 
                      className="h-full bg-emerald-400"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: triggerPhase === 'deleting' ? '30%' : triggerPhase === 'firing' ? '70%' : '100%' 
                      }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>

                  {/* Flow items showing old values being payloaded */}
                  <div className="bg-slate-900 border border-emerald-800 p-4 rounded-xl max-w-sm w-full space-y-1.5 text-left font-mono text-[12px]">
                    <p className="text-emerald-400 font-bold pb-1 block border-b border-slate-800">
                      VARIÁVEL DE ENTRADA <span className="bg-emerald-950 px-1 py-0.2 rounded">OLD</span> CAPTURADA:
                    </p>
                    <p className="text-slate-300">OLD.id_lote = <span className="text-amber-400">{triggeredBatch?.id_lote ?? ''}</span></p>
                    <p className="text-slate-300">OLD.produto = <span className="text-amber-400">"{triggeredBatch?.produto ?? ''}"</span></p>
                    <p className="text-slate-300">OLD.quantidade_kg = <span className="text-amber-400">{(triggeredBatch?.quantidade_kg ?? 0).toFixed(2)} kg</span></p>
                    <p className="text-slate-300">OLD.status_validade = <span className="text-amber-400">"{triggeredBatch?.status_validade ?? ''}"</span></p>
                    <div className="text-slate-400 pt-1 text-[11px] border-t border-slate-800/60 mt-1">
                      NOW() = <span className="text-emerald-300">{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs mt-3 italic max-w-sm">
                    Garantia da integridade física e rastreabilidade total de descarte na automação de estoque.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tables Container (Flex/Grid Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch flex-1">
              
              {/* TABLE 1: lotes_estoque */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800 font-mono tracking-tight lowercase">
                        lotes_estoque
                      </h3>
                      <p className="text-[10px] text-slate-400">Tabela de Estoque Ativa</p>
                    </div>
                  </div>

                  {lotesTableCreated && (
                    <button
                      onClick={() => { playSound('click'); setIsAddingCustom(true); }}
                      className="px-2 py-1 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-md text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      id="btn-add-lote"
                    >
                      <Plus className="h-3 w-3" />
                      Inserir Lote
                    </button>
                  )}
                </div>

                {/* Table Body */}
                {!lotesTableCreated ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                    <Database className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Tabela não criada</p>
                    <p className="text-[10px] text-slate-400 max-w-[160px] leading-relaxed mt-0.5">
                      Execute o passo 1 no guia ao lado para rodar o comando CREATE TABLE.
                    </p>
                  </div>
                ) : lotes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-100/30 rounded-lg border border-dashed border-slate-200/80">
                    <p className="text-xs text-slate-400 font-semibold">Tabela Vazia</p>
                    <p className="text-[10px] text-slate-400 max-w-[160px] mt-0.5">
                      Nenhum lote de estoque registrado. Use o botão "Inserir Lote" ou o passo 4 do guia.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
                    <AnimatePresence>
                      {lotes.map((lote) => {
                        const isCritical = lote.status_validade === 'Crítico';
                        const isExpired = lote.status_validade === 'Vencido';
                        
                        return (
                          <motion.div
                            key={lote.id_lote}
                            layoutId={`lote-${lote.id_lote}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -50 }}
                            className={`p-2.5 rounded-lg border text-xs flex gap-2 justify-between items-start transition-all duration-250 ${
                              isExpired 
                                ? 'bg-rose-50/70 border-rose-200/80' 
                                : isCritical 
                                  ? 'bg-amber-50/70 border-amber-200/80'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-bold">
                                  #{lote.id_lote}
                                </span>
                                <h4 className="font-bold text-slate-800 text-[11.5px] tracking-tight truncate max-w-[140px]">
                                  {lote.produto}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                                <span>Qtde: <strong className="text-slate-700 font-bold">{lote.quantidade_kg.toFixed(2)} kg</strong></span>
                              </div>
                              
                              {/* Status Badge */}
                              <div className="pt-0.5">
                                <span className={`inline-flex items-center gap-1 font-semibold text-[9.5px] px-1.5 py-0.5 rounded-full border ${
                                  isExpired 
                                    ? 'bg-rose-100 text-rose-800 border-rose-200' 
                                    : isCritical 
                                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                  {isExpired ? <XCircle className="h-2.5 w-2.5" /> : isCritical ? <AlertTriangle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                                  {lote.status_validade}
                                </span>
                              </div>
                            </div>

                            {/* Descarte action */}
                            <button
                              onClick={() => triggerDeleteFlow(lote.id_lote)}
                              title="Remover/Descartar Lote"
                              className="text-slate-400 hover:text-rose-600 p-1 bg-slate-100 hover:bg-rose-50 border border-slate-200 rounded-md transition duration-150 cursor-pointer"
                              id={`delete-btn-${lote.id_lote}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* TABLE 2: auditoria_descartes */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-600/10 text-indigo-700 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800 font-mono tracking-tight lowercase">
                        auditoria_descartes
                      </h3>
                      <p className="text-[10px] text-slate-400">Atas Registradas por Triggers</p>
                    </div>
                  </div>

                  <span className="text-[9.5px] font-mono bg-indigo-950 text-white font-bold px-2 py-0.5 rounded border border-indigo-800/30">
                    LOGS: {totalDiscardedRecords}
                  </span>
                </div>

                {/* Table Body */}
                {!auditoriaTableCreated ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                    <Database className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Tabela não criada</p>
                    <p className="text-[10px] text-slate-400 max-w-[160px] leading-relaxed mt-0.5">
                      Gere a tabela de auditoria rodando o passo 2 do roteiro SQL.
                    </p>
                  </div>
                ) : auditoria.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-100/30 rounded-lg border border-dashed border-slate-200/80">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-ping inline-block mb-1.5" />
                    <p className="text-xs text-slate-400 font-semibold">Tabela de Auditoria Vazia</p>
                    <p className="text-[11px] text-slate-400 max-w-[180px] mt-0.5">
                      Nenhum descarte efetuado ainda. Deleta qualquer lote na tabela ao lado para disparar a auditoria!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
                    <AnimatePresence>
                      {auditoria.map((aud) => {
                        const timeStr = new Date(aud.data_remocao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        return (
                          <motion.div
                            key={aud.id_auditoria}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                            className="p-2.5 rounded-lg border border-emerald-200/75 bg-emerald-50/50 font-sans text-xs space-y-1 relative"
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-emerald-100/30">
                              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100/80 border border-emerald-200 px-1 rounded">
                                Aud #{aud.id_auditoria}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                                <Activity className="h-2.5 w-2.5 text-emerald-500" />
                                {timeStr}
                              </span>
                            </div>

                            <div className="space-y-0.5 pt-1 text-[11px]">
                              <p className="text-slate-700">
                                <strong>Lote Deletado:</strong> <span className="bg-white/80 px-1 rounded text-slate-900 border border-slate-100 font-semibold font-mono text-[10px]">ID {aud.id_lote_deletado}</span>
                              </p>
                              <p className="font-semibold text-slate-950 font-sans truncate text-[11.5px]">
                                {aud.produto_deletado}
                              </p>
                              <p className="text-slate-500 font-mono text-[10.5px]">
                                Quantidade: <strong className="text-slate-700">{aud.quantidade_kg.toFixed(2)} kg</strong>
                              </p>
                            </div>

                            {/* Trigger Stamp mark */}
                            <div className="absolute right-2 bottom-1">
                              <span className="text-[8.5px] tracking-wider text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-extrabold uppercase select-none">
                                TRIGGER GRANTED
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

            </div>

            {/* Custom Interactive SQL / Insert Lote Modal/Form inline */}
            <AnimatePresence>
              {isAddingCustom && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-700 shadow-lg"
                >
                  <form onSubmit={handleAddCustomLote} className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5 text-emerald-400" />
                        Inserir Lote de Estoque Personalizado (Simulação de Envio)
                      </span>
                      <button 
                        type="button" 
                        onClick={() => { playSound('click'); setIsAddingCustom(false); }}
                        className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 font-mono">Produto FLV</label>
                        <input
                          type="text"
                          required
                          value={customProduto}
                          onChange={(e) => setCustomProduto(e.target.value)}
                          placeholder="Ex: Laranja Pera Saco"
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white placeholder-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 font-mono">Quantidade (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={customKg}
                          onChange={(e) => setCustomKg(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 font-mono">Status de Validade</label>
                        <select
                          value={customValidade}
                          onChange={(e) => setCustomValidade(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-300"
                        >
                          <option value="Seguro">Seguro</option>
                          <option value="Crítico">Crítico</option>
                          <option value="Vencido">Vencido</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 transition text-emerald-950 font-bold text-xs rounded-lg flex items-center gap-1 shadow cursor-pointer"
                      >
                        Executar SQL: INSERT
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Explanatory footer inside the engine to prevent tech-larping */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 leading-relaxed text-slate-600 text-xs mt-auto space-y-1">
              <span className="font-bold text-slate-800 text-[11px] block flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                Como a Automação e o Trigger evitam perdas silenciosas?
              </span>
              <p className="text-[11px] text-slate-500">
                Lanchonetes, supermercados e armazéns costumam deletar alimentos descartados para manter o inventário correto. Sem um trigger, o histórico desse alimento se perderia para sempre. A automação garante que cada descarte seja auditado por fora automaticamente pelo MySQL, permitindo um relatório refinado do prejuízo mensal.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono">
            db_qualiflv_automacao &copy; 2026 - Automação Residida em Banco de Dados Relacional
          </p>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">MySQL Triggers</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Qualidade FLV</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Rastreabilidade</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
