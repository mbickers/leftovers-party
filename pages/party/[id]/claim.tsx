import { Leftover, Party } from '@prisma/client';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Image from 'next/image';
import React, { SyntheticEvent, useState } from 'react';
import prisma from '../../../lib/prisma';

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
    <div>
      <Image src={leftover.image_url} alt="" width="50px" height="50px" />
      <p>{leftover.description}</p>
      <p>
        { leftover.owner ? `Claimed by ${leftover.owner}` : 'Unclaimed' }
      </p>
      { leftover.owner === name
        ? <button type="button" onClick={() => setLeftoverOwner('')}>Unclaim</button> : <button type="button" onClick={() => setLeftoverOwner(name)}>This is mine and I want to keep it</button>}
    </div>
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
    <form onSubmit={onSubmit}>
      <label htmlFor="name">
        Name
        <input id="name" type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} />
      </label>
      { tempName ? <input type="submit" /> : null}
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
      <p>{party.name}</p>
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
      <button type="button" onClick={() => setName('')}>Change my name</button>
    </>
  );
}
