import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/httpStatus';
import { Order } from '../../models/orders/order.model';
import { User } from '../../models/accounts/user.model';
import { httpError } from '../../utils/httpError';

import type {
  CreateOrderManagerCommentInput,
  OrderCommentsQuery,
} from '../../schemas/order.schema';

import type { OrderManagerCommentEntity } from '../../types/order';
import type { UserRole } from '../../types/user';
import type { OrderDocument, UserDocument } from './order-shared';

import { serializeManagerComments } from './order-shared';

import {
  assertCanAccessPharmacyOrder,
  assertCanEditPharmacyOrder,
} from './order-access';

//===============================================================

function getManagerCommentAuthorDisplayName(
  user?: Pick<UserDocument, 'name' | 'email'> | null
): string {
  return user?.name?.trim() || user?.email?.trim() || 'Pharmacy member';
}

//===============================================================

function findManagerCommentReplay(
  order: OrderDocument,
  actorId: string,
  clientRequestId: string
): OrderManagerCommentEntity | undefined {
  return (order.managerComments ?? []).find(
    (comment) =>
      comment.createdBy.toString() === actorId &&
      comment.clientRequestId === clientRequestId
  );
}

//===============================================================

function assertManagerCommentReplayMatches(
  comment: OrderManagerCommentEntity,
  normalizedText: string
): void {
  if (comment.text !== normalizedText) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comment request key was already used for different content.'
    );
  }
}

//===============================================================

function serializeCreatedManagerComment(
  comment: OrderManagerCommentEntity,
  actorId: string
) {
  return {
    comment: {
      id: comment._id?.toString() ?? '',
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      createdBy: actorId,

      author: {
        userId: actorId,
        displayName: comment.authorDisplayName?.trim() || 'Pharmacy member',
      },
    },
  };
}

//===============================================================

export async function getOrderManagerCommentsService(
  actor: { id: string; role: UserRole },
  orderId: string,
  query: OrderCommentsQuery
) {
  const session = await mongoose.startSession();

  try {
    const order = await Order.findById(orderId)
      .session(session)
      .lean<OrderDocument | null>();

    if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

    await assertCanAccessPharmacyOrder(actor, order, session);

    const comments = serializeManagerComments(order);
    const total = comments.length;
    const totalPages = Math.ceil(total / query.perPage);
    const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
    const start = (page - 1) * query.perPage;

    return {
      items: comments.slice(start, start + query.perPage),
      page,
      perPage: query.perPage,
      total,
      totalPages,
    };
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function createOrderManagerCommentService(
  actor: { id: string; role: UserRole },
  orderId: string,
  input: CreateOrderManagerCommentInput
) {
  const session = await mongoose.startSession();
  const normalizedText = input.text.trim();

  let resultComment: OrderManagerCommentEntity | null = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session)
        .lean<OrderDocument | null>();

      if (!order) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
      }

      await assertCanEditPharmacyOrder(actor, order, session);

      const replay = findManagerCommentReplay(
        order,
        actor.id,
        input.clientRequestId
      );

      if (replay) {
        assertManagerCommentReplayMatches(replay, normalizedText);
        resultComment = replay;
        return;
      }

      if (order.status !== 'in_progress') {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Comments can be added only while the order is in progress.'
        );
      }

      const author = await User.findById(actor.id)
        .select('name email')
        .session(session)
        .lean<UserDocument | null>();

      const authorDisplayName = getManagerCommentAuthorDisplayName(author);

      const comment: OrderManagerCommentEntity = {
        _id: new Types.ObjectId(),
        text: normalizedText,
        createdAt: new Date(),
        createdBy: new Types.ObjectId(actor.id),
        authorDisplayName,
        clientRequestId: input.clientRequestId,
      };

      await Order.updateOne(
        { _id: orderId },
        { $push: { managerComments: comment } },
        { session, runValidators: true }
      );

      resultComment = comment;
    });

    const finalComment = resultComment as OrderManagerCommentEntity | null;

    if (!finalComment) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Comment could not be created.'
      );
    }

    return serializeCreatedManagerComment(finalComment, actor.id);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function deleteOrderManagerCommentService(
  actor: { id: string; role: UserRole },
  orderId: string,
  commentId: string
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session)
        .lean<OrderDocument | null>();

      if (!order) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
      }

      await assertCanEditPharmacyOrder(actor, order, session);

      if (order.status !== 'in_progress') {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Comments can be deleted only while the order is in progress.'
        );
      }

      if (commentId === order._id.toString() && order.managerComment) {
        await Order.updateOne(
          { _id: orderId },
          { $unset: { managerComment: '' } },
          { session }
        );

        return;
      }

      if (!Types.ObjectId.isValid(commentId)) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment was not found');
      }

      const commentExists = (order.managerComments ?? []).some(
        (comment) => comment._id?.toString() === commentId
      );

      if (!commentExists) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment was not found');
      }

      await Order.updateOne(
        { _id: orderId },
        { $pull: { managerComments: { _id: new Types.ObjectId(commentId) } } },
        { session }
      );
    });

    return { message: 'Comment deleted successfully.' };
  } finally {
    await session.endSession();
  }
}
