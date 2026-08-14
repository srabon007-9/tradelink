/**
 * services/wallet.service.js — Credit Wallet API Client
 */

import api from './api';

export const walletService = {
  /** Get current user's wallet balance & summary statistics */
  getWallet: async () => {
    const { data } = await api.get('/wallet');
    return data.data;
  },

  /** Get current user's transaction history */
  getTransactions: async () => {
    const { data } = await api.get('/wallet/transactions');
    return data.data;
  },

  /** Purchase credit package (starter, popular, pro) */
  purchaseCredits: async (packageId, paymentId = null) => {
    const { data } = await api.post('/wallet/purchase', { packageId, paymentId });
    return data.data;
  },

  /** Dev / Testing helper (earn, spend, bonus) */
  devAction: async (action, amount, reason) => {
    const { data } = await api.post('/wallet/dev-action', { action, amount, reason });
    return data.data;
  },
};

export default walletService;
