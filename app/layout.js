import './globals.css';

export const metadata = {
  title: 'Tortitacos — El antojo tiene cuatro sabores',
  description: 'Descubre los cuatro sabores de Tortitacos: Queso, Tradicional, De colores y Limón fuego.',
};

export default function RootLayout({ children }) {
  return <html lang="es"><body>{children}</body></html>;
}
