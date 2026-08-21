/**
 * components/skills/SkillForm.jsx — Shared skill listing form.
 */

import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import { EXPERIENCE_LEVELS, SKILL_CATEGORIES, SKILL_STATUSES } from '../../constants';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  experienceLevel: 'Intermediate',
  estimatedDuration: '',
  baseRate: '',
  tags: '',
  thumbnail: '',
  status: 'active',
};

const normalizeFormData = form => ({
  ...form,
  baseRate: Number(form.baseRate),
  tags: form.tags
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean),
});

const validateForm = form => {
  const errors = {};

  if (form.title.trim().length < 5 || form.title.trim().length > 80) {
    errors.title = 'Title must be 5 to 80 characters.';
  }

  if (form.description.trim().length < 30 || form.description.trim().length > 1000) {
    errors.description = 'Description must be 30 to 1000 characters.';
  }

  if (!form.category) {
    errors.category = 'Category is required.';
  }

  if (!Number(form.baseRate) || Number(form.baseRate) <= 0) {
    errors.baseRate = 'Base rate must be a positive number.';
  }

  return errors;
};

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-xs font-medium text-red-700">{message}</p> : null;

const SkillForm = ({ initialValues, submitLabel, onSubmit, isSubmitting = false, apiError = '' }) => {
  const initialForm = useMemo(() => {
    if (!initialValues) {
      return EMPTY_FORM;
    }

    return {
      ...EMPTY_FORM,
      ...initialValues,
      baseRate: initialValues.baseRate?.toString() || '',
      tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : initialValues.tags || '',
    };
  }, [initialValues]);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const updateField = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: '' }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(normalizeFormData(form));
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card p-5 sm:p-6">
      {apiError && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {apiError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Title</span>
          <input name="title" value={form.title} onChange={updateField} className="input-base mt-2" />
          <FieldError message={errors.title} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Category</span>
          <select name="category" value={form.category} onChange={updateField} className="input-base mt-2 cursor-pointer">
            <option value="">Select category</option>
            {SKILL_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Experience Level</span>
          <select name="experienceLevel" value={form.experienceLevel} onChange={updateField} className="input-base mt-2 cursor-pointer">
            {EXPERIENCE_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Estimated Duration</span>
          <input name="estimatedDuration" value={form.estimatedDuration} onChange={updateField} className="input-base mt-2" placeholder="Example: 2 weeks" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Base Rate</span>
          <input name="baseRate" type="number" min="1" step="1" value={form.baseRate} onChange={updateField} className="input-base mt-2" />
          <FieldError message={errors.baseRate} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Status</span>
          <select name="status" value={form.status} onChange={updateField} className="input-base mt-2 cursor-pointer">
            {SKILL_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-900">Description</span>
          <textarea name="description" value={form.description} onChange={updateField} rows={6} className="input-base mt-2 resize-y" />
          <FieldError message={errors.description} />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-900">Tags</span>
          <input name="tags" value={form.tags} onChange={updateField} className="input-base mt-2" placeholder="React, Tailwind, API Integration" />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-900">Thumbnail URL</span>
          <input name="thumbnail" value={form.thumbnail} onChange={updateField} className="input-base mt-2" />
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default SkillForm;
