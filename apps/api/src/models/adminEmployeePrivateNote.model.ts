import { Schema, model, models, type Types } from 'mongoose';

import { ADMIN_EMPLOYEE_PRIVATE_NOTE_MAX_LENGTH } from '../constants/admin-employee-private-note';

//===============================================================

export type AdminEmployeePrivateNoteEntity = {
  ownerUserId: Types.ObjectId;
  text: string;
  clientRequestId: string;
  authorNameSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const adminEmployeePrivateNoteSchema =
  new Schema<AdminEmployeePrivateNoteEntity>(
    {
      ownerUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true,
        index: true,
      },

      text: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: ADMIN_EMPLOYEE_PRIVATE_NOTE_MAX_LENGTH,
      },

      clientRequestId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 36,
        match:
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      },

      authorNameSnapshot: {
        type: String,
        required: true,
        trim: true,
        maxlength: 254,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

//===============================================================

adminEmployeePrivateNoteSchema.index({
  ownerUserId: 1,
  createdAt: -1,
  _id: -1,
});

adminEmployeePrivateNoteSchema.index(
  { ownerUserId: 1, clientRequestId: 1 },
  { unique: true }
);

//===============================================================

export const AdminEmployeePrivateNote =
  models.AdminEmployeePrivateNote ||
  model<AdminEmployeePrivateNoteEntity>(
    'AdminEmployeePrivateNote',
    adminEmployeePrivateNoteSchema
  );
