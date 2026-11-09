import api from './api';

export const reviewService = {
  async createReview(data: any): Promise<any> {
    const res = await api.post('/reviews', data);
    return res.data.data;
  },

  async getProductReviews(productId: string): Promise<any> {
    const res = await api.get(`/reviews/product/${productId}`);
    return res.data;
  },

  async getMyReviews(): Promise<any> {
    const res = await api.get('/reviews/my-reviews');
    return res.data.data;
  },
};