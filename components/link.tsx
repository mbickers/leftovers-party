import * as React from 'react';
import NextLink from 'next/link';

export type LinkProps = { href: string, text: string };
export function Link({ href, text }: LinkProps) {
  return <NextLink href={href}><a className="underline">{text}</a></NextLink>;
}
