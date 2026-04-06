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
import { Plus, FileText, User, Calendar, Pencil, Trash2, Eye, Upload, Image } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  coverImage?: string;
  tags: string[];
  status: string;
  authorId: string;
  author?: { firstName: string; lastName: string };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-yellow-100 text-yellow-700",
};

const emptyForm = { title: "", body: "", coverImage: "", tags: "", status: "draft" };

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, type: "blog" }),
        });
        const data = await res.json();
        if (data.url) {
          setForm((prev) => ({ ...prev, coverImage: data.url }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const fetchData = async () => {
    try {
      const url = statusFilter !== "all" ? `/api/blog?status=${statusFilter}` : "/api/blog";
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      body: post.body,
      coverImage: post.coverImage || "",
      tags: post.tags.join(", "),
      status: post.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        coverImage: form.coverImage || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: form.status,
      };
      if (editing) {
        await fetch(`/api/blog/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      fetchData();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/blog/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchData();
    } catch { /* empty */ }
  };

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mocha-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog / News</h1>
          <p className="text-gray-500 mt-1">Manage announcements and news articles</p>
        </div>
        <Button className="mocha-gradient hover:opacity-90" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Posts</p><p className="text-3xl font-bold">{posts.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><FileText className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Published</p><p className="text-3xl font-bold text-green-600">{publishedCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><FileText className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Drafts</p><p className="text-3xl font-bold text-gray-600">{draftCount}</p></div><div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><FileText className="h-6 w-6 text-gray-600" /></div></div></CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "draft", "published", "archived"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? "mocha-gradient" : ""}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader><CardTitle>All Posts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No posts found. Create your first post.</TableCell></TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell><Badge className={statusColors[post.status]}>{post.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />{post.author?.firstName} {post.author?.lastName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {post.tags.slice(0, 2).map((tag) => (<Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>))}
                        {post.tags.length > 2 && <Badge variant="outline" className="text-xs">+{post.tags.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><div className="flex items-center gap-2 text-gray-500"><Calendar className="h-4 w-4" />{new Date(post.createdAt).toLocaleDateString()}</div></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewPost(post)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(post)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(post.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" /></div>
            <div><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your post content..." rows={8} /></div>
            <div>
              <Label>Cover Image</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input 
                    value={form.coverImage} 
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })} 
                    placeholder="https://... or upload below"
                  />
                  {form.coverImage && (
                    <div className="mt-2">
                      <img src={form.coverImage} alt="Cover preview" className="h-24 w-auto rounded object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="cover-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center h-10 px-4 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">
                      {uploading ? <span className="text-sm">Uploading...</span> : <><Upload className="h-4 w-4 mr-1" /> Upload</>}
                    </div>
                  </Label>
                  <Input 
                    id="cover-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>
            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="news, update, ramadan" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="mocha-gradient hover:opacity-90" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewPost?.title}</DialogTitle></DialogHeader>
          {previewPost && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={statusColors[previewPost.status]}>{previewPost.status}</Badge>
                {previewPost.tags.map((t) => (<Badge key={t} variant="outline">{t}</Badge>))}
              </div>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{previewPost.body}</div>
              <p className="text-sm text-gray-500">By {previewPost.author?.firstName} {previewPost.author?.lastName} • {new Date(previewPost.createdAt).toLocaleDateString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Post?</DialogTitle></DialogHeader><p className="text-gray-500">This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
