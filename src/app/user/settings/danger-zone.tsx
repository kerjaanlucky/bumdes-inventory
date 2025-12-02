
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { useProductStore } from "@/store/product-store";
import { useCustomerStore } from "@/store/customer-store";
import { useSupplierStore } from "@/store/supplier-store";
import { useSaleStore } from "@/store/sale-store";
import { usePurchaseStore } from "@/store/purchase-store";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type ActionType = 'products' | 'customers' | 'suppliers' | 'sales' | 'purchases' | 'all';

interface ActionConfig {
  title: string;
  description: string;
  action: () => Promise<void>;
  isSubmitting: boolean;
}

export function DangerZone() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");

  const { deleteAllProducts, isDeleting: isDeletingProducts } = useProductStore();
  const { deleteAllCustomers, isDeleting: isDeletingCustomers } = useCustomerStore();
  const { deleteAllSuppliers, isDeleting: isDeletingSuppliers } = useSupplierStore();
  const { deleteAllSales, isDeleting: isDeletingSales } = useSaleStore();
  const { deleteAllPurchases, isDeleting: isDeletingPurchases } = usePurchaseStore();
  
  const isAnyTaskRunning = isDeletingProducts || isDeletingCustomers || isDeletingSuppliers || isDeletingSales || isDeletingPurchases;

  const actions: Record<ActionType, ActionConfig> = {
    products: {
      title: "Hapus Semua Produk?",
      description: "Tindakan ini akan menghapus semua data master produk secara permanen. Ini tidak dapat dibatalkan.",
      action: deleteAllProducts,
      isSubmitting: isDeletingProducts,
    },
    customers: {
      title: "Hapus Semua Pelanggan?",
      description: "Tindakan ini akan menghapus semua data pelanggan secara permanen.",
      action: deleteAllCustomers,
      isSubmitting: isDeletingCustomers,
    },
    suppliers: {
      title: "Hapus Semua Pemasok?",
      description: "Tindakan ini akan menghapus semua data pemasok secara permanen.",
      action: deleteAllSuppliers,
      isSubmitting: isDeletingSuppliers,
    },
    sales: {
      title: "Hapus Semua Penjualan?",
      description: "Tindakan ini akan menghapus semua riwayat transaksi penjualan secara permanen.",
      action: deleteAllSales,
      isSubmitting: isDeletingSales,
    },
    purchases: {
      title: "Hapus Semua Pembelian?",
      description: "Tindakan ini akan menghapus semua riwayat transaksi pembelian secara permanen.",
      action: deleteAllPurchases,
      isSubmitting: isDeletingPurchases,
    },
    all: {
      title: "Hapus Semua Data Transaksional?",
      description: "PERINGATAN: Ini akan menjalankan semua tindakan penghapusan di atas. Semua produk, pelanggan, pemasok, penjualan, dan pembelian akan dihapus.",
      action: async () => {
          await deleteAllProducts();
          await deleteAllCustomers();
          await deleteAllSuppliers();
          await deleteAllSales();
          await deleteAllPurchases();
      },
      isSubmitting: isAnyTaskRunning,
    },
  };

  const openDialog = (action: ActionType) => {
    setSelectedAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (selectedAction) {
      const config = actions[selectedAction];
      await config.action();
      toast({ title: "Data Dihapus", description: `Semua ${selectedAction === 'all' ? 'data transaksional' : selectedAction} telah berhasil dihapus.` });
      setDialogOpen(false);
      setSelectedAction(null);
      setConfirmationInput("");
    }
  };

  return (
    <>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Harap berhati-hati.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(actions).map((key) => {
            const actionKey = key as ActionType;
            if(actionKey === 'all') return null; // handle 'all' separately
            const { title, description, isSubmitting } = actions[actionKey];
            return (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{title.replace('?', '')}</h4>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button variant="destructive" onClick={() => openDialog(actionKey)} disabled={isSubmitting || isAnyTaskRunning}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Hapus
                </Button>
              </div>
            );
          })}
           <div className="flex items-center justify-between p-4 border border-destructive bg-destructive/10 rounded-lg">
            <div>
                <h4 className="font-semibold text-destructive">Hapus Semua Data Transaksional</h4>
                <p className="text-sm text-destructive/80">Menjalankan semua tindakan penghapusan data master dan transaksi.</p>
            </div>
            <Button variant="destructive" onClick={() => openDialog('all')} disabled={isAnyTaskRunning}>
                {isAnyTaskRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Hapus Semua
            </Button>
            </div>
        </CardContent>
      </Card>

      {selectedAction && (
        <ConfirmationDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleConfirm}
          title={actions[selectedAction].title}
          description={actions[selectedAction].description}
          isSubmitting={actions[selectedAction].isSubmitting}
        >
            <div className="space-y-2 my-4">
                <p className="text-sm text-muted-foreground">
                    Untuk konfirmasi, silakan ketik <strong className="text-foreground">HAPUS</strong> di bawah ini.
                </p>
                <Input 
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder="HAPUS"
                />
            </div>
        </ConfirmationDialog>
      )}
    </>
  );
}
