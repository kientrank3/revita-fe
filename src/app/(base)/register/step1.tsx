// Bước 1: Nhập email hoặc số điện thoại
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterStep1() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/register/verify-otp?sessionId=${data.sessionId}`);
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
      <h2 className="text-xl font-bold mb-2">Đăng ký tài khoản</h2>
      <Input
        placeholder="Số điện thoại"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        type="tel"
      />
      <div className="text-center text-gray-400">hoặc</div>
      <Input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="email"
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Đang gửi..." : "Tiếp tục"}
      </Button>
    </form>
  );
}
