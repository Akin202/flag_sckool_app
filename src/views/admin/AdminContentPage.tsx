import React, { useState, useEffect } from 'react';
import {
  Page,
  AdminModule,
  AdminLesson,
  LessonResource,
  AdminLessonUpdatePayload,
} from '@/types/index';
import {
  getAdminModules,
  updateAdminLesson,
  reorderAdminLessons,
  reorderAdminModules,
  deleteAdminLessonResource,
  uploadAdminLessonResource,
} from '@/lib/data-access';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  X,
  UploadCloud,
  FileCode,
  Trash2,
  Film,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminContentPageProps {
  onNavigate: (page: Page) => void;
}

export function AdminContentPage({ onNavigate }: AdminContentPageProps) {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(
    new Set(['mod-0', 'mod-1', 'mod-2', 'mod-3'])
  );

  // Edit Lesson Drawer State
  const [editingLesson, setEditingLesson] = useState<{
    moduleId: string;
    lesson: AdminLesson;
  } | null>(null);

  // Edit Form Fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBunnyId, setEditBunnyId] = useState('');
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editIsFree, setEditIsFree] = useState(false);
  const [editIsPublished, setEditIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const loadModules = () => {
    setLoading(true);
    getAdminModules().then((data) => {
      setModules(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadModules();
  }, []);

  const toggleModuleExpand = (modId: string) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) {
        next.delete(modId);
      } else {
        next.add(modId);
      }
      return next;
    });
  };

  // Reorder modules using transform
  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const newModules = [...modules];
    const [moved] = newModules.splice(index, 1);
    newModules.splice(targetIndex, 0, moved);

    const reordered = await reorderAdminModules(newModules.map((m) => m.id));
    setModules(reordered);
  };

  // Reorder lessons within a module
  const handleMoveLesson = async (
    moduleId: string,
    lessonIndex: number,
    direction: 'up' | 'down'
  ) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;

    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= mod.lessons.length) return;

    const newLessons = [...mod.lessons];
    const [moved] = newLessons.splice(lessonIndex, 1);
    newLessons.splice(targetIndex, 0, moved);

    const updatedMod = await reorderAdminLessons(moduleId, newLessons.map((l) => l.id));
    setModules((prev) => prev.map((m) => (m.id === moduleId ? updatedMod : m)));
  };

  const handleOpenEdit = (moduleId: string, lesson: AdminLesson) => {
    setEditingLesson({ moduleId, lesson });
    setEditTitle(lesson.title);
    setEditDescription(lesson.description || '');
    setEditBunnyId(lesson.bunnyVideoId);
    setEditDuration(lesson.durationMinutes);
    setEditIsFree(!!lesson.isFree);
    setEditIsPublished(lesson.isPublished !== false);
    setSaveFeedback(null);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    setSaving(true);

    try {
      const payload: AdminLessonUpdatePayload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        bunnyVideoId: editBunnyId.trim(),
        durationMinutes: Number(editDuration),
        isFree: editIsFree,
        isPublished: editIsPublished,
      };

      const updated = await updateAdminLesson(editingLesson.lesson.id, payload);

      setModules((prev) =>
        prev.map((mod) => {
          if (mod.id !== editingLesson.moduleId) return mod;
          return {
            ...mod,
            lessons: mod.lessons.map((l) =>
              l.id === updated.id ? { ...l, ...updated, resources: l.resources } : l
            ),
          };
        })
      );

      setEditingLesson((prev) => (prev ? { ...prev, lesson: { ...prev.lesson, ...updated } } : null));
      setSaveFeedback('Lesson updated successfully.');
      setTimeout(() => setSaveFeedback(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLessonFree = async (moduleId: string, lesson: AdminLesson) => {
    const payload: AdminLessonUpdatePayload = {
      title: lesson.title,
      description: lesson.description || '',
      bunnyVideoId: lesson.bunnyVideoId,
      durationMinutes: lesson.durationMinutes,
      isFree: !lesson.isFree,
      isPublished: lesson.isPublished !== false,
    };
    const updated = await updateAdminLesson(lesson.id, payload);
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, ...updated } : l)) }
          : m
      )
    );
  };

  const handleToggleLessonPublished = async (moduleId: string, lesson: AdminLesson) => {
    const payload: AdminLessonUpdatePayload = {
      title: lesson.title,
      description: lesson.description || '',
      bunnyVideoId: lesson.bunnyVideoId,
      durationMinutes: lesson.durationMinutes,
      isFree: !!lesson.isFree,
      isPublished: !lesson.isPublished,
    };
    const updated = await updateAdminLesson(lesson.id, payload);
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, ...updated } : l)) }
          : m
      )
    );
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!editingLesson) return;
    if (confirm('Delete this resource asset?')) {
      await deleteAdminLessonResource(editingLesson.lesson.id, resourceId);
      const updatedResources = editingLesson.lesson.resources.filter((r) => r.id !== resourceId);
      setEditingLesson({
        ...editingLesson,
        lesson: { ...editingLesson.lesson, resources: updatedResources },
      });
      setModules((prev) =>
        prev.map((m) =>
          m.id === editingLesson.moduleId
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === editingLesson.lesson.id ? { ...l, resources: updatedResources } : l
                ),
              }
            : m
        )
      );
    }
  };

  const handleSimulatedFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingLesson) return;
    setUploading(true);

    // TODO(handoff): wire uploads to storage
    const file = files[0];
    const format = file.name.split('.').pop() || 'BIN';

    try {
      const newResource = await uploadAdminLessonResource(editingLesson.lesson.id, {
        name: file.name,
        sizeBytes: file.size || 2048000,
        format,
      });

      const updatedResources = [...editingLesson.lesson.resources, newResource];
      setEditingLesson({
        ...editingLesson,
        lesson: { ...editingLesson.lesson, resources: updatedResources },
      });
      setModules((prev) =>
        prev.map((m) =>
          m.id === editingLesson.moduleId
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === editingLesson.lesson.id ? { ...l, resources: updatedResources } : l
                ),
              }
            : m
        )
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
            Curriculum & Video Content
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Module syllabus hierarchy, Bunny Stream video IDs, preview toggles & resource attachments.
          </p>
        </div>
        <button
          onClick={loadModules}
          disabled={loading}
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid: Modules on left, Edit Panel on right */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Module & Lessons List */}
        <div className="flex-1 w-full space-y-3">
          {loading ? (
            <div className="bg-white border border-gray-200 p-8 text-center text-xs font-mono text-gray-400">
              Loading curriculum modules...
            </div>
          ) : (
            modules.map((mod, modIdx) => {
              const isExpanded = expandedModuleIds.has(mod.id);
              return (
                <div
                  key={mod.id}
                  className="bg-white border border-gray-200 shadow-none transition-transform"
                >
                  {/* Module Header Row */}
                  <div className="p-3 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => toggleModuleExpand(mod.id)}
                        className="text-gray-500 hover:text-gray-900 p-0.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <span className="font-mono text-xs font-bold text-gray-900">
                        Module {mod.number}
                      </span>
                      <span className="text-gray-300 font-mono">|</span>
                      <span className="text-xs font-semibold text-gray-900">{mod.title}</span>
                      <span className="text-[11px] font-mono text-gray-500">
                        ({mod.lessons.length} lessons · {mod.totalDurationMinutes}m)
                      </span>
                    </div>

                    {/* Reorder Module Buttons (transform only) */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleMoveModule(modIdx, 'up')}
                        disabled={modIdx === 0}
                        title="Move Module Up"
                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 rounded hover:bg-gray-200"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveModule(modIdx, 'down')}
                        disabled={modIdx === modules.length - 1}
                        title="Move Module Down"
                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 rounded hover:bg-gray-200"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Lessons Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-gray-50/40 border-b border-gray-200 text-gray-500 font-mono text-[10px]">
                            <th className="py-2 px-3 w-8">#</th>
                            <th className="py-2 px-3">Lesson Title</th>
                            <th className="py-2 px-3 font-mono">Duration</th>
                            <th className="py-2 px-3 font-mono">Bunny Video ID</th>
                            <th className="py-2 px-3 text-center">Free Preview</th>
                            <th className="py-2 px-3 text-center">Published</th>
                            <th className="py-2 px-3 text-right">Reorder / Edit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {mod.lessons.map((les, lesIdx) => {
                            const isCurrentlyEditing = editingLesson?.lesson.id === les.id;
                            return (
                              <tr
                                key={les.id}
                                className={`hover:bg-gray-50/80 transition-colors ${
                                  isCurrentlyEditing ? 'bg-blue-50/70 font-medium' : ''
                                }`}
                              >
                                <td className="py-2 px-3 font-mono text-gray-400 text-[11px]">
                                  {lesIdx + 1}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-medium text-gray-900">{les.title}</div>
                                  {les.resources.length > 0 && (
                                    <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                                      {les.resources.length} resource{les.resources.length > 1 ? 's' : ''} attached
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono text-gray-600 text-[11px] whitespace-nowrap">
                                  {les.durationMinutes} min
                                </td>
                                <td className="py-2 px-3 font-mono text-gray-600 text-[11px] select-all">
                                  <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-[10px]">
                                    {les.bunnyVideoId}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => handleToggleLessonFree(mod.id, les)}
                                    title={les.isFree ? 'Revoke free preview' : 'Make free preview'}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                                      les.isFree
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    {les.isFree ? 'Free Preview' : 'Locked'}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => handleToggleLessonPublished(mod.id, les)}
                                    title={les.isPublished ? 'Unpublish lesson' : 'Publish lesson'}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                                      les.isPublished !== false
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    {les.isPublished !== false ? 'Live' : 'Draft'}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <div className="inline-flex items-center space-x-1">
                                    <button
                                      onClick={() => handleMoveLesson(mod.id, lesIdx, 'up')}
                                      disabled={lesIdx === 0}
                                      className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-30 rounded"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveLesson(mod.id, lesIdx, 'down')}
                                      disabled={lesIdx === mod.lessons.length - 1}
                                      className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-30 rounded"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenEdit(mod.id, les)}
                                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-mono text-[11px] border border-gray-200"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Edit Panel Drawer */}
        {editingLesson ? (
          <div className="w-full lg:w-[420px] bg-white border border-gray-200 p-4 shrink-0 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono uppercase text-gray-500">Edit Lesson</span>
                <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[280px]">
                  {editingLesson.lesson.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingLesson(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveFeedback && (
              <div className="my-2 p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono rounded flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{saveFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveLesson} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-gray-600 mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-600 mb-1">
                  Description / Topics Covered
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-gray-600 mb-1">
                    Bunny Video ID
                  </label>
                  <input
                    type="text"
                    value={editBunnyId}
                    onChange={(e) => setEditBunnyId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-600 mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <label className="flex items-center space-x-2 p-2 border border-gray-200 bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsFree}
                    onChange={(e) => setEditIsFree(e.target.checked)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-0"
                  />
                  <span className="text-gray-700 text-[11px]">Free Preview</span>
                </label>

                <label className="flex items-center space-x-2 p-2 border border-gray-200 bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPublished}
                    onChange={(e) => setEditIsPublished(e.target.checked)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-0"
                  />
                  <span className="text-gray-700 text-[11px]">Published</span>
                </label>
              </div>

              {/* Attached Resources List */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold font-mono text-gray-800">
                    Attached Resources ({editingLesson.lesson.resources.length})
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {editingLesson.lesson.resources.length === 0 ? (
                    <div className="text-[11px] font-mono text-gray-400 p-2 bg-gray-50 border border-dashed border-gray-200 text-center">
                      No files or workflow blueprints attached.
                    </div>
                  ) : (
                    editingLesson.lesson.resources.map((res: LessonResource) => (
                      <div
                        key={res.id}
                        className="flex items-center justify-between p-1.5 bg-gray-50 border border-gray-200 text-xs"
                      >
                        <div className="flex items-center space-x-1.5 truncate max-w-[240px]">
                          <FileCode className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="font-medium text-gray-800 text-[11px] truncate">
                            {res.title}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            .{res.fileFormat.toLowerCase()}
                          </span>
                        </div>
                        {/* Flag Red on Destructive delete action */}
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(res.id)}
                          className="p-1 text-gray-400 hover:text-[#CA3A32] hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Upload Placeholder // TODO(handoff): wire uploads to storage */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleSimulatedFileUpload(e.dataTransfer.files);
                  }}
                  className={`mt-2 p-3 border-2 border-dashed rounded text-center transition-colors ${
                    dragActive ? 'border-gray-900 bg-gray-100' : 'border-gray-300 bg-gray-50/50'
                  }`}
                >
                  <UploadCloud className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-[11px] font-mono text-gray-600">
                    Drag & drop files here, or{' '}
                    <label className="text-gray-900 font-semibold underline cursor-pointer">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleSimulatedFileUpload(e.target.files)}
                      />
                    </label>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    JSON blueprints, ZIP projects, PDF slides
                  </div>
                  {uploading && (
                    <div className="mt-1 text-[11px] font-mono text-emerald-600">
                      Uploading to storage placeholder...
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Save */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-2.5 py-1 text-xs font-mono text-gray-600 hover:text-gray-900 border border-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-mono font-medium bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Lesson Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden lg:flex w-[320px] bg-gray-50 border border-dashed border-gray-300 p-8 flex-col items-center justify-center text-center text-gray-400 text-xs font-mono">
            <Film className="w-8 h-8 text-gray-300 mb-2" />
            <span>Select any lesson to edit metadata, update video ID, or manage blueprint files.</span>
          </div>
        )}
      </div>
    </div>
  );
}
