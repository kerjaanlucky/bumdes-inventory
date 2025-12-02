"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useProductStore } from '@/store/product-store';
import { Loader2, UploadCloud, FileCheck2, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type ParsedProduct = {
  nama_produk: string;
  kode_produk: string;
  nama_kategori: string;
  nama_satuan: string;
  stok: number;
  harga_modal: number;
  harga_jual: number;
};

export function ImportDataForm() {
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { importProducts, isSubmitting } = useProductStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setIsLoading(true);
    setError(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const mappedData: ParsedProduct[] = data.map((row, index) => {
           if (!row.nama_produk) {
            throw new Error(`Baris ${index + 2}: 'nama_produk' wajib diisi.`);
          }
           return {
            nama_produk: row.nama_produk,
            kode_produk: row.kode_produk || `PROD-${Date.now() + index}`,
            nama_kategori: row.nama_kategori || 'Lainnya',
            nama_satuan: row.nama_satuan || 'Pcs',
            stok: Number(row.stok) || 0,
            harga_modal: Number(row.harga_modal) || 0,
            harga_jual: Number(row.harga_jual) || 0,
          };
        });

        setParsedData(mappedData);
      } catch (e: any) {
        setError(`Gagal memproses file: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError('Gagal membaca file.');
        setIsLoading(false);
    }
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (parsedData.length > 0) {
      await importProducts(parsedData);
      setParsedData([]); // Clear data after import
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impor Data Produk</CardTitle>
        <CardDescription>
          Unggah file CSV atau Excel untuk mengimpor data produk secara massal.
          Pastikan file Anda memiliki header: `nama_produk`, `kode_produk`, `nama_kategori`, `nama_satuan`, `stok`, `harga_modal`, `harga_jual`.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!parsedData.length && (
           <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {isLoading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
                <>
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-center text-muted-foreground">
                    {isDragActive ? 'Jatuhkan file di sini...' : 'Seret & jatuhkan file di sini, atau klik untuk memilih file'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Hanya file .xlsx, .xls, atau .csv yang didukung.</p>
                </>
            )}
          </div>
        )}

        {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/50">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
            </div>
        )}

        {parsedData.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-700 border border-green-500/50">
                <FileCheck2 className="h-5 w-5" />
                <span>{parsedData.length} produk berhasil diproses dan siap untuk diimpor. Silakan tinjau data di bawah.</span>
            </div>
            <div className="max-h-[50vh] overflow-auto border rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur">
                    <TableRow>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead className="text-right">Stok</TableHead>
                        <TableHead className="text-right">Harga Modal</TableHead>
                        <TableHead className="text-right">Harga Jual</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {parsedData.map((product, index) => (
                        <TableRow key={index}>
                        <TableCell className="font-medium">{product.nama_produk}</TableCell>
                        <TableCell>{product.kode_produk}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{product.nama_kategori}</Badge>
                        </TableCell>
                        <TableCell>
                             <Badge variant="outline">{product.nama_satuan}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.stok}</TableCell>
                        <TableCell className="text-right">Rp{product.harga_modal.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">Rp{product.harga_jual.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
             <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setParsedData([]); setError(null); }} disabled={isSubmitting}>
                    Batalkan
                </Button>
                <Button onClick={handleImport} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Impor {parsedData.length} Produk
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
