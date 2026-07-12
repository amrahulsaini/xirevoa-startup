import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Added in the session callback so server code can query by id directly. */
      id: string;
    } & DefaultSession["user"];
  }
}
