import { Leftover, Party } from '@prisma/client';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import React, { SyntheticEvent, useState } from 'react';
import { Card } from '../../../components/card';
import { Input } from '../../../components/input';
import prisma from '../../../lib/prisma';

const emojiForString = (string: string) => {
  const emojis = ['🤓', '😶‍🌫️', '😤', '🫥', '😎', '🤔', '😵‍💫', '🤠', '🤨', '😇', '🥸', '🧐', '😳'];
  const idx = Array.from(string)
    .map((c) => c.charCodeAt(0)).reduce((acc, el) => acc + el) % emojis.length;
  return emojis[idx];
};

type ClaimPageProps = { initialParty: Party & { leftovers: Leftover[] }, initialName: string };

export const getServerSideProps: GetServerSideProps<ClaimPageProps> = async (context) => {
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
      initialName: context.req.cookies.name || '',
    },
  };
};

type ClaimLeftoverCellProps = {
  leftover: Leftover, name: string, setLeftoverOwner: (name: string) => void
};

function ClaimLeftoverCell({ leftover, name, setLeftoverOwner }: ClaimLeftoverCellProps) {
  return (
    <Card image_url={leftover.image_url}>
      <div className="space-y-3">
        <p>
          {leftover.description + (leftover.description ? '. ' : '')}
          { leftover.owner
            ? (
              <>
                Claimed by
                {' '}
                <span className="font-bold">
                  {leftover.owner === name ? 'You' : leftover.owner}
                  {' '}
                  {emojiForString(leftover.owner)}
                </span>
              </>
            )
            : 'Unclaimed' }
          .
        </p>
        { leftover.owner === name
          ? <button type="button" onClick={() => setLeftoverOwner('')} className="p-2 px-3 bg-red-200 hover:bg-red-300">Unclaim 🙅</button>
          : <button type="button" onClick={() => setLeftoverOwner(name)} className="p-2 px-3 bg-green-200 hover:bg-green-300 text-left">This is mine and I want to keep it 🧑‍🍳</button>}
      </div>
    </Card>
  );
}

type SetNameProps = { setName: (name: string) => void };
function SetName({ setName }: SetNameProps) {
  const [tempName, setTempName] = useState('');
  const onSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    if (tempName) {
      setName(tempName);
    }
  };
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input name="Enter your name" value={tempName} setValue={setTempName} />
      { tempName ? <button type="submit" className="p-2 px-3 bg-blue-200 hover:bg-blue-300">Claim some leftovers 😎</button> : null}
    </form>
  );
}

export default function Claim(
  { initialParty, initialName }: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const [party, setParty] = useState(initialParty);
  const [name, setName] = useState(initialName);

  const setLeftoverOwner = async (newOwner: string, id: string) => {
    const body = JSON.stringify({ data: { owner: newOwner } });
    const response = await fetch(`/api/leftovers/${id}/setOwner`, { method: 'POST', body });
    const { data: updatedLeftover } = await response.json();
    setParty({
      ...party,
      leftovers: party.leftovers.map(
        (leftover) => (leftover.id === id ? updatedLeftover : leftover),
      ),
    });
  };

  if (!name) {
    return (
      <SetName setName={(newName) => {
        document.cookie = `name=${newName}`;
        setName(newName);
      }}
      />
    );
  }

  return (
    <>
      <Head>
        <title>Claim your leftovers</title>
      </Head>

      <div className="space-y-3">
        <h1 className="text-xl font-bold">{party.name}</h1>
        <p>
          {`Hi ${name} ${emojiForString(name)}. Claim the leftovers you want to keep:`}
        </p>
        <button type="button" onClick={() => setName('')} className="bg-blue-200 hover:bg-blue-300 p-2 px-3">Change my name</button>
        {party.leftovers.map(
          (leftover) => (
            <ClaimLeftoverCell
              key={leftover.id}
              leftover={leftover}
              name={name}
              setLeftoverOwner={(newOwner) => setLeftoverOwner(newOwner, leftover.id)}
            />
          ),
        )}
      </div>
    </>
  );
}
