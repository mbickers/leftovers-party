import prisma from '../../lib/prisma';

export async function getServerSideProps() {
  const newPost = await prisma.party.create({
    data: {
      name: 'New Party',
    },
  });

  return {
    redirect: {
      destination: `/party/${newPost.id}/edit`,
    },
  };
}

const New = () => {};
export default New;
