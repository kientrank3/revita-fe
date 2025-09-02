"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Phone, Mail, ArrowRight, Loader2, ArrowLeft, Lock } from "lucide-react"
import Image from "next/image"
import { authApi } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("") // phone or email
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEmailMode, setIsEmailMode] = useState(false)
  const router = useRouter()

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const ok = await login({ identifier, password });
      if (ok) router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thông tin đăng nhập không chính xác")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    
    try {
      // Mở popup cho Google OAuth
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&response_type=code&scope=email profile`;
      
      const popup = window.open(googleAuthUrl, 'googleAuth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      // Lắng nghe message từ popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.code) {
          try {
            const response = await authApi.googleLogin({ code: event.data.code });
            
            // Lưu token vào localStorage
            if (response.data.accessToken) {
              localStorage.setItem('auth_token', response.data.accessToken);
              if (response.data.refreshToken) {
                localStorage.setItem('refresh_token', response.data.refreshToken);
              }
            }
            
            router.push("/");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Đăng nhập Google thất bại");
          } finally {
            setGoogleLoading(false);
            window.removeEventListener('message', handleMessage);
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Cleanup nếu popup bị đóng
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setGoogleLoading(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Không thể mở cửa sổ đăng nhập Google");
      setGoogleLoading(false);
    }
  }

  const toggleMode = () => {
    setIsEmailMode(!isEmailMode)
    setIdentifier("")
    setError("")
  }

  const handleBack = () => {
    router.back()
  }

  const handleForgotPassword = () => {
    // Navigate to forgot password page
    router.push("/forgot-password")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 inline-flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6 p-2">
            <Image
              src="/logos/LogoRevita-v2-noneBG.png"
              alt="Revita Clinic Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại!</h1>
          <p className="text-gray-600">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary"></div>

          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-semibold text-center text-gray-800">Đăng nhập</CardTitle>
            <CardDescription className="text-center text-gray-600">
              {isEmailMode ? "Nhập email và mật khẩu" : "Nhập số điện thoại và mật khẩu"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identifier Input Field */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                  {isEmailMode ? "Email" : "Số điện thoại"}
                </Label>
                <div className="relative group">
                  {isEmailMode ? (
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                  )}
                  <Input
                    id="identifier"
                    placeholder={isEmailMode ? "Nhập địa chỉ email của bạn" : "Nhập số điện thoại của bạn"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    type={isEmailMode ? "email" : "tel"}
                    className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mật khẩu
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Toggle Mode Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-primary hover:text-primary/80 text-sm font-medium hover:underline transition-colors"
                >
                  {isEmailMode ? "Đăng nhập bằng số điện thoại" : "Đăng nhập bằng email"}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-top-2">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                disabled={loading || !identifier || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">hoặc</span>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Đang đăng nhập Google...
                  </>
                ) : (
                  <>
                    <Image src="/socials/google.svg" alt="Google" width={20} height={20} className="mr-3" />
                    <span className="font-medium text-gray-700">Đăng nhập với Google</span>
                  </>
                )}
              </Button>
            </form>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-primary hover:text-primary/80 text-sm font-medium hover:underline transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <a
                  href="/register"
                  className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                >
                  Đăng ký ngay
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <a href="/terms" className="text-primary hover:underline">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Chính sách bảo mật
            </a>{" "}
            của chúng tôi
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-xl -z-10"></div>
      </div>
    </div>
  )
}
