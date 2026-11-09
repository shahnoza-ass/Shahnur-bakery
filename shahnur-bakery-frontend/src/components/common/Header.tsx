import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineUser } from 'react-icons/hi';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl">🎂</span>
            <div>
              <h1 className="font-display text-2xl font-bold text-primary-600">
                Shahnur Bakery
              </h1>
              <p className="text-xs text-primary-400 font-medium tracking-wider">
                PREMIUM PASTRY
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-dark-600 hover:text-primary-600 transition-colors">
              Asosiy
            </Link>
            <Link to="/shop" className="text-dark-600 hover:text-primary-600 transition-colors">
              Mahsulotlar
            </Link>
            <Link to="/about" className="text-dark-600 hover:text-primary-600 transition-colors">
              Biz haqimizda
            </Link>
            <Link to="/contact" className="text-dark-600 hover:text-primary-600 transition-colors">
              Aloqa
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative p-2 hover:bg-cream-100 rounded-full transition-colors">
              <HiOutlineShoppingBag className="w-6 h-6 text-dark-600" />
            </Link>
            <Link to="/login" className="p-2 hover:bg-cream-100 rounded-full transition-colors">
              <HiOutlineUser className="w-6 h-6 text-dark-600" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};