import Link from 'next/link';
import * as React from 'react';

export default function Home() {
  return (
    <div className="space-y-3">
      <h1 className="font-bold">Figure out what stuff in your fridge people still care about.</h1>
      <p>
        Does anyone you live with ever forget about things they left in the fridge?
        It happens to the best of us. Sometimes, life just gets in the way.
      </p>
      <p>
        <span className="font-bold">leftovers.party</span>
        {' '}
        lets you make a list of items in your fridge,
        where your roommates can &apos;claim&apos; the things they want to keep.
      </p>
      <p>
        If no one claims the three month old pad thai thats starting to stink,
        then you finally have your roommates&apos; blessing to throw it away.
      </p>
      <p>
        Don&apos;t wait any longer.
      </p>
      <Link href="/party/new"><a className="bg-green-200 hover:bg-green-300 p-2 px-3 block w-fit">Start a party 🥳</a></Link>
    </div>
  );
}
