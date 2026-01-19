import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['user'], index: true },
  refreshTokenHash: { type: String }
}, { timestamps: true });

userSchema.methods.setPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};
userSchema.methods.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};
userSchema.methods.setRefreshToken = async function(token) {
  const salt = await bcrypt.genSalt(10);
  this.refreshTokenHash = await bcrypt.hash(token, salt);
};
userSchema.methods.verifyRefreshToken = async function(token) {
  if (!this.refreshTokenHash) return false;
  return bcrypt.compare(token, this.refreshTokenHash);
};

export const User = mongoose.model('User', userSchema);
