import * as React from 'react';

export type InputProps = { name: string, value: string, setValue: (value: string) => void };
export function Input({ name, value, setValue }: InputProps) {
  return (
    <div>
      {name}
      :
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="bg-gray-200 mx-2 px-2 py-1 focus:outline-none focus:bg-gray-300 hover:bg-gray-300 rounded-none" />
    </div>
  );
}
