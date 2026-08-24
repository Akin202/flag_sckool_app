import React, { useState, useEffect } from 'react';
import { Page, AdminStudent, StudentLessonProgressDetail } from '@/types/index';
import { getAdminStudents } from '@/lib/data-access';
import {
  Search,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Circle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface AdminStudentsPageProps {
  onNavigate: (page: Page) => void;
}

type SortField = 'name' | 'email' | 'progressPercent' | 'lastActive' | 'joinedDate';
type SortOrder = 'asc' | 'desc';

export function AdminStudentsPage({ onNavigate }: AdminStudentsPageProps) {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [alumniFilter, setAlumniFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('joinedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selected student for detail side-panel
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadStudents = () => {
    setLoading(true);
    getAdminStudents({ search, product: productFilter, alumniFilter }).then((data) => {
      setStudents(data);
      setLoading(false);
      // Update selected student if panel is open
      if (selectedStudent) {
        const fresh = data.find((s) => s.id === selectedStudent.id);
        if (fresh) setSelectedStudent(fresh);
      }
    });
  };

  useEffect(() => {
    loadStudents();
  }, [search, productFilter, alumniFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'email') {
      comparison = a.email.localeCompare(b.email);
    } else if (sortField === 'progressPercent') {
      comparison = a.progressPercent - b.progressPercent;
    } else if (sortField === 'joinedDate') {
      comparison = a.joinedDate.localeCompare(b.joinedDate);
    } else if (sortField === 'lastActive') {
      comparison = a.lastActive.localeCompare(b.lastActive);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleExport = () => {
    // TODO(handoff): wire to real export
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Name,Email,Tier,Progress%,LastActive,Joined,IsAlumni']
        .concat(
          students.map(
            (s) =>
              `"${s.id}","${s.name}","${s.email}","${s.tier}",${s.progressPercent},"${s.lastActive}","${s.joinedDate}",${s.isAlumni}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flagskool_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${students.length} student records to CSV.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Students Directory</h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {students.length} registered student accounts & progress records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {exportNotice && (
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              {exportNotice}
            </span>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-gray-900 text-white hover:bg-gray-800 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white font-sans"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 font-mono text-[11px]">Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded py-1 px-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="all">All Products</option>
              <option value="cohort">Live Cohort 2</option>
              <option value="recordings">Recordings Archive</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-gray-500 font-mono text-[11px]">Alumni:</span>
            <select
              value={alumniFilter}
              onChange={(e) => setAlumniFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded py-1 px-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="all">All Status</option>
              <option value="alumni">Alumni Only</option>
              <option value="non-alumni">Standard</option>
            </select>
          </div>

          <button
            onClick={loadStudents}
            title="Refresh List"
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-200"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Students Table & Side Detail Panel Layout */}
      <div className="flex gap-4 items-start">
        {/* Table Container */}
        <div className="flex-1 bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono text-[11px]">
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3 font-medium cursor-pointer hover:text-gray-900 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className="py-2.5 px-3 font-medium cursor-pointer hover:text-gray-900 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email</span>
                      {sortField === 'email' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 font-medium">Enrollments</th>
                  <th
                    onClick={() => handleSort('progressPercent')}
                    className="py-2.5 px-3 font-medium text-right cursor-pointer hover:text-gray-900 select-none"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Progress</span>
                      {sortField === 'progressPercent' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('lastActive')}
                    className="py-2.5 px-3 font-medium cursor-pointer hover:text-gray-900 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Active</span>
                      {sortField === 'lastActive' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('joinedDate')}
                    className="py-2.5 px-3 font-medium cursor-pointer hover:text-gray-900 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Joined</span>
                      {sortField === 'joinedDate' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-mono text-xs">
                      Loading student records...
                    </td>
                  </tr>
                ) : sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-mono text-xs">
                      No students matched your search criteria.
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((s) => {
                    const isSelected = selectedStudent?.id === s.id;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{s.name}</span>
                            {s.isAlumni && (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-200">
                                ALUMNI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-600 text-[11px]">
                          {s.email}
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-[11px] text-gray-700 truncate max-w-[180px]">
                            {s.enrollments.join(', ')}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gray-900 h-1.5"
                                style={{ width: `${s.progressPercent}%` }}
                              />
                            </div>
                            <span className="font-mono text-gray-900 font-semibold w-8 text-right">
                              {s.progressPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                          {s.lastActive}
                        </td>
                        <td className="py-2 px-3 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                          {s.joinedDate}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row click opens a detail panel showing that student's per-lesson progress */}
        {selectedStudent && (
          <div className="w-96 bg-white border border-gray-200 p-4 shrink-0 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <div className="text-xs font-mono uppercase text-gray-500">Student Progress Detail</div>
                <h3 className="text-sm font-semibold text-gray-900">{selectedStudent.name}</h3>
                <div className="text-[11px] text-gray-500 font-mono">{selectedStudent.email}</div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Meta */}
            <div className="grid grid-cols-2 gap-2 py-3 border-b border-gray-200 text-xs font-mono">
              <div className="bg-gray-50 p-2 border border-gray-200">
                <span className="text-gray-500 text-[10px] block">TIER</span>
                <span className="font-semibold text-gray-900 uppercase">{selectedStudent.tier}</span>
              </div>
              <div className="bg-gray-50 p-2 border border-gray-200">
                <span className="text-gray-500 text-[10px] block">COMPLETED</span>
                <span className="font-semibold text-gray-900">
                  {selectedStudent.completedLessonsCount} / {selectedStudent.totalLessonsCount} lessons
                </span>
              </div>
            </div>

            {/* Per-Lesson Progress Breakdown */}
            <div className="mt-3">
              <div className="text-xs font-semibold font-mono text-gray-700 mb-2">
                Lesson Completion Breakdown
              </div>

              {selectedStudent.lessonProgressList.length === 0 ? (
                <div className="py-6 text-center text-gray-400 font-mono text-xs bg-gray-50 border border-gray-200">
                  No active video progress recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {selectedStudent.lessonProgressList.map((lp: StudentLessonProgressDetail) => (
                    <div
                      key={lp.lessonId}
                      className={`p-2 border text-xs ${
                        lp.isCompleted
                          ? 'bg-emerald-50/50 border-emerald-200 text-gray-900'
                          : lp.lastPositionSeconds > 0
                          ? 'bg-amber-50/50 border-amber-200 text-gray-900'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          {lp.isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : lp.lastPositionSeconds > 0 ? (
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                          <span className="font-medium text-[11px] truncate max-w-[170px]">
                            {lp.lessonTitle}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-500">
                          M{lp.moduleNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-gray-500 pl-5">
                        <span>Position: {lp.lastPositionFormatted}</span>
                        {lp.completedAt && <span>Done: {lp.completedAt}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
