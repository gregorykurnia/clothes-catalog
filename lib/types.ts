export type Category = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  photoUrl: string | null;
  categoryId: string;
  brand: string;
  createdAt: number;
};
