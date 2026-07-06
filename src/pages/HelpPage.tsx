import { BookOpen, LayoutDashboard, Clock, History, Tag, Settings, Upload, EyeOff, PieChart, Filter, CheckCircle, AlertTriangle, FileText, ArrowRightLeft, CreditCard, PlusCircle, PenTool, Trash2 } from 'lucide-react';

export default function HelpPage() {
    return (
        <div className="settings-page" style={{ paddingBottom: '40px' }}>
            <div className="settings-card card">
                <div className="card-header" style={{ marginBottom: 20 }}>
                    <BookOpen size={24} style={{ color: 'var(--primary-color)' }} />
                    <span style={{ fontSize: 20, fontWeight: 600 }}>Central de Ajuda</span>
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '32px', borderLeft: '4px solid var(--primary-color)' }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.6 }}>
                        Bem-vindo ao guia completo do Finance Tracker. Aqui você encontra não apenas o passo a passo de como usar cada tela, mas também <strong>melhores práticas</strong> e <strong>dicas</strong> de como manter suas finanças sempre organizadas e seus gráficos precisos.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                    {/* Dashboard */}
                    <div className="help-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '8px', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
                                <LayoutDashboard size={20} style={{ color: 'var(--primary-color)' }} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>Dashboard e Gráficos</h4>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, paddingLeft: '42px' }}>
                            <p style={{ marginBottom: '12px' }}>O Dashboard é a central de controle. Ele resume todas as suas movimentações confirmadas do mês.</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                <li><strong>Cartões de Resumo:</strong> Exibem de forma rápida o total de Receitas, Despesas e o Saldo final do mês.</li>
                                <li><strong>Gráfico de Categoria <PieChart size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />:</strong> Ótimo para identificar para onde a maior parte do seu dinheiro está indo.</li>
                                <li><strong>Gráfico de Evolução:</strong> Permite visualizar as entradas e saídas ao longo do tempo (dias ou meses), ajudando a identificar padrões de comportamento financeiro.</li>
                                <li><strong>Filtros Rápido <Filter size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />:</strong> No topo da tela, você pode facilmente trocar de mês para comparar seus resultados atuais com os anteriores.</li>
                            </ul>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: 'rgba(255, 171, 0, 0.1)', padding: '12px', borderRadius: '6px' }}>
                                <AlertTriangle size={16} color="#FFAB00" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}><strong>Atenção:</strong> Transações pendentes aparecem como "sem categoria" nos gráficos. Certifique-se de processar a aba "Pendentes" para que seus gráficos fiquem precisos.</span>
                            </div>
                        </div>
                    </div>

                    {/* Importação */}
                    <div className="help-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '8px', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
                                <Upload size={20} style={{ color: 'var(--primary-color)' }} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>Importar Transações (Arquivos CSV)</h4>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, paddingLeft: '42px' }}>
                            <p style={{ marginBottom: '12px' }}>A funcionalidade de importação é a maneira de importar as transações do seu banco para o sistema.</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li><strong>Como usar:</strong> Clique no botão "Importar", selecione o arquivo gerado pelo seu banco e aguarde.</li>
                                <li><strong>Formatos suportados:</strong> O sistema suporta <strong>APENAS</strong> arquivos no formato CSV.</li>
                                <li><strong>O que acontece:</strong> O sistema lê o arquivo e cria registros em massa que vão diretamente para a aba "Pendentes". Seu saldo não é afetado neste momento.</li>
                            </ul>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: 'rgba(255, 171, 0, 0.1)', padding: '12px', borderRadius: '6px' }}>
                                <AlertTriangle size={16} color="#FFAB00" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}><strong>Dica:</strong> Se voce criar categorias automáticas na aba "Categorias" antes de importar os dados, o sistema irá categorizar as transações importadas com base nas regras criadas.</span>
                            </div>
                        </div>
                    </div>

                    {/* Pendentes e Conciliação */}
                    <div className="help-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '8px', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
                                <Clock size={20} style={{ color: 'var(--primary-color)' }} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>Processando Transações Pendentes</h4>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, paddingLeft: '42px' }}>
                            <p style={{ marginBottom: '12px' }}>A aba Pendentes é a sua "caixa de entrada" financeira. É aqui que você classifica suas importações.</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                <li><strong>Escolhendo Categorias:</strong> O passo mais importante. Atribua a categoria correta para garantir a qualidade dos gráficos.</li>
                                <li><strong>Confirmar <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--success-color)' }} />:</strong> Após conferir valor e descrição, e definir a categoria, clique em "Confirmar" ou no botão de ✓. A transação agora é oficial e vai para o Histórico.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Histórico */}
                    <div className="help-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '8px', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
                                <History size={20} style={{ color: 'var(--primary-color)' }} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>Gerenciando o Histórico</h4>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, paddingLeft: '42px' }}>
                            <p style={{ marginBottom: '12px' }}>O Histórico contém os dados definitivos. Diferente das "Pendentes", tudo aqui ja esta categorizado.</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li><strong>Edição e Exclusão:</strong> Cometeu um erro? Não tem problema. Encontre a transação no Histórico e você poderá alterar a categoria, ou até mesmo excluí-la <Trash2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                                <li><strong>Navegação:</strong> Use a barra de busca e os filtros para encontrar transações específicas.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Categorias */}
                    <div className="help-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '8px', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
                                <Tag size={20} style={{ color: 'var(--primary-color)' }} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>Organização de Categorias</h4>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, paddingLeft: '42px' }}>
                            <p style={{ marginBottom: '12px' }}>Um bom controle financeiro depende de uma boa categorização. Aqui você gerencia isso.</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li><strong>Criando e Editando <PenTool size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />:</strong> Crie novas categorias definindo um nome, uma cor, e o Tipo (se é uma categoria para despesas essenciais, economias ou investimentos).</li>
                                <li><strong>Evite Excesso:</strong> Cuidado para não criar categorias muito específicas. Prefira grupos como "Delivery", "Mercado", "Lazer", "Transporte", etc.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Configurações */}
                    <div className="help-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '8px', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px' }}>
                                <Settings size={20} style={{ color: 'var(--primary-color)' }} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>Configurações do Sistema</h4>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, paddingLeft: '42px' }}>
                            <p style={{ marginBottom: '12px' }}>Personalize a sua experiência de uso no site.</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li><strong>Moeda Base:</strong> Ajuste o símbolo monetário (R$, $, €, etc) que acompanha todos os valores do sistema. Ao alterar aqui, todas as telas passam a exibir o novo símbolo instantaneamente.</li>
                                <li><strong>Tema / Aparência:</strong> Alterne entre os modos claro e escuro no topo da página para melhor visualização.</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
