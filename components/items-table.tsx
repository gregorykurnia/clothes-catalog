"use client";

import { memo, useMemo, useState } from "react";
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

let pendingRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

// Coalesces rapid-fire edits (e.g. flipping several dropdowns in a row) into a
// single router.refresh(). Firing one refresh per edit lets their responses
// race and arrive out of order, so a stale snapshot from an earlier edit can
// land last and revert everything to it.
function scheduleRefresh(router: { refresh: () => void }) {
  if (pendingRefreshTimeout) clearTimeout(pendingRefreshTimeout);
  pendingRefreshTimeout = setTimeout(() => {
    pendingRefreshTimeout = null;
    router.refresh();
  }, 400);
}

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
    getRowId: (row) => row.id,
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

const StatusCell = memo(function StatusCell({ item }: { item: Item }) {
  const [status, setStatus] = useState(item.status);
  const router = useRouter();
  // Tracks the updatedAt of the value we're currently showing, so an
  // out-of-order refresh response carrying an older snapshot (from before
  // this or another edit landed) can't stomp a newer value.
  const [version, setVersion] = useState(item.updatedAt);

  if (item.updatedAt > version) {
    setVersion(item.updatedAt);
    if (item.status !== status) setStatus(item.status);
  }

  async function handleChange(value: string) {
    const next = value as ItemStatus;
    if (next === status) return;
    const previous = status;
    setStatus(next);
    try {
      const updatedAt = await updateItemStatus(item.id, next);
      // Two edits on the same row can resolve out of order; never let the
      // version go backward.
      setVersion((v) => Math.max(v, updatedAt));
      scheduleRefresh(router);
    } catch {
      setStatus(previous);
      toast.error("Failed to update status");
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      className={`h-7 rounded-md border-none px-2 text-xs font-medium ${
        status === "washed"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
      }`}
    >
      <option value="present">Present</option>
      <option value="washed">Laundry</option>
    </select>
  );
});

const GoingOutCell = memo(function GoingOutCell({ item }: { item: Item }) {
  const [goingOut, setGoingOut] = useState(item.goingOut);
  const router = useRouter();
  // Tracks the updatedAt of the value we're currently showing, so an
  // out-of-order refresh response carrying an older snapshot (from before
  // this or another edit landed) can't stomp a newer value.
  const [version, setVersion] = useState(item.updatedAt);

  if (item.updatedAt > version) {
    setVersion(item.updatedAt);
    if (item.goingOut !== goingOut) setGoingOut(item.goingOut);
  }

  async function handleChange(value: string) {
    const next = value === "yes";
    if (next === goingOut) return;
    const previous = goingOut;
    setGoingOut(next);
    try {
      const updatedAt = await updateItemGoingOut(item.id, next);
      // Two edits on the same row can resolve out of order; never let the
      // version go backward.
      setVersion((v) => Math.max(v, updatedAt));
      scheduleRefresh(router);
    } catch {
      setGoingOut(previous);
      toast.error("Failed to update going out status");
    }
  }

  return (
    <select
      value={goingOut ? "yes" : "no"}
      onChange={(e) => handleChange(e.target.value)}
      className={`h-7 rounded-md border-none px-2 text-xs font-medium ${
        goingOut
          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
});

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
