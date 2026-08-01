export type Category = {
  id: string;
  name: string;
  order: number;
};

export type ItemStatus = "present" | "washed";

export type Item = {
  id: string;
  name: string;
  photoUrl: string | null;
  categoryId: string;
  brand: string;
  status: ItemStatus;
  goingOut: boolean;
  createdAt: number;
};
