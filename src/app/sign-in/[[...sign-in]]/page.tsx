import { SignIn } from "@clerk/nextjs";
import { authRedirectUrl } from "@/constants/routes";

type PageProps = { searchParams: Promise<{ character?: string; redirect_url?: string }> };

export default async function SignInPage({ searchParams }: PageProps) {
  const { character, redirect_url } = await searchParams;
  const redirectUrl =
    redirect_url?.startsWith("/") ? redirect_url : authRedirectUrl(character);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md">
        <SignIn fallbackRedirectUrl={redirectUrl} forceRedirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
