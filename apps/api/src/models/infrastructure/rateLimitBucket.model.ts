import { Schema, model, models } from 'mongoose';

//===============================================================

type RateLimitBucketEntity = {
  _id: string;
  hits: number;
  resetAt: Date;
  expiresAt: Date;
};

//===============================================================

const rateLimitBucketSchema = new Schema<RateLimitBucketEntity>(
  {
    _id: {
      type: String,
      required: true,
    },

    hits: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    resetAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  }
);

// The fixed-window id already gives every replica the same counter. Mongo TTL
// removes old buckets after a short grace period; request authorization never
// depends on the TTL worker deleting the row exactly at resetAt.
rateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

//===============================================================

export const RateLimitBucket =
  models.RateLimitBucket ||
  model<RateLimitBucketEntity>('RateLimitBucket', rateLimitBucketSchema);
