/**
 * services/skill.service.js — Skill listing API helpers.
 */

import api from './api';

export const skillService = {
  listMine: async params => {
    const { data } = await api.get('/skills/my', { params });
    return data.data.skills;
  },
  listAll: async params => {
    const { data } = await api.get('/skills', { params });
    return data.data.skills;
  },
  getById: async id => {
    const { data } = await api.get(`/skills/${id}`);
    return data.data.skill;
  },
  create: async payload => {
    const { data } = await api.post('/skills', payload);
    return data.data.skill;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/skills/${id}`, payload);
    return data.data.skill;
  },
  remove: async id => {
    await api.delete(`/skills/${id}`);
  },
  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/skills/${id}/status`, { status });
    return data.data.skill;
  },
};
