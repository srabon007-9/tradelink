/**
 * utils/formatters.js — Display formatting helpers.
 */

export const formatCurrency = amount =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatCompactCurrency = amount =>
  new Intl.NumberFormat('en-BD', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(amount);

export const formatPercent = value => `${Math.round(value)}%`;

export const truncate = (str, maxLength = 80) =>
  str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;

export const getInitials = name =>
  name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('');

export const formatDate = date =>
  new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const pluralise = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
