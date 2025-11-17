import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Package, ShoppingCart } from "lucide-react";
import { userMock } from "@/lib/mock/user";

export default function UserDashboardPage() {
  const { name, recentActivities, inventorySummary } = userMock;

  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Welcome, {name}!</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.inStock}</div>
            <p className="text-xs text-muted-foreground">
              Across {inventorySummary.categories} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.pendingPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-sm text-muted-foreground">
                {recentActivities.length > 0 ? (
                    <ul>
                        {recentActivities.map((activity, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <span className="font-semibold">{activity.action}:</span>
                                <span>{activity.details}</span>
                                <span className="text-xs text-gray-500">({activity.time})</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No recent activity.</p>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>User Actions</CardTitle>
            <CardDescription>Quick actions for your daily tasks.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  User-specific features coming soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  You will be able to perform actions here.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
