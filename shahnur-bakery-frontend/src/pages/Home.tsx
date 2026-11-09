import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Home = () => {
  return (
    <div>
      <section className="min-h-[80vh] flex items-center hero-gradient relative overflow-hidden">
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <span className="inline-block px-4 py-2 bg-gold-500/20 text-gold-600 rounded-full text-sm font-semibold">
                ✨ Premium qandolatxona
              </span>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="gradient-text">Nafis</span> va
                <br />
                <span className="text-dark-800">mazali</span> tortlar
              </h1>
              <p className="text-lg text-dark-600 max-w-lg">
                Har bir tort va pirojniy maxsus retsept bo'yicha, faqat siz uchun 
                eng yuqori sifatli ingredientlardan tayyorlanadi.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop" className="btn-primary">Mahsulotlarni ko'rish</Link>
                <Link to="/about" className="btn-outline">Ko'proq ma'lumot</Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"
                  alt="Shahnur Bakery"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-cream-50 rounded-2xl">
              <div className="text-4xl mb-4">🎂</div>
              <h3 className="font-semibold text-xl mb-2">Premium ingredientlar</h3>
              <p className="text-dark-500">Eng sifatli va tabiiy mahsulotlardan foydalanamiz</p>
            </div>
            <div className="text-center p-8 bg-cream-50 rounded-2xl">
              <div className="text-4xl mb-4">👨‍🍳</div>
              <h3 className="font-semibold text-xl mb-2">Professional qandolatchilar</h3>
              <p className="text-dark-500">Tajribali ustalar tomonidan tayyorlanadi</p>
            </div>
            <div className="text-center p-8 bg-cream-50 rounded-2xl">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="font-semibold text-xl mb-2">Tez yetkazib berish</h3>
              <p className="text-dark-500">Toshkent bo'ylab 30 daqiqada yetkazib beramiz</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary-600 to-gold-500 text-white">
        <div className="container-custom text-center">
          <h2 className="font-display text-4xl font-bold mb-4">
            Maxsus tort buyurtma qilishni xohlaysizmi?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            O'zingiz xohlagan dizayn va mazdagi tortni bizga buyurtma bering
          </p>
          <Link to="/contact" className="inline-block bg-white text-primary-600 font-semibold px-8 py-4 rounded-full hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Bog'lanish
          </Link>
        </div>
      </section>
    </div>
  );
};