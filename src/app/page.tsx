export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-2xl text-center bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-3">
          Sistema de Empeños Online
        </h1>
        <p className="text-gray-700 mb-6">
          Solicita préstamos dejando tus artículos en garantía, da seguimiento a
          tus solicitudes y gestiona pagos desde una sola plataforma, rápida y segura.
        </p>

        <div className="flex gap-4 justify-center">
          <a href="/register" className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
            Crear cuenta
          </a>
          <a href="/login" className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Iniciar sesión
          </a>
        </div>
      </div>
    </main>
  );
}
