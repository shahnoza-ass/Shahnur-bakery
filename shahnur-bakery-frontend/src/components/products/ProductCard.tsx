import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineShoppingBag, HiStar } from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    images: { url: string; isMain: boolean }[];
    averageRating: number;
    totalReviews: number;
    stock: number;
    slug: string;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isLiked, setIsLiked] = useState(false);
  const { addToCart } = useCart();

  const mainImage = product.images?.find(img => img.isMain)?.url || 
                   product.images?.[0]?.url || 
                   'https://via.placeholder.com/300x300?text=No+Image';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0) {
      toast.error('Mahsulot tugagan!');
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: mainImage,
      quantity: 1,
    });
    toast.success('Mahsulot savatga qo\'shildi!');
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Sevimlilardan olib tashlandi' : 'Sevimlilarga qo\'shildi');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="card card-hover group"
    >
      <Link to={`/product/${product._id}`}>
        <div className="relative overflow-hidden aspect-square">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Stock badge */}
          {product.stock === 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Tugagan
            </div>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Kam qolgan
            </div>
          )}

          {/* Rating badge */}
          {product.averageRating > 0 && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <HiStar className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold">{product.averageRating.toFixed(1)}</span>
              <span className="text-xs text-dark-400">({product.totalReviews})</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleLike}
              className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <HiOutlineHeart 
                className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-dark-600'}`}
              />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiOutlineShoppingBag className="w-4 h-4" />
              Savatga
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-display text-lg font-semibold text-dark-800 mb-1 truncate">
            {product.name}
          </h3>
          <p className="text-sm text-dark-500 mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary-600">
              {product.price.toLocaleString()} so'm
            </span>
            <span className="text-xs text-dark-400">
              {product.stock > 0 ? `${product.stock} dona` : 'Tugagan'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};