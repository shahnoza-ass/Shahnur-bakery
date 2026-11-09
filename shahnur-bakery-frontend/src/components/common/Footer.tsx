import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-800 text-cream-100 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-2xl text-gold-400 mb-4">Shahnur Bakery</h3>
            <p className="text-cream-300 text-sm leading-relaxed">
              Nafis qandolatchilik mahsulotlari. Har bir tort va pirojniy maxsus 
              muhabbat va e'tibor bilan tayyorlanadi.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Tez havolalar</h4>
            <ul className="space-y-2">
              <li><Link to="/shop" className="hover:text-gold-400 transition-colors">Mahsulotlar</Link></li>
              <li><Link to="/about" className="hover:text-gold-400 transition-colors">Biz haqimizda</Link></li>
              <li><Link to="/contact" className="hover:text-gold-400 transition-colors">Aloqa</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Bog'lanish</h4>
            <ul className="space-y-2 text-sm text-cream-300">
              <li>📍 Toshkent sh., Chilonzor tumani</li>
              <li>📞 +998 90 123 45 67</li>
              <li>✉️ info@shahnurbakery.uz</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-sm text-cream-400">
          © {currentYear} Shahnur Bakery. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
};