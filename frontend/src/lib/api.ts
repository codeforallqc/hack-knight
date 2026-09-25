// Auth-aware API helper for the admin dashboard.
// Reads the access token from the Supabase session and attaches it to every
// request. Supabase owns session storage and refresh, so there is no
// hand-rolled expiry handling here.

import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/** Access token for the current Supabase session, or null when signed out. */
export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Thrown on a 403: the token is valid but the account is not in the backend's
 * ADMIN_EMAILS allowlist. Distinct from Unauthorized so the UI can say "not
 * authorized" and offer sign-out instead of bouncing to a login it would
 * immediately pass again.
 */
export class ForbiddenError extends Error {
  constructor(message = "This account is not authorized") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Authenticated fetch. Attaches the session token, throws on non-2xx, and
 * signs out on 401 so the auth guard bounces the user back to login.
 * Returns parsed JSON, or null for 204 responses.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // no-store: the public GET routes send `stale-while-revalidate` for the
  // CDN, which also lets the browser answer the admin's post-save refetch
  // from its HTTP cache. The dashboard must always see what it just wrote.
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (res.status === 401) {
    // signOut fires onAuthStateChange, so the guard redirects before any
    // caller gets a chance to swallow this error.
    await logout();
    throw new Error("Unauthorized");
  }

  if (res.status === 403) {
    const data: { message?: string } = await res.json().catch(() => ({}));
    throw new ForbiddenError(data.message);
  }

  if (!res.ok) {
    const data: { message?: string } = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Request failed (${res.status})`);
  }

  // 204 No Content — callers that DELETE ignore the return value.
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const apiGet = <T = unknown>(path: string) => apiFetch<T>(path);

export const apiPost = <T = unknown>(path: string, body: unknown) =>
  apiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const apiPut = <T = unknown>(path: string, body: unknown) =>
  apiFetch<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const apiDelete = (path: string) => apiFetch<null>(path, { method: "DELETE" });

/**
 * Fetch a file body as a Blob. Downloads behind auth cannot use a plain anchor
 * href — the browser would send no Authorization header and get a 401 — so the
 * caller turns this blob into an object URL and clicks it instead.
 */
export async function apiDownload(path: string): Promise<Blob> {
  const token = await getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { headers });

  if (res.status === 401) {
    await logout();
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    throw new ForbiddenError();
  }
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  return res.blob();
}

// Multipart upload. Do NOT set Content-Type — the browser adds the boundary.
export const apiUpload = <T = unknown>(
  path: string,
  formData: FormData,
  method: string = "POST",
) => apiFetch<T>(path, { method, body: formData });

// Longest edge per kind of image. Uploads are served straight from Supabase
// storage and every byte counts toward its egress quota, so size them for
// how they're displayed (at 2x for retina), not for the source camera.
// Keep in sync with backend/scripts/optimize-storage-images.ts.
const MAX_EDGE = {
  // Headshots, character badges and logos render at most ~250px wide.
  thumb: 512,
  // Gallery photos can open full-screen in the lightbox.
  gallery: 1600,
} as const;

export type ImageKind = keyof typeof MAX_EDGE;

/**
 * Resize and re-encode an image as WebP in the browser before upload. Keeps
 * the request well under Vercel's 4.5 MB body limit and, more importantly,
 * keeps the stored file small. SVGs are vector and already tiny, so they
 * pass through untouched.
 */
export async function compressImage(
  file: File,
  kind: ImageKind = "thumb",
): Promise<File> {
  if (file.type === "image/svg+xml") return file;

  const blob = await imageCompression(file, {
    maxSizeMB: kind === "gallery" ? 0.5 : 0.15,
    maxWidthOrHeight: MAX_EDGE[kind],
    fileType: "image/webp",
    initialQuality: 0.8,
    useWebWorker: true,
  });
  // The backend names the stored object after this file's extension.
  const name = file.name.replace(/\.[^.]*$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}
