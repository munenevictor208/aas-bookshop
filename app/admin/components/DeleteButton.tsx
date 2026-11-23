"use client";

export default function DeleteButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="font-semibold text-red-600 hover:underline"
        onClick={(event) => {
          if (!window.confirm(`${label}?`)) event.preventDefault();
        }}
      >
        Delete
      </button>
    </form>
  );
}
