import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const getServiceAccountFromEnv = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
};

export const getAdminApp = () => {
  if (getApps().length > 0) return getApps()[0];

  try {
    return initializeApp({
      credential: applicationDefault(),
    });
  } catch (error) {
    const adcMessage = error instanceof Error ? error.message : "Unknown error";
    const serviceAccount = getServiceAccountFromEnv();

    if (serviceAccount) {
      return initializeApp({
        credential: cert(serviceAccount),
      });
    }

    throw new Error(
      `Failed to initialize firebase-admin via ADC (${adcMessage}) and no complete env fallback was found. Set FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY for local fallback.`
    );
  }
};

const resolveFirestoreDatabaseId = () => {
  const fromEnv = process.env.FIRESTORE_DATABASE_ID?.trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "development" ? "test" : "(default)";
};

export const getAdminDb = () => getFirestore(getAdminApp(), resolveFirestoreDatabaseId());

export const getAdminAuth = () => getAuth(getAdminApp());
