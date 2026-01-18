import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-16 overflow-hidden bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-black mb-6">
          L'expertise Microsoft. <br />
          <span className="text-gray-600">Simplement Premium.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-10 font-medium">
          Logiciels authentiques. Activation immédiate. <br /> Support d'expert inclus.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="#products" className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all">
            Acheter maintenant
          </Link>
          <Link href="/blog" className="text-blue-600 hover:underline font-semibold text-lg">
            En savoir plus &rsaquo;
          </Link>
        </div>
      </div>
    </section>
  );
}