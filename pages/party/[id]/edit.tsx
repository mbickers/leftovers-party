import { Leftover, Party } from '@prisma/client';
import type {
  GetServerSideProps, InferGetServerSidePropsType,
} from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, {
  ChangeEvent, SyntheticEvent, useState,
} from 'react';
import { Input } from '../../../components/input';
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
    <div className="overflow-hidden bg-gray-100 sm:flex sm:h-64">
      <div className="sm:shrink-0 sm:w-64 bg-blue-400">
        <picture>
          <img src={leftover.image_url} alt="" className="object-cover aspect-square w-full" />
        </picture>
      </div>
      <div className="flex-grow p-2 space-y-2">
        <Input name="Description" value={leftover.description} setValue={(value) => setLeftover({ ...leftover, description: value })} />
        <Input name="Owner" value={leftover.owner} setValue={(value) => setLeftover({ ...leftover, owner: value })} />
        <button type="button" onClick={onDelete} className="bg-red-200 hover:bg-red-300 p-2 px-3">Delete</button>
      </div>
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

      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="Party name" value={party.name} setValue={(value) => setParty({ ...party, name: value })} />
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

          <div>
            <label htmlFor="image_choose" className="bg-blue-200 hover:bg-blue-300 p-2 px-3 hover:cursor-pointer">
              Choose photos to upload
              <input type="file" id="image_choose" accept="image/png, image/jpeg" multiple onChange={handleImageInput} className="w-0" />
            </label>
          </div>

          <div>
            <label htmlFor="image_take" className="bg-blue-200 hover:bg-blue-300 p-2 px-3 hover:cursor-pointer">
              Take picture
              <input type="file" id="image_take" accept="image/png, image/jpeg" capture="environment" onChange={handleImageInput} className="w-0" />
            </label>
          </div>
          <button type="submit" className="bg-green-300 hover:bg-green-400 p-2 px-3">Save</button>
        </form>

        <div>
          Claim leftovers
          {' '}
          <Link href={`/party/${party.id}/claim`}><a className="underline">here</a></Link>
          .
        </div>
      </div>
    </>
  );
}

export default Edit;
