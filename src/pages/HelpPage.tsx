import { BookOpen, LayoutDashboard, Clock, History, Tag, Settings, Upload, EyeOff } from 'lucide-react';

export default function HelpPage() {
    return (
        <div className="settings-page" style={{ paddingBottom: '40px' }}>
            <div className="settings-card card">
                <div className="card-header" style={{ marginBottom: 20 }}>
                    <BookOpen size={20} />
                    <span>Guia de Uso do Sistema</span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                    Abaixo você encontra uma explicação detalhada de cada uma das funcionalidades disponíveis no sistema.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Dashboard */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <LayoutDashboard size={18} style={{ color: 'var(--text-primary)' }} />
                            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Dashboard</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            É a visão geral das suas finanças. Aqui você acompanha seus saldos totais, receitas e despesas. 
                            Gráficos interativos mostram para onde seu dinheiro está indo, dividindo os gastos por categorias e permitindo 
                            uma análise rápida da sua saúde financeira.
                        </p>
                    </div>

                    {/* Importação */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Upload size={18} style={{ color: 'var(--text-primary)' }} />
                            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Importar Transações</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Através do botão "Importar" no topo da tela, você pode adicionar várias transações de uma só vez usando um arquivo de planilha (CSV) ou 
                            extrato bancário. As transações importadas não vão direto para o seu saldo; elas ficam na aba "Pendentes" 
                            para que você possa revisá-las.
                        </p>
                    </div>

                    {/* Pendentes */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Clock size={18} style={{ color: 'var(--text-primary)' }} />
                            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Transações Pendentes</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Esta tela exibe todas as transações que foram importadas mas ainda não foram confirmadas. 
                            O objetivo aqui é que você atribua a categoria correta para cada gasto ou ganho. 
                            Somente após você "confirmar" uma transação pendente, ela passará a contar no seu saldo e nos gráficos do Dashboard.
                        </p>
                    </div>

                    {/* Ignorar Transações */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <EyeOff size={18} style={{ color: 'var(--text-primary)' }} />
                            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Ignorar Transações</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Ao revisar suas transações pendentes, você pode encontrar transferências internas, pagamentos de fatura de cartão ou itens que não devem afetar seus gráficos. Nesses casos, basta usar a opção de "Ignorar". A transação será descartada com segurança, sem contabilizar como despesa ou receita no seu Dashboard.
                        </p>
                    </div>

                    {/* Histórico */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <History size={18} style={{ color: 'var(--text-primary)' }} />
                            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Histórico</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            O Histórico é o registro definitivo de todas as suas movimentações financeiras já processadas. 
                            Você pode visualizar os detalhes de qualquer mês, e se cometer algum erro, pode editar o valor, a data ou a 
                            categoria de qualquer transação salva. Você também pode excluir registros por aqui.
                        </p>
                    </div>

                    {/* Categorias */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Tag size={18} style={{ color: 'var(--text-primary)' }} />
                            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Categorias</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Aqui você personaliza como organiza seu dinheiro. É possível criar novas categorias para suas despesas e receitas, 
                            escolhendo cores específicas para facilitar a identificação visual em todo o aplicativo.
                        </p>
                    </div>

                    {/* Configurações */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Settings size={18} style={{ color: 'var(--text-primary)' }} />
                            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Configurações</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Permite ajustar preferências gerais do sistema, como alterar a sua Moeda Base (ex: Real, Dólar, Euro). 
                            Ao alterar a moeda, todo o aplicativo será atualizado para exibir o símbolo monetário escolhido.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
