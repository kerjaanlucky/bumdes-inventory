import { create } from 'zustand';
import { User } from '@/lib/types';

type UserState = {
  users: User[];
  isFetching: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'avatar'>) => Promise<void>;
  editUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
};

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  fetchUsers: async () => {
    set({ isFetching: true });
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      set({ users, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      set({ isFetching: false });
    }
  },
  addUser: async (user) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const newUser = await response.json();
      set((state) => ({
        users: [...state.users, newUser],
        isSubmitting: false,
      }));
    } catch (error) {
      console.error("Failed to add user:", error);
      set({ isSubmitting: false });
    }
  },
  editUser: async (updatedUser) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      const returnedUser = await response.json();
      set((state) => ({
        users: state.users.map((user) =>
          user.id === returnedUser.id ? returnedUser : user
        ),
        isSubmitting: false,
      }));
    } catch (error) {
      console.error("Failed to edit user:", error);
      set({ isSubmitting: false });
    }
  },
  deleteUser: async (userId) => {
    set({ isDeleting: true });
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
        isDeleting: false,
      }));
    } catch (error) {
      console.error("Failed to delete user:", error);
      set({ isDeleting: false });
    }
  },
  getUserById: (userId) => {
    return get().users.find((user) => user.id === userId);
  },
}));
