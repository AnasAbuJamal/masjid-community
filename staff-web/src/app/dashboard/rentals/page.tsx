"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Package, Plus, Pencil, Trash2, DollarSign, Calendar, Image, ToggleLeft, ToggleRight } from "lucide-react";

interface RentalItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  priceHourly: number | null;
  priceDaily: number | null;
  isAvailable: boolean;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  hall: "bg-purple-100 text-purple-700",
  furniture: "bg-amber-100 text-amber-700",
  equipment: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-700",
};

export default function RentalsPage() {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RentalItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "other",
    imageUrl: "",
    priceHourly: "",
    priceDaily: "",
    isAvailable: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/rentals");
      const data = await res.json();
      setItems(data.items || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category,
        imageUrl: form.imageUrl || null,
        priceHourly: form.priceHourly ? parseFloat(form.priceHourly) : null,
        priceDaily: form.priceDaily ? parseFloat(form.priceDaily) : null,
        isAvailable: form.isAvailable,
      };

      if (editingItem) {
        await fetch(`/api/rentals/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/rentals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      setEditingItem(null);
      setForm({ name: "", description: "", category: "other", imageUrl: "", priceHourly: "", priceDaily: "", isAvailable: true });
      fetchItems();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleEdit = (item: RentalItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      imageUrl: item.imageUrl || "",
      priceHourly: item.priceHourly?.toString() || "",
      priceDaily: item.priceDaily?.toString() || "",
      isAvailable: item.isAvailable,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/rentals/${deleteId}`, { method: "DELETE" });
      fetchItems();
    } catch { /* empty */ }
    setDeleteId(null);
  };

  const toggleAvailability = async (item: RentalItem) => {
    try {
      await fetch(`/api/rentals/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      fetchItems();
    } catch { /* empty */ }
  };

  const categories = ["hall", "furniture", "equipment", "other"];
  const availableCount = items.filter((i) => i.isAvailable).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Rentals</h1><p className="text-gray-500 mt-1">Manage items available for rent (halls, equipment, furniture)</p></div>
        <Button onClick={() => { setEditingItem(null); setForm({ name: "", description: "", category: "other", imageUrl: "", priceHourly: "", priceDaily: "", isAvailable: true }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Items</p><p className="text-3xl font-bold">{items.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Package className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Available</p><p className="text-3xl font-bold text-green-600">{availableCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><ToggleRight className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Unavailable</p><p className="text-3xl font-bold text-red-600">{items.length - availableCount}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><ToggleLeft className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Rental Items</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No rental items found. Add your first item!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Hourly</TableHead>
                  <TableHead>Daily</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge className={categoryColors[item.category] || categoryColors.other}>{item.category}</Badge></TableCell>
                    <TableCell>{item.priceHourly ? `$${item.priceHourly}/hr` : "—"}</TableCell>
                    <TableCell>{item.priceDaily ? `$${item.priceDaily}/day` : "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleAvailability(item)}>
                        {item.isAvailable ? <Badge className="bg-green-100 text-green-700">Available</Badge> : <Badge className="bg-red-100 text-red-700">Unavailable</Badge>}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Rental Item" : "Add Rental Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Main Hall" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description of the item" /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (Hourly)</Label><Input type="number" value={form.priceHourly} onChange={(e) => setForm({ ...form, priceHourly: e.target.value })} placeholder="0.00" /></div>
              <div><Label>Price (Daily)</Label><Input type="number" value={form.priceDaily} onChange={(e) => setForm({ ...form, priceDaily: e.target.value })} placeholder="0.00" /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="available" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
              <Label htmlFor="available">Available for rent</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Item?</DialogTitle></DialogHeader>
          <p>Are you sure you want to delete this rental item? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}