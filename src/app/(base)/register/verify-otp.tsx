// Bước 2: Xác thực OTP
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyOtp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/register/complete?sessionId=${sessionId}`);
        }, 1000);
      } else {
        setError(data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError("Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || "Có lỗi xảy ra");
    } catch {
      setError("Không thể gửi lại OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4 p-4 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">Nhập mã OTP</h2>
      <Input
        placeholder="Mã OTP 6 số"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        maxLength={6}
        type="text"
        inputMode="numeric"
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Xác thực thành công!</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Đang xác thực..." : "Xác thực"}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={loading}>
        Gửi lại mã OTP
      </Button>
    </form>
  );
}
