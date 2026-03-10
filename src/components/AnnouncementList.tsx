import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Megaphone,
  RefreshCw,
  Wrench,
  Pencil,
  Plus,
  Search,
  X,
  ImagePlus,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import DOMPurify from 'dompurify';
import RichAnnouncementEditor from '@/components/RichAnnouncementEditor';

type AnnouncementType = 'update' | 'bugfix' | 'change';

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'] & {
  type: AnnouncementType;
};

interface AnnouncementListProps {
  canManage?: boolean;
  maxItems?: number;
  embedded?: boolean;
}

const iconByType = {
  update: RefreshCw,
  bugfix: Wrench,
  change: Megaphone,
} as const;

const labelByType = {
  update: 'System Update',
  bugfix: 'Bug Fix',
  change: 'Process Change',
} as const;

const AnnouncementList: React.FC<AnnouncementListProps> = ({ canManage = false, maxItems, embedded = false }) => {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewAnnouncement, setViewAnnouncement] = useState<AnnouncementRow | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState<AnnouncementType>('update');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const parseStoredDetail = (storedText: string) => {
    const imageMarker = storedText.match(/^\s*\[image:(.+?)\]\s*\n?/im);
    const image = imageMarker?.[1]?.trim() || '';
    let content = storedText;
    if (imageMarker) {
      content = content.replace(/^\s*\[image:(.+?)\]\s*\n?/im, '');
    }
    return {
      image,
      content: content.trim(),
    };
  };

  const buildStoredDetail = (content: string) => content.trim();

  const loadAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('announcements')
        .select('id, title, detail, type, is_active, published_at, imageurl, expires_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });

      if (!canManage) {
        query = query
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setAnnouncements((data || []) as AnnouncementRow[]);
    } catch (err: any) {
      const msg = err.message || 'Failed to load announcements.';
      setError(msg);
      if (canManage) {
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [canManage]);

  const visibleAnnouncements = useMemo(() => {
    if (!maxItems || maxItems <= 0) return announcements;
    return announcements.slice(0, maxItems);
  }, [announcements, maxItems]);

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter((item) => {
      const parsed = parseStoredDetail(item.detail);
      return (
        item.title.toLowerCase().includes(q) ||
        parsed.content.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    });
  }, [announcements, searchQuery]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDetail('');
    setType('update');
    setIsActive(true);
    setImageUrl('');
    setExpiresAt('');
    setError('');
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (row: AnnouncementRow) => {
    const parsed = parseStoredDetail(row.detail);
    setEditingId(row.id);
    setTitle(row.title);
    setDetail(parsed.content);
    setImageUrl((row.imageurl || parsed.image || '').trim());
    setExpiresAt(row.expires_at ? new Date(row.expires_at).toISOString().slice(0, 10) : '');
    setType(row.type);
    setIsActive(row.is_active);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !detail.trim()) {
      setError('Title and detail are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const detailPayload = buildStoredDetail(detail);

      if (editingId) {
        const { error: updateError } = await supabase
          .from('announcements')
          .update({
            title: title.trim(),
            detail: detailPayload,
            type,
            is_active: isActive,
            imageurl: imageUrl.trim() || null,
            expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
          })
          .eq('id', editingId);
        if (updateError) throw updateError;
        toast({ title: 'Success', description: 'Announcement updated successfully.' });
      } else {
        const now = new Date().toISOString();
        const { data: insertedAnnouncement, error: insertError } = await supabase
          .from('announcements')
          .insert({
            title: title.trim(),
            detail: detailPayload,
            type,
            is_active: isActive,
            published_at: now,
            imageurl: imageUrl.trim() || null,
            expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
          })
          .select('id, title')
          .single();
        if (insertError) throw insertError;

        const actorUserId = (window as any).getGlobal?.('userid') || 'system';
        const actorName = (() => {
          try {
            const raw = localStorage.getItem('carfSession');
            if (!raw) return actorUserId;
            const parsed = JSON.parse(raw);
            return parsed?.fullName || parsed?.email || actorUserId;
          } catch {
            return actorUserId;
          }
        })();

        const announcementId = insertedAnnouncement?.id ?? 0;
        await supabase.from('notifications').insert({
          gencode: `ANNOUNCEMENT-${announcementId}`,
          refid: announcementId,
          notification_type: 'SUBMISSION',
          action: 'SUBMITTED',
          actor_userid: actorUserId,
          actor_name: actorName,
          recipient_userid: actorUserId,
          recipient_name: actorName,
          custtype: 'SYSTEM',
          title: `New Announcement: ${insertedAnnouncement?.title || title.trim()}`,
          message: 'A new announcement has been posted. Click to view announcements.',
          new_status: 'ANNOUNCED',
        });

        toast({ title: 'Success', description: 'Announcement added successfully.' });
      }

      setShowModal(false);
      resetForm();
      await loadAnnouncements();
    } catch (err: any) {
      const msg = err.message || 'Failed to save announcement.';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .or(`gencode.eq.ANNOUNCEMENT-${id},refid.eq.${id}`);
      const { error: deleteError } = await supabase.from('announcements').delete().eq('id', id);
      if (deleteError) throw deleteError;

      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      if (viewAnnouncement?.id === id) {
        setViewAnnouncement(null);
      }
      toast({ title: 'Deleted', description: 'Announcement deleted successfully.' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete announcement.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return 'Unscheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unscheduled';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });

  const handleImageFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageUrl(dataUrl);
      toast({ title: 'Image added', description: 'Announcement image is ready.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to process image.', variant: 'destructive' });
    }
  };

  const handleImageInputChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0] || null;
    await handleImageFile(file);
    e.target.value = '';
  };

  const handlePasteImage: React.ClipboardEventHandler<HTMLDivElement> = async (e) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    await handleImageFile(file);
  };

  const renderAnnouncementDetail = (
    storedText: string,
    variant: 'table' | 'card' | 'modal' = 'card',
    imageFromRow?: string | null,
    showImage: boolean = true
  ) => {
    const parsed = parseStoredDetail(storedText);
    const imageToShow = (imageFromRow || parsed.image || '').trim();
    const isHtmlContent = /<\/?[a-z][\s\S]*>/i.test(parsed.content);

    const textBlock = isHtmlContent ? (
      <div
        className="space-y-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_img]:max-w-full [&_img]:rounded-lg"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parsed.content) }}
      />
    ) : (
      <div className="space-y-1 text-left">
        {parsed.content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line, index) => {
            const bulletMatch = line.match(/^[-*\u2022]\s+(.+)$/);
            if (bulletMatch) {
              return (
                <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1">
                  <li>{bulletMatch[1]}</li>
                </ul>
              );
            }
            return <p key={`p-${index}`}>{line}</p>;
          })}
      </div>
    );

    const imageClass =
      variant === 'table'
        ? 'mb-2 h-24 w-36 object-cover rounded-lg border border-slate-300 shadow-sm'
        : variant === 'modal'
          ? 'mb-3 w-full max-h-96 object-contain rounded-xl border border-slate-200 bg-slate-100 p-1'
          : 'mb-2 w-full max-h-40 object-cover rounded-xl border border-sky-200 shadow-sm';

    return (
      <div>
        {showImage && imageToShow && (
          <img
            src={imageToShow}
            alt="Announcement visual"
            className={imageClass}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        {textBlock}
      </div>
    );
  };

  if (canManage) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="border-b border-slate-200 bg-background px-4 py-4 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">ANNOUNCEMENTS</h2>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:hidden"
              >
                <Plus size={18} />
                Add
              </button>
            </div>

            <div className="flex w-full items-center gap-2 sm:justify-end">
              <div className="relative w-full sm:w-72 md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search announcements"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-border bg-input pl-10 text-sm"
                />
              </div>
              <button
                onClick={handleAdd}
                className="hidden items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 sm:flex"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 mx-4 mb-4 mt-4 overflow-hidden flex flex-col">
          <div className="md:hidden flex-1 overflow-auto custom-scrollbar space-y-3 pr-1">
            {filteredAnnouncements.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                No announcements available.
              </div>
            )}
            {filteredAnnouncements.map((item) => (
              <article
                key={`mobile-${item.id}`}
                onDoubleClick={() => handleEdit(item)}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-gray-300">
                  <p><span className="font-semibold">Type:</span> {labelByType[item.type]}</p>
                  <p><span className="font-semibold">Published:</span> {formatDate(item.published_at)}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden md:block flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow custom-scrollbar">
            <table className="min-w-full table-auto">
              <thead className="bg-slate-100 dark:bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200 whitespace-nowrap">TITLE</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200 whitespace-nowrap">TYPE</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200 whitespace-nowrap">PUBLISHED</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200 whitespace-nowrap">EXPIRES</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200 whitespace-nowrap">ACTIVE</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200 w-32 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {filteredAnnouncements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-sm text-slate-500 dark:text-gray-300 text-center">
                      No announcements available.
                    </td>
                  </tr>
                )}
                {filteredAnnouncements.map((item) => (
                  <tr
                    key={item.id}
                    onDoubleClick={() => handleEdit(item)}
                    className="cursor-pointer hover:bg-slate-100/80 dark:hover:bg-gray-700/50 transition-colors"
                    title="Double-click to edit"
                  >
                    <td className="px-6 py-4 text-slate-800 dark:text-gray-200">
                      <p className="font-medium">{item.title}</p>
                      <div className="mt-1 text-xs text-slate-500 dark:text-gray-300">
                        {renderAnnouncementDetail(item.detail, 'table', item.imageurl)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{labelByType[item.type]}</td>
                    <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{formatDate(item.published_at)}</td>
                    <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{item.expires_at ? formatDate(item.expires_at) : 'No expiry'}</td>
                    <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{item.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 w-32">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 sm:items-center sm:p-6">
            <div
              className="my-auto flex w-full max-w-3xl max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-3 sm:p-4 md:p-6 text-slate-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              onPaste={handlePasteImage}
            >
              <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 md:-mx-6 mb-3 flex items-center justify-between border-b border-slate-200 bg-white px-3 pb-3 pt-1 sm:px-4 dark:border-gray-700 dark:bg-gray-800 md:px-6">
                <h3 className="text-lg font-semibold">{editingId ? 'Edit Announcement' : 'Add Announcement'}</h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <label className="text-sm mb-1">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="px-3 py-2 rounded bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_14rem] gap-3 items-start">
                    <div className="flex flex-col">
                      <label className="text-sm mb-1">Detail</label>
                      <RichAnnouncementEditor value={detail} onChange={setDetail} />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm mb-1">Announcement Image (optional)</label>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageInputChange}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <ImagePlus size={14} />
                          Upload
                        </button>
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="inline-flex items-center gap-1 rounded border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] leading-tight text-slate-500 dark:text-gray-300">
                        You can also paste an image with <span className="font-semibold">Ctrl+V</span>.
                      </p>
                      {imageUrl && (
                      <div className="relative mt-2 w-full">
                        <img
                          src={imageUrl}
                          alt="Announcement preview"
                          className="h-28 w-full rounded-lg border border-slate-300 object-cover dark:border-gray-600"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedImageUrl(imageUrl)}
                          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[11px] font-semibold text-white hover:bg-black/80"
                          title="Expand image"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          Expand
                        </button>
                      </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
                    <div className="flex flex-col">
                      <label className="text-sm mb-1">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as AnnouncementType)}
                        className="px-3 py-2 rounded bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="update">System Update</option>
                        <option value="bugfix">Bug Fix</option>
                        <option value="change">Process Change</option>
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[7rem]">
                      <label className="text-sm mb-1">Status</label>
                      <label className="inline-flex items-center justify-center gap-2 rounded border border-slate-300 dark:border-gray-600 px-3 py-2 text-sm">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        Active
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm mb-1">Expiry Date (optional)</label>
                      <input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="px-3 py-2 rounded bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-300">
                    Expired announcements are hidden from login/public view.
                  </p>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
              </div>

              <div className="sticky bottom-0 z-20 -mx-3 sm:-mx-4 md:-mx-6 mt-3 flex justify-end gap-2 border-t border-slate-200 bg-white px-3 pb-1 pt-3 sm:px-4 dark:border-gray-700 dark:bg-gray-800 md:px-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded border border-slate-300 dark:border-gray-600 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {expandedImageUrl && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setExpandedImageUrl(null)}
          >
            <button
              type="button"
              onClick={() => setExpandedImageUrl(null)}
              className="absolute right-4 top-4 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              Close
            </button>
            <img
              src={expandedImageUrl}
              alt="Announcement visual expanded"
              className="max-h-[88vh] max-w-[92vw] rounded-lg border border-white/25 bg-black object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      className={
        embedded
          ? 'rounded-xl border border-slate-200 bg-background p-3'
          : 'rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-4 shadow-[0_10px_28px_rgba(14,116,144,0.12)]'
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-sky-600 p-1.5 text-white shadow-sm">
            <Megaphone className="h-4 w-4" />
          </div>
          <h3 className={`text-sm font-bold uppercase tracking-wide ${embedded ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>Announcements</h3>
        </div>
        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
          Latest
        </span>
      </div>

      {loading && <p className={`text-xs ${embedded ? 'text-slate-200' : 'text-slate-600'}`}>Loading announcements...</p>}
      {!loading && visibleAnnouncements.length === 0 && (
        <p className={`rounded-lg border px-3 py-2 text-xs ${embedded ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-200 bg-white/70 text-slate-600'}`}>
          No announcements available.
        </p>
      )}

      {!loading && visibleAnnouncements.length > 0 && !canManage && (
        <div className={`${embedded ? 'max-h-[56vh]' : 'max-h-[20rem]'} overflow-y-auto pr-1 space-y-3 custom-scrollbar`}>
          {visibleAnnouncements.map((item) => {
            const Icon = iconByType[item.type];
            const accentClass =
              item.type === 'update'
                ? 'border-l-sky-500'
                : item.type === 'bugfix'
                  ? 'border-l-emerald-500'
                  : 'border-l-amber-500';
            const parsed = parseStoredDetail(item.detail);
            const imageToShow = (item.imageurl || parsed.image || '').trim();
            const plainLength = parsed.content.replace(/<[^>]+>/g, '').trim().length;
            const canExpand = plainLength > 220 || Boolean(imageToShow);
            const previewHeight = imageToShow ? 'max-h-32' : 'max-h-20';
            const cardClass = embedded
              ? 'rounded-xl border border-slate-600 border-l-4 bg-slate-800 p-3 shadow-sm'
              : `rounded-xl border border-slate-200 border-l-4 ${accentClass} bg-white p-3 shadow-sm`;
            return (
              <article
                key={item.id}
                className={embedded ? cardClass.replace('border-l-4', `border-l-4 ${accentClass}`) : cardClass}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    <Icon className="h-3 w-3" />
                    {labelByType[item.type]}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${embedded ? 'text-slate-300' : 'text-slate-500'}`}>
                    {formatDate(item.published_at)}
                  </span>
                </div>
                <p className={`text-sm font-bold ${embedded ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                <div className={`mt-1 ${previewHeight} overflow-hidden text-xs leading-relaxed ${embedded ? 'text-slate-100' : 'text-slate-700'}`}>
                  {renderAnnouncementDetail(item.detail, 'card', item.imageurl)}
                </div>
                {canExpand && (
                  <button
                    type="button"
                    onClick={() => setViewAnnouncement(item)}
                    className="mt-2 text-[11px] font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Show more
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {viewAnnouncement && !canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-900">{viewAnnouncement.title}</h4>
              <button
                type="button"
                onClick={() => setViewAnnouncement(null)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="p-4 text-sm text-slate-700 max-h-[70vh] overflow-auto custom-scrollbar">
              {(() => {
                const parsed = parseStoredDetail(viewAnnouncement.detail);
                const imageToShow = (viewAnnouncement.imageurl || parsed.image || '').trim();
                if (!imageToShow) return null;
                return (
                  <div className="relative mb-3">
                    <img
                      src={imageToShow}
                      alt="Announcement visual"
                      className="w-full max-h-80 object-cover rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setExpandedImageUrl(imageToShow)}
                      className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-xs font-semibold text-white hover:bg-black/80"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      Expand
                    </button>
                  </div>
                );
              })()}
              {renderAnnouncementDetail(viewAnnouncement.detail, 'modal', viewAnnouncement.imageurl, false)}
            </div>
          </div>
        </div>
      )}

      {expandedImageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setExpandedImageUrl(null)}
            className="absolute top-4 right-4 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            Close
          </button>
          <img
            src={expandedImageUrl}
            alt="Announcement visual expanded"
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg border border-white/25 bg-black"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default AnnouncementList;
