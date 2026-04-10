'use server';

import type { Route } from "next";
import { redirect } from "next/navigation";

import { formDataToObject } from "@/lib/form-data";
import { authService, buildLoginHref, getPostLoginPath } from "@/modules/auth/auth.service";
import { createAuthenticatedSession, destroyAuthenticatedSession } from "@/modules/auth/auth.session";
import { loginSchema } from "@/modules/auth/auth.validation";

function buildLoginFeedbackHref(nextPath: string | undefined, message: string) {
  const href = new URL(`https://chitflow.local${buildLoginHref(nextPath)}`);
  href.searchParams.set("status", "error");
  href.searchParams.set("message", message);
  return `${href.pathname}${href.search}` as Route;
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildLoginFeedbackHref(
        typeof formData.get("next") === "string" ? String(formData.get("next")) : undefined,
        parsed.error.issues[0]?.message ?? "Unable to log in.",
      ),
    );
  }

  try {
    const user = await authService.authenticateWithPassword(parsed.data);
    await createAuthenticatedSession(user.id);
  } catch (error) {
    redirect(
      buildLoginFeedbackHref(
        parsed.data.next,
        error instanceof Error ? error.message : "Unable to log in.",
      ),
    );
  }

  const session = await authService.requireAuthenticatedSession(parsed.data.next);
  redirect((parsed.data.next ?? getPostLoginPath(session)) as Route);
}

export async function logoutAction() {
  await destroyAuthenticatedSession();
  redirect("/login?status=success&message=Signed%20out%20successfully.");
}
