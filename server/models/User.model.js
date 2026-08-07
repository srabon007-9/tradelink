/**
 * models/User.model.js — User Schema
 *
 * TODO (Member 1 — Backend):
 *
 * Fields to implement:
 *  - name          String, required
 *  - email         String, required, unique, lowercase
 *  - password      String, required (hashed via bcrypt)
 *  - avatar        String (Cloudinary URL)
 *  - bio           String
 *  - company       String
 *  - phone         String
 *  - role          Enum: ['client', 'operations', 'admin']
 *  - assignedProjects [ObjectId] ref: 'Project'
 *  - isVerified    Boolean, default: false
 *  - createdAt     Date (via timestamps)
 *  - updatedAt     Date (via timestamps)
 *
 * Methods to implement:
 *  - comparePassword(candidatePassword)  → Boolean
 *  - toPublicJSON()                       → safe object (no password)
 */

'use strict';

// Schema will be implemented in the authentication feature sprint.
// const UserSchema = new mongoose.Schema({ ... }, { timestamps: true });

// const User = mongoose.model('User', UserSchema);
// module.exports = User;

module.exports = {};
