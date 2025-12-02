
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountSettingsForm } from "./account-settings-form"
import { BranchSettingsForm } from "./branch-settings-form"
import { DangerZone } from "./danger-zone"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Pengaturan</h1>
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="account">Akun</TabsTrigger>
          <TabsTrigger value="branch">Cabang</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <AccountSettingsForm />
        </TabsContent>
        <TabsContent value="branch">
          <BranchSettingsForm />
        </TabsContent>
        <TabsContent value="danger">
            <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  )
}
