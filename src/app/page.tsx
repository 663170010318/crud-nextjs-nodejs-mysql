'use client';

import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setShouldDeleteImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    if (editId) setShouldDeleteImage(true);
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const resetForm = () => {
    setFormData({ name: '', email: '' });
    setFile(null);
    setPreview(null);
    setEditId(null);
    setShouldDeleteImage(false);
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    
    if (file) {
      data.append('image', file);
    } else if (shouldDeleteImage) {
      data.append('deleteImage', 'true');
    }

    if (editId) data.append('id', editId.toString());

    try {
      const res = await fetch('/api/users', {
        method: editId ? 'PUT' : 'POST',
        body: data,
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: editId ? 'อัปเดตเรียบร้อย' : 'บันทึกเรียบร้อย',
          showConfirmButton: false,
          timer: 1500
        });
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: any) => {
    setEditId(user.id);
    setFormData({ name: user.name, email: user.email });
    setPreview(user.image ? `/uploads/${user.image}` : null);
    setShouldDeleteImage(false);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบสมาชิก?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ยืนยัน'
    });

    if (result.isConfirmed) {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        Swal.fire('ลบแล้ว', '', 'success');
        fetchUsers();
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="alert alert-dark" role="alert">
        <h2>CRUD Basic NextJS Bootstrap + MySQL</h2>
      </div>
      <div className="row g-4">
        <div className="col-lg-4 col-md-5">
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-header bg-dark py-3">
              <h6 className="mb-0 text-white fw-bold">
                {editId ? 'แก้ไขสมาชิก' : 'ลงทะเบียนใหม่'}
              </h6>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    <img 
                      src={preview || 'https://www.nicepng.com/png/detail/128-1280406_view-user-icon-png-user-circle-icon-png.png'} 
                      className="rounded-circle border shadow-sm object-fit-cover" 
                      style={{ width: 120, height: 120, backgroundColor: '#f8f9fa' }} 
                      alt="Avatar" 
                    />
                    {preview && (
                      <button 
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle d-flex align-items-center justify-content-center shadow"
                        style={{ width: 28, height: 28, border: '2px solid white' }}
                        title="ลบรูปภาพ"
                      >
                        <small>✕</small>
                      </button>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">ชื่อ - นามสกุล</label>
                  <input name="name" type="text" className="form-control form-control-lg" required
                         placeholder="ระบุชื่อและสกุล" value={formData.name} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">อีเมล</label>
                  <input name="email" type="email" className="form-control form-control-lg" required
                         placeholder="email@gmail.com" value={formData.email} onChange={handleChange} />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small">เปลี่ยนรูปโปรไฟล์</label>
                  <input id="imageInput" type="file" className="form-control" 
                         accept="image/*" onChange={handleFileChange} />
                </div>
                <div className="d-grid gap-2">
                  <button type="submit" disabled={loading} className={`btn btn-lg fw-bold ${editId ? 'btn-warning' : 'btn-primary'}`}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : editId ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันลงทะเบียน'}
                  </button>
                  {editId && (
                    <button type="button" onClick={resetForm} className="btn btn-outline-secondary">
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-8 col-md-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="table-dark">
                      <th className="px-4 py-3">ข้อมูลสมาชิก</th>
                      <th className="py-3">อีเมล</th>
                      <th className="py-3 text-end px-4">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center">
                            <img 
                              src={user.image ? `/uploads/${user.image}` : 'https://www.nicepng.com/png/detail/128-1280406_view-user-icon-png-user-circle-icon-png.png'} 
                              className="rounded-circle me-3 border shadow-sm object-fit-cover" 
                              style={{ width: 45, height: 45 }} 
                              alt="" 
                            />
                            <span className="fw-semibold text-dark">{user.name}</span>
                          </div>
                        </td>
                        <td className="text-muted">{user.email}</td>
                        <td className="text-end px-4">
                          <div className="btn-group shadow-sm">
                            <button onClick={() => startEdit(user)} className="btn btn-white btn-sm border">แก้ไข</button>
                            <button onClick={() => handleDelete(user.id)} className="btn btn-outline-danger btn-sm">ลบ</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-muted">ไม่พบข้อมูลสมาชิกในระบบ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}