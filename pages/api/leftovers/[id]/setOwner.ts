import { Leftover } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '../../../../lib/api';
import prisma from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Leftover>>,
) {
  const { id } = req.query;
  const { owner } = req.body;

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
