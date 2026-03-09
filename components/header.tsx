import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://mysite.ai/assets/svg/logo.svg"
            alt="mysite.ai"
            width={32}
            height={32}
            unoptimized
          />
          <span className="font-semibold text-foreground">
            Raport konkurencji
          </span>
          <span className="text-sm text-muted-foreground">| mysite.ai</span>
        </Link>
        <Link
          href="https://mysite.ai/en/contact/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Contact us
        </Link>
      </div>
    </header>
  );
}
