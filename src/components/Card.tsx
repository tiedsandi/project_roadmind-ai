import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <div className="flex flex-col justify-between border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      {children}
    </div>
  );
}
