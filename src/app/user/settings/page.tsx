"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountSettingsForm } from "./account-settings-form"
import { BranchSettingsForm } from "./branch-settings-form"
import { DangerZone } from "./danger-zone"
import { ImportDataForm } from "./import-data-form"
import Link from "next/link"
import UnitReconciliationPage from "./unit-reconciliation/page"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Pengaturan</h1>
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="account">Akun</TabsTrigger>
          <TabsTrigger value="branch">Cabang</TabsTrigger>
          <TabsTrigger value="import">Impor Data</TabsTrigger>
          <TabsTrigger value="reconciliation">Pemadanan Data</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <AccountSettingsForm />
        </TabsContent>
        <TabsContent value="branch">
          <BranchSettingsForm />
        </TabsContent>
         <TabsContent value="import">
          <ImportDataForm />
        </TabsContent>
         <TabsContent value="reconciliation">
          <UnitReconciliationPage />
        </TabsContent>
        <TabsContent value="danger">
            <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  )
}
