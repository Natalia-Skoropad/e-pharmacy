import { USER_ROLES, USER_STATUSES } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { User } from '../models/user.model';

import type {
  AuthResponse,
  AuthUserResponse,
  LoginInput,
  RegisterInput,
  UpdatePasswordInput,
  UpdateProfileInput,
} from '../types/auth';

import { httpError } from '../utils/httpError';
import { signToken } from '../utils/jwt';
import { isDuplicateEmailError } from '../utils/mongoError';
import { comparePassword, hashPassword } from '../utils/password';
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
