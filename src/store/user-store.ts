import { create } from 'zustand';
import { users as initialUsers } from '@/lib/data';
import { User } from '@/lib/types';

type UserState = {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'avatar'>) => void;
  editUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
};

export const useUserStore = create<UserState>((set, get) => ({
  users: initialUsers,
  addUser: (user) => {
    const newUser: User = {
      ...user,
      id: `USR${String(get().users.length + 1).padStart(3, '0')}`,
      avatar: `/avatars/0${(get().users.length % 4) + 1}.png`,
    };
    set((state) => ({
      users: [...state.users, newUser],
    }));
  },
  editUser: (updatedUser) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      ),
    }));
  },
  deleteUser: (userId) => {
    set((state) => ({
      users: state.users.filter((user) => user.id !== userId),
    }));
  },
  getUserById: (userId: string) => {
    return get().users.find((user) => user.id === userId);
  }
}));
