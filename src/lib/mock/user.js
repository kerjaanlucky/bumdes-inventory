export const userMock = {
  id: 'USR002',
  name: 'Bob Williams',
  email: 'bob@example.com',
  role: 'User',
  branch: 'West',
  avatar: '/avatars/02.png',
  recentActivities: [
    { action: 'Sale', details: 'Sold 2x Laptop Pro 15"', time: '2 hours ago' },
    { action: 'Stock Check', details: 'Verified stock for Wireless Mouse', time: '1 day ago' },
    { action: 'Purchase', details: 'Ordered 10x 4K Monitor 27"', time: '3 days ago' },
  ],
  inventorySummary: {
    inStock: 188,
    lowStock: 1,
    outOfStock: 1,
    categories: 3,
    pendingPurchases: 2,
  },
};
