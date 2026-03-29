import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  className?: string;
};

export default function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  label,
  className,
}: InputProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="mb-1">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="border rounded-lg p-2"
      />
    </div>
  );
}
