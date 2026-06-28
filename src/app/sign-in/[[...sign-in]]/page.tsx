import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <SignIn
        forceRedirectUrl="/chat"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-border rounded-2xl",
          },
        }}
      />
    </div>
  );
}
