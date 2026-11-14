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
};

export type ProductSpecification = {
  property: string;
  value: string;
};

export type CatalogResponse = {
  categories: Category[];
  products: Product[];
  contactPhone: string;
};

export type ProductResponse = {
  product: Product;
  contactPhone: string;
};
