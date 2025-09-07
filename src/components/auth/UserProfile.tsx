'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Edit, 
  Save, 
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export function UserProfile() {
  const { user, logout, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin profile</p>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
  };

  const handleSave = async () => {
    try {
      // Note: Update profile functionality needs to be implemented in authApi
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };



  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    Lưu
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || ''} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name ? getInitials(user.name) : user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{user.name || 'Chưa có tên'}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    
                    {user.role && (
                      <Badge variant="secondary">{user.role}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">ID</div>
              <div className="text-sm text-gray-600 font-mono">{user.id}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Trạng thái</div>
              <div className="text-sm text-gray-600">
                {user.role ? 'Đã xác thực' : 'Chưa xác thực'}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Cập nhật</div>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
