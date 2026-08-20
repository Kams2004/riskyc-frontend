"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import { useAdminColors } from "@/lib/useAdminColors";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { AdminUser, Role, Permission, ALL_PERMISSIONS, UserStatus } from "@/lib/types";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import {
  Users,
  Shield,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

type Tab = "users" | "roles";

interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  /** Blank on edit means "keep the current password". */
  password: string;
  roleId: string;
  status: UserStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Form
// ─────────────────────────────────────────────────────────────────────────────
interface UserFormProps {
  roles: Role[];
  initial?: AdminUser;
  onSave: (u: UserFormValues) => void;
  onCancel: () => void;
  c: ReturnType<typeof useAdminColors>;
}

function UserForm({ roles, initial, onSave, onCancel, c }: UserFormProps) {
  const isEdit = !!initial;
  const [firstName, setFirstName]   = useState(initial?.firstName ?? "");
  const [lastName,  setLastName]    = useState(initial?.lastName  ?? "");
  const [email,     setEmail]       = useState(initial?.email     ?? "");
  const [password,  setPassword]    = useState("");
  const [roleId,    setRoleId]      = useState(initial?.roleId    ?? (roles[0]?.id ?? ""));
  const [status,    setStatus]      = useState<UserStatus>(initial?.status ?? "ACTIVE");
  const [showPwd,   setShowPwd]     = useState(false);
  const [errors,    setErrors]      = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim())  e.lastName  = "Required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email required";
    if (!isEdit && (!password.trim() || password.length < 6)) e.password = "Min 6 characters";
    if (password.trim() && password.length < 6) e.password = "Min 6 characters";
    if (!roleId) e.roleId = "Select a role";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ firstName, lastName, email, password, roleId, status });
  };

  const inputCls = (field: string) =>
    clsx(
      "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors",
      errors[field]
        ? "border-red-400 bg-red-50 focus:border-red-500"
        : c.isDark
        ? "bg-gray-800 border-gray-600 text-white focus:border-brand-500"
        : "bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-400 focus:bg-white"
    );

  return (
    <div className={clsx("rounded-2xl border p-5 space-y-4", c.card)}>
      <p className={clsx("font-semibold text-sm", c.textPrimary)}>
        {isEdit ? "Edit User" : "New User"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={clsx("text-xs font-semibold mb-1.5 flex items-center gap-1", c.textSecondary)}>
            <User size={11} /> First Name
          </label>
          <input className={inputCls("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className={clsx("text-xs font-semibold mb-1.5 flex items-center gap-1", c.textSecondary)}>
            <User size={11} /> Last Name
          </label>
          <input className={inputCls("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" />
          {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className={clsx("text-xs font-semibold mb-1.5 flex items-center gap-1", c.textSecondary)}>
          <Mail size={11} /> Email
        </label>
        <input className={inputCls("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@riskyc.com" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className={clsx("text-xs font-semibold mb-1.5 flex items-center gap-1", c.textSecondary)}>
          <Lock size={11} /> Password {isEdit && <span className="font-normal normal-case text-gray-400">(leave blank to keep current)</span>}
        </label>
        <div className="relative">
          <input
            className={clsx(inputCls("password"), "pr-10")}
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "Unchanged" : "Min 6 characters"}
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className={clsx("absolute right-3 top-1/2 -translate-y-1/2", c.textMuted)}
          >
            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={clsx("text-xs font-semibold mb-1.5 block", c.textSecondary)}>Role</label>
          <select
            className={clsx(inputCls("roleId"), "cursor-pointer")}
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {errors.roleId && <p className="text-xs text-red-500 mt-1">{errors.roleId}</p>}
        </div>
        <div>
          <label className={clsx("text-xs font-semibold mb-1.5 block", c.textSecondary)}>Status</label>
          <select
            className={clsx(inputCls("status"), "cursor-pointer")}
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          <Save size={14} /> Save User
        </button>
        <button
          onClick={onCancel}
          className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors", c.btnGhost)}
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Form
// ─────────────────────────────────────────────────────────────────────────────
interface RoleFormProps {
  initial?: Partial<Role>;
  onSave: (r: { name: string; description: string; permissions: Permission[] }) => void;
  onCancel: () => void;
  c: ReturnType<typeof useAdminColors>;
}

function RoleForm({ initial, onSave, onCancel, c }: RoleFormProps) {
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [permissions, setPermissions] = useState<Permission[]>(initial?.permissions ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    const map: Record<string, typeof ALL_PERMISSIONS> = {};
    ALL_PERMISSIONS.forEach((p) => {
      if (!map[p.group]) map[p.group] = [];
      map[p.group].push(p);
    });
    return map;
  }, []);

  const toggle = (p: Permission) =>
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const toggleGroup = (group: string) => {
    const keys = groups[group].map((p) => p.key);
    const allOn = keys.every((k) => permissions.includes(k));
    setPermissions((prev) =>
      allOn ? prev.filter((p) => !keys.includes(p)) : [...new Set([...prev, ...keys])]
    );
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSave({ name, description, permissions });
  };

  const inputCls = clsx(
    "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors",
    c.isDark
      ? "bg-gray-800 border-gray-600 text-white focus:border-brand-500"
      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-400 focus:bg-white"
  );

  return (
    <div className={clsx("rounded-2xl border p-5 space-y-4", c.card)}>
      <p className={clsx("font-semibold text-sm", c.textPrimary)}>
        {initial?.name ? "Edit Role" : "New Role"}
      </p>

      <div>
        <label className={clsx("text-xs font-semibold mb-1.5 block", c.textSecondary)}>Role Name</label>
        <input className={clsx(inputCls, errors.name ? "border-red-400" : "")} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Store Manager" />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className={clsx("text-xs font-semibold mb-1.5 block", c.textSecondary)}>Description</label>
        <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of what this role can do" />
      </div>

      {/* Permissions */}
      <div>
        <label className={clsx("text-xs font-semibold mb-3 block", c.textSecondary)}>
          Permissions ({permissions.length} selected)
        </label>
        <div className="space-y-3">
          {Object.entries(groups).map(([group, perms]) => {
            const allOn = perms.every((p) => permissions.includes(p.key));
            const someOn = perms.some((p) => permissions.includes(p.key));
            return (
              <div key={group} className={clsx("rounded-xl border overflow-hidden", c.isDark ? "border-gray-700" : "border-gray-200")}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group)}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors",
                    c.isDark ? "bg-gray-800/60 hover:bg-gray-800 text-gray-200" : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  )}
                >
                  <span>{group}</span>
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    allOn ? "bg-brand-500 text-white" : someOn ? "bg-amber-100 text-amber-700" : c.isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"
                  )}>
                    {allOn ? "All" : someOn ? "Some" : "None"}
                  </span>
                </button>
                {/* Permission toggles */}
                <div className={clsx("px-4 py-3 flex flex-wrap gap-2", c.isDark ? "bg-gray-900/30" : "bg-white")}>
                  {perms.map((p) => {
                    const on = permissions.includes(p.key);
                    return (
                      <button
                        key={p.key}
                        onClick={() => toggle(p.key)}
                        className={clsx(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          on
                            ? "bg-brand-500 border-brand-500 text-white"
                            : c.isDark
                            ? "bg-gray-800 border-gray-600 text-gray-400 hover:border-brand-500/50"
                            : "bg-white border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600"
                        )}
                      >
                        {on ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          <Save size={14} /> Save Role
        </button>
        <button
          onClick={onCancel}
          className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors", c.btnGhost)}
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page — users & roles are fetched from and written to the real backend
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const session = useAdminStore((s) => s.session);
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const canManage = hasPermission("MANAGE_USERS");
  const c = useAdminColors();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");

  const [tab,          setTab]          = useState<Tab>("users");
  const [userForm,     setUserForm]     = useState<null | "new" | string>(null); // null | "new" | userId
  const [roleForm,     setRoleForm]     = useState<null | "new" | string>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const token = session?.token;

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError("");
    try {
      const [usersData, rolesData] = await Promise.all([
        apiFetch<AdminUser[]>("/api/admin-users", { token }),
        apiFetch<Role[]>("/api/roles", { token }),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Could not load users and roles.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? "—";

  // ── User CRUD ──
  const handleSaveUser = async (data: UserFormValues, existing?: AdminUser) => {
    setFormError("");
    try {
      if (existing) {
        const updated = await apiFetch<AdminUser>(`/api/admin-users/${existing.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify({
            firstName: data.firstName, lastName: data.lastName, email: data.email,
            password: data.password || undefined, roleId: data.roleId, status: data.status,
          }),
        });
        setUsers((prev) => prev.map((u) => (u.id === existing.id ? updated : u)));
      } else {
        const created = await apiFetch<AdminUser>("/api/admin-users", {
          method: "POST",
          token,
          body: JSON.stringify({
            firstName: data.firstName, lastName: data.lastName, email: data.email,
            password: data.password, roleId: data.roleId, status: data.status,
          }),
        });
        setUsers((prev) => [...prev, created]);
      }
      setUserForm(null);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Failed to save user");
    }
  };

  const askDeleteUser = (u: AdminUser) => {
    setConfirm({
      title: "Delete user?",
      message: `This will permanently delete "${u.firstName} ${u.lastName}" (${u.email}). This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await apiFetch(`/api/admin-users/${u.id}`, { method: "DELETE", token });
          setUsers((prev) => prev.filter((x) => x.id !== u.id));
        } catch (e) {
          setLoadError(e instanceof ApiError ? e.message : "Failed to delete user");
        }
        setConfirm(null);
      },
    });
  };

  // ── Role CRUD ──
  const handleSaveRole = async (data: { name: string; description: string; permissions: Permission[] }, existing?: Role) => {
    setFormError("");
    try {
      if (existing) {
        const updated = await apiFetch<Role>(`/api/roles/${existing.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(data),
        });
        setRoles((prev) => prev.map((r) => (r.id === existing.id ? updated : r)));
      } else {
        const created = await apiFetch<Role>("/api/roles", {
          method: "POST",
          token,
          body: JSON.stringify(data),
        });
        setRoles((prev) => [...prev, created]);
      }
      setRoleForm(null);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Failed to save role");
    }
  };

  const askDeleteRole = (role: Role, assignedCount: number) => {
    setConfirm({
      title: "Delete role?",
      message: `This will permanently delete "${role.name}"${
        assignedCount > 0 ? `. ${assignedCount} user${assignedCount !== 1 ? "s are" : " is"} currently assigned this role` : ""
      }. This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await apiFetch(`/api/roles/${role.id}`, { method: "DELETE", token });
          setRoles((prev) => prev.filter((r) => r.id !== role.id));
        } catch (e) {
          setLoadError(e instanceof ApiError ? e.message : "Failed to delete role");
        }
        setConfirm(null);
      },
    });
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={clsx("text-2xl font-bold", c.textPrimary)}>User Management</h1>
            <p className={clsx("text-sm mt-0.5", c.textSecondary)}>
              {users.length} users · {roles.length} roles
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setFormError("");
                if (tab === "users") setUserForm("new");
                else setRoleForm("new");
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus size={16} />
              {tab === "users" ? "New User" : "New Role"}
            </button>
          )}
        </div>

        {loadError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm font-medium">{loadError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className={clsx("flex rounded-xl border p-1 w-fit gap-1", c.isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200")}>
          {(["users", "roles"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setFormError(""); }}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize",
                tab === t
                  ? "bg-brand-500 text-white shadow"
                  : c.isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {t === "users" ? <Users size={15} /> : <Shield size={15} />}
              {t === "users" ? `Users (${users.length})` : `Roles (${roles.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
        <>
        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-4">
            {userForm === "new" && (
              <div className="space-y-2">
                <UserForm
                  roles={roles}
                  onSave={(data) => handleSaveUser(data)}
                  onCancel={() => setUserForm(null)}
                  c={c}
                />
                {formError && <p className="text-xs text-red-500 px-1">{formError}</p>}
              </div>
            )}

            <div className={clsx("rounded-2xl border overflow-x-auto", c.card)}>
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className={clsx("border-b text-xs font-semibold uppercase tracking-wide", c.isDark ? "bg-gray-800/60 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500")}>
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3 hidden sm:table-cell">Email</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Role</th>
                    <th className="text-left px-5 py-3">Status</th>
                    {canManage && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", c.divide)}>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className={clsx("text-center py-16 text-sm", c.textMuted)}>
                        No users yet
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <Fragment key={u.id}>
                      <tr className={clsx("transition-colors", c.rowHover)}>
                        <td className={clsx("px-5 py-3.5 font-medium", c.textPrimary)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <span>{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className={clsx("px-5 py-3.5 hidden sm:table-cell", c.textSecondary)}>{u.email}</td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold", c.isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}>
                            {u.roleName ?? getRoleName(u.roleId)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.status === "ACTIVE" ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                              <CheckCircle2 size={13} /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                              <XCircle size={13} /> Inactive
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => { setFormError(""); setUserForm(userForm === u.id ? null : u.id); }}
                                className={clsx("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors", c.btnGhost)}
                              >
                                <Pencil size={11} /> Edit
                              </button>
                              <button
                                onClick={() => askDeleteUser(u)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              >
                                <Trash2 size={11} />
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {userForm === u.id && (
                        <tr key={`${u.id}-form`}>
                          <td colSpan={5} className="px-5 py-3">
                            <UserForm
                              roles={roles}
                              initial={u}
                              onSave={(data) => handleSaveUser(data, u)}
                              onCancel={() => setUserForm(null)}
                              c={c}
                            />
                            {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ROLES TAB ── */}
        {tab === "roles" && (
          <div className="space-y-4">
            {roleForm === "new" && (
              <div className="space-y-2">
                <RoleForm
                  onSave={(data) => handleSaveRole(data)}
                  onCancel={() => setRoleForm(null)}
                  c={c}
                />
                {formError && <p className="text-xs text-red-500 px-1">{formError}</p>}
              </div>
            )}

            {roles.length === 0 && roleForm === null && (
              <div className={clsx("text-center py-20 rounded-2xl border", c.card)}>
                <Shield size={40} className={clsx("mx-auto mb-3 opacity-30", c.textMuted)} />
                <p className={clsx("text-sm", c.textMuted)}>No roles yet</p>
              </div>
            )}

            {roles.map((role) => {
              const isExpanded = expandedRole === role.id;
              const assignedCount = users.filter((u) => u.roleId === role.id).length;

              return (
                <div key={role.id}>
                  {roleForm === role.id ? (
                    <div className="space-y-2">
                      <RoleForm
                        initial={role}
                        onSave={(data) => handleSaveRole(data, role)}
                        onCancel={() => setRoleForm(null)}
                        c={c}
                      />
                      {formError && <p className="text-xs text-red-500 px-1">{formError}</p>}
                    </div>
                  ) : (
                    <div className={clsx("rounded-2xl border overflow-hidden", c.card)}>
                      {/* Role header */}
                      <div className={clsx("flex items-center gap-3 px-5 py-4", c.isDark ? "bg-gray-800/40" : "bg-gray-50")}>
                        <button
                          onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                          className="flex-shrink-0"
                        >
                          {isExpanded
                            ? <ChevronDown size={16} className={c.textSecondary} />
                            : <ChevronRight size={16} className={c.textSecondary} />}
                        </button>

                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                          <Shield size={16} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={clsx("font-semibold text-sm", c.textPrimary)}>{role.name}</p>
                          <p className={clsx("text-xs", c.textSecondary)}>
                            {role.description || "No description"} · {role.permissions.length} permissions · {assignedCount} user{assignedCount !== 1 ? "s" : ""}
                          </p>
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => { setFormError(""); setRoleForm(role.id); }}
                              className={clsx("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors", c.btnGhost)}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                            <button
                              onClick={() => askDeleteRole(role, assignedCount)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            >
                              <Trash2 size={11} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded permissions */}
                      {isExpanded && (
                        <div className={clsx("px-5 py-4 space-y-3", c.isDark ? "bg-gray-900/20" : "bg-white")}>
                          <p className={clsx("text-xs font-semibold uppercase tracking-wide", c.textMuted)}>
                            Permissions
                          </p>
                          {Object.entries(
                            ALL_PERMISSIONS.reduce((acc, p) => {
                              if (!acc[p.group]) acc[p.group] = [];
                              acc[p.group].push(p);
                              return acc;
                            }, {} as Record<string, typeof ALL_PERMISSIONS>)
                          ).map(([group, perms]) => (
                            <div key={group}>
                              <p className={clsx("text-xs font-semibold mb-1.5", c.textSecondary)}>{group}</p>
                              <div className="flex flex-wrap gap-2">
                                {perms.map((p) => {
                                  const on = role.permissions.includes(p.key);
                                  return (
                                    <span
                                      key={p.key}
                                      className={clsx(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
                                        on
                                          ? "bg-brand-50 border-brand-200 text-brand-700"
                                          : c.isDark
                                          ? "bg-gray-800 border-gray-700 text-gray-500"
                                          : "bg-gray-50 border-gray-200 text-gray-400"
                                      )}
                                    >
                                      {on ? <CheckCircle2 size={11} className="text-brand-500" /> : <XCircle size={11} />}
                                      {p.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}
