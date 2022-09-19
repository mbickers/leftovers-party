import * as React from 'react';

export type CardProps = { image_url: string, children: React.ReactNode };
export function Card({ image_url, children }: CardProps) {
  return (
    <div className="overflow-hidden bg-gray-100 sm:flex sm:h-64">
      <div className="sm:shrink-0 sm:w-64">
        <picture>
          <img src={image_url} alt="" className="object-cover aspect-square w-full" />
        </picture>
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
  );
}
