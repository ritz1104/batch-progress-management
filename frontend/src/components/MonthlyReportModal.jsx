import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileDown, 
  Calendar, 
  Trophy, 
  BookOpen, 
  Users, 
  Download,
  Clock,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MonthlyReportModal({
  isOpen,
  onClose,
  batchId,
  month,
  batches = []
}) {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(batchId);
  const [selectedMonth, setSelectedMonth] = useState(month || new Date().toISOString().substring(0, 7));

  useEffect(() => {
    setSelectedBatchId(batchId);
    setSelectedMonth(month || new Date().toISOString().substring(0, 7));
  }, [batchId, month]);

  useEffect(() => {
    async function fetchReport() {
      if (!selectedBatchId || !isOpen) return;
      setLoading(true);
      try {
        const data = await reportApi.getMonthly(selectedBatchId, selectedMonth);
        setReportData(data);
      } catch (err) {
        console.error('Failed to load monthly report:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [selectedBatchId, selectedMonth, isOpen]);

  if (!isOpen) return null;

  // Generate and Download PDF using jsPDF + autoTable
  const handleDownloadPDF = () => {
    if (!reportData) return;
    setDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;

      // Header Brand Banner
      doc.setFillColor(33, 37, 41); // Dark Slate #212529
      doc.rect(0, 0, pageWidth, 54, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('ACADEMY OF ENGINEERING & CURRICULUM OPERATIONS', margin, 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 205, 210);
      doc.text('OFFICIAL MONTHLY BATCH PROGRESS & ATTENDANCE AUDIT REPORT', margin, 45);

      // Report Meta Information Box
      let currentY = 75;
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${reportData.batch.name} (${reportData.batch.code})`, margin, currentY);

      currentY += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(90, 90, 90);
      doc.text(`Track: ${reportData.batch.track}  |  Enrolled Strength: ${reportData.batch.totalStudents} Students`, margin, currentY);

      currentY += 14;
      doc.text(`Co-Instructors: ${reportData.batch.instructor1} & ${reportData.batch.instructor2}  |  Period: ${reportData.reportMeta.monthName}`, margin, currentY);

      // KPI Metric Cards Table
      currentY += 15;
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Average Attendance', 'Avg Daily Present', 'Sessions Held', 'Syllabus Reached', 'Activities/Hackathons']],
        body: [[
          `${reportData.summary.overallAttendanceRate}%`,
          `${reportData.summary.averageDailyPresent} / ${reportData.batch.totalStudents}`,
          `${reportData.summary.totalClassesConducted} Lectures`,
          `${reportData.summary.syllabusCompletedPercentage}% Completed`,
          `${reportData.summary.totalEventsHeld} Events (${reportData.summary.hackathonsCount} Hackathons)`
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: [240, 242, 245],
          textColor: [70, 70, 70],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 10,
          fontStyle: 'bold',
          textColor: [11, 110, 153],
          halign: 'center',
          cellPadding: 6
        }
      });

      // Section 1: Curriculum Progress Table
      currentY = doc.lastAutoTable.finalY + 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text('1. DAILY CURRICULUM PROGRESS & LECTURES LOG', margin, currentY);

      const curriculumRows = reportData.curriculum.map(c => [
        c.date,
        c.topic,
        `${c.syllabusPercentage}%`,
        c.assignments || 'N/A',
        c.loggedBy || 'Lead Trainer'
      ]);

      autoTable(doc, {
        startY: currentY + 8,
        margin: { left: margin, right: margin },
        head: [['Date', 'Topic / Concept Covered', 'Progress', 'Assignment', 'Logged By']],
        body: curriculumRows.length > 0 ? curriculumRows : [['-', 'No curriculum logs recorded for this period', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [11, 110, 153],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: [50, 50, 50]
        },
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 175 },
          2: { cellWidth: 50, halign: 'center' },
          3: { cellWidth: 140 },
          4: { cellWidth: 85 }
        }
      });

      // Section 2: Daily Attendance Counts Log
      currentY = doc.lastAutoTable.finalY + 20;
      if (currentY > pageHeight - 160) {
        doc.addPage();
        currentY = 50;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text('2. DAILY STUDENT ATTENDANCE HEAD-COUNT REGISTER', margin, currentY);

      const attendanceRows = (reportData.attendance.dailyRecords || []).map(a => [
        a.date,
        `${a.totalStudents}`,
        `${a.presentCount}`,
        `${a.absentCount}`,
        `${a.attendanceRate}%`,
        a.loggedBy || 'Trainer',
        a.note || 'Regular Session'
      ]);

      autoTable(doc, {
        startY: currentY + 8,
        margin: { left: margin, right: margin },
        head: [['Date', 'Enrolled Strength', 'Students Present', 'Students Absent', 'Turnout %', 'Recorded By', 'Remarks']],
        body: attendanceRows.length > 0 ? attendanceRows : [['-', '-', '-', '-', '-', '-', 'No attendance logs']],
        theme: 'striped',
        headStyles: {
          fillColor: [15, 123, 108],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: [50, 50, 50]
        },
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 70, halign: 'center' },
          2: { cellWidth: 75, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 65, halign: 'center' },
          4: { cellWidth: 65, halign: 'center' },
          5: { cellWidth: 85 },
          6: { cellWidth: 90 }
        }
      });

      // Section 3: Activities, Events & Hackathons
      currentY = doc.lastAutoTable.finalY + 20;
      if (currentY > pageHeight - 160) {
        doc.addPage();
        currentY = 50;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text('3. ACTIVITIES, WORKSHOPS & HACKATHONS CONDUCTED', margin, currentY);

      const eventRows = (reportData.events || []).map(e => [
        e.date,
        e.title,
        e.type.toUpperCase(),
        e.winnerTeam || (e.deliverables ? `Deliverables: ${e.deliverables}` : 'Completed'),
        `${e.participantsCount} Attendees`
      ]);

      autoTable(doc, {
        startY: currentY + 8,
        margin: { left: margin, right: margin },
        head: [['Date', 'Event / Hackathon Name', 'Type', 'Winner / Outcomes', 'Attendance']],
        body: eventRows.length > 0 ? eventRows : [['-', 'No special events held this month', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [105, 64, 165],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: [50, 50, 50]
        },
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 165 },
          2: { cellWidth: 70 },
          3: { cellWidth: 140 },
          4: { cellWidth: 75, halign: 'center' }
        }
      });

      // Verification Signatures Block (2 Co-Instructors + Senior Leadership)
      currentY = doc.lastAutoTable.finalY + 30;
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 60;
      }

      const colWidth = (pageWidth - margin * 2 - 20) / 3;

      // Col 1: Instructor 1
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, margin + colWidth - 10, currentY);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Primary Instructor', margin, currentY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Signed: ${reportData.batch.instructor1}`, margin, currentY + 24);

      // Col 2: Instructor 2
      const col2X = margin + colWidth + 5;
      doc.line(col2X, currentY, col2X + colWidth - 10, currentY);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Co-Instructor', col2X, currentY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Signed: ${reportData.batch.instructor2}`, col2X, currentY + 24);

      // Col 3: Senior Reviewer
      const col3X = margin + (colWidth * 2) + 10;
      doc.line(col3X, currentY, col3X + colWidth - 10, currentY);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Senior Academic Reviewer', col3X, currentY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Verified: Dr. Vikram Roy (VP)`, col3X, currentY + 24);

      // Page numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `Page ${p} of ${totalPages}  |  Official Batch Progress Audit Report  |  Confidential`,
          pageWidth / 2,
          pageHeight - 20,
          { align: 'center' }
        );
      }

      const cleanBatchCode = (reportData.batch.code || 'BATCH').replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`BatchReport_${cleanBatchCode}_${selectedMonth}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('PDF generation failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-notion-border flex items-center justify-between bg-notion-sidebar/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              PDF
            </div>
            <div>
              <h2 className="font-semibold text-sm text-notion-text">
                Monthly Batch Progress & Attendance Audit Studio
              </h2>
              <p className="text-[11px] text-notion-muted">
                Executive month-end report with curriculum log, daily attendance headcounts, and hackathons.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-notion-border bg-white text-notion-text focus:outline-none"
            >
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.code} - {b.name.substring(0, 24)}...</option>
              ))}
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-notion-border bg-white text-notion-text focus:outline-none"
            />

            <button
              onClick={handleDownloadPDF}
              disabled={loading || downloading || !reportData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              title="Download High-Resolution PDF Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Compiling PDF...' : 'Download Official PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-notion-hover rounded-md text-notion-muted hover:text-notion-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Interactive Preview Pane */}
        <div className="p-8 overflow-y-auto flex-1 bg-stone-100/60 text-xs">
          {loading ? (
            <div className="py-20 text-center text-notion-muted">
              <div className="animate-spin w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full mx-auto mb-2"></div>
              <span>Compiling monthly report data...</span>
            </div>
          ) : !reportData ? (
            <div className="py-20 text-center text-notion-muted">
              No report data available for this batch and month.
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-notion-border max-w-3xl mx-auto space-y-6">
              {/* Document Header */}
              <div className="border-b border-notion-border pb-4 flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    Official Executive Report
                  </div>
                  <h1 className="text-xl font-bold text-stone-900 mt-1">
                    {reportData.batch.name}
                  </h1>
                  <div className="text-xs text-stone-600 mt-1">
                    Track: <span className="font-medium text-stone-800">{reportData.batch.track}</span> • Batch Code: <span className="font-mono">{reportData.batch.code}</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    Co-Instructors: <strong>{reportData.batch.instructor1}</strong> & <strong>{reportData.batch.instructor2}</strong>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="inline-block px-2.5 py-1 rounded bg-stone-100 font-semibold text-stone-800 border border-stone-200">
                    {reportData.reportMeta.monthName}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    Audited by: {user?.name || 'Academic Board'}
                  </div>
                </div>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-lg border border-notion-border">
                <div>
                  <div className="text-[11px] text-stone-500">Overall Attendance</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    {reportData.summary.overallAttendanceRate}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500">Avg Daily Turnout</div>
                  <div className="text-lg font-bold text-stone-800 mt-0.5">
                    {reportData.summary.averageDailyPresent} / {reportData.batch.totalStudents}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500">Syllabus Progress</div>
                  <div className="text-lg font-bold text-blue-700 mt-0.5">
                    {reportData.summary.syllabusCompletedPercentage}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500">Hackathons & Events</div>
                  <div className="text-lg font-bold text-purple-700 mt-0.5">
                    {reportData.summary.totalEventsHeld} Events
                  </div>
                </div>
              </div>

              {/* Section 1: Curriculum Progress Table */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Daily Curriculum Progress Log</span>
                </h3>
                <div className="overflow-x-auto border border-notion-border rounded-md">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-notion-border text-stone-600 text-[11px]">
                      <tr>
                        <th className="py-2 px-3 w-24">Date</th>
                        <th className="py-2 px-3">Topic Covered</th>
                        <th className="py-2 px-3 w-20 text-center">Progress</th>
                        <th className="py-2 px-3">Assignment Given</th>
                        <th className="py-2 px-3 w-28">Logged By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-notion-border">
                      {reportData.curriculum.map((c, i) => (
                        <tr key={i} className="hover:bg-stone-50/50">
                          <td className="py-2 px-3 font-mono text-stone-500">{c.date}</td>
                          <td className="py-2 px-3 font-medium text-stone-900">{c.topic}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-600">{c.syllabusPercentage}%</td>
                          <td className="py-2 px-3 text-stone-600">{c.assignments || '—'}</td>
                          <td className="py-2 px-3 text-stone-600">{c.loggedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Daily Attendance Count Table */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Daily Attendance Counts ({reportData.attendance.dailyRecords?.length || 0} Sessions)</span>
                </h3>
                <div className="overflow-x-auto border border-notion-border rounded-md">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-notion-border text-stone-600 text-[11px]">
                      <tr>
                        <th className="py-2 px-3 w-24">Date</th>
                        <th className="py-2 px-3 text-center">Enrolled</th>
                        <th className="py-2 px-3 text-center">Present</th>
                        <th className="py-2 px-3 text-center">Absent</th>
                        <th className="py-2 px-3 text-center">Turnout %</th>
                        <th className="py-2 px-3">Recorded By</th>
                        <th className="py-2 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-notion-border">
                      {(reportData.attendance.dailyRecords || []).map((a, i) => (
                        <tr key={i} className="hover:bg-stone-50/50">
                          <td className="py-1.5 px-3 font-mono text-stone-600">{a.date}</td>
                          <td className="py-1.5 px-3 text-center font-mono">{a.totalStudents}</td>
                          <td className="py-1.5 px-3 text-center font-mono font-bold text-emerald-800">{a.presentCount}</td>
                          <td className="py-1.5 px-3 text-center font-mono text-rose-600">{a.absentCount}</td>
                          <td className="py-1.5 px-3 text-center font-mono font-bold">{a.attendanceRate}%</td>
                          <td className="py-1.5 px-3 text-stone-700">{a.loggedBy}</td>
                          <td className="py-1.5 px-3 text-stone-500">{a.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Activities & Hackathons */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-purple-600" />
                  <span>3. Hackathons & Activities Conducted</span>
                </h3>
                <div className="space-y-2">
                  {(reportData.events || []).map((e, idx) => (
                    <div key={idx} className="p-3 rounded-md bg-stone-50 border border-notion-border text-xs flex items-center justify-between">
                      <div>
                        <div className="font-medium text-stone-900">{e.title}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Date: {e.date} • Type: <span className="capitalize">{e.type}</span> • Venue: {e.venueOrLink}
                        </div>
                      </div>
                      <div className="text-right">
                        {e.winnerTeam && (
                          <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            🏆 {e.winnerTeam}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-notion-border grid grid-cols-3 gap-6 text-xs">
                <div>
                  <div className="border-b border-stone-300 pb-6 text-stone-400 italic">
                    [Signature on file]
                  </div>
                  <div className="font-semibold text-stone-800 mt-2">
                    {reportData.batch.instructor1}
                  </div>
                  <div className="text-[11px] text-stone-500">Primary Instructor</div>
                </div>

                <div>
                  <div className="border-b border-stone-300 pb-6 text-stone-400 italic">
                    [Signature on file]
                  </div>
                  <div className="font-semibold text-stone-800 mt-2">
                    {reportData.batch.instructor2}
                  </div>
                  <div className="text-[11px] text-stone-500">Co-Instructor</div>
                </div>

                <div>
                  <div className="border-b border-stone-300 pb-6 text-stone-400 italic">
                    [Verified & Approved]
                  </div>
                  <div className="font-semibold text-stone-800 mt-2">Dr. Vikram Roy</div>
                  <div className="text-[11px] text-stone-500">VP of Academics</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
