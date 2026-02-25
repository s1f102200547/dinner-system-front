import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

type FirebaseEnvKey =
  | "FIREBASE_PROJECT_ID"
  | "FIREBASE_CLIENT_EMAIL"
  | "FIREBASE_PRIVATE_KEY";

const getRequiredEnv = (key: FirebaseEnvKey) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

export const getAdminApp = () => {
  if (getApps().length > 0) return getApps()[0];

  const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

const resolveFirestoreDatabaseId = () => {
  const fromEnv = process.env.FIRESTORE_DATABASE_ID?.trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "development" ? "test" : "(default)";
};

export const getAdminDb = () => getFirestore(getAdminApp(), resolveFirestoreDatabaseId());

export const getAdminAuth = () => getAuth(getAdminApp());
