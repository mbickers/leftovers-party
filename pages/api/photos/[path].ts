import type { NextApiRequest, NextApiResponse } from 'next'
import { retrieve } from '../../../lib/photos'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer | string>
) {
  if (req.method !== "GET") {
    res.status(405).send("only GET supported at this endpoint")
    return
  }

  const { path } = req.query

  if (typeof path !== "string") {
    res.status(400).send("must specify path")
    return
  }

  try {
    const file = await retrieve(path)
    res.status(200).send(file)
  } catch {
    res.status(404).send("image not found")
  }
}