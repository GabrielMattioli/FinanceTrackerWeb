import { useState } from 'react';
import { List, Hash } from 'lucide-react';
import CategoryManager from '../components/categories/CategoryManager';
import RuleManager from '../components/categories/RuleManager';

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'rules'>('categories');

  return (
    <div>
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h2>Categorias & Automação</h2>
          <p>Gerencie suas categorias e regras de automação</p>
        </div>
      </div>

      <div role="tablist" aria-label="Gerenciamento de categorias" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'categories'}
          className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('categories')}
        >
          <List size={16} /> Categorias
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rules'}
          className={`btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('rules')}
        >
          <Hash size={16} /> Categorização Automática
        </button>
      </div>

      {activeTab === 'categories' ? <CategoryManager /> : <RuleManager />}
    </div>
  );
}
