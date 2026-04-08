import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { auth } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
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

        case "auth/invalid-credential":
            return "Invalid authentication credentials.";

        case "auth/user-disabled":
            return "This user account has been disabled.";

        case "auth/popup-closed-by-user":
            return "Okno logowania zostało zamknięte.";

        case "auth/cancelled-popup-request":
            return "";

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

      // Sprawdź czy email został zweryfikowany
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        user.value = null;
        userUid.value = null;
        error.value = "__email_not_verified__";
        throw new Error("Email not verified");
      }

      user.value = userCredential.user;
      userUid.value = userCredential.user.uid;
      return userCredential.user;
    } catch (err: any) {
      if (error.value !== "__email_not_verified__") {
        error.value = mapFirebaseError(err.code || "");
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Ponowne wysłanie emaila weryfikacyjnego
  const resendVerificationEmail = async (emailAddr: string, password: string) => {
    loading.value = true;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailAddr, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      user.value = null;
      userUid.value = null;
    } catch (err: any) {
      error.value = mapFirebaseError(err.code || "");
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
      // Wyślij email weryfikacyjny
      await sendEmailVerification(userCredential.user);
      // Wyloguj użytkownika — nie może korzystać z aplikacji bez weryfikacji
      await signOut(auth);
      user.value = null;
      userUid.value = null;
      return userCredential.user;
    } catch (err: any) {
      error.value = mapFirebaseError(err.code || "");;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Logowanie przez Google
  const loginWithGoogle = async () => {
    loading.value = true;
    error.value = null;
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      user.value = result.user;
      userUid.value = result.user.uid;
      return result.user;
    } catch (err: any) {
      const msg = mapFirebaseError(err.code || "");
      if (msg) error.value = msg;
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
    loginWithGoogle,
    resendVerificationEmail,
    logout,
    initialized,
    initAuth,
    userUid
  };
});
