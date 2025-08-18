import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-4">
      <Link href="/chat" className="text-blue-600 underline">Gå till chatten</Link>
    </main>
  );
}
