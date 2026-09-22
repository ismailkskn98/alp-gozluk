import Image from "next/image";
import { Link } from "@/i18n/navigation";

export default function HeaderLogo({ label }) {
  return (
    <Link href="/" aria-label={label} className="col-start-2 row-start-1 shrink-0 justify-self-center">
      <Image src="/brand/logo.png" alt="ALP Gözlük" width={156} height={94} priority className="h-10 w-auto object-contain" />
    </Link>
  );
}
