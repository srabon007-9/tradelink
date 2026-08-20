'use strict';

/**
 * services/admin.service.js — Admin Business Logic
 */

const User = require('../models/User.model');
const SkillCategory = require('../models/SkillCategory.model');
const SkillListing = require('../models/SkillListing.model');
const TradeProposal = require('../models/TradeProposal.model');
const Review = require('../models/Review.model');
const ApiError = require('../utils/ApiError');
const { recalculateCategoryPrices } = require('./valuation.service');

const adminService = {
  /**
   * Get high-level platform statistics and KPIs.
   */
  getPlatformStats: async () => {
    const totalUsers = await User.countDocuments({ role: 'client' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });
    
    const totalListings = await SkillListing.countDocuments({ status: 'active' });
    const totalCategories = await SkillCategory.countDocuments({});

    const totalProposals = await TradeProposal.countDocuments({});
    const activeEscrows = await TradeProposal.countDocuments({ status: { $in: ['accepted', 'pending'] } });
    const completedTrades = await TradeProposal.countDocuments({ status: 'completed' });
    const disputedTrades = await TradeProposal.countDocuments({ status: 'disputed' });

    const totalReviews = await Review.countDocuments({});

    // Calculate sum of active escrow credits
    const escrowAggregate = await TradeProposal.aggregate([
      { $match: { status: 'accepted' } },
      { $group: { _id: null, totalBDT: { $sum: '$priceAtProposal' } } }
    ]);
    const activeEscrowBDT = escrowAggregate[0]?.totalBDT || 0;

    return {
      users: { total: totalUsers, admins: totalAdmins, suspended: suspendedUsers },
      listings: { active: totalListings, categories: totalCategories },
      trades: {
        total: totalProposals,
        active: activeEscrows,
        completed: completedTrades,
        disputed: disputedTrades,
        escrowBDT: activeEscrowBDT
      },
      reviews: { total: totalReviews }
    };
  },

  /**
   * Get all users with search, role, and suspension filter.
   */
  getUsers: async ({ search, role, isSuspended, limit = 50, page = 1 }) => {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {query.role = role;}
    if (isSuspended !== undefined && isSuspended !== '') {
      query.isSuspended = isSuspended === 'true';
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    return {
      users: users.map(u => u.toPublicJSON()),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * Toggle user suspension state.
   */
  toggleUserSuspend: async (adminUserId, targetUserId, isSuspended) => {
    if (String(adminUserId) === String(targetUserId)) {
      throw ApiError.badRequest('Administrators cannot suspend their own account.');
    }

    const user = await User.findById(targetUserId);
    if (!user) {throw ApiError.notFound('User not found.');}

    user.isSuspended = isSuspended;
    await user.save();

    return user.toPublicJSON();
  },

  /**
   * Toggle user verification badge status.
   */
  toggleUserVerification: async (targetUserId, isVerified) => {
    const user = await User.findById(targetUserId);
    if (!user) {throw ApiError.notFound('User not found.');}

    user.isVerified = isVerified;
    await user.save();

    return user.toPublicJSON();
  },

  /**
   * Get all skill categories with price details.
   */
  getCategories: async () => {
    return SkillCategory.find({}).sort({ name: 1 });
  },

  /**
   * Add new Skill Category.
   */
  createCategory: async ({ name, description, basePriceBDT }) => {
    const existing = await SkillCategory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      throw ApiError.badRequest(`Category "${name}" already exists.`);
    }

    const category = new SkillCategory({
      name,
      description: description || '',
      basePriceBDT: Number(basePriceBDT) || 1500,
      priceBDT: Number(basePriceBDT) || 1500,
      activeDemandCount: 0,
      activeSupplyCount: 0,
      demandSupplyRatio: 1
    });

    await category.save();
    return category;
  },

  /**
   * Update existing Skill Category base price / details.
   */
  updateCategory: async (categoryId, { description, basePriceBDT }) => {
    const category = await SkillCategory.findById(categoryId);
    if (!category) {throw ApiError.notFound('Skill Category not found.');}

    if (description !== undefined) {category.description = description;}
    if (basePriceBDT !== undefined) {
      category.basePriceBDT = Number(basePriceBDT);
    }

    await category.save();
    // Trigger valuation update
    await recalculateCategoryPrices('admin_update');

    return category;
  },

  /**
   * Get all trade proposals across system.
   */
  getTradeProposals: async ({ status, limit = 50, page = 1 }) => {
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const proposals = await TradeProposal.find(query)
      .populate('requester', 'name email avatar')
      .populate('provider', 'name email avatar')
      .populate('skillListing', 'title category')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await TradeProposal.countDocuments(query);

    return {
      proposals,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * Admin dispute resolution action.
   * Action can be: 'refund_requester' (cancel trade) or 'release_provider' (complete trade).
   */
  resolveDispute: async (proposalId, { action, adminNote }) => {
    const proposal = await TradeProposal.findById(proposalId);
    if (!proposal) {throw ApiError.notFound('Trade Proposal not found.');}

    if (action === 'refund_requester') {
      proposal.status = 'cancelled';
      proposal.adminResolutionNote = adminNote || 'Trade cancelled by Admin resolution. Credits refunded.';
    } else if (action === 'release_provider') {
      proposal.status = 'completed';
      proposal.completedAt = new Date();
      proposal.adminResolutionNote = adminNote || 'Trade approved and completed by Admin resolution. Escrow released.';
    } else {
      throw ApiError.badRequest('Invalid resolution action. Use "refund_requester" or "release_provider".');
    }

    await proposal.save();
    return proposal;
  }
};

module.exports = adminService;
