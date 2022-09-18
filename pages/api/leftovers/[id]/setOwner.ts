import { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../../lib/db";
import { Leftover } from "../../../../lib/types";
import { ApiResponse } from "../../../../lib/api";


export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<Leftover>>) {
  const { id } = req.query
  const { owner } = req.body

  if (typeof owner !== "string") {
    res.status(400).json({ errors: [{ message: "must specify owner (can be empty string)"}] })
    return
  } 

  if (typeof id !== "string") {
    res.status(400).json({ errors: [{ message: "must specify string id" }]})
    return
  }

  const leftover = db.leftovers[id]
  if (!leftover) {
    res.status(400).json({ errors: [{ message: `no leftover with id '${id}'` }]})
    return
  }

  leftover.owner = owner
  res.status(200).json({ data: leftover })
}