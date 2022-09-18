import { Leftover, Party } from '@prisma/client'
import type { GetServerSideProps, GetServerSidePropsResult, InferGetServerSidePropsType, NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import { SyntheticEvent, useRef, useState } from 'react'
import prisma from '../../../lib/prisma'

export const getServerSideProps: GetServerSideProps<{ initialParty: Party & { leftovers: Leftover[] } }> = async (context) => {
  const { query } = context
  const id = query.id as string

  const party = await prisma.party.findUnique({ where: { id }, include: { leftovers: true }})

  if (!party) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      initialParty: party
    }
  }
}

type LeftoverCellProps = { leftover: Leftover, setLeftover: (leftover: Leftover) => void, deleteLeftover: (id: string) => void }

const LeftoverCell: React.FC<LeftoverCellProps> = ({ leftover, setLeftover, deleteLeftover }) => {
  const onDelete = (event: SyntheticEvent) => {
    event.preventDefault();
    deleteLeftover(leftover.id)
  }

  return (
    <div>
      <img src={leftover.image_url} alt="leftover image" width="50px" height="50px" />
      <label htmlFor={`description-${leftover.id}`} >Description</label>
      <input type="text" id={`description-${leftover.id}`} value={leftover.description} onChange={e => setLeftover({...leftover, description: e.target.value})}></input>
      <label htmlFor={`owner-${leftover.id}`} >Owner</label>
      <input type="text" id={`owner-${leftover.id}`} value={leftover.owner} onChange={e => setLeftover({...leftover, owner: e.target.value})}></input>
      <button onClick={onDelete}>Delete</button>
    </div>
  )
}

const Edit = ({ initialParty }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [party, setParty] = useState(initialParty)
  const [selectedLeftoverImages, setSelectedLeftoverImages] = useState<{ [key: string]: File }>({})

  const handleImageInput = (event: SyntheticEvent) => {
    if (event.target.files.length === 0) {
      return
    }

    const files: File[] = Array.from(event.target.files)
    event.target.value = ""


    const newSelectedLeftoverImages: { [key: string]: File } = {}
    const newLeftovers = files.map(file => {
      const id = crypto.randomUUID()
      newSelectedLeftoverImages[id] = file
      return {
        id,
        description: "",
        owner: "",
        image_url: URL.createObjectURL(file),
        partyId: party.id
      }})

    setSelectedLeftoverImages({...selectedLeftoverImages, ...newSelectedLeftoverImages})
    setParty({...party, leftovers: party.leftovers.concat(newLeftovers) })
  }

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault()

    const formData = new FormData()
    formData.append("party", JSON.stringify(party))
    for (const [id, file] of Object.entries(selectedLeftoverImages)) {
      formData.append(id, file)
    }

    await fetch(`/api/parties/${party.id}`, {method: "POST", body: formData});
  }

  const deleteLeftover = (id: string) => {
    const newLeftovers = party.leftovers.filter(leftover => leftover.id !== id)
    setParty({ ...party, leftovers: newLeftovers })
    
    const newSelectedLeftoverImages = { ...selectedLeftoverImages }
    delete newSelectedLeftoverImages[id]
    setSelectedLeftoverImages(newSelectedLeftoverImages)
  }

  return (
    <>
      <Head>
        <title>Edit Your Party</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <form onSubmit={handleSubmit} >
        <label htmlFor="name">Name</label>
        <input type={"text"} id="name" name="name" value={party.name} onChange={e => setParty({ ...party, name: e.target.value })}></input>
        {party.leftovers.map(leftover => <LeftoverCell leftover={leftover} setLeftover={newLeftover => setParty({ ...party, leftovers: party.leftovers.map(leftover => leftover.id === newLeftover.id ? newLeftover : leftover)})} deleteLeftover={deleteLeftover} key={leftover.id} />
          )}
        <input type="submit"></input>
      </form>

      <div>
        <label htmlFor="image_choose">Choose images to upload</label>
        <input type="file" id="image_choose" accept="image/png, image/jpeg" multiple onChange={handleImageInput} />
      </div>

      <div>
        <label htmlFor="image_take">Take picture</label>
        <input type="file" id="image_take" accept="image/png, image/jpeg" multiple capture="user" onChange={handleImageInput} />
      </div>
    </>
  )
}

export default Edit
