export const ORDER_REJECTION_REASON_MIN_LENGTH = 100;
export const ORDER_REJECTION_REASON_MAX_LENGTH = 500;
export const ORDER_STATUS_COMMENT_MAX_LENGTH = 500;

//===============================================================

export const ORDER_STATUS_VALIDATION_MESSAGES = {
  requiredRejectionReason: 'Rejection reason is required',
  rejectionReasonMin: `Rejection reason must be at least ${ORDER_REJECTION_REASON_MIN_LENGTH} characters`,
  rejectionReasonMax: `Rejection reason must be at most ${ORDER_REJECTION_REASON_MAX_LENGTH} characters`,
  commentMax: `Status comment must be at most ${ORDER_STATUS_COMMENT_MAX_LENGTH} characters`,
} as const;
