import { SignUp } from "@clerk/nextjs";
import { resolveAuthPageRedirect } from "@/constants/routes";

type PageProps = { searchParams: Promise<{ character?: string; redirect_url?: string }> };

export default async function SignUpPage({ searchParams }: PageProps) {
  const { character, redirect_url } = await searchParams;
  const redirectUrl = resolveAuthPageRedirect(redirect_url, character);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md">
        <SignUp fallbackRedirectUrl={redirectUrl} forceRedirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
