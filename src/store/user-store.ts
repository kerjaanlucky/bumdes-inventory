import { create } from 'zustand';
import { UserProfile } from '@/lib/types';
import { useFirebaseStore } from './firebase-store';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const allUsers: UserProfile[] = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
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
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc?.exists()) {
        return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
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
      console.warn("addUser function is for demonstration. Secure user creation requires a backend.");
      
      const tempUid = `TEMP_${Date.now()}`;
      
      const userProfile: UserProfile = {
        uid: tempUid, // This will be overwritten by the real UID in a real scenario
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      };

      const userDocRef = doc(firestore, `users`, tempUid);
      
      setDoc(userDocRef, userProfile).then(async () => {
         await get().fetchUsers();
         set({ isSubmitting: false });
      }).catch(error => {
        console.log("Error in setDoc for addUser", error);
         errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'create',
              requestResourceData: userProfile
         }));
         set({ isSubmitting: false });
      });

    } catch (error) {
      console.error("Outer error in addUser:", error);
      set({ isSubmitting: false });
    }
  },

  editUser: async (originalBranchId, updatedUser) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isSubmitting: true });
    try {
      const userDocRef = doc(firestore, `users`, updatedUser.uid);
      await setDoc(userDocRef, updatedUser, { merge: true });
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
      const userDocRef = doc(firestore, 'users', userId);
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
