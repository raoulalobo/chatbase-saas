'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-9xl font-bold text-red-300">500</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Erreur serveur</h2>
        <p className="text-gray-600 mt-4">
          Une erreur inattendue s'est produite.
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={() => reset()}
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}