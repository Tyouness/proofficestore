import Link from 'next/link';

export default function ProductCard({ id, title, price, category }: any) {
  return (
    <Link href={`/product/${id}`} className="group block">
      <div className="bg-[#f5f5f7] rounded-3xl p-8 h-[400px] flex flex-col items-center justify-between transition-transform duration-500 group-hover:scale-[1.02]">
        <div className="text-center">
          <span className="text-[12px] font-bold text-blue-600 uppercase tracking-widest">{category}</span>
          <h3 className="mt-2 text-2xl font-semibold text-gray-900 leading-tight">{title}</h3>
        </div>
        
        {/* Ici on mettra une belle image plus tard */}
        <div className="w-full h-32 bg-gradient-to-t from-gray-200 to-transparent rounded-xl opacity-50"></div>

        <div className="text-center">
          <p className="text-lg font-medium text-gray-500">Dès {price} €</p>
          <span className="mt-4 inline-block bg-white text-black border border-black/10 px-6 py-2 rounded-full text-sm font-semibold group-hover:bg-black group-hover:text-white transition-all">
            Découvrir
          </span>
        </div>
      </div>
    </Link>
  );
}