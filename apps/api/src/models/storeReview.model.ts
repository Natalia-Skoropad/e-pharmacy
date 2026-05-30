import { Schema, model, models } from 'mongoose';

//===============================================================

export type StoreReviewEntity = {
  storeId: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'reported' | 'hidden';
  moderationReason?: string;
  moderatedBy?: Schema.Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const storeReviewSchema = new Schema<StoreReviewEntity>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [80, 'User name must be at most 80 characters'],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Review comment must be at least 10 characters'],
      maxlength: [500, 'Review comment must be at most 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'reported', 'hidden'],
      default: 'pending',
      required: true,
      index: true,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Moderation reason must be at most 300 characters'],
      default: undefined,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
    moderatedAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true, versionKey: false }
);

storeReviewSchema.index({ storeId: 1, status: 1, createdAt: -1 });
storeReviewSchema.index({ status: 1, createdAt: -1 });

export const StoreReview =
  models.StoreReview || model<StoreReviewEntity>('StoreReview', storeReviewSchema);
