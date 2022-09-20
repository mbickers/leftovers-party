import '../styles/globals.css';
import * as React from 'react';
import type { AppProps } from 'next/app';
import NextLink from 'next/link';
import Head from 'next/head';
import { Link } from '../components/link';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍗</text></svg>" />
      </Head>

      <div className="container font-mono min-h-screen min-w-full">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <header className="font-bold text-xl p-2 border-black border-4 flex justify-between">
            <NextLink href="/">leftovers.party</NextLink>
            <div className="hover:rotate-180 transition-all">
              🍗
            </div>
          </header>
          <div className="border-black border-4 p-2">
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <Component {...pageProps} />
          </div>
          <footer className="text-center">
            Made by
            {' '}
            <Link href="https://bickers.dev" text="Max" />
            {' '}
            on
            {' '}
            <Link href="https://github.com/mbickers/leftovers-party" text="GitHub" />
            .
          </footer>
        </div>
      </div>
    </>
  );
}

export default MyApp;
