"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import * as deliveryContactsApi from "@/lib/api/deliveryContacts";
import { DeliveryContact } from "@/lib/types";
import { X, Plus, Trash2, Pencil, Check, Truck } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/lib/i18n/useTranslation";

/** Admin CRUD for the delivery team roster auto-attached to packaging-confirmation messages (see ConversationService.buildDeliveryTeamBlock server-side). */
export default function DeliveryContactsPanel({ onClose }: { onClose: () => void }) {
  const token = useAdminStore((s) => s.session?.token);
  const canManage = useAdminStore((s) => s.hasPermission("MANAGE_TREATMENT"));
  const c = useAdminColors();
  const { t } = useTranslation();

  const [contacts, setContacts] = useState<DeliveryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    deliveryContactsApi
      .listDeliveryContacts(token)
      .then(setContacts)
      .catch(() => setError(t("adminOrders.deliveryContacts.errorLoad")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startEdit = (contact: DeliveryContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setPhone(contact.phone);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setPhone("");
  };

  const saveEdit = async (id: string) => {
    if (!token || !name.trim() || !phone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await deliveryContactsApi.updateDeliveryContact(id, { name: name.trim(), phone: phone.trim() }, token);
      setContacts((prev) => prev.map((c2) => (c2.id === id ? updated : c2)));
      cancelEdit();
    } catch {
      setError(t("adminOrders.deliveryContacts.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!token || !newName.trim() || !newPhone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await deliveryContactsApi.createDeliveryContact(
        { name: newName.trim(), phone: newPhone.trim(), position: contacts.length },
        token
      );
      setContacts((prev) => [...prev, created]);
      setNewName("");
      setNewPhone("");
      setAdding(false);
    } catch {
      setError(t("adminOrders.deliveryContacts.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await deliveryContactsApi.deleteDeliveryContact(id, token);
      setContacts((prev) => prev.filter((c2) => c2.id !== id));
    } catch {
      setError(t("adminOrders.deliveryContacts.errorDelete"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className={clsx("w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]", c.card, "border")}>
        <div className={clsx("flex items-center justify-between px-5 py-4 border-b flex-shrink-0", c.border)}>
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-brand-500" />
            <h2 className={clsx("font-semibold text-sm", c.textPrimary)}>{t("adminOrders.deliveryContacts.title")}</h2>
          </div>
          <button onClick={onClose} className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-colors", c.btnGhost)}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          <p className={clsx("text-xs mb-1", c.textMuted)}>{t("adminOrders.deliveryContacts.hint")}</p>

          {error && <div className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}

          {loading ? (
            <div className={clsx("text-sm text-center py-6", c.textMuted)}>{t("adminOrders.deliveryContacts.loading")}</div>
          ) : contacts.length === 0 && !adding ? (
            <div className={clsx("text-sm text-center py-6", c.textMuted)}>{t("adminOrders.deliveryContacts.empty")}</div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className={clsx("rounded-xl p-3 flex items-center gap-2", c.innerCard)}>
                {editingId === contact.id ? (
                  <>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("adminOrders.deliveryContacts.namePlaceholder")}
                        className={clsx("w-full text-sm rounded-lg border px-2.5 py-1.5 outline-none", c.input)} />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("adminOrders.deliveryContacts.phonePlaceholder")}
                        className={clsx("w-full text-sm rounded-lg border px-2.5 py-1.5 outline-none", c.input)} />
                    </div>
                    <button onClick={() => saveEdit(contact.id)} disabled={saving} className="w-8 h-8 rounded-lg bg-green-500/15 text-green-500 hover:bg-green-500/25 flex items-center justify-center flex-shrink-0 disabled:opacity-50">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEdit} className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", c.btnGhost)}>
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className={clsx("text-sm font-semibold truncate", c.textPrimary)}>{contact.name}</p>
                      <p className={clsx("text-xs", c.textMuted)}>{contact.phone}</p>
                    </div>
                    {canManage && (
                      <>
                        <button onClick={() => startEdit(contact)} className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", c.btnGhost)}>
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          disabled={busyId === contact.id}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))
          )}

          {canManage && adding && (
            <div className={clsx("rounded-xl p-3 space-y-1.5", c.innerCard)}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("adminOrders.deliveryContacts.namePlaceholder")}
                className={clsx("w-full text-sm rounded-lg border px-2.5 py-1.5 outline-none", c.input)} autoFocus />
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder={t("adminOrders.deliveryContacts.phonePlaceholder")}
                className={clsx("w-full text-sm rounded-lg border px-2.5 py-1.5 outline-none", c.input)} />
              <div className="flex gap-2 pt-1">
                <button onClick={handleAdd} disabled={saving || !newName.trim() || !newPhone.trim()}
                  className="flex-1 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors">
                  {t("adminOrders.deliveryContacts.save")}
                </button>
                <button onClick={() => { setAdding(false); setNewName(""); setNewPhone(""); }}
                  className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", c.btnGhost)}>
                  {t("adminOrders.deliveryContacts.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        {canManage && !adding && (
          <div className={clsx("px-5 py-3.5 border-t flex-shrink-0", c.border)}>
            <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors">
              <Plus size={15} /> {t("adminOrders.deliveryContacts.addButton")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
