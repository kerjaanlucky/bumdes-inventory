
import { create } from 'zustand';
import { UserProfile } from '@/lib/types';
import { useFirebaseStore } from './firebase-store';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuthStore } from './auth-store';


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
  updateCurrentUserProfile: (newName: string) => Promise<void>;
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
    const { firestore } = useFirebaseStore.getState();
    const auth = useAuthStore.getState().user?.providerId ? useFirebaseStore.getState().auth : null;
    if (!firestore || !auth) return;

    set({ isSubmitting: true });
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password!);
      const firebaseUser = userCredential.user;
      
      // Update display name in Auth
      await updateProfile(firebaseUser, { displayName: user.name });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      };
      
      const userDocRef = doc(firestore, `users`, firebaseUser.uid);
      await setDoc(userDocRef, userProfile);
      
      await get().fetchUsers();

    } catch (error) {
      console.error("Error in addUser:", error);
      // Handle specific auth errors if needed
    } finally {
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
  
  updateCurrentUserProfile: async (newName: string) => {
    const { auth, firestore } = useFirebaseStore.getState();
    const currentUser = auth?.currentUser;
    if (!currentUser || !firestore) {
        console.error("User not logged in or firestore not available");
        return;
    }

    set({ isSubmitting: true });
    try {
        // 1. Update Firebase Auth profile
        await updateProfile(currentUser, { displayName: newName });
        
        // 2. Update Firestore user document
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await setDoc(userDocRef, { name: newName }, { merge: true });

        // 3. Re-fetch user profile in auth store to reflect changes globally
        useAuthStore.getState().fetchUserProfile(currentUser);

    } catch(error) {
        console.error("Error updating user profile:", error);
    } finally {
        set({ isSubmitting: false });
    }
  },

  deleteUser: async (branchId, userId) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    set({ isDeleting: true });
    try {
      // Note: This only deletes the Firestore record. For a full deletion,
      // you would need a Firebase Function to delete the Auth user.
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
