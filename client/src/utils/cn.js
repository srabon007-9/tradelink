/**
 * utils/cn.js — Class Name Merge Utility
 *
 * Merges Tailwind class names conditionally.
 * Thin wrapper that avoids pulling in the full clsx+tailwind-merge stack
 * while keeping the API consistent.
 *
 * Usage:
 *   cn('px-4 py-2', isActive && 'bg-navy-800', className)
 */

import { clsx } from 'clsx';

/**
 * @param {...(string|boolean|null|undefined|object)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return clsx(...inputs);
}
