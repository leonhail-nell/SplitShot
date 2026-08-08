import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function SiteNav() {
  const session = await auth();

  return (
    <nav className="site-nav">
      <Link href="/" className="nav-brand">
        <Image
          src="/logo.png"
          alt=""
          width={28}
          height={28}
          className="nav-logo"
          priority
        />
        SplitShot
      </Link>
      <div className="nav-links">
        {session?.user ? (
          <>
            <Link href="/history">Your splits</Link>
            <span className="nav-user">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="nav-btn">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="nav-btn-link">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
