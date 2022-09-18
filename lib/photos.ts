import { randomUUID } from "crypto"
import formidable from "formidable"
import * as fs from "fs/promises"

export async function store(file: formidable.File) {
  const newName = `${randomUUID()}_${file.originalFilename}`
  const newPath = `${process.env.PHOTO_UPLOAD_DIR}/${newName}`

  await fs.cp(file.filepath, newPath)
  await fs.rm(file.filepath)

  return newName
}

export async function retrieve(name: string) {
  return await fs.readFile(`${process.env.PHOTO_UPLOAD_DIR}/${name}`)
}

export async function remove(name: string) {
  await fs.rm(`${process.env.PHOTO_UPLOAD_DIR}/${name}`)
}