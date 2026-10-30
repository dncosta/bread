import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import "../admin.css";

export default function LoginPage() {
  return (
    <div className="admin-login">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
