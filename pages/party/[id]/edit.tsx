import type { GetServerSideProps, GetServerSidePropsResult, InferGetServerSidePropsType, NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'

type Leftover = {id: string, description: string, owner: string, image_url: string }
type Party = {id: string, name: string, leftovers: Leftover[]}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

  const leftovers: Leftover[] = [
          { id: "0", description: "meatballs", owner: "Max", image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6tT-hR7jmedBjiqkWmPDp4EjipkOB4eGTMQ&usqp=CAU" },
          { id: "1", description: "rice and chickpeas", owner: "Arya", image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_HtOUC489RstiQhbdR5MV30azCdbTCvqEUA&usqp=CAU"}]

  const id = params?.id as string

  return {
    props: {
      initialParty: {
        id,
        name: "HoganLeftovers",
        leftovers
      }
    }
  }
}

const LeftoverCell = ({ initialLeftover }: { initialLeftover: Leftover }) => {
  const onDelete = event => {
    event.preventDefault();
  }
  return (
    <div>
      <img src={initialLeftover.image_url} alt="leftover image" width="50px" height="50px" />
      <label htmlFor={`description-${initialLeftover.id}`} >Description</label>
      <input type="text" id={`description-${initialLeftover.id}`} name={`description-${initialLeftover.id}`} defaultValue={initialLeftover.description}></input>
      <label htmlFor={`owner-${initialLeftover.id}`} >Owner</label>
      <input type="text" id={`owner-${initialLeftover.id}`} name={`owner-${initialLeftover.id}`} defaultValue={initialLeftover.owner}></input>
      <button onClick={onDelete}>Delete</button>
    </div>
  )
}

const Edit = ({ initialParty }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  const [party, setParty] = useState<Party>(initialParty)
  const [newLeftoverImages, setNewLeftoverImages] = useState<{ [key: string]: File }>({})
  const formRef = useRef<HTMLFormElement>()

  const handleImageInput = event => {
    if (event.target.files.length === 0) {
      return
    }

    const files: File[] = Array.from(event.target.files)
    event.target.value = ""


    const newImages: { [key: string]: File } = {}
    const newLeftovers = files.map(file => {
      const id = crypto.randomUUID()
      newImages[id] = file
      return {
        id,
        description: "",
        owner: "",
        image_url: URL.createObjectURL(file)
      }})

    setNewLeftoverImages({...newLeftoverImages, ...newImages})
    setParty({...party, leftovers: party.leftovers.concat(newLeftovers) })
  }

  const handleSubmit = async event => {
    event.preventDefault()

    const formData = new FormData(formRef.current)
    for (const [id, file] of Object.entries(newLeftoverImages)) {
      formData.append(id, file)
    }

    await fetch("/api/hello", {method: "POST", body: formData});
  }

  return (
    <>
      <Head>
        <title>Edit Your Party</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <form onSubmit={handleSubmit} ref={formRef}>
        <label htmlFor="name">Name</label>
        <input type={"text"} id="name" name="name" defaultValue={initialParty.name}></input>
        {party.leftovers.map(leftover => <LeftoverCell initialLeftover={leftover} key={leftover.id} />
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
