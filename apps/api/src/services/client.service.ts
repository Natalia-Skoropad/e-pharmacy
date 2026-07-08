import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';

import type { ClientsQuery } from '../schemas/client.schema';
import type { OrderEntity } from '../types/order';
import type { PharmacyEntity } from '../types/pharmacy';
import type { UserEntity } from '../types/user';

//===============================================================

type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
type OrderDocument = OrderEntity & { _id: Types.ObjectId };
type UserDocument = UserEntity & { _id: Types.ObjectId };

//===============================================================

type ClientRow = Readonly<{
  id: string;
  photoUrl: string | null;
  firstOrderAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
  status: 'active' | 'blocked';
}>;

//===============================================================

function getStartOfDay(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

//===============================================================

function getEndOfDay(value: string): Date {
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

//===============================================================

function createClientSearchRegExp(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

//===============================================================

async function getCurrentPharmacyId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return null;

  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id')
    .lean<Pick<PharmacyDocument, '_id'> | null>();

  return pharmacy?._id ?? null;
}

//===============================================================

function getDeliveryAddress(order: OrderDocument): string | undefined {
  return order.delivery.method === 'postal_delivery'
    ? order.delivery.details.address
    : undefined;
}

//===============================================================

function getClientAddress(user: UserDocument, orders: OrderDocument[]): string {
  if (user.address) return user.address;

  const deliveryAddress = orders
    .map((order) => getDeliveryAddress(order))
    .find((address): address is string => Boolean(address));

  return deliveryAddress ?? 'Not specified';
}

//===============================================================

function getFirstOrderDate(orders: OrderDocument[]): Date {
  return orders.reduce(
    (earliest, order) =>
      order.createdAt < earliest ? order.createdAt : earliest,
    orders[0]?.createdAt ?? new Date(0)
  );
}

//===============================================================

function serializeClient(
  user: UserDocument,
  orders: OrderDocument[]
): ClientRow {
  const successfulOrders = orders.filter(
    (order) => order.status === 'successful'
  );

  return {
    id: String(user._id),
    photoUrl: user.pictureUrl ?? null,
    firstOrderAt: getFirstOrderDate(orders).toISOString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: getClientAddress(user, orders),
    successfulOrdersCount: successfulOrders.length,
    successfulOrdersAmount: successfulOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    ),
    status: user.status === 'blocked' ? 'blocked' : 'active',
  };
}

//===============================================================

function matchesClientFilters(client: ClientRow, query: ClientsQuery): boolean {
  if (query.clientId?.trim() && !client.id.includes(query.clientId.trim())) {
    return false;
  }

  if (
    query.name?.trim() &&
    !createClientSearchRegExp(query.name.trim()).test(client.name)
  ) {
    return false;
  }

  if (query.contact?.trim()) {
    const contactSearchRegExp = createClientSearchRegExp(query.contact.trim());

    if (
      !contactSearchRegExp.test(client.email) &&
      !contactSearchRegExp.test(client.phone) &&
      !contactSearchRegExp.test(client.address)
    ) {
      return false;
    }
  }

  if (
    query.email?.trim() &&
    !createClientSearchRegExp(query.email.trim()).test(client.email)
  ) {
    return false;
  }

  if (
    query.phone?.trim() &&
    !createClientSearchRegExp(query.phone.trim()).test(client.phone)
  ) {
    return false;
  }

  if (
    query.address?.trim() &&
    !createClientSearchRegExp(query.address.trim()).test(client.address)
  ) {
    return false;
  }

  if (query.status && client.status !== query.status) {
    return false;
  }

  if (query.successfulOrders === 'repeat') {
    return client.successfulOrdersCount > 1;
  }

  if (query.successfulOrders === 'successful') {
    return client.successfulOrdersCount > 0;
  }

  if (query.successfulOrders === 'other') {
    return client.successfulOrdersCount === 0;
  }

  return true;
}

//===============================================================

async function getClientRowsForPharmacy(
  pharmacyId: Types.ObjectId,
  query: ClientsQuery
): Promise<ClientRow[]> {
  const orderFilter: Record<string, unknown> = { pharmacyId };

  if (query.firstOrderFrom || query.firstOrderTo) {
    orderFilter.createdAt = {
      ...(query.firstOrderFrom
        ? { $gte: getStartOfDay(query.firstOrderFrom) }
        : {}),
      ...(query.firstOrderTo ? { $lte: getEndOfDay(query.firstOrderTo) } : {}),
    };
  }

  const orders = await Order.find(orderFilter)
    .sort({ createdAt: -1 })
    .lean<OrderDocument[]>();

  if (!orders.length) return [];

  const ordersByUserId = new Map<string, OrderDocument[]>();

  for (const order of orders) {
    const userId = String(order.userId);
    const existingOrders = ordersByUserId.get(userId) ?? [];
    existingOrders.push(order);
    ordersByUserId.set(userId, existingOrders);
  }

  const users = await User.find({
    _id: { $in: [...ordersByUserId.keys()] },
  }).lean<UserDocument[]>();

  return users
    .flatMap((user) => {
      const userOrders = ordersByUserId.get(String(user._id)) ?? [];

      return userOrders.length ? [serializeClient(user, userOrders)] : [];
    })
    .filter((client) => matchesClientFilters(client, query))
    .sort((first, second) =>
      second.firstOrderAt.localeCompare(first.firstOrderAt)
    );
}

//===============================================================

export async function getClientsService(userId: string, query: ClientsQuery) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    return {
      items: [],
      page: query.page,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
    };
  }

  const clients = await getClientRowsForPharmacy(pharmacyId, query);
  const skip = (query.page - 1) * query.perPage;
  const items = clients.slice(skip, skip + query.perPage);

  return {
    items,
    page: query.page,
    perPage: query.perPage,
    total: clients.length,
    totalPages: Math.ceil(clients.length / query.perPage),
  };
}

//===============================================================

export async function getClientByIdService(userId: string, clientId: string) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const clients = await getClientRowsForPharmacy(pharmacyId, {
    page: 1,
    perPage: 1,
    clientId,
  });

  const client = clients.find((item) => item.id === clientId);

  if (!client) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  return { client };
}
