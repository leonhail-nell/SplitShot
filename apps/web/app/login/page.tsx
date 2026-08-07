import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <p>Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
