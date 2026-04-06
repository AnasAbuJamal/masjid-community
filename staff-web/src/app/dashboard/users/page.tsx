"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Plus, Users as UsersIcon, Shield, UserCheck, Pencil, Trash2 } from "lucide-react";

interface User {
  id: string; email: string; firstName: string; lastName: string;
  phone?: string; role: string; isActive: boolean; isVerified: boolean;
  lastLoginAt?: string; createdAt: string;
}

const roleColors: Record<string, string> = { admin: "bg-purple-100 text-purple-700", teacher: "bg-blue-100 text-blue-700" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "teacher", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);
  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeCount = users.filter((u) => u.isActive).length;

  const openCreate = () => { setEditing(null); setForm({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "teacher", isActive: true }); setError(""); setDialogOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || "", password: "", role: u.role, isActive: u.isActive }); setError(""); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      if (editing) {
        const payload: Record<string, unknown> = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, role: form.role, isActive: form.isActive };
        if (form.password) payload.password = form.password;
        const res = await fetch(`/api/users/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const data = await res.json(); setError(data.error || "Failed"); return; }
      } else {
        if (!form.password) { setError("Password is required"); setSaving(false); return; }
        const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) { const data = await res.json(); setError(data.error || "Failed"); return; }
      }
      setDialogOpen(false); fetchData();
    } catch { setError("An error occurred"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/users/${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); } catch { /* empty */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">User Management</h1><p className="text-gray-500 mt-1">Manage staff accounts and permissions</p></div>
        <Button className="mocha-gradient hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add User</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Users</p><p className="text-3xl font-bold">{users.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><UsersIcon className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Admins</p><p className="text-3xl font-bold text-purple-600">{adminCount}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Shield className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active</p><p className="text-3xl font-bold text-green-600">{activeCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><UserCheck className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
      </div>

      <div className="flex gap-2">
        {["all", "admin", "teacher"].map((r) => (
          <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r)} className={roleFilter === r ? "mocha-gradient" : ""}>
            {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}s
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No users found.</TableCell></TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-gray-500">{user.phone || "-"}</TableCell>
                    <TableCell><Badge className={roleColors[user.role]}>{user.role}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                        {user.isVerified && <Badge className="bg-blue-100 text-blue-700">Verified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(user.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>{editing ? "New Password (leave blank to keep)" : "Password"}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="teacher">Teacher</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button className="mocha-gradient hover:opacity-90" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete User?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
