export type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
};

export type Product = {
  id: string;
  name: string;
  model: string;
  description: string;
  imageUrl: string | null;
  specifications: ProductSpecification[];
  categoryId: string;
  categoryName: string;
  active: boolean;
};

export type ProductSpecification = {
  property: string;
  value: string;
};

export type ProductInput = Omit<Product, 'id' | 'categoryName' | 'active'>;

export type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
  readAt: string | null;
};
