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

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const userUid = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);
  
  const router = useRouter()

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
      error.value = err.message;
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
      error.value = err.message;
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
