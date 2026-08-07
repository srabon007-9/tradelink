/**
 * services/auth.service.js — Authentication Business Logic
 *
 * Contains all auth business logic. Controllers call this, never models directly.
 *
 * TODO (Member 1 — Backend):
 *  - registerUser(data)          → creates client or operations user and sends verification email
 *  - loginUser(email, password)  → validates creds, returns tokens
 *  - refreshAccessToken(token)   → validates refresh token, issues new access token
 *  - forgotPassword(email)       → generates reset token, sends email
 *  - resetPassword(token, pass)  → validates token, updates password
 *  - verifyEmail(token)          → marks user as verified
 *  - generateTokens(userId)      → creates access + refresh JWT pair
 */

'use strict';

const authService = {};

module.exports = authService;
