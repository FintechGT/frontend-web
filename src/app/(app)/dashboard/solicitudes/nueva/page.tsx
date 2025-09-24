export default function NuevaSolicitudPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nueva solicitud</h1>
      <p className="text-sm text-neutral-400">
        Aquí irá el formulario para crear tu solicitud (artículos, fotos, etc.).
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-neutral-300">
          *Pendiente de integrar con el endpoint <code className="px-1 py-0.5 rounded bg-white/10">POST /solicitudes</code>.
        </p>
      </div>
    </div>
  );
}
