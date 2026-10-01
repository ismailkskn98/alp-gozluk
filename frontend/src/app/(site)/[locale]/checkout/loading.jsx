export default function CheckoutLoading() {
  return (
    <section className="grid-container py-[clamp(2rem,5vw,4rem)]" aria-busy="true" aria-label="Checkout yükleniyor">
      <div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-10 animate-pulse border-b-2 border-[#e2e6e2] bg-[#f7f8f5]" />)}
        </div>
        <div className="mt-10 h-16 max-w-xl animate-pulse bg-[#f1f3f0]" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(20rem,25vw,24rem)]">
          <div className="h-[34rem] animate-pulse border border-[#e2e6e2] bg-[#f7f8f5]" />
          <div className="h-[26rem] animate-pulse border border-[#e2e6e2] bg-[#f7f8f5]" />
        </div>
      </div>
    </section>
  );
}
