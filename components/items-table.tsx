"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category, Item, ItemStatus } from "@/lib/types";
import { deleteItem, updateItemGoingOut, updateItemStatus } from "@/lib/actions/items";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Row = Item & { categoryName: string };

export function ItemsTable({
  items,
  categories,
  onEdit,
}: {
  items: Item[];
  categories: Category[];
  onEdit: (item: Item) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const router = useRouter();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const data: Row[] = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        categoryName: categoryMap.get(item.categoryId) ?? "Uncategorized",
      })),
    [items, categoryMap],
  );

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "photo",
        header: "Photo",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.photoUrl ? (
            <PhotoLightbox photoUrl={row.original.photoUrl} name={row.original.name}>
              <Image
                src={cloudinaryThumb(row.original.photoUrl, 96)}
                alt={row.original.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-md object-cover"
                unoptimized
              />
            </PhotoLightbox>
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted" />
          ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortButton column={column} label="Name" />
        ),
      },
      {
        accessorKey: "categoryName",
        header: ({ column }) => (
          <SortButton column={column} label="Category" />
        ),
      },
      {
        accessorKey: "brand",
        header: ({ column }) => (
          <SortButton column={column} label="Brand" />
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortButton column={column} label="Status" />
        ),
        cell: ({ row }) => <StatusCell item={row.original} />,
      },
      {
        accessorKey: "goingOut",
        header: ({ column }) => (
          <SortButton column={column} label="Going Out?" />
        ),
        cell: ({ row }) => <GoingOutCell item={row.original} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {row.original.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await deleteItem(row.original.id);
                        toast.success("Item deleted");
                        router.refresh();
                      } catch {
                        toast.error("Failed to delete item");
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ],
    [onEdit, router],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search items..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusCell({ item }: { item: Item }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleChange(value: string | null) {
    const status = value as ItemStatus;
    if (!status || status === item.status) return;
    setBusy(true);
    try {
      await updateItemStatus(item.id, status);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Select value={item.status} onValueChange={handleChange} disabled={busy}>
      <SelectTrigger
        size="sm"
        className={`h-7 border-none text-xs font-medium ${
          item.status === "washed"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
        }`}
      >
        <SelectValue placeholder="Status">
          {(value: ItemStatus | null) => (value === "washed" ? "Washed" : "Present")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="present">Present</SelectItem>
        <SelectItem value="washed">Washed</SelectItem>
      </SelectContent>
    </Select>
  );
}

function GoingOutCell({ item }: { item: Item }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleChange(value: string | null) {
    if (!value) return;
    const goingOut = value === "yes";
    if (goingOut === item.goingOut) return;
    setBusy(true);
    try {
      await updateItemGoingOut(item.id, goingOut);
      router.refresh();
    } catch {
      toast.error("Failed to update going out status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Select value={item.goingOut ? "yes" : "no"} onValueChange={handleChange} disabled={busy}>
      <SelectTrigger
        size="sm"
        className={`h-7 border-none text-xs font-medium ${
          item.goingOut
            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <SelectValue placeholder="Going Out?">
          {(value: string | null) => (value === "yes" ? "Yes" : "No")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SortButton({
  column,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: any;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-3"
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}
