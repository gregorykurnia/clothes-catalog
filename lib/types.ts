export type Category = {
  id: string;
  name: string;
  order: number;
};

export type Item = {
  id: string;
  name: string;
  photoUrl: string | null;
  categoryId: string;
  brand: string;
  createdAt: number;
};
