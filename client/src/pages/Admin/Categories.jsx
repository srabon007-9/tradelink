import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [form, setForm] = useState({ name: '', description: '', basePriceBDT: '1500' });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.data);
    } catch {
      toast.error('Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', basePriceBDT: '1500' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, description: cat.description || '', basePriceBDT: String(cat.basePriceBDT || 1500) });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.basePriceBDT) {
      toast.error('Name and Base BDT price are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        const res = await api.patch(`/admin/categories/${editingCategory._id}`, {
          description: form.description,
          basePriceBDT: Number(form.basePriceBDT)
        });
        toast.success(res.data.message);
      } else {
        const res = await api.post('/admin/categories', {
          name: form.name.trim(),
          description: form.description,
          basePriceBDT: Number(form.basePriceBDT)
        });
        toast.success(res.data.message);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save skill category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Category Manager 🏷️"
        description="Add new skill categories, update base BDT rates, and monitor live dynamic valuation engine metrics."
        action={
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            + Add New Category
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-concrete-200 bg-concrete-50 text-xs font-semibold uppercase tracking-wider text-steel-600">
                <tr>
                  <th className="px-5 py-3.5">Category Name</th>
                  <th className="px-5 py-3.5">Base Price (BDT)</th>
                  <th className="px-5 py-3.5">Current Live Price</th>
                  <th className="px-5 py-3.5">Demand / Supply</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-200">
                {categories.map(cat => (
                  <tr key={cat._id} className="hover:bg-concrete-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-navy-900">{cat.name}</p>
                        <p className="text-xs text-steel-500 max-w-md truncate">{cat.description || 'No description provided.'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-steel-700">
                      {formatCurrency(cat.basePriceBDT || 1500)}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-navy-900">
                      {formatCurrency(cat.priceBDT || cat.basePriceBDT || 1500)}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-steel-600">
                      D: <span className="font-semibold text-navy-900">{cat.activeDemandCount || 0}</span> | S: <span className="font-semibold text-navy-900">{cat.activeSupplyCount || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(cat)}>
                        Edit Base Rate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900">
              {editingCategory ? `Edit "${editingCategory.name}"` : 'Add New Skill Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">Category Name</label>
                <input
                  type="text"
                  disabled={!!editingCategory}
                  placeholder="e.g. Graphic Design"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of skills included in this category"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">Base Price in BDT (৳)</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  placeholder="1500"
                  value={form.basePriceBDT}
                  onChange={e => setForm(prev => ({ ...prev, basePriceBDT: e.target.value }))}
                  className="input-base text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
