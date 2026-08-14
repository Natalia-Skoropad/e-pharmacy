import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { PHARMACY_DOCUMENT_RULES } from '../constants/pharmacy-document-validation';
import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import type { PharmacyVerificationDocumentMetadata } from '../types/pharmacy';
import { PharmacyDocumentFile } from '../models/pharmacyDocumentFile.model';
import { PharmacyRegistrationUploadSession } from '../models/pharmacyRegistrationUploadSession.model';
import { Session } from '../models/session.model';
import { User } from '../models/user.model';
import { comparePassword, hashPassword } from '../utils/password';

import {
  createPharmacyUserByAdminService,
  updatePharmacyStatusByAdminService,
} from './admin.service';

import {
  createPrivatePharmacyDocumentUploadService,
  createRegistrationPharmacyDocumentUploadService,
  createRegistrationPharmacyDocumentUploadSessionService,
  getAdminPharmacyDocumentContentService,
  getPrivatePharmacyDocumentContentService,
} from './pharmacy-document.service';

import {
  getMyPharmacyProfileService,
  sendMyPharmacyForVerificationService,
  updateMyPharmacyProfileService,
} from './pharmacy.service';

import {
  loginUserService,
  refreshAuthSessionService,
  registerUserService,
  resetPasswordService,
  revokeAllUserSessionsByRefreshTokensService,
  revokeSessionByRefreshTokenService,
  updateUserPasswordService,
  updateUserProfileService,
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

  const registrationUploadSessionIds = await PharmacyDocumentFile.find({
    uploadedByUserId: user._id,
    registrationUploadSessionId: { $exists: true },
  }).distinct('registrationUploadSessionId');

  await Promise.all([
    Client.deleteMany({ userId: user._id }),
    Pharmacy.deleteMany({ ownerId: user._id }),
    Session.deleteMany({ userId: user._id }),
    PharmacyDocumentFile.deleteMany({ uploadedByUserId: user._id }),
    PharmacyRegistrationUploadSession.deleteMany({
      _id: { $in: registrationUploadSessionIds },
    }),
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
    const pharmacyIdentity = uniqueIdentity('login-enumeration-pharmacy');
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

      await User.create({
        name: 'Login Enumeration Pharmacy',
        email: pharmacyIdentity.email,
        phone: pharmacyIdentity.phone,
        password: await hashPassword(password),
        role: 'pharmacy',
      });

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
        () =>
          loginUserService({
            email: pharmacyIdentity.email,
            password,
            application: 'client',
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
      await cleanup(pharmacyIdentity.email);
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
  'pharmacy profile document attachment is status-checked and atomic with the Pharmacy update',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('profile-document-atomicity');
    const content = Buffer.from('%PDF-1.4');
    const originalFindByIdAndUpdate = Pharmacy.findByIdAndUpdate.bind(Pharmacy);

    try {
      const user = await User.create({
        name: 'Profile Document Atomicity',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      const pharmacy = await Pharmacy.create({
        ownerId: user._id,
        managerUserIds: [],
        name: '',
        phone: user.phone,
        email: user.email,
        documents: [],
        status: 'new',
      });

      const uploaded = await createPrivatePharmacyDocumentUploadService(
        String(user._id),
        {
          name: 'atomic-license.pdf',
          size: content.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
        }
      );

      pharmacy.status = 'on_verification';
      await pharmacy.save();

      await assert.rejects(
        () =>
          updateMyPharmacyProfileService(String(user._id), {
            documents: [{ documentId: uploaded.document.id }],
          }),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'PHARMACY_PROFILE_LOCKED'
      );

      let stored = await PharmacyDocumentFile.findById(uploaded.document.id);
      assert.ok(stored?.expiresAt);
      assert.equal(stored.attachedAt, undefined);

      pharmacy.status = 'new';
      await pharmacy.save();

      Pharmacy.findByIdAndUpdate = (async () => {
        throw new Error('forced pharmacy profile write failure');
      }) as unknown as typeof Pharmacy.findByIdAndUpdate;

      await assert.rejects(
        () =>
          updateMyPharmacyProfileService(String(user._id), {
            documents: [{ documentId: uploaded.document.id }],
          }),
        /forced pharmacy profile write failure/
      );

      stored = await PharmacyDocumentFile.findById(uploaded.document.id);
      assert.ok(stored?.expiresAt);
      assert.equal(stored.attachedAt, undefined);

      Pharmacy.findByIdAndUpdate =
        originalFindByIdAndUpdate as typeof Pharmacy.findByIdAndUpdate;

      const saved = await updateMyPharmacyProfileService(String(user._id), {
        documents: [{ documentId: uploaded.document.id }],
      });

      assert.equal(saved.pharmacy.documents.length, 1);
      assert.equal(saved.pharmacy.documents[0]?.id, uploaded.document.id);

      stored = await PharmacyDocumentFile.findById(uploaded.document.id);
      assert.ok(stored?.attachedAt);
      assert.equal(stored.expiresAt, undefined);
    } finally {
      Pharmacy.findByIdAndUpdate =
        originalFindByIdAndUpdate as typeof Pharmacy.findByIdAndUpdate;
      await cleanup(identity.email);
      await PharmacyDocumentFile.deleteMany({ name: 'atomic-license.pdf' });
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
      const uploadSession =
        await createRegistrationPharmacyDocumentUploadSessionService();
      const uploaded = await createRegistrationPharmacyDocumentUploadService({
        name: 'license.pdf',
        size: content.byteLength,
        type: 'application/pdf',
        dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
        uploadSessionId: uploadSession.uploadSessionId,
        uploadToken: uploadSession.uploadToken,
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
      assert.equal(
        await PharmacyRegistrationUploadSession.exists({
          _id: uploadSession.uploadSessionId,
        }),
        null
      );

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
    let uploadSessionId: string | undefined;

    try {
      const uploadSession =
        await createRegistrationPharmacyDocumentUploadSessionService();
      uploadSessionId = uploadSession.uploadSessionId;

      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'license.png',
          size: content.byteLength,
          type: 'image/png',
          dataUrl: `data:image/png;base64,${content.toString('base64')}`,
          uploadSessionId: uploadSession.uploadSessionId,
          uploadToken: uploadSession.uploadToken,
        })
      );

      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'license.pdf',
          size: content.byteLength + 1,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
          uploadSessionId: uploadSession.uploadSessionId,
          uploadToken: uploadSession.uploadToken,
        })
      );
    } finally {
      if (uploadSessionId) {
        await PharmacyRegistrationUploadSession.deleteOne({
          _id: uploadSessionId,
        });
      }
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'registration upload sessions enforce file-count, aggregate-byte and expiry quotas',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const content = Buffer.from('%PDF-1.4');
    const uploadSessionIds: string[] = [];

    try {
      const countSession =
        await createRegistrationPharmacyDocumentUploadSessionService();
      uploadSessionIds.push(countSession.uploadSessionId);

      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'wrong-token.pdf',
          size: content.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
          uploadSessionId: countSession.uploadSessionId,
          uploadToken: '0'.repeat(64),
        })
      );

      for (
        let index = 0;
        index < PHARMACY_DOCUMENT_RULES.maxFiles;
        index += 1
      ) {
        await createRegistrationPharmacyDocumentUploadService({
          name: `license-${index}.pdf`,
          size: content.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
          uploadSessionId: countSession.uploadSessionId,
          uploadToken: countSession.uploadToken,
        });
      }

      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'license-seventh.pdf',
          size: content.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
          uploadSessionId: countSession.uploadSessionId,
          uploadToken: countSession.uploadToken,
        })
      );

      const bytesSession =
        await createRegistrationPharmacyDocumentUploadSessionService();
      uploadSessionIds.push(bytesSession.uploadSessionId);
      await PharmacyRegistrationUploadSession.updateOne(
        { _id: bytesSession.uploadSessionId },
        {
          $set: {
            uploadedBytes:
              PHARMACY_DOCUMENT_RULES.maxTotalSizeBytes -
              content.byteLength +
              1,
          },
        }
      );

      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'over-total.pdf',
          size: content.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
          uploadSessionId: bytesSession.uploadSessionId,
          uploadToken: bytesSession.uploadToken,
        })
      );

      const expiredSession =
        await createRegistrationPharmacyDocumentUploadSessionService();
      uploadSessionIds.push(expiredSession.uploadSessionId);
      await PharmacyRegistrationUploadSession.updateOne(
        { _id: expiredSession.uploadSessionId },
        { $set: { expiresAt: new Date(Date.now() - 1_000) } }
      );

      await assert.rejects(() =>
        createRegistrationPharmacyDocumentUploadService({
          name: 'expired.pdf',
          size: content.byteLength,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
          uploadSessionId: expiredSession.uploadSessionId,
          uploadToken: expiredSession.uploadToken,
        })
      );
    } finally {
      await PharmacyDocumentFile.deleteMany({
        registrationUploadSessionId: { $in: uploadSessionIds },
      });
      await PharmacyRegistrationUploadSession.deleteMany({
        _id: { $in: uploadSessionIds },
      });
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'pharmacy registration rejects document claims from different upload sessions atomically',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('cross-upload-session');
    const content = Buffer.from('%PDF-1.4');
    const uploadSessionIds: string[] = [];
    const documentIds: string[] = [];

    try {
      const firstSession =
        await createRegistrationPharmacyDocumentUploadSessionService();
      const secondSession =
        await createRegistrationPharmacyDocumentUploadSessionService();
      uploadSessionIds.push(
        firstSession.uploadSessionId,
        secondSession.uploadSessionId
      );

      const first = await createRegistrationPharmacyDocumentUploadService({
        name: 'first-license.pdf',
        size: content.byteLength,
        type: 'application/pdf',
        dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
        uploadSessionId: firstSession.uploadSessionId,
        uploadToken: firstSession.uploadToken,
      });
      const second = await createRegistrationPharmacyDocumentUploadService({
        name: 'second-license.pdf',
        size: content.byteLength,
        type: 'application/pdf',
        dataUrl: `data:application/pdf;base64,${content.toString('base64')}`,
        uploadSessionId: secondSession.uploadSessionId,
        uploadToken: secondSession.uploadToken,
      });
      documentIds.push(first.document.id, second.document.id);

      await assert.rejects(() =>
        registerUserService({
          name: 'Cross Upload Session',
          email: identity.email,
          phone: identity.phone,
          password: 'SecurePassword123!',
          role: 'pharmacy',
          pharmacyDocuments: [
            { documentId: first.document.id, claimToken: first.claimToken },
            { documentId: second.document.id, claimToken: second.claimToken },
          ],
        })
      );

      assert.equal(await User.exists({ email: identity.email }), null);
      assert.equal(await Pharmacy.exists({ email: identity.email }), null);

      const storedDocuments = await PharmacyDocumentFile.find({
        _id: { $in: documentIds },
      });
      assert.equal(storedDocuments.length, 2);
      for (const document of storedDocuments) {
        assert.equal(document.claimedByPharmacyId, undefined);
        assert.equal(document.uploadedByUserId, undefined);
        assert.ok(document.expiresAt);
      }

      assert.equal(
        await PharmacyRegistrationUploadSession.countDocuments({
          _id: { $in: uploadSessionIds },
        }),
        2
      );
    } finally {
      await PharmacyDocumentFile.deleteMany({ _id: { $in: documentIds } });
      await PharmacyRegistrationUploadSession.deleteMany({
        _id: { $in: uploadSessionIds },
      });
      await cleanup(identity.email);
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

//===============================================================

test(
  'pharmacy activation rolls back when default User creation fails',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const ownerIdentity = uniqueIdentity('activation-user-rollback');
    const conflictIdentity = uniqueIdentity('activation-user-conflict');
    let conflictEmail = '';

    try {
      const owner = await User.create({
        name: 'Activation Owner',
        email: ownerIdentity.email,
        phone: ownerIdentity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      const pharmacy = await Pharmacy.create({
        ownerId: owner._id,
        name: 'Activation Rollback Pharmacy',
        email: ownerIdentity.email,
        phone: ownerIdentity.phone,
        status: 'new',
      });

      conflictEmail = `walk-in+${String(pharmacy._id)}@e-pharmacy.local`;

      await User.create({
        name: 'Default Email Conflict',
        email: conflictEmail,
        phone: conflictIdentity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'client',
      });

      await assert.rejects(() =>
        updatePharmacyStatusByAdminService(
          String(pharmacy._id),
          { status: 'active' },
          new Types.ObjectId().toHexString()
        )
      );

      const persisted = await Pharmacy.findById(pharmacy._id).lean<{
        status: string;
        approvedAt?: Date;
        activatedAt?: Date;
      } | null>();

      assert.equal(persisted?.status, 'new');
      assert.equal(persisted?.approvedAt, undefined);
      assert.equal(persisted?.activatedAt, undefined);

      assert.equal(
        await User.exists({
          isDefaultPharmacyClient: true,
          defaultClientPharmacyId: pharmacy._id,
        }),
        null
      );
    } finally {
      await User.deleteMany({
        email: {
          $in: [ownerIdentity.email, conflictIdentity.email, conflictEmail],
        },
      });
      await Pharmacy.deleteMany({ email: ownerIdentity.email });
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'pharmacy activation rolls back User and pharmacy status when Client creation fails',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const ownerIdentity = uniqueIdentity('activation-client-rollback');
    const originalFindOneAndUpdate = Client.findOneAndUpdate;

    try {
      const owner = await User.create({
        name: 'Activation Client Rollback',
        email: ownerIdentity.email,
        phone: ownerIdentity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      const pharmacy = await Pharmacy.create({
        ownerId: owner._id,
        name: 'Activation Client Rollback Pharmacy',
        email: ownerIdentity.email,
        phone: ownerIdentity.phone,
        status: 'new',
      });

      Object.defineProperty(Client, 'findOneAndUpdate', {
        configurable: true,
        writable: true,
        value: async () => {
          throw new Error('forced default client creation failure');
        },
      });

      await assert.rejects(
        () =>
          updatePharmacyStatusByAdminService(
            String(pharmacy._id),
            { status: 'active' },
            new Types.ObjectId().toHexString()
          ),
        /forced default client creation failure/
      );

      const persisted = await Pharmacy.findById(pharmacy._id).lean<{
        status: string;
      } | null>();

      assert.equal(persisted?.status, 'new');

      assert.equal(
        await User.exists({
          isDefaultPharmacyClient: true,
          defaultClientPharmacyId: pharmacy._id,
        }),
        null
      );
    } finally {
      Object.defineProperty(Client, 'findOneAndUpdate', {
        configurable: true,
        writable: true,
        value: originalFindOneAndUpdate,
      });

      await cleanup(ownerIdentity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'logout revokes only the current refresh session while logout-all revokes every device',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('logout-lifecycle');
    const password = 'SecurePassword123!';

    try {
      const user = await User.create({
        name: 'Logout Lifecycle',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword(password),
        role: 'client',
      });

      await Client.create({ userId: user._id });

      const first = await loginUserService({
        email: identity.email,
        password,
        application: 'client',
      });

      const second = await loginUserService({
        email: identity.email,
        password,
        application: 'client',
      });

      await revokeSessionByRefreshTokenService(first.tokens.refreshToken);

      await assert.rejects(() =>
        refreshAuthSessionService(first.tokens.refreshToken)
      );

      await refreshAuthSessionService(second.tokens.refreshToken);
      await revokeAllUserSessionsByRefreshTokensService([
        second.tokens.refreshToken,
      ]);

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
  'refresh rotation is race-safe, bounded by an absolute lifetime, and revokes reuse after grace',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('refresh-rotation');
    const password = 'SecurePassword123!';

    try {
      const user = await User.create({
        name: 'Refresh Rotation',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword(password),
        role: 'client',
      });
      await Client.create({ userId: user._id });

      const login = await loginUserService({
        email: identity.email,
        password,
        application: 'client',
      });

      const before = await Session.findOne({ userId: user._id }).select(
        '+refreshTokenHash +previousRefreshTokenHash absoluteExpiresAt expiresAt'
      );
      assert.ok(before?.absoluteExpiresAt);
      const absoluteBefore = before.absoluteExpiresAt.getTime();

      const [firstRefresh, parallelRefresh] = await Promise.all([
        refreshAuthSessionService(login.tokens.refreshToken),
        refreshAuthSessionService(login.tokens.refreshToken),
      ]);

      assert.notEqual(
        firstRefresh.tokens.refreshToken,
        login.tokens.refreshToken
      );
      assert.equal(
        parallelRefresh.tokens.refreshToken,
        firstRefresh.tokens.refreshToken
      );

      const after = await Session.findById(before._id).select(
        '+refreshTokenHash +previousRefreshTokenHash previousRefreshTokenValidUntil absoluteExpiresAt expiresAt'
      );
      assert.ok(after?.absoluteExpiresAt);
      assert.equal(after.absoluteExpiresAt.getTime(), absoluteBefore);
      assert.ok(after.expiresAt <= after.absoluteExpiresAt);
      assert.equal(
        after.refreshTokenHash,
        createHash('sha256')
          .update(firstRefresh.tokens.refreshToken)
          .digest('hex')
      );
      assert.equal(
        after.previousRefreshTokenHash,
        createHash('sha256').update(login.tokens.refreshToken).digest('hex')
      );

      await Session.updateOne(
        { _id: after._id },
        {
          $set: {
            previousRefreshTokenValidUntil: new Date(Date.now() - 1_000),
          },
        }
      );

      await assert.rejects(
        () =>
          refreshAuthSessionService(login.tokens.refreshToken, undefined, [
            login.tokens.refreshToken,
            firstRefresh.tokens.refreshToken,
          ]),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'AUTH_SESSION_INVALID'
      );

      const afterStaleCookie = await Session.findById(after._id).select(
        'revokedAt'
      );
      assert.equal(afterStaleCookie?.revokedAt, undefined);

      const secondRotation = await refreshAuthSessionService(
        firstRefresh.tokens.refreshToken
      );

      const afterSecondRotation = await Session.findById(after._id).select(
        'revokedAt +previousRefreshTokenHash previousRefreshTokenValidUntil'
      );
      assert.equal(afterSecondRotation?.revokedAt, undefined);
      assert.equal(
        afterSecondRotation?.previousRefreshTokenHash,
        createHash('sha256')
          .update(firstRefresh.tokens.refreshToken)
          .digest('hex')
      );

      await Session.updateOne(
        { _id: after._id },
        {
          $set: {
            previousRefreshTokenValidUntil: new Date(Date.now() - 1_000),
          },
        }
      );

      await assert.rejects(
        () => refreshAuthSessionService(firstRefresh.tokens.refreshToken),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'AUTH_SESSION_REVOKED'
      );

      await assert.rejects(
        () => refreshAuthSessionService(secondRotation.tokens.refreshToken),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === 'AUTH_SESSION_REVOKED'
      );
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'profile update cannot mass-assign role or status',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('profile-mass-assignment');

    try {
      const user = await User.create({
        name: 'Profile Security',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'client',
        status: 'active',
      });

      await Client.create({ userId: user._id });

      await updateUserProfileService(String(user._id), {
        name: 'Updated Profile Security',
        role: 'admin',
        status: 'blocked',
      } as never);

      const persisted = await User.findById(user._id).lean<{
        name: string;
        role: string;
        status: string;
      } | null>();

      assert.equal(persisted?.name, 'Updated Profile Security');
      assert.equal(persisted?.role, 'client');
      assert.equal(persisted?.status, 'active');
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'active pharmacy edits stay pending until moderation submission',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('moderation-lifecycle');

    try {
      const owner = await User.create({
        name: 'Moderation Lifecycle',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      const pharmacy = await Pharmacy.create({
        ownerId: owner._id,
        name: 'Moderation Lifecycle Pharmacy',
        email: identity.email,
        phone: identity.phone,
        description: 'Approved description',
        status: 'active',
        approvedAt: new Date(),
        activatedAt: new Date(),
      });

      const updateResponse = await updateMyPharmacyProfileService(
        String(owner._id),
        { description: 'Pending description' }
      );

      assert.equal(updateResponse.pharmacy.description, 'Approved description');
      assert.equal(
        updateResponse.pharmacy.pendingModeration?.description,
        'Pending description'
      );

      const submitted = await sendMyPharmacyForVerificationService(
        String(owner._id)
      );

      assert.equal(submitted.pharmacy.status, 'on_moderation');
      assert.equal(
        submitted.pharmacy.pendingModeration?.description,
        'Pending description'
      );

      const persisted = await Pharmacy.findById(pharmacy._id).lean<{
        description?: string;
        status: string;
        pendingModeration?: { description?: string };
      } | null>();

      assert.equal(persisted?.description, 'Approved description');
      assert.equal(persisted?.status, 'on_moderation');
      assert.equal(
        persisted?.pendingModeration?.description,
        'Pending description'
      );
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'pharmacy managers can read the profile but cannot edit verification data or submit moderation',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const ownerIdentity = uniqueIdentity('profile-owner');
    const managerIdentity = uniqueIdentity('profile-manager');

    try {
      const owner = await User.create({
        name: 'Profile Owner',
        email: ownerIdentity.email,
        phone: ownerIdentity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      const manager = await User.create({
        name: 'Profile Manager',
        email: managerIdentity.email,
        phone: managerIdentity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      await Pharmacy.create({
        ownerId: owner._id,
        managerUserIds: [manager._id],
        name: 'Membership Pharmacy',
        email: ownerIdentity.email,
        phone: ownerIdentity.phone,
        status: 'active',
        approvedAt: new Date(),
        activatedAt: new Date(),
        bankDetails: {
          recipientName: 'Membership Pharmacy LLC',
          taxId: '12345678',
          iban: 'UA123456789012345678901234567',
          bankName: 'Example Bank',
          paymentPurpose: 'Payment for medicines',
          receiptEmail: ownerIdentity.email,
        },
        pendingModeration: {
          description: 'Owner-only pending change',
        },
      });

      const managerProfile = await getMyPharmacyProfileService(
        String(manager._id)
      );

      assert.equal(managerProfile.pharmacy.membershipRole, 'manager');
      assert.equal(managerProfile.pharmacy.bankDetails, undefined);
      assert.deepEqual(managerProfile.pharmacy.documents, []);
      assert.equal(managerProfile.pharmacy.pendingModeration, undefined);

      await assert.rejects(
        () =>
          updateMyPharmacyProfileService(String(manager._id), {
            description: 'Manager must not change this',
          }),
        (error: unknown) =>
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'PHARMACY_OWNER_REQUIRED'
      );

      await assert.rejects(
        () => sendMyPharmacyForVerificationService(String(manager._id)),
        (error: unknown) =>
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'PHARMACY_OWNER_REQUIRED'
      );

      const ownerProfile = await getMyPharmacyProfileService(String(owner._id));
      assert.equal(ownerProfile.pharmacy.membershipRole, 'owner');
      assert.equal(
        ownerProfile.pharmacy.bankDetails?.recipientName,
        'Membership Pharmacy LLC'
      );
      assert.equal(
        ownerProfile.pharmacy.pendingModeration?.description,
        'Owner-only pending change'
      );
    } finally {
      await cleanup(ownerIdentity.email);
      await cleanup(managerIdentity.email);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'pharmacy profiles already under review reject repeated submission explicitly',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const identity = uniqueIdentity('repeat-moderation-submit');

    try {
      const owner = await User.create({
        name: 'Repeat Submit Owner',
        email: identity.email,
        phone: identity.phone,
        password: await hashPassword('SecurePassword123!'),
        role: 'pharmacy',
      });

      const pharmacy = await Pharmacy.create({
        ownerId: owner._id,
        name: 'Repeat Submit Pharmacy',
        email: identity.email,
        phone: identity.phone,
        status: 'on_verification',
      });

      for (const status of ['on_verification', 'on_moderation'] as const) {
        await Pharmacy.updateOne({ _id: pharmacy._id }, { $set: { status } });

        await assert.rejects(
          () => sendMyPharmacyForVerificationService(String(owner._id)),
          (error: unknown) =>
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'PHARMACY_PROFILE_ALREADY_SUBMITTED'
        );
      }
    } finally {
      await cleanup(identity.email);
      await mongoose.disconnect();
    }
  }
);
