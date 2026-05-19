import { createHash, randomBytes } from 'node:crypto';

import { env } from '../config/env';
import { USER_ROLES, USER_STATUSES } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { User } from '../models/user.model';

import type {
  AuthResponse,
  AuthUserResponse,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  RegisterInput,
  UpdatePasswordInput,
  UpdateProfileInput,
} from '../types/auth';

import { httpError } from '../utils/httpError';
import { signToken } from '../utils/jwt';
import { isDuplicateEmailError } from '../utils/mongoError';
import { comparePassword, hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from '../utils/passwordResetEmail';
import { toAuthUserResponse } from '../utils/userResponse';

//===============================================================

export async function registerUserService(
  input: RegisterInput
): Promise<AuthResponse> {
  const existingUser = await User.findOne({ email: input.email });

  if (existingUser) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  }

  const hashedPassword = await hashPassword(input.password);

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role || USER_ROLES.CUSTOMER,
      phone: input.phone,
      address: input.address,
    });

    const token = signToken({
      userId: String(user._id),
      role: user.role,
    });

    return {
      user: toAuthUserResponse(user),
      token,
    };
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
    }

    throw error;
  }
}

//===============================================================

export async function loginUserService(
  input: LoginInput
): Promise<AuthResponse> {
  const user = await User.findOne({ email: input.email }).select('+password');

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_CREDENTIALS);
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.USER_BLOCKED);
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_CREDENTIALS);
  }

  const token = signToken({
    userId: String(user._id),
    role: user.role,
  });

  return {
    user: toAuthUserResponse(user),
    token,
  };
}


//===============================================================

function buildPasswordResetUrl(token: string): string {
  const url = new URL('/reset-password', env.CLIENT_APP_URL);

  url.searchParams.set('token', token);

  return url.toString();
}

//===============================================================

function createPasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

//===============================================================

function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

//===============================================================

function parseResetTokenTtlMs(value: string): number {
  const match = value.trim().match(/^(\d+)(s|m|h|d)?$/i);

  if (!match) return 15 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = (match[2] || 'm').toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] || multipliers.m);
}

//===============================================================

function getPasswordResetExpiresAt(): Date {
  return new Date(
    Date.now() + parseResetTokenTtlMs(String(env.JWT_RESET_EXPIRES_IN))
  );
}

//===============================================================

export async function requestPasswordResetService(
  input: ForgotPasswordInput
): Promise<void> {
  const user = await User.findOne({ email: input.email });

  // Anti user enumeration: the controller returns the same 200 response
  // whether the account exists or not.
  if (!user || user.status === USER_STATUSES.BLOCKED) {
    return;
  }

  const resetToken = createPasswordResetToken();

  user.resetPasswordTokenHash = hashPasswordResetToken(resetToken);
  user.resetPasswordExpiresAt = getPasswordResetExpiresAt();

  await user.save();

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl: buildPasswordResetUrl(resetToken),
  });
}

//===============================================================

export async function resetPasswordService(
  input: ResetPasswordInput
): Promise<void> {
  const tokenHash = hashPasswordResetToken(input.token);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+password +resetPasswordTokenHash +resetPasswordExpiresAt');

  if (!user || user.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      API_MESSAGES.PASSWORD_RESET_TOKEN_INVALID
    );
  }

  user.password = await hashPassword(input.newPassword);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;

  await user.save();
}

//===============================================================

export async function getUserByIdService(
  userId: string
): Promise<AuthUserResponse> {
  const user = await User.findById(userId);

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.USER_BLOCKED);
  }

  return toAuthUserResponse(user);
}


//===============================================================

export async function updateUserProfileService(
  userId: string,
  input: UpdateProfileInput
): Promise<AuthUserResponse> {
  const update: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  if (typeof input.name === 'string') update.name = input.name;

  if (typeof input.phone === 'string') {
    if (input.phone) update.phone = input.phone;
    else unset.phone = '';
  }

  if (typeof input.address === 'string') {
    if (input.address) update.address = input.address;
    else unset.address = '';
  }

  if ('avatarUrl' in input) {
    if (input.avatarUrl) update.avatarUrl = input.avatarUrl;
    else unset.avatarUrl = '';
  }

  const updateQuery: Record<string, unknown> = {};

  if (Object.keys(update).length > 0) updateQuery.$set = update;
  if (Object.keys(unset).length > 0) updateQuery.$unset = unset;

  const user = await User.findByIdAndUpdate(userId, updateQuery, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  return toAuthUserResponse(user);
}

//===============================================================

export async function updateUserPasswordService(
  userId: string,
  input: UpdatePasswordInput
): Promise<void> {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  const isCurrentPasswordValid = await comparePassword(
    input.currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
  }

  user.password = await hashPassword(input.newPassword);
  await user.save();
}
