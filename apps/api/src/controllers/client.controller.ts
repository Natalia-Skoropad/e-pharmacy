import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { clientParamsSchema, clientsQuerySchema } from '../schemas/client.schema';

import {
  getClientByIdService,
  getClientsService,
} from '../services/client.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function getClients(req: Request, res: Response): Promise<void> {
  const query = clientsQuerySchema.parse(req.query);
  const data = await getClientsService(req.user?.id ?? '', query);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getClientById(req: Request, res: Response): Promise<void> {
  const { clientId } = clientParamsSchema.parse(req.params);
  const data = await getClientByIdService(req.user?.id ?? '', clientId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
