// Bước 3: Hoàn tất đăng ký
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CompleteRegistration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    citizenId: "",
    avatar: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError("Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4 p-4 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">Hoàn tất đăng ký</h2>
      <Input name="name" placeholder="Họ và tên" value={form.name} onChange={handleChange} required />
      <Input name="dateOfBirth" placeholder="Ngày sinh (YYYY-MM-DD)" value={form.dateOfBirth} onChange={handleChange} required type="date" />
      <select name="gender" value={form.gender} onChange={handleChange} className="w-full border rounded px-3 py-2">
        <option value="male">Nam</option>
        <option value="female">Nữ</option>
        <option value="other">Khác</option>
      </select>
      <Input name="address" placeholder="Địa chỉ" value={form.address} onChange={handleChange} required />
      <Input name="citizenId" placeholder="Số CMND/CCCD (tuỳ chọn)" value={form.citizenId} onChange={handleChange} />
      <Input name="avatar" placeholder="Link avatar (tuỳ chọn)" value={form.avatar} onChange={handleChange} />
      <Input name="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required type="password" />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Đăng ký thành công! Đang chuyển hướng...</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Đang gửi..." : "Hoàn tất đăng ký"}
      </Button>
    </form>
  );
}
