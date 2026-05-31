"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen, Upload, Image, FileText, Film, Music, Archive, Trash2,
  Copy, CheckCircle, Grid, List, RefreshCw, X, Search, HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  folder?: string;
  createdAt: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("application/pdf") || mimeType.startsWith("text/")) return FileText;
  return Archive;
};

const getFileColor = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return "bg-pink-100 text-pink-600";
  if (mimeType.startsWith("video/")) return "bg-purple-100 text-purple-600";
  if (mimeType.startsWith("audio/")) return "bg-orange-100 text-orange-600";
  return "bg-gray-100 text-gray-600";
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadFilename, setUploadFilename] = useState("");
  const [uploadFolder, setUploadFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const url = currentFolder
        ? `/api/media?folder=${encodeURIComponent(currentFolder)}`
        : "/api/media";
      const res = await fetch(url);
      const data = await res.json();
      setFiles(data.files || []);
      setFolders(data.folders || []);
      setTotalSize(data.files?.reduce((acc: number, f: MediaFile) => acc + f.size, 0) || 0);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentFolder]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleUrlUpload = async () => {
    if (!uploadUrl || !uploadFilename) return;
    setUploading(true);
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFilename,
          originalName: uploadFilename,
          mimeType: getMimeType(uploadFilename),
          size: 0,
          url: uploadUrl,
          folder: uploadFolder || null,
        }),
      });
      if (res.ok) {
        setShowUploadDialog(false);
        setUploadUrl("");
        setUploadFilename("");
        setUploadFolder("");
        fetchFiles();
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          body: JSON.stringify({ image: base64, type: "media" }),
        });
        if (res.ok) {
          const data = await res.json();
          await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: data.fileName,
              originalName: file.name,
              mimeType: file.type,
              size: file.size,
              url: data.url,
              folder: uploadFolder || null,
            }),
          });
          fetchFiles();
          setShowUploadDialog(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await fetch(`/api/media?id=${id}`, { method: "DELETE" });
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setCurrentFolder(newFolderName.trim());
    setShowFolderDialog(false);
    setNewFolderName("");
  };

  const filteredFiles = files.filter((f) =>
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-500 mt-1">Manage uploaded files and media</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFolderDialog(true)}>
            <FolderOpen className="h-4 w-4 mr-2" />New Folder
          </Button>
          <Button variant="outline" onClick={fetchFiles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />Add Media
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Files</p>
                <p className="text-3xl font-bold text-blue-600">{files.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Storage Used</p>
                <p className="text-3xl font-bold text-purple-600">{formatFileSize(totalSize)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Archive className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Folders</p>
                <p className="text-3xl font-bold text-green-600">{folders.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Folder</p>
                <p className="text-xl font-bold text-orange-600 truncate">{currentFolder || "Root"}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setCurrentFolder(null)}>
            Root
          </Button>
          {currentFolder && (
            <>
              <span className="text-gray-400">/</span>
              <Badge variant="secondary">{currentFolder}</Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex border rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-2 rounded-l-lg", viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50")}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2 rounded-r-lg", viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folders List */}
      {folders.length > 0 && !currentFolder && (
        <Card>
          <CardHeader><CardTitle>Folders</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-green-600" />
                  <span>{folder}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Grid/List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-mocha-600" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <HardDrive className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No files found</p>
              <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />Upload First File
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                const colorClass = getFileColor(file.mimeType);
                const isImage = file.mimeType.startsWith("image/");

                return (
                  <div key={file.id} className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className={cn("aspect-square flex items-center justify-center", colorClass)}>
                      {isImage ? (
                        <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="h-12 w-12" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => copyToClipboard(file.url, file.id)}
                        className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100"
                        title="Copy URL"
                      >
                        {copiedId === file.id ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                const colorClass = getFileColor(file.mimeType);

                return (
                  <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.originalName}</p>
                      <p className="text-sm text-gray-500">{file.mimeType}</p>
                    </div>
                    <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                    <div className="text-sm text-gray-400">{new Date(file.createdAt).toLocaleDateString()}</div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(file.url, file.id)}>
                        {copiedId === file.id ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upload File</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Select a file from your computer</p>
            </div>
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <div>
              <Label>File URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Enter the URL of the file to add</p>
            </div>
            <div>
              <Label>Filename</Label>
              <Input
                placeholder="my-image.jpg"
                value={uploadFilename}
                onChange={(e) => setUploadFilename(e.target.value)}
              />
            </div>
            <div>
              <Label>Folder (optional)</Label>
              <Select value={uploadFolder} onValueChange={(v) => setUploadFolder(v === "_none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUrlUpload} disabled={!uploadUrl || !uploadFilename || uploading}>
              {uploading ? "Adding..." : "Add Media"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Folder Name</Label>
            <Input
              placeholder="images"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    zip: "application/zip",
  };
  return types[ext || ""] || "application/octet-stream";
}
