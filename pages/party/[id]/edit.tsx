import { Leftover, Party } from '@prisma/client';
import type {
  GetServerSideProps, InferGetServerSidePropsType,
} from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, {
  ChangeEvent, SyntheticEvent, useState,
} from 'react';
import { Card } from '../../../components/card';
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
    <Card image_url={leftover.image_url}>
      <div className="flex-grow space-y-2">
        <Input name="Description" value={leftover.description} setValue={(value) => setLeftover({ ...leftover, description: value })} />
        <Input name="Owner" value={leftover.owner} setValue={(value) => setLeftover({ ...leftover, owner: value })} />
        <button type="button" onClick={onDelete} className="bg-red-200 hover:bg-red-300 p-2 px-3">Delete</button>
      </div>
    </Card>
  );
}

const resizeImage = async (file: File) => {
  const image = await new Promise<HTMLImageElement>((resolve) => {
    const tempImage = new Image();
    tempImage.addEventListener('load', () => {
      resolve(tempImage);
    });
    tempImage.src = URL.createObjectURL(file);
  });

  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  if (image.height > image.width) {
    const sourceY = Math.floor((image.height - image.width) / 2);
    ctx.drawImage(image, 0, sourceY, image.width, image.width, 0, 0, size, size);
  } else {
    const sourceX = Math.floor((image.width - image.height) / 2);
    ctx.drawImage(image, sourceX, 0, image.height, image.height, 0, 0, size, size);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((newBlob) => {
      if (!newBlob) {
        reject(new Error('Unable to convert canvas to blob'));
        return;
      }
      resolve(newBlob);
    });
  });

  const outputFile = new File([blob], 'resized.png');
  return outputFile;
};

function Edit({ initialParty }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [party, setParty] = useState(initialParty);
  const [selectedLeftoverImages, setSelectedLeftoverImages] = useState(new Map<string, File>());
  const [showClaimLink, setShowClaimLink] = useState(initialParty.leftovers.length > 0);

  const handleImageInput = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const files: File[] = Array.from(event.target.files);
    // eslint-disable-next-line no-param-reassign
    event.target.value = '';

    const newSelectedLeftoverImages = new Map(selectedLeftoverImages);
    const newLeftovers = await Promise.all(files.map(async (file) => {
      const id = String(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
      const resizedFile = await resizeImage(file);
      newSelectedLeftoverImages.set(id, resizedFile);
      return {
        id,
        description: '',
        owner: '',
        image_url: URL.createObjectURL(resizedFile),
        partyId: party.id,
      };
    }));

    setSelectedLeftoverImages(newSelectedLeftoverImages);
    setParty({ ...party, leftovers: party.leftovers.concat(newLeftovers) });
  };

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('party', JSON.stringify(party));
    selectedLeftoverImages.forEach((file, id) => formData.append(id, file));

    const response = await fetch(`/api/parties/${party.id}`, { method: 'POST', body: formData });
    const { data: updatedParty } = await response.json();
    setParty(updatedParty);
    setShowClaimLink(updatedParty.leftovers.length > 0);
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
        <title>Edit your party</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
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

          <label htmlFor="image_choose" className="block">
            <div className="bg-blue-200 hover:bg-blue-300 p-2 px-3 hover:cursor-pointer w-fit">
              Choose photos to upload
            </div>
            <input type="file" id="image_choose" accept="image/png, image/jpeg" multiple onChange={handleImageInput} className="hidden" />
          </label>

          <label htmlFor="image_take" className="block">
            <div className="bg-blue-200 hover:bg-blue-300 p-2 px-3 hover:cursor-pointer w-fit">
              Take picture
            </div>
            <input type="file" id="image_take" accept="image/png, image/jpeg" capture="environment" onChange={handleImageInput} className="hidden" />
          </label>

          <button type="submit" className="bg-green-200 hover:bg-green-300 p-2 px-3">Save</button>
        </form>

        { showClaimLink
          ? (
            <div>
              Claim leftovers
              {' '}
              <Link href={`/party/${party.id}/claim`}><a className="underline">here</a></Link>
              . Save a link to the current page to make future edits.
            </div>
          ) : undefined }
      </div>
    </>
  );
}

export default Edit;
