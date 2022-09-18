import { Leftover } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, errorBody } from '../../../../lib/api';
import prisma from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Leftover>>,
) {
  if (req.method !== 'POST') {
    res.status(405).json(errorBody('this endpoint only supports post requests'));
    return;
  }

  const { id } = req.query;
  const { data } = JSON.parse(req.body);
  if (!data) {
    res.status(400).json({ errors: [{ message: 'request must have data' }] });
    return;
  }

  const { owner } = data;
  if (typeof owner !== 'string') {
    res.status(400).json({ errors: [{ message: 'must specify owner (can be empty string)' }] });
    return;
  }

  if (typeof id !== 'string') {
    res.status(400).json({ errors: [{ message: 'must specify string id' }] });
    return;
  }

  const leftover = await prisma.leftover.update({ where: { id }, data: { owner } });
  if (!leftover) {
    res.status(400).json({ errors: [{ message: `no leftover with id '${id}'` }] });
    return;
  }

  res.status(200).json({ data: leftover });
}
