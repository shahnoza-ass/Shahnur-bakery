import api from './api';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: { url: string; isMain: boolean }[];
  stock: number;
  category: string;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  slug: string;
  nameRu?: string;
  descriptionRu?: string;
  ingredients?: string;
  allergens?: string[];
  ingredientsVerified?: boolean;
  customizable?: boolean;
  customPricePerKg?: number;
  lowStockThreshold?: number;
}

export interface ProductFilters {
  ids?: string;
  excludeAllergens?: string;
  customizable?: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const productService = {
  // Mahsulotlar ro'yxatini olish
  async getProducts(filters: ProductFilters = {}): Promise<{ data: Product[]; pagination: any }> {
    const res = await api.get('/products', { params: filters });
    return res.data;
  },

  // Bitta mahsulotni olish
  async getProduct(id: string): Promise<Product> {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  },

  // Yangi mahsulot qo'shish (ADMIN)
  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await api.post('/products', data);
    return res.data.data;
  },

  // Mahsulotni tahrirlash (ADMIN)
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const res = await api.put(`/products/${id}`, data);
    return res.data.data;
  },

  // Mahsulotni o'chirish (ADMIN)
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  // Rasm yuklash (ADMIN)
  async uploadImages(id: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const res = await api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Rasm o'chirish (ADMIN)
  async deleteImage(productId: string, imageId: string): Promise<void> {
    await api.delete(`/products/${productId}/images/${imageId}`);
  },

  // Ombor miqdorini yangilash (ADMIN)
  async updateStock(id: string, stock: number): Promise<Product> {
    const res = await api.patch(`/products/${id}/stock`, { stock });
    return res.data.data;
  },
};
