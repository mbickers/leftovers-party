// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import IncomingForm from 'formidable'
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false
  }
}

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const data = await new Promise((resolve, reject) => {
    const form = IncomingForm()

    form.parse(req, (err, fields, files) => {
      if (err) reject({ err })
      resolve({err, fields, files})
    })
  })
  console.log(data)
  res.status(200).json({ name: "test", data })
}
