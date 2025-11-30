import { create } from 'zustand';
import { UserProfile } from '@/lib/types';
import { useFirebaseStore } from './firebase-store';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

type NewUserParams = {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  branchId: string;
};

type UserState = {
  users: UserProfile[];
  isFetching: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (user: NewUserParams) => Promise<void>;
  editUser: (originalBranchId: string, user: UserProfile) => Promise<void>;
  deleteUser: (branchId: string, userId: string) => Promise<void>;
  findUserInAnyBranch: (userId: string) => Promise<UserProfile | undefined>;
};

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  
  fetchUsers: async () => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isFetching: true });
    try {
      const branchesSnapshot = await getDocs(collection(firestore, 'branches'));
      const allUsers: UserProfile[] = [];
      for (const branchDoc of branchesSnapshot.docs) {
        const usersSnapshot = await getDocs(collection(firestore, `branches/${branchDoc.id}/users`));
        usersSnapshot.forEach(userDoc => {
          allUsers.push({ uid: userDoc.id, ...userDoc.data() } as UserProfile);
        });
      }
      set({ users: allUsers, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      set({ isFetching: false });
    }
  },

  findUserInAnyBranch: async (userId: string) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return undefined;
    
    // First, check the local state
    const userInState = get().users.find(u => u.uid === userId);
    if (userInState) return userInState;

    // If not in state, query Firestore
    set({ isFetching: true });
    try {
        const branchesSnapshot = await getDocs(collection(firestore, 'branches'));
        for (const branchDoc of branchesSnapshot.docs) {
            const userDocsSnap = await getDocs(collection(firestore, `branches/${branchDoc.id}/users`));
            const userDoc = userDocsSnap.docs.find(d => d.id === userId);
             if (userDoc?.exists()) {
                return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
            }
        }
    } catch (error) {
        console.error("Error finding user:", error);
    } finally {
        set({ isFetching: false });
    }
    return undefined;
  },

  addUser: async (user) => {
    const { firestore, auth } = useFirebaseStore.getState();
    if (!firestore || !auth) return;

    set({ isSubmitting: true });
    try {
      // In a real app, this should be a Cloud Function.
      // Creating a user on the client and then their profile has security implications.
      // For this project, we'll proceed with a client-side implementation.
      const { password, ...profileData } = user;
      
      // IMPORTANT: This part is a placeholder. Secure user creation requires Admin SDK.
      // We will create the Firestore record, but Auth user creation won't work securely from client.
      // We'll simulate it by assuming a UID could be created.
      console.warn("addUser function is for demonstration. Secure user creation requires a backend.");
      
      const tempUid = `TEMP_${Date.now()}`;
      
      const userProfile: Omit<UserProfile, 'uid'> = {
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        branchId: profileData.branchId,
      };

      const userDocRef = doc(firestore, `branches/${user.branchId}/users`, tempUid);
      await setDoc(userDocRef, userProfile);
      
      await get().fetchUsers();

    } catch (error) {
      console.error("Failed to add user:", error);
    } finally {
        set({ isSubmitting: false });
    }
  },

  editUser: async (originalBranchId, updatedUser) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isSubmitting: true });
    try {
      const newUserDocRef = doc(firestore, `branches/${updatedUser.branchId}/users`, updatedUser.uid);

      if (originalBranchId !== updatedUser.branchId) {
        // Branch has changed, so we need to delete the old document and create a new one
        const oldUserDocRef = doc(firestore, `branches/${originalBranchId}/users`, updatedUser.uid);
        await deleteDoc(oldUserDocRef);
      }
      
      // Create or update the document in the new branch
      await setDoc(newUserDocRef, updatedUser, { merge: true });
      await get().fetchUsers();

    } catch (error) {
      console.error("Failed to edit user:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteUser: async (branchId, userId) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    set({ isDeleting: true });
    try {
      const userDocRef = doc(firestore, `branches/${branchId}/users`, userId);
      // Note: This only deletes the Firestore record, not the Firebase Auth user.
      // Deleting the auth user requires the Admin SDK.
      await deleteDoc(userDocRef);
      set((state) => ({
        users: state.users.filter((user) => user.uid !== userId),
      }));
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
        set({ isDeleting: false });
    }
  },
}));
