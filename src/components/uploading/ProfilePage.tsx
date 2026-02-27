import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Camera, Save, User, Mail, Hash, Shield,
  Building2, CheckCircle, Loader2, LogOut, ZoomIn, ZoomOut,
  RotateCw, X, CropIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfilePageProps {
  userEmail: string;
  onBack: () => void;
  onLogout?: () => void;
}

interface UserProfile {
  userid: string;
  email: string;
  fullname: string;
  approver: boolean;
  allaccess: boolean;
  editaccess: boolean;
  customlimitaccess: boolean;
  usergroup: string | null;
  company: string | null;
  allcompanyaccess: boolean;
  complianceandfinalapprover: boolean;
  avatar_url?: string | null;
}

// ─── Crop Modal ──────────────────────────────────────────────────────────────
interface CropModalProps {
  imageSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

const CropModal: React.FC<CropModalProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [outputSize, setOutputSize] = useState(256);
  const [imgLoaded, setImgLoaded] = useState(false);

  const CANVAS_SIZE = 320; // display canvas size (square)

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw whenever params change
  useEffect(() => {
    if (!imgLoaded) return;
    draw();
    drawPreview();
  }, [zoom, rotation, offset, imgLoaded, outputSize]);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    const size = CANVAS_SIZE;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Background
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, size, size);

    // Draw image with transform
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99,102,241,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawPreview = () => {
    const src = canvasRef.current;
    const dst = previewRef.current;
    if (!src || !dst) return;
    const ctx = dst.getContext('2d')!;
    dst.width = outputSize;
    dst.height = outputSize;
    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(src, 0, 0, outputSize, outputSize);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Draw final at outputSize
    const out = document.createElement('canvas');
    out.width = outputSize;
    out.height = outputSize;
    const ctx = out.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(canvas, 0, 0, outputSize, outputSize);
    onConfirm(out.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CropIcon className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">Crop Profile Photo</h3>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-4">

          {/* Canvas + preview side by side */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {/* Main crop canvas */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">Drag to reposition</p>
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="rounded-full cursor-grab active:cursor-grabbing border-2 border-indigo-500/40 w-[min(68vw,320px)] h-[min(68vw,320px)] md:w-[320px] md:h-[320px]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              />
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">Preview</p>
              <canvas
                ref={previewRef}
                className="rounded-full border-2 border-border"
                style={{ width: 80, height: 80 }}
              />
              <p className="text-xs text-muted-foreground">{outputSize}×{outputSize}px</p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">

            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="range" min={0.5} max={3} step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Rotation */}
            <div className="flex items-center gap-3">
              <RotateCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="range" min={-180} max={180} step={1}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">{rotation}°</span>
              <button
                onClick={() => setRotation(0)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >Reset</button>
            </div>

            {/* Output size */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex-shrink-0 w-20">Output size</span>
              <div className="flex gap-2">
                {[128, 256, 512].map((s) => (
                  <button
                    key={s}
                    onClick={() => setOutputSize(s)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      outputSize === s
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/60'
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0 md:justify-between px-4 md:px-5 py-4 border-t border-border">
          <button
            onClick={() => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
          >
            Reset all
          </button>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 md:flex-none px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 md:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
            >
              Apply Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ProfilePage ─────────────────────────────────────────────────────────────
const ProfilePage: React.FC<ProfilePageProps> = ({ userEmail, onBack, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editName, setEditName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null); // triggers crop modal
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProfile(); }, [userEmail]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users').select('*').eq('email', userEmail).single();
      if (!error && data) {
        setProfile(data as UserProfile);
        setEditName(data.fullname || '');
        setAvatarPreview((data as any).avatar_url || null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  // Step 1: file selected → open crop modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be smaller than 10MB.'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Step 2: crop confirmed → upload cropped base64
  const handleCropConfirm = async (croppedBase64: string) => {
    setCropSrc(null);
    if (!profile) return;
    setUploadingPhoto(true);
    setAvatarPreview(croppedBase64);

    try {
      // Convert base64 to blob for storage upload
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const fileName = `${profile.userid}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(fileName, blob, { upsert: true, contentType: 'image/png' });

      let finalUrl = croppedBase64;

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        if (urlData?.publicUrl) finalUrl = urlData.publicUrl;
      }

      // Save to avatar_url column
      await supabase
        .from('users')
        .update({ avatar_url: finalUrl } as any)
        .eq('userid', profile.userid);

      setAvatarPreview(finalUrl);
      setProfile((prev) => prev ? { ...prev, avatar_url: finalUrl } : prev);

    } catch (err) {
      console.error('Photo upload error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile) return;
    setAvatarPreview(null);
    await supabase
      .from('users')
      .update({ avatar_url: null } as any)
      .eq('userid', profile.userid);
    setProfile((prev) => prev ? { ...prev, avatar_url: null } : prev);
  };

  const handleSave = async () => {
    if (!profile || !editName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ fullname: editName.trim() })
        .eq('userid', profile.userid);
      if (!error) {
        setProfile((prev) => prev ? { ...prev, fullname: editName.trim() } : prev);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleBadges = () => {
    if (!profile) return [];
    const badges: { label: string; color: string }[] = [];
    if (profile.complianceandfinalapprover) badges.push({ label: 'Final Approver', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' });
    if (profile.approver)                   badges.push({ label: 'Approver',       color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' });
    if (profile.allaccess)                  badges.push({ label: 'All Access',     color: 'bg-green-500/20 text-green-300 border-green-500/30' });
    if (profile.editaccess)                 badges.push({ label: 'Edit Access',    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' });
    if (profile.customlimitaccess)          badges.push({ label: 'Custom Limit',   color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' });
    if (profile.allcompanyaccess)           badges.push({ label: 'All Companies',  color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' });
    if (profile.usergroup)                  badges.push({ label: profile.usergroup.toUpperCase(), color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' });
    return badges;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const roleBadges = getRoleBadges();

  return (
    <>
      {/* Crop modal — rendered outside main layout so it overlays everything */}
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div className="w-full h-full flex flex-col overflow-hidden">

        {/* ── Top bar ───────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 md:px-5 py-3 md:py-4 border-b border-border">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div className="w-px h-5 bg-border flex-shrink-0" />

          {/* Avatar — click to open file picker */}
          <div className="relative group flex-shrink-0 cursor-pointer" onClick={handlePhotoClick}>
            <div className="w-10 h-10 rounded-full border-2 border-border bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center overflow-hidden">
              {uploadingPhoto ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm select-none">
                  {getInitials(profile.fullname || profile.email)}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">{profile.fullname}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>

          <div className="w-full md:w-auto md:ml-auto flex flex-wrap gap-1.5 justify-start md:justify-end">
            {roleBadges.map((badge, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ── Fields ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 px-3 md:px-5 py-4 md:py-5 overflow-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full">

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <Hash className="h-3 w-3" /> User ID
              </label>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground font-mono">
                {profile.userid}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <User className="h-3 w-3" /> Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <Mail className="h-3 w-3" /> Email Address
              </label>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {profile.email}
              </div>
            </div>

            {/* Profile Photo with crop trigger */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <Camera className="h-3 w-3" /> Profile Photo
              </label>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs text-muted-foreground">Max 10MB · JPG, PNG, WEBP</span>
                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap flex-shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                  >
                    <CropIcon className="h-3 w-3" />
                    {avatarPreview ? 'Change & Crop' : 'Upload & Crop'}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex-1 sm:flex-none text-xs px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {profile.company && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  <Building2 className="h-3 w-3" /> Company
                </label>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                  {profile.company}
                </div>
              </div>
            )}

            {profile.usergroup && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  <Shield className="h-3 w-3" /> User Group
                </label>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground capitalize">
                  {profile.usergroup}
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ───────────────────────────────────────────── */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-auto border-t border-border w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim() || editName.trim() === profile.fullname}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  : <><Save className="h-4 w-4" /> Save Changes</>
                }
              </button>
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4" /> Saved
                </span>
              )}
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
