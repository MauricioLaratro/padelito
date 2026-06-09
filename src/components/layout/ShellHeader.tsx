/**
 * Encabezado compacto de la aplicacion.
 * Se construye para mostrar marca sin ocupar demasiado espacio vertical.
 * Lo usa App mientras se incorporan las rutas reales.
 * Sirve para mantener visible la identidad de Padelito en el shell mobile.
 */
export function ShellHeader() {
  return (
    <header className="px-4 pt-20">
      <img
        alt="Padelito"
        className="h-auto w-44"
        src="/logo-padelito.svg"
      />
    </header>
  );
}
