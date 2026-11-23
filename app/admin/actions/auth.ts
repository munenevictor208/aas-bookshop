"use server";

import { redirect } from "next/navigation";
import {
  checkIpRateLimit,
  checkLoginRateLimit,
  clearLoginFailures,
  clearOwnerSession,
  getClientIp,
  isConfigurationMissing,
  recordFailedLogin,
  setOwnerSession,
  verifyPassword,
} from "@/lib/auth";
import { LOGIN_MAX_ATTEMPTS } from "@/lib/rate-limit";
import { getAuthConfig } from "@/lib/session";

export type LoginState = {
  message: string;
};

export async function authenticateOwner(
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (isConfigurationMissing()) {
    return {
      message:
        "Owner login has not been configured yet. Run npm run setup:admin on the server.",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Enter both your email and password." };
  }

  const ipAllowed = await checkIpRateLimit(await getClientIp());
  if (!ipAllowed || (await checkLoginRateLimit(email)) >= LOGIN_MAX_ATTEMPTS) {
    return {
      message: "Too many attempts. Please wait 15 minutes and try again.",
    };
  }

  const config = getAuthConfig();
  if (!config || email !== config.email || !verifyPassword(password, config.passwordHash)) {
    await recordFailedLogin(email);
    return { message: "Invalid email or password." };
  }

  await clearLoginFailures(email);
  await setOwnerSession();
  redirect("/admin");
}

export async function signOutOwner() {
  await clearOwnerSession();
  redirect("/admin/login");
}
