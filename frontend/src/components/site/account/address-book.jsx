"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ConfirmActionDialog from "@/components/admin/ui/confirm-action-dialog";
import AccountSectionHeader from "./section-header";

const schema = z.object({
  title: z.string().trim().min(2, "Adres başlığı gerekli.").max(80),
  firstName: z.string().trim().min(2, "Ad gerekli.").max(80),
  lastName: z.string().trim().min(2, "Soyad gerekli.").max(80),
  phone: z.string().trim().min(8, "Geçerli bir telefon yazın.").max(32),
  city: z.string().trim().min(2, "İl gerekli.").max(100),
  district: z.string().trim().min(2, "İlçe gerekli.").max(100),
  postalCode: z.string().trim().max(20),
  addressLine: z.string().trim().min(8, "Açık adres en az 8 karakter olmalı.").max(1000),
  isDefault: z.boolean(),
});

const inputClass = "mt-1.5 h-11 w-full rounded-lg border border-[#cfd5d1] bg-white px-3.5 text-sm text-[#172536] outline-none transition-colors placeholder:text-[#9aa39f] focus:border-[#65746e]";

export default function AddressBook({ addresses, onUpdated, onDemoChange }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [removing, setRemoving] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const reduceMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { isDefault: addresses.length === 0 },
  });

  function closeForm() {
    setOpen(false);
    setEditing(null);
    setMessage("");
  }

  async function submit(values) {
    setMessage("");
    if (String(editing).startsWith("demo-")) {
      onDemoChange(addresses.map((address) => (address.id === editing ? { ...address, ...values } : { ...address, isDefault: values.isDefault ? false : address.isDefault })));
      closeForm();
      return;
    }
    const response = await fetch(editing ? `/api/account/addresses/${editing}` : "/api/account/addresses", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message || "Adres kaydedilemedi.");
      return;
    }
    onUpdated(payload.data);
    reset({ isDefault: false });
    closeForm();
  }

  function startCreate() {
    setEditing(null);
    reset({ title: "", firstName: "", lastName: "", phone: "", city: "", district: "", postalCode: "", addressLine: "", isDefault: addresses.length === 0 });
    setOpen(true);
  }

  function startEdit(address) {
    setEditing(address.id);
    reset(address);
    setOpen(true);
  }

  async function remove() {
    if (!deleteTarget) return;
    setRemoving(deleteTarget.id);
    if (deleteTarget.isDemo) {
      onDemoChange(addresses.filter((address) => address.id !== deleteTarget.id));
      setDeleteTarget(null);
      setRemoving(null);
      return;
    }
    const response = await fetch(`/api/account/addresses/${deleteTarget.id}`, { method: "DELETE" });
    const payload = await response.json();
    if (response.ok) {
      onUpdated(payload.data);
      setDeleteTarget(null);
    } else {
      setMessage(payload.message || "Adres silinemedi.");
    }
    setRemoving(null);
  }

  return (
    <section>
      <AccountSectionHeader
        kicker="Teslimat ve fatura bilgilerin"
        title="Adreslerim"
        description="Sık kullandığın adresleri kaydet; ödeme sırasında teslimat bilgilerini yeniden yazma."
        action={
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#172536] px-4 text-sm font-medium text-white transition-colors hover:bg-[#24364a]"
          >
            <Plus className="size-4" /> Yeni adres
          </button>
        }
      />
      {message ? (
        <p role="alert" className="mt-4 text-sm text-[#a53e3e]">
          {message}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {open ? (
          <motion.form
            onSubmit={handleSubmit(submit)}
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-7 border-y border-[#d8ddd7] bg-white px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-medium text-[#172536]">{editing ? "Adresi düzenle" : "Yeni adres"}</h3>
                <button type="button" onClick={closeForm} aria-label="Adres formunu kapat" className="grid size-8 place-items-center rounded-full hover:bg-[#f1f3f0]">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Adres başlığı" error={errors.title?.message}>
                  <input className={inputClass} placeholder="Ev, iş" {...register("title")} />
                </Field>
                <Field label="Telefon" error={errors.phone?.message}>
                  <input className={inputClass} inputMode="tel" autoComplete="tel" {...register("phone")} />
                </Field>
                <Field label="Ad" error={errors.firstName?.message}>
                  <input className={inputClass} autoComplete="given-name" {...register("firstName")} />
                </Field>
                <Field label="Soyad" error={errors.lastName?.message}>
                  <input className={inputClass} autoComplete="family-name" {...register("lastName")} />
                </Field>
                <Field label="İl" error={errors.city?.message}>
                  <input className={inputClass} autoComplete="address-level1" {...register("city")} />
                </Field>
                <Field label="İlçe" error={errors.district?.message}>
                  <input className={inputClass} autoComplete="address-level2" {...register("district")} />
                </Field>
                <Field label="Posta kodu">
                  <input className={inputClass} inputMode="numeric" autoComplete="postal-code" {...register("postalCode")} />
                </Field>
                <Field label="Açık adres" error={errors.addressLine?.message}>
                  <textarea className={`${inputClass} h-[5.5rem] resize-none py-3`} autoComplete="street-address" {...register("addressLine")} />
                </Field>
              </div>
              <label className="mt-5 inline-flex cursor-pointer items-center gap-3 text-sm text-[#46534e]">
                <input type="checkbox" className="size-4 accent-[#172536]" {...register("isDefault")} /> Varsayılan teslimat adresim yap
              </label>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#172536] px-5 text-sm font-medium text-white disabled:opacity-60">
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {editing ? "Değişiklikleri kaydet" : "Adresi kaydet"}
                </button>
                <button type="button" onClick={closeForm} className="h-10 rounded-full border border-[#cfd5d1] px-5 text-sm text-[#46534e]">
                  Vazgeç
                </button>
              </div>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      {addresses.length ? (
        <div className="mt-7 grid gap-x-8 md:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="flex min-h-56 flex-col border-b border-[#d8ddd7] py-6 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-4 text-[#172536]" strokeWidth={1.45} />
                  <h3 className="font-medium text-[#172536]">{address.title}</h3>
                  {address.isDefault ? <span className="rounded-full bg-[#e9f1eb] px-2 py-0.5 text-[11px] text-[#356a50]">Varsayılan</span> : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(address)}
                    aria-label={`${address.title} adresini düzenle`}
                    className="grid size-8 place-items-center rounded-full text-[#68736f] hover:bg-white hover:text-[#172536]"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(address)}
                    aria-label={`${address.title} adresini sil`}
                    className="grid size-8 place-items-center rounded-full text-[#68736f] hover:bg-[#fff0f0] hover:text-[#a84242]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-7 text-sm font-medium text-[#172536]">
                {address.firstName} {address.lastName}
              </p>
              <address className="mt-2 max-w-sm text-sm not-italic leading-6 text-[#68736f]">
                {address.addressLine}
                <br />
                {address.postalCode ? `${address.postalCode} · ` : ""}
                {address.district} / {address.city}
                <br />
                {address.phone}
              </address>
            </article>
          ))}
        </div>
      ) : !open ? (
        <div className="mt-7 border-y border-[#d8ddd7] py-14 text-center">
          <MapPin className="mx-auto size-6 text-[#7a8781]" strokeWidth={1.35} />
          <h3 className="mt-4 text-lg text-[#172536]">Kayıtlı adresin yok</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68736f]">İlk adresini ekleyerek ödeme adımını hızlandırabilirsin.</p>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}
        onConfirm={remove}
        title="Adresi sil"
        description="Bu adres hesabından kaldırılacak. Sipariş geçmişindeki teslimat bilgileri değişmez."
        itemName={deleteTarget?.title}
        itemLabel="Adres"
        confirmLabel="Adresi sil"
        pending={Boolean(removing)}
      />
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-medium text-[#263630]">
      {label}
      {children}
      {error ? <span className="mt-1.5 block text-xs font-normal text-[#a53e3e]">{error}</span> : null}
    </label>
  );
}
