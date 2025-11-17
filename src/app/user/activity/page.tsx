
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Activity } from "lucide-react"

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Log Aktivitas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Pengguna</CardTitle>
          <CardDescription>
            Log aktivitas terbaru yang dilakukan oleh pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
              <div className="flex flex-col items-center gap-1 text-center">
                <Activity className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                  Log aktivitas segera hadir
                </h3>
                <p className="text-sm text-muted-foreground">
                  Anda akan dapat melihat log aktivitas pengguna di sini.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}

