import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-slate-900">
          Not authorized
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your role does not have access to this screen.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-sm text-slate-900 underline"
        >
          Back to your dashboard
        </Link>
      </div>
    </div>
  );
}
