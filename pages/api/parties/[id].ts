// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Leftover, Party } from '@prisma/client'
import IncomingForm, { Fields, File, Files } from 'formidable'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ApiResponse, errorBody } from '../../../lib/api'
import * as photos from '../../../lib/photos'
import prisma from '../../../lib/prisma'

export const config = {
  api: {
    bodyParser: false
  }
}

const parseFields = (fields: Fields) => {
  const unparsedPartyJSON = fields["party"]

  if (typeof unparsedPartyJSON !== "string") {
    return errorBody("must include exactly one party field")
  }

  const parsedPartyJSON = JSON.parse(unparsedPartyJSON)
  const { name, leftovers: uncheckedLeftovers } = parsedPartyJSON
  if (!(typeof name === "string")) {
    return errorBody("must include name string")
  }

  if (!Array.isArray(uncheckedLeftovers)) {
    return errorBody("must include leftovers array")
  }

  const leftovers = uncheckedLeftovers.flatMap(leftover => {
    const { id, description, owner } = leftover
    if (typeof id === "string" && typeof description === "string" && typeof owner === "string") {
      return [{ id, description, owner }]
    }

    return []
  })

  return { data: { party: { name, leftovers } } }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Party>>
) {
  const { id } = req.query
  if (typeof id !== "string") {
    res.status(400).json(errorBody("must specify id"))
    return
  }

  const existingParty = await prisma.party.findUnique({ where: { id }, include: { leftovers: true }})
  if (!existingParty) {
    res.status(404).json(errorBody(`invalid id '${id}'`))
    return
  }

  if (req.method === "GET") {
    res.status(200).json({ data: existingParty })
    return
  }

  if (req.method === "POST") {
    const { fields, files: uploadedImages } = await new Promise<{ fields: Fields, files: Files, err?: any }>((resolve, reject) => {
      const form = IncomingForm()

      form.parse(req, (err, fields, files) => {
        if (err) reject({ err })
        resolve({ err, fields, files })
      })
    })

    const parseResult = parseFields(fields)
    if ("errors" in parseResult) {
      res.status(400).json(parseResult)
      return
    }

    const { name, leftovers } = parseResult.data.party

    const existingLeftoverIds = new Set(existingParty.leftovers.map(({ id }) => id))
    const leftoverIds = new Set(leftovers.map(({ id }) => id))
    const leftoversToDelete = existingParty.leftovers.filter(({ id }) => (!leftoverIds.has(id)))

    const newLeftovers = leftovers
      .filter(({ id }) => (!existingLeftoverIds.has(id)))
      .filter(({ id }) => (uploadedImages[id] !== undefined))
    const newPhotoPaths = await Promise.all(newLeftovers.map(({ id }) => photos.store(uploadedImages[id] as File)))
    const leftoversToCreate = newLeftovers.map((leftover, idx) => ({ ...leftover, image_url: `/api/photos/${newPhotoPaths[idx]}`}))
    const leftoversToUpdate = leftovers.filter(({ id }) => (existingLeftoverIds.has(id)))
    await Promise.all([...leftoversToDelete.map(leftover => {
      const name = leftover.image_url.split("/api/photos/")[1]
      photos.remove(name)
    })])

    const out = await prisma.$transaction([
      prisma.leftover.deleteMany({where: { id: { in: leftoversToDelete.map(({ id }) => id )}}}),
      ...leftoversToUpdate.map(({ id, owner, description }) => prisma.leftover.update({ where: { id }, data: { owner, description }})),
      ...leftoversToCreate.map((({ owner, description, image_url }) => prisma.leftover.create({ data: { owner, description, image_url, partyId: id } }))),
      prisma.party.update({ include: {leftovers: true }, where: { id }, data: { name }})
    ])
    const party = out[out.length - 1] as Party & { leftovers: Leftover[] }

    res.status(200).json({ data: party })
    return
  }

  res.status(405).json(errorBody("only GET and PUT supported at this endpoint"))
}
