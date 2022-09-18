import { Leftover, Party } from '@prisma/client';
import type {
  GetServerSideProps, InferGetServerSidePropsType,
} from 'next';
import Head from 'next/head';
import Image from 'next/image';
import React, {
  ChangeEvent, SyntheticEvent, useState,
} from 'react';
import prisma from '../../../lib/prisma';

type EditPageProps = { initialParty: Party & { leftovers: Leftover[] } };

export const getServerSideProps: GetServerSideProps<EditPageProps> = async (context) => {
  const { query } = context;
  const id = query.id as string;

  const party = await prisma.party.findUnique({ where: { id }, include: { leftovers: true } });

  if (!party) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      initialParty: party,
    },
  };
};

type EditLeftoverCellProps = {
  leftover: Leftover,
  setLeftover: (leftover: Leftover) => void,
  deleteLeftover: (id: string) => void
};

function EditLeftoverCell({ leftover, setLeftover, deleteLeftover }: EditLeftoverCellProps) {
  const onDelete = (event: SyntheticEvent) => {
    event.preventDefault();
    deleteLeftover(leftover.id);
  };

  return (
    <div>
      <Image src={leftover.image_url} alt="" width="50px" height="50px" />
      <label htmlFor={`description-${leftover.id}`}>
        Description
        <input type="text" id={`description-${leftover.id}`} value={leftover.description} onChange={(e) => setLeftover({ ...leftover, description: e.target.value })} />
      </label>
      <label htmlFor={`owner-${leftover.id}`}>
        Owner
        <input type="text" id={`owner-${leftover.id}`} value={leftover.owner} onChange={(e) => setLeftover({ ...leftover, owner: e.target.value })} />
      </label>
      <button type="submit" onClick={onDelete}>Delete</button>
    </div>
  );
}

function Edit({ initialParty }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [party, setParty] = useState(initialParty);
  const [selectedLeftoverImages, setSelectedLeftoverImages] = useState(new Map<string, File>());
  const handleImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const files: File[] = Array.from(event.target.files);
    // eslint-disable-next-line no-param-reassign
    event.target.value = '';

    const newSelectedLeftoverImages = new Map(selectedLeftoverImages);
    const newLeftovers = files.map((file) => {
      const id = crypto.randomUUID();
      newSelectedLeftoverImages.set(id, file);
      return {
        id,
        description: '',
        owner: '',
        image_url: URL.createObjectURL(file),
        partyId: party.id,
      };
    });

    setSelectedLeftoverImages(newSelectedLeftoverImages);
    setParty({ ...party, leftovers: party.leftovers.concat(newLeftovers) });
  };

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('party', JSON.stringify(party));
    selectedLeftoverImages.forEach((file, id) => formData.append(id, file));

    await fetch(`/api/parties/${party.id}`, { method: 'POST', body: formData });
  };

  const deleteLeftover = (id: string) => {
    const newLeftovers = party.leftovers.filter((leftover) => leftover.id !== id);
    setParty({ ...party, leftovers: newLeftovers });

    const newSelectedLeftoverImages = new Map(selectedLeftoverImages);
    newSelectedLeftoverImages.delete(id);
    setSelectedLeftoverImages(newSelectedLeftoverImages);
  };

  const setLeftover = (newLeftover: Leftover) => {
    setParty({
      ...party,
      leftovers: party.leftovers.map(
        (leftover) => (leftover.id === newLeftover.id ? newLeftover : leftover),
      ),
    });
  };

  return (
    <>
      <Head>
        <title>Edit Your Party</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <form onSubmit={handleSubmit}>
        <label htmlFor="name">
          Name
          <input type="text" id="name" name="name" value={party.name} onChange={(e) => setParty({ ...party, name: e.target.value })} />
        </label>
        {party.leftovers.map(
          (leftover) => (
            <EditLeftoverCell
              leftover={leftover}
              setLeftover={setLeftover}
              deleteLeftover={deleteLeftover}
              key={leftover.id}
            />
          ),
        )}
        <input type="submit" />
      </form>

      <div>
        <label htmlFor="image_choose">
          Choose images to upload
          <input type="file" id="image_choose" accept="image/png, image/jpeg" multiple onChange={handleImageInput} />
        </label>
      </div>

      <div>
        <label htmlFor="image_take">
          Take picture
          <input type="file" id="image_take" accept="image/png, image/jpeg" multiple capture="user" onChange={handleImageInput} />
        </label>
      </div>
    </>
  );
}

export default Edit;
