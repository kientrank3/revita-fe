"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Pin,
  PinOff,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { postsService } from "@/lib/services/posts.service";
import type {
  PostResponse,
  CategoryResponse,
  SeriesResponse,
  PostStatus,
} from "@/lib/types/posts";

export default function PostsManagementPage() {
  const [tab, setTab] = React.useState("posts");
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col gap-6 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Quản lý bài viết</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger value="posts">Bài viết</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <PostsTab />
          </TabsContent>
          <TabsContent value="categories" className="mt-4">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="series" className="mt-4">
            <SeriesTab />
          </TabsContent>
        </Tabs>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}

// ============== POSTS TAB ==============
function PostsTab() {
  const router = useRouter();
  const [limit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PostStatus | "ALL">("ALL");

  const [data, setData] = React.useState<PostResponse[]>([]);
  const [pagination, setPagination] = React.useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newPostTitle, setNewPostTitle] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const loadPosts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsService.getAdminPosts({
        limit,
        offset,
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : (statusFilter as PostStatus),
      });
      setData(res.items || []);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, search, statusFilter]);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleCreateDraft = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const draft = await postsService.createDraft({
        title: newPostTitle || undefined,
      });
      toast.success("Tạo bản nháp thành công!");
      setCreateDialogOpen(false);
      setNewPostTitle("");
      // Chuyển đến trang edit
      router.push(`/posts-management/${draft.id}/edit`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo bản nháp");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await postsService.deletePost(id);
      toast.success("Xóa bài viết thành công!");
      void loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa bài viết");
    }
  };

  const handleTogglePin = async (post: PostResponse) => {
    try {
      await postsService.updatePost(post.id, { isPinned: !post.isPinned });
      toast.success(
        `${post.isPinned ? "Bỏ ghim" : "Ghim"} bài viết thành công!`
      );
      void loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi cập nhật");
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    const variants: Record<
      PostStatus,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      DRAFT: { variant: "secondary", label: "Bản nháp" },
      PUBLISHED: { variant: "default", label: "Đã xuất bản" },
      UNPUBLISHED: { variant: "destructive", label: "Chưa xuất bản" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PostStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
              <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => loadPosts()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài viết
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo bài viết mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề bài viết</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creating) {
                      void handleCreateDraft();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateDraft} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo bản nháp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!loading && !error && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Lượt thích</TableHead>
                  <TableHead>Bình luận</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      Không có bài viết nào
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((post, idx) => (
                    <TableRow key={post.id}>
                      <TableCell>{offset + idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {post.isPinned && (
                            <Pin className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium">{post.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        {post.categories.length > 0 ? (
                          <div className="flex gap-1">
                            {post.categories.map((cat) => (
                              <Badge key={cat.id} variant="outline">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{post.likesCount}</TableCell>
                      <TableCell>{post.commentsCount}</TableCell>
                      <TableCell>
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePin(post)}
                            title={post.isPinned ? "Bỏ ghim" : "Ghim"}
                          >
                            {post.isPinned ? (
                              <PinOff className="h-4 w-4" />
                            ) : (
                              <Pin className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/posts-management/${post.id}/edit`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị {offset + 1} -{" "}
              {Math.min(offset + limit, pagination.total)} / {pagination.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOffset(offset + limit)}
                disabled={!pagination.hasMore}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============== CATEGORIES TAB ==============
function CategoriesTab() {
  const [categories, setCategories] = React.useState<CategoryResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryResponse | null>(null);
  const [form, setForm] = React.useState<{
    name: string;
    slug?: string;
    description: string;
  }>({ name: "", slug: "", description: "" });
  const [submitting, setSubmitting] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsService.getAllCategories();
      setCategories(res || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "" });
    setOpen(true);
  };

  const openEdit = (cat: CategoryResponse) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await postsService.updateCategory(editing.id, {
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
        });
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await postsService.createCategory({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
        });
        toast.success("Tạo danh mục thành công!");
      }
      setOpen(false);
      void loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await postsService.deleteCategory(id);
      toast.success("Xóa danh mục thành công!");
      void loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa danh mục");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => loadCategories()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên danh mục</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhập tên danh mục..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (tùy chọn)</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Để trống để tự động tạo..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Nhập mô tả..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số bài viết</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Không có danh mục nào
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat, idx) => (
                  <TableRow key={cat.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {cat.slug}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {cat.description}
                    </TableCell>
                    <TableCell>{cat.totalPosts}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ============== SERIES TAB ==============
function SeriesTab() {
  const [series, setSeries] = React.useState<SeriesResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SeriesResponse | null>(null);
  const [form, setForm] = React.useState<{
    name: string;
    slug?: string;
    description: string;
  }>({ name: "", slug: "", description: "" });
  const [submitting, setSubmitting] = React.useState(false);

  const loadSeries = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsService.getAllSeries();
      setSeries(res || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "" });
    setOpen(true);
  };

  const openEdit = (s: SeriesResponse) => {
    setEditing(s);
    setForm({ name: s.name, slug: s.slug, description: s.description });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await postsService.updateSeries(editing.id, {
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
        });
        toast.success("Cập nhật series thành công!");
      } else {
        await postsService.createSeries({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
        });
        toast.success("Tạo series thành công!");
      }
      setOpen(false);
      void loadSeries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu series");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa series này?")) return;
    try {
      await postsService.deleteSeries(id);
      toast.success("Xóa series thành công!");
      void loadSeries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa series");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => loadSeries()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm series
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Chỉnh sửa series" : "Tạo series mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên series</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhập tên series..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (tùy chọn)</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Để trống để tự động tạo..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Nhập mô tả..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số bài viết</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Không có series nào
                  </TableCell>
                </TableRow>
              ) : (
                series.map((s, idx) => (
                  <TableRow key={s.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {s.slug}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {s.description}
                    </TableCell>
                    <TableCell>{s.totalPosts}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
