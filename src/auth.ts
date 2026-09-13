import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { isEmailAllowed } from "@/lib/auth-access";

const providers: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }));
}

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(MicrosoftEntraID({
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER || "https://login.microsoftonline.com/common/v2.0/",
  }));
}

export const authProviders = {
  google: providers.some((provider) => typeof provider !== "function" && provider.id === "google"),
  microsoft: providers.some((provider) => typeof provider !== "function" && provider.id === "microsoft-entra-id"),
};

export const authRequired = process.env.AUTH_REQUIRED === "true";
export const authReady = Boolean(process.env.AUTH_SECRET) && (authProviders.google || authProviders.microsoft);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: { signIn: "/sign-in", error: "/sign-in" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  trustHost: true,
  callbacks: {
    signIn({ user }) {
      return isEmailAllowed(user.email, process.env.AUTH_ALLOWED_EMAILS, process.env.AUTH_ALLOWED_DOMAINS);
    },
  },
});
