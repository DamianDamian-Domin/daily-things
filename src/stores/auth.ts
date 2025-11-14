import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { auth } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { useRouter } from "vue-router";
import { useHabbitsStore } from "./habbits";
import { FirebaseError } from "firebase/app";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const userUid = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);
  
  const router = useRouter()


  const mapFirebaseError = (code: string) => {
    switch (code) {
        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/invalid-email":
            return "Invalid email format.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/network-request-failed":
            return "Network error. Check your connection.";

        case "auth/operation-not-allowed":
            return "This account type is disabled.";

        default:
            return "An unexpected error occurred. Try again later.";
    }
};


  const initAuth = () => {
    return new Promise<void>(async (resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        user.value = firebaseUser;
        userUid.value = firebaseUser ? firebaseUser.uid : null;
        initialized.value = true;
        resolve();
      });
    });
  };

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user.value = userCredential.user;
      userUid.value = userCredential.user.uid;
      return userCredential.user;
    } catch (err: any) {
      error.value = mapFirebaseError(err.code || "");;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user.value = userCredential.user;
      userCredential.user.uid;
      return userCredential.user;
    } catch (err: any) {
      error.value = mapFirebaseError(err.code || "");;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    user.value = null;
    router.push('/login');
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    initialized,
    initAuth,
    userUid
  };
});
