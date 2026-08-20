'use strict';

/**
 * services/email.service.js — Email Notifications via Nodemailer
 *
 * Sends automated email notifications when wallet transactions occur.
 * Email failure is handled gracefully and will NEVER throw errors that cause
 * database transactions to roll back or fail.
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Lazy-create transporter using environment variables
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const emailService = {
  /**
   * Sends an automated email notification for wallet transactions.
   * Runs asynchronously in a fire-and-forget manner to safeguard wallet operations.
   */
  sendWalletNotification: async ({ toEmail, userName, type, amount, balanceAfter, bdtAmount, description }) => {
    try {
      const transporter = createTransporter();
      if (!transporter) {
        logger.warn(`[Email] Skipping email notification for ${toEmail}: EMAIL_USER / EMAIL_PASSWORD not set in .env`);
        return false;
      }

      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@tradelink.com.bd';
      const formattedAmount = amount > 0 ? `+${amount}` : `${amount}`;
      
      let typeLabel = 'Wallet Transaction';
      let extraText = '';

      if (type === 'purchase') {
        typeLabel = 'Credit Purchase';
        extraText = `BDT Paid: ৳${bdtAmount || 0}\n`;
      } else if (type === 'earned') {
        typeLabel = 'Skill Completed (Credits Earned)';
      } else if (type === 'spent') {
        typeLabel = 'Skill Request (Credits Spent)';
      } else if (type === 'bonus') {
        typeLabel = 'TradeLink Activity Bonus';
      }

      const textBody = `Hello ${userName || 'Student'},

Your TradeLink wallet has been updated.

Transaction: ${typeLabel}
Amount: ${formattedAmount} Credits
${extraText}Reason / Description: ${description}
New Balance: ${balanceAfter} Credits

Thank you for using TradeLink!
— The TradeLink Team`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
          <h2 style="color: #0f172a; margin-top: 0;">TradeLink Wallet Update</h2>
          <p>Hello <strong>${userName || 'Student'}</strong>,</p>
          <p>Your TradeLink wallet balance has been updated.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Type:</strong> ${typeLabel}</p>
            <p style="margin: 4px 0;"><strong>Amount:</strong> <span style="font-size: 16px; font-weight: bold; color: ${amount >= 0 ? '#15803d' : '#b91c1c'};">${formattedAmount} Credits</span></p>
            ${bdtAmount ? `<p style="margin: 4px 0;"><strong>BDT Paid:</strong> ৳${bdtAmount}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Description:</strong> ${description}</p>
            <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 12px 0;" />
            <p style="margin: 4px 0; font-size: 16px;"><strong>New Balance:</strong> <span style="color: #1e3a8a; font-weight: bold;">${balanceAfter} Credits</span></p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Thank you for being part of the TradeLink skill exchange community.</p>
        </div>
      `;

      await transporter.sendMail({
        from: `TradeLink <${fromAddress}>`,
        to: toEmail,
        subject: `TradeLink Wallet Update: ${formattedAmount} Credits`,
        text: textBody,
        html: htmlBody,
      });

      logger.info(`[Email] Notification sent successfully to ${toEmail} for ${type} transaction.`);
      return true;
    } catch (err) {
      // Email failure MUST NOT crash or fail the transaction
      logger.error(`[Email] Failed to send email to ${toEmail}: ${err.message}`);
      return false;
    }
  },

  /**
   * Sends a Watchlist price-alert email when a watched category crosses
   * the user's threshold (see jobs/watchlistCron.js). Failure is fully
   * swallowed — a broken email must never stop the cron from checking
   * the rest of the watchlist.
   */
  sendWatchlistAlert: async ({ toEmail, userName, categoryName, condition, thresholdBDT, currentPriceBDT }) => {
    try {
      const transporter = createTransporter();
      if (!transporter) {
        logger.warn(`[Email] Skipping watchlist alert for ${toEmail}: EMAIL_USER / EMAIL_PASSWORD not set in .env`);
        return false;
      }

      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@tradelink.com.bd';
      const directionLabel = condition === 'below' ? 'dropped below' : 'risen above';

      const textBody = `Hello ${userName || 'Student'},

Your TradeLink watchlist alert has triggered!

Category: ${categoryName}
Your target: price ${directionLabel} ৳${thresholdBDT} BDT
Current live price: ৳${currentPriceBDT} BDT

This is a great time to check the marketplace for this skill.

— The TradeLink Team`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
          <h2 style="color: #0f172a; margin-top: 0;">📈 Watchlist Alert — ${categoryName}</h2>
          <p>Hello <strong>${userName || 'Student'}</strong>,</p>
          <p>A category on your TradeLink watchlist just hit your target price.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Category:</strong> ${categoryName}</p>
            <p style="margin: 4px 0;"><strong>Your target:</strong> price ${directionLabel} ৳${thresholdBDT} BDT</p>
            <p style="margin: 4px 0; font-size: 16px;"><strong>Current live price:</strong> <span style="color: #1e3a8a; font-weight: bold;">৳${currentPriceBDT} BDT</span></p>
          </div>
          <p style="color: #64748b; font-size: 13px;">You're receiving this because you added this category to your TradeLink watchlist. This watch has now paused — visit your Watchlist page to reactivate it.</p>
        </div>
      `;

      await transporter.sendMail({
        from: `TradeLink <${fromAddress}>`,
        to: toEmail,
        subject: `TradeLink Watchlist Alert: ${categoryName} ${directionLabel} ৳${thresholdBDT}`,
        text: textBody,
        html: htmlBody,
      });

      logger.info(`[Email] Watchlist alert sent to ${toEmail} for ${categoryName}.`);
      return true;
    } catch (err) {
      logger.error(`[Email] Failed to send watchlist alert to ${toEmail}: ${err.message}`);
      return false;
    }
  },
};

module.exports = emailService;
