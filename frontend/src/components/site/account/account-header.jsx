export default function AccountHeader({ user }) {
  const firstName = user?.firstName || "merhaba";

  return (
    <header className="pb-[clamp(1.5rem,3vw,2.5rem)]">
      <div>
        <div>
          <p className="text-sm text-[#63706c]">Hesabım</p>
          <h1 className="mt-2 text-[clamp(2rem,3.5vw,3.35rem)] font-normal leading-[0.96] tracking-[-0.055em] text-[#172536]">Merhaba, {firstName}.</h1>
        </div>
      </div>
      <p className="mt-5 max-w-xl text-sm leading-6 text-[#66716d]">Siparişlerini, adreslerini ve kayıtlı favorilerini buradan yönet.</p>
    </header>
  );
}
