import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import type { PharmacyVerificationDocumentMetadata } from '../types/pharmacy';
import { PharmacyDocumentFile } from '../models/pharmacyDocumentFile.model';
import { Session } from '../models/session.model';
import { User } from '../models/user.model';
import { comparePassword, hashPassword } from '../utils/password';
import { createPharmacyUserByAdminService } from './admin.service';

import {
  createPrivatePharmacyDocumentUploadService,
  createRegistrationPharmacyDocumentUploadService,
  getAdminPharmacyDocumentContentService,
  getPrivatePharmacyDocumentContentService,
} from './pharmacy-document.service';

import {
  getMyPharmacyProfileService,
  updateMyPharmacyProfileService,
} from './pharmacy.service';

import {
  loginUserService,
  refreshAuthSessionService,
  registerUserService,
  resetPasswordService,
  updateUserPasswordService,
} from './auth.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;

//===============================================================

function getTestMongoUri(): string {
  if (!TEST_MONGODB_URI) {
    throw new Error(
      'E_PHARMACY_TEST_MONGODB_URI is required for Mongo integration tests.'
    );
  }
  return TEST_MONGODB_URI;
}

//===============================================================

function uniqueIdentity(prefix: string) {
  const suffix = new Types.ObjectId().toHexString();
  return {
    email: `${prefix}-${suffix}@example.com`,
    phone: `+380${suffix.slice(-9).replace(/[a-f]/gi, '1')}`,
  };
}

//===============================================================

async function cleanup(email: string): Promise<void> {
  const user = await User.findOne({ email }).lean<{
    _id: Types.ObjectId;
  } | null>();
  if (!user) return;
  await Promise.all([
    Client.deleteMany({ userId: user._id }),
    Pharmacy.deleteMany({ ownerId: user._id }),
    Session.deleteMany({ userId: user._id }),
    PharmacyDocumentFile.deleteMany({ uploadedByUserId: user._id }),
  ]);
  await User.deleteOne({ _id: user._id });
}

//===============================================================

test(
  'registration rolls User back when Client creation fails',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('client-rollback');
    const originalCreate = Client.create.bind(Client);

    try {
      Client.create = (async () => {
        throw new Error('forced client profile failure');
      }) as typeof Client.create;

      await assert.rejects(
        () =>
          registerUserService({
            name: 'Client Rollback',
            email: identity.email,
            phone: identity.phone,
            password: 'SecurePassword123!',
            role: 'client',
          }),
        /forced client profile failure/
      );

      assert.equal(await User.exists({ email: identity.email }), null);
    } finally {
      Client.create = originalCreate as typeof Client.create;
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'registration rolls User and Pharmacy back when document claim fails',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('pharmacy-rollback');

    try {
      await assert.rejects(() =>
        registerUserService({
          name: 'Pharmacy Rollback',
          email: identity.email,
          phone: identity.phone,
          password: 'SecurePassword123!',
          role: 'pharmacy',
          pharmacyDocuments: [
            {
              documentId: new Types.ObjectId().toHexString(),
              claimToken: 'a'.repeat(64),
            },
          ],
        })
      );

      assert.equal(await User.exists({ email: identity.email }), null);
      assert.equal(await Pharmacy.exists({ email: identity.email }), null);
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'session creation failure does not roll back a committed registration',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('session-failure');
    const originalCreate = Session.create.bind(Session);

    try {
      Session.create = (async () => {
        throw new Error('forced session failure');
      }) as typeof Session.create;

      await assert.rejects(
        () =>
          registerUserService({
            name: 'Session Failure',
            email: identity.email,
            phone: identity.phone,
            password: 'SecurePassword123!',
            role: 'client',
          }),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'AUTH_REGISTRATION_SESSION_FAILED'
      );

      const user = await User.findOne({ email: identity.email });
      assert.ok(user);
      assert.ok(await Client.exists({ userId: user._id }));
    } finally {
      Session.create = originalCreate as typeof Session.create;
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'concurrent duplicate email registration creates one identity only',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('duplicate-email');

    try {
      const results = await Promise.allSettled([
        registerUserService({
          name: 'Duplicate A',
          email: identity.email,
          phone: identity.phone,
          password: 'SecurePassword123!',
          role: 'client',
        }),
        registerUserService({
          name: 'Duplicate B',
          email: identity.email,
          phone: `+380${new Types.ObjectId().toHexString().slice(-9).replace(/[a-f]/gi, '2')}`,
          password: 'SecurePassword123!',
          role: 'client',
        }),
      ]);

      assert.equal(
        results.filter((result) => result.status === 'fulfilled').length,
        1
      );
      assert.equal(await User.countDocuments({ email: identity.email }), 1);
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'concurrent duplicate phone registration creates one identity only',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('duplicate-phone');
    const secondEmail = uniqueIdentity('duplicate-phone-b').email;

    try {
      const results = await Promise.allSettled([
        registerUserService({
          name: 'Phone A',
          email: identity.email,
          phone: identity.phone,
          password: 'SecurePassword123!',
          role: 'client',
        }),
        registerUserService({
          name: 'Phone B',
          email: secondEmail,
          phone: identity.phone,
          password: 'SecurePassword123!',
          role: 'client',
        }),
      ]);

      assert.equal(
        results.filter((result) => result.status === 'fulfilled').length,
        1
      );
      assert.equal(await User.countDocuments({ phone: identity.phone }), 1);
    } finally {
      await cleanup(identity.email);
      await cleanup(secondEmail);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'password change and revoke-all roll back together when session update fails',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('password-rollback');
    const oldPassword = 'SecurePassword123!';
    const newPassword = 'SecurePassword456!';
    const originalUpdateMany = Session.updateMany;

    try {
      const user = await User.create({
        name: 'Password Rollback',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword(oldPassword),
        role: 'client',
      });
      await Client.create({ userId: user._id });

      Object.defineProperty(Session, 'updateMany', {
        configurable: true,
        writable: true,
        value: async () => {
          throw new Error('forced revoke failure');
        },
      });

      await assert.rejects(
        () =>
          updateUserPasswordService(String(user._id), {
            currentPassword: oldPassword,
            newPassword,
          }),
        /forced revoke failure/
      );

      const persisted = await User.findById(user._id).select('+password');
      assert.ok(persisted);
      assert.equal(
        await comparePassword(oldPassword, persisted.password),
        true
      );
      assert.equal(
        await comparePassword(newPassword, persisted.password),
        false
      );
    } finally {
      Object.defineProperty(Session, 'updateMany', {
        configurable: true,
        writable: true,
        value: originalUpdateMany,
      });
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'one reset token has exactly one successful concurrent consumer',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('reset-race');
    const token =
      new Types.ObjectId().toHexString() + new Types.ObjectId().toHexString();
    const tokenHash = createHash('sha256').update(token).digest('hex');

    try {
      const user = await User.create({
        name: 'Reset Race',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'client',
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: new Date(Date.now() + 60_000),
        resetPasswordApplication: 'client',
      });
      await Client.create({ userId: user._id });

      const results = await Promise.allSettled([
        resetPasswordService({ token, newPassword: 'RacePassword111!' }),
        resetPasswordService({ token, newPassword: 'RacePassword222!' }),
      ]);

      assert.equal(
        results.filter((result) => result.status === 'fulfilled').length,
        1
      );
      assert.equal(
        results.filter((result) => result.status === 'rejected').length,
        1
      );
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'password change revokes refresh tokens from all existing devices',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('refresh-revoke');
    const oldPassword = 'SecurePassword123!';

    try {
      const user = await User.create({
        name: 'Refresh Revoke',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword(oldPassword),
        role: 'client',
      });
      await Client.create({ userId: user._id });

      const first = await loginUserService({
        email: identity.email,
        password: oldPassword,
        application: 'client',
      });
      const second = await loginUserService({
        email: identity.email,
        password: oldPassword,
        application: 'client',
      });

      await updateUserPasswordService(String(user._id), {
        currentPassword: oldPassword,
        newPassword: 'SecurePassword456!',
      });

      await assert.rejects(() =>
        refreshAuthSessionService(first.tokens.refreshToken)
      );
      await assert.rejects(() =>
        refreshAuthSessionService(second.tokens.refreshToken)
      );
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'login does not enumerate unknown accounts, wrong passwords or wrong applications',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('login-enumeration');
    const password = 'SecurePassword123!';

    try {
      const user = await User.create({
        name: 'Login Enumeration',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword(password),
        role: 'client',
      });
      await Client.create({ userId: user._id });

      const attempts = [
        () =>
          loginUserService({
            email: `unknown-${identity.email}`,
            password: 'WrongPassword123!',
            application: 'client',
          }),
        () =>
          loginUserService({
            email: identity.email,
            password: 'WrongPassword123!',
            application: 'client',
          }),
        () =>
          loginUserService({
            email: identity.email,
            password,
            application: 'pharmacy',
          }),
      ];

      for (const attempt of attempts) {
        await assert.rejects(
          attempt,
          (error: unknown) =>
            error instanceof Error &&
            'status' in error &&
            'code' in error &&
            error.status === 401 &&
            error.code === 'AUTH_INVALID_CREDENTIALS'
        );
      }

      user.status = 'blocked';
      await user.save();

      await assert.rejects(
        () =>
          loginUserService({
            email: identity.email,
            password: 'WrongPassword123!',
            application: 'client',
          }),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'AUTH_INVALID_CREDENTIALS'
      );

      await assert.rejects(
        () =>
          loginUserService({
            email: identity.email,
            password,
            application: 'client',
          }),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'AUTH_USER_BLOCKED'
      );
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'admin-created pharmacy rolls User back when Pharmacy creation fails',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('admin-pharmacy-rollback');
    const originalCreate = Pharmacy.create.bind(Pharmacy);

    try {
      Pharmacy.create = (async () => {
        throw new Error('forced pharmacy create failure');
      }) as typeof Pharmacy.create;

      await assert.rejects(
        () =>
          createPharmacyUserByAdminService(
            {
              name: 'Admin Pharmacy Rollback',
              email: identity.email,
              phone: identity.phone,
              password: 'SecurePassword123!',
            },
            new Types.ObjectId().toHexString()
          ),
        /forced pharmacy create failure/
      );

      assert.equal(await User.exists({ email: identity.email }), null);
    } finally {
      Pharmacy.create = originalCreate as typeof Pharmacy.create;
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'reading a missing pharmacy profile reports integrity failure without auto-creating one',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('missing-pharmacy-profile');

    try {
      const user = await User.create({
        name: 'Missing Pharmacy Profile',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      await assert.rejects(
        () => getMyPharmacyProfileService(String(user._id)),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'PHARMACY_PROFILE_MISSING'
      );

      assert.equal(await Pharmacy.exists({ ownerId: user._id }), null);
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'pharmacy registration stores verified binary evidence and exposes it only through controlled access services',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('document-storage');
    const content = Buffer.from('%PDF-1.4');

    try {
      const uploaded = await createRegistrationPharmacyDocumentUploadService({
        name: 'license.pdf',
        size: content.byteLength,
        type: 'application/pdf',
        dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
      });

      const registration = await registerUserService({
        name: 'Document Storage',
        email: identity.email,
        phone: identity.phone,
        password: 'SecurePassword123!',
        role: 'pharmacy',
        pharmacyDocuments: [
          {
            documentId: uploaded.document.id,
            claimToken: uploaded.claimToken,
          },
        ],
      });

      const pharmacy = await Pharmacy.findOne({
        ownerId: registration.user.id,
      });
      assert.ok(pharmacy);
      assert.equal(pharmacy.documents.length, 1);
      assert.equal(pharmacy.documents[0]?.sha256, uploaded.document.sha256);

      const stored = await PharmacyDocumentFile.findById(
        uploaded.document.id
      ).select('+content');

      assert.ok(stored?.content);
      assert.deepEqual(stored.content, content);

      const ownerContent = await getPrivatePharmacyDocumentContentService(
        registration.user.id,
        uploaded.document.id
      );

      const adminContent = await getAdminPharmacyDocumentContentService(
        String(pharmacy._id),
        uploaded.document.id
      );

      assert.equal(ownerContent.dataUrl, adminContent.dataUrl);

      assert.equal(
        ownerContent.dataUrl,
        `data:application/pdf;base64,${content.toString('base64')}`
      );
    } finally {
      await cleanup(identity.email);
      await PharmacyDocumentFile.deleteMany({ name: 'license.pdf' });
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'pharmacy document upload rejects MIME and size spoofing',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const content = Buffer.from('%PDF-1.4');

    try {
      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'license.png',
          size: content.byteLength,
          type: 'image/png',
          dataUrl: `data:image/png;base64,${content.toString('base64')}`,
        })
      );

      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'license.pdf',
          size: content.byteLength + 1,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
        })
      );
    } finally {
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'private pharmacy document replacement and removal use server document IDs',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('document-replace');
    const firstContent = Buffer.from('%PDF-1.4');
    const secondContent = Buffer.from('%PDF-1.5');

    try {
      const user = await User.create({
        name: 'Document Replace',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      const pharmacy = await Pharmacy.create({
        ownerId: user._id,
        managerUserIds: [],
        name: '',
        phone: identity.phone,
        email: identity.email,
        documents: [],
        status: 'new',
      });

      const first = await createPrivatePharmacyDocumentUploadService(
        String(user._id),
        {
          name: 'first.pdf',
          size: firstContent.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${firstContent.toString('base64')}`,
        }
      );

      const second = await createPrivatePharmacyDocumentUploadService(
        String(user._id),
        {
          name: 'second.pdf',
          size: secondContent.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${secondContent.toString('base64')}`,
        }
      );

      await updateMyPharmacyProfileService(String(user._id), {
        documents: [{ documentId: first.document.id }],
      });

      await updateMyPharmacyProfileService(String(user._id), {
        documents: [{ documentId: second.document.id }],
      });

      let persisted = await Pharmacy.findById(pharmacy._id);

      assert.deepEqual(
        persisted?.documents.map(
          (document: PharmacyVerificationDocumentMetadata) => document.id
        ),
        [second.document.id]
      );

      await updateMyPharmacyProfileService(String(user._id), { documents: [] });
      persisted = await Pharmacy.findById(pharmacy._id);
      assert.deepEqual(persisted?.documents, []);
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);
