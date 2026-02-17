"use client";

import dynamic from "next/dynamic";

const SignupForm = dynamic(
  () => import("./signup-form").then((m) => m.SignupForm),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function SignupPage() {
  return <SignupForm />;
}
