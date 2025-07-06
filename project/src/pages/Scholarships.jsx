import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';
import DataTable from '../components/UI/DataTable';
import { FormField, Input, TextArea, Button } from '../components/UI/Form';
import StatsCard from '../components/UI/StatsCard';

const Scholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', amount: '', deadline: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/scholarships');
      setScholarships(res.data);
    } catch (err) {
      console.error('Error fetching scholarships:', err);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', amount: '', deadline: '' });
    setErrors({});
    setEditingScholarship(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title: formData.title,
      description: formData.description,
      amount: parseFloat(formData.amount),
      deadline: formData.deadline
    };

    try {
      if (editingScholarship) {
        await axios.put(`http://localhost:5000/api/scholarships/${editingScholarship._id}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/scholarships', payload);
      }
      fetchScholarships();
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving scholarship:', err);
    }
  };

  const handleEdit = (s) => {
    setEditingScholarship(s);
    setFormData({
      title: s.title,
      description: s.description,
      amount: s.amount.toString(),
      deadline: s.deadline.split('T')[0]
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (s) => {
    if (!window.confirm('Are you sure you want to delete this scholarship?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/scholarships/${s._id}`);
      fetchScholarships();
    } catch (err) {
      console.error('Error deleting scholarship:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const scholarshipColumns = [
    {
      key: 'title', label: 'Title',
      render: v => <div className="font-medium text-gray-900">{v}</div>
    },
    {
      key: 'description', label: 'Description',
      render: v => <div className="text-gray-600 max-w-xs truncate" title={v}>{v}</div>
    },
    {
      key: 'amount', label: 'Amount',
      render: v => <div className="font-semibold text-green-600">${v.toLocaleString()}</div>
    },
    {
      key: 'deadline', label: 'Deadline',
      render: v => <div className="text-gray-500 text-sm">{new Date(v).toLocaleDateString('en-US', { year:'numeric',month:'short',day:'numeric'})}</div>
    }
  ];

  const actions = [
    { label: 'Edit', icon: Edit, onClick: handleEdit, className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50' },
    { label: 'Delete', icon: Trash2, onClick: handleDelete, className: 'text-red-600 hover:text-red-800 hover:bg-red-50' }
  ];

  const totalAmount = scholarships.reduce((sum, s) => sum + s.amount, 0);
  const activePrograms = scholarships.filter(s => new Date(s.deadline) > new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scholarship Management</h1>
          <p className="text-gray-600">Manage and track scholarship programs</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" /><span>Add Scholarship</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Scholarships" value={scholarships.length} icon={GraduationCap} color="blue" />
        <StatsCard title="Total Amount" value={`$${totalAmount.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatsCard title="Active Programs" value={activePrograms} icon={TrendingUp} color="purple" />
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</h2>
            <Button variant="secondary" onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Title" error={errors.title} required>
                <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Title" />
              </FormField>
              <FormField label="Amount" error={errors.amount} required>
                <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} placeholder="Amount" min="0" step="0.01" />
              </FormField>
            </div>
            <FormField label="Description" error={errors.description} required>
              <TextArea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" rows={3} />
            </FormField>
            <FormField label="Deadline" error={errors.deadline} required>
              <Input name="deadline" type="date" value={formData.deadline} onChange={handleInputChange} />
            </FormField>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit">{editingScholarship ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Scholarships</h2>
          <div className="text-sm text-gray-500">Total: {scholarships.length}</div>
        </div>
        <DataTable columns={scholarshipColumns} data={scholarships} actions={actions} />
      </div>
    </div>
  );
};

export default Scholarships;
