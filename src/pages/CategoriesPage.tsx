import { useState } from 'react';
import { List, Hash } from 'lucide-react';
import CategoryManager from '../components/categories/CategoryManager';
import RuleManager from '../components/categories/RuleManager';

export default function CategoriesPage() {
    const [activeTab, setActiveTab] = useState('categories');

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Categorias & Automação</h2>
                    <p>Gerencie suas categorias e regras de automação</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                    className={`btn ${activeTab === 'categories' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('categories')}
                    style={activeTab !== 'categories' ? { background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                >
                    <List size={16} /> Categorias
                </button>
                <button
                    className={`btn ${activeTab === 'rules' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('rules')}
                    style={activeTab !== 'rules' ? { background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                >
                    <Hash size={16} /> Categorização Automática
                </button>
            </div>

            {activeTab === 'categories' ? <CategoryManager /> : <RuleManager />}
        </div>
    );
}
