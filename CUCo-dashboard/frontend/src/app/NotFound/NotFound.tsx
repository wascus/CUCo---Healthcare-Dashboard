export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-white text-center p-6">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found</p>
      <p className="mt-2 text-gray-400">The page you are looking for doesn’t exist.</p>

      <a
        href="/"
        className="mt-6 inline-block rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
      >
        Go back home
      </a>
    </div>
  );
}
