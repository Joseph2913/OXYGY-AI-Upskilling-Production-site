import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Download, Check, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import { supabase } from '../../../lib/supabase';

interface CsvUploadModalProps {
  orgId: string;
  orgName: string;
  cohorts: { id: string; name: string }[];
  onClose: () => void;
  onComplete: () => void;
}

interface ParsedRow {
  rowNum: number;
  email: string;
  fullName: string;
  role: string;
  valid: boolean;
  error?: string;
}

interface EnrollResult {
  email: string;
  status: 'enrolled' | 'invited' | 'failed';
  error?: string;
}

type Stage = 'upload' | 'preview' | 'results';

const MAX_ROWS = 200;
const VALID_ROLES = ['learner', 'facilitator', 'admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const font: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

export default function CsvUploadModal({
  orgId,
  orgName,
  cohorts,
  onClose,
  onComplete,
}: CsvUploadModalProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [cohortId, setCohortId] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<EnrollResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- helpers ----

  const downloadTemplate = useCallback(async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'OXYGY';
    const ws = wb.addWorksheet('Enrollment');

    // Define columns with widths
    ws.columns = [
      { header: 'email', key: 'email', width: 36 },
      { header: 'full_name', key: 'full_name', width: 28 },
      { header: 'role', key: 'role', width: 16 },
    ];

    // Style the header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF38B2AC' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF2C9A94' } },
      };
    });

    // Add example rows
    const examples = [
      { email: 'jane.smith@example.com', full_name: 'Jane Smith', role: 'learner' },
      { email: 'mark.jones@example.com', full_name: 'Mark Jones', role: 'facilitator' },
      { email: 'sarah.lee@example.com', full_name: 'Sarah Lee', role: 'admin' },
    ];
    examples.forEach(ex => {
      const row = ws.addRow(ex);
      row.font = { size: 11, color: { argb: 'FFA0AEC0' }, italic: true };
    });

    // Add data validation (dropdown) for the role column — rows 2 to 201 (200 data rows)
    for (let r = 2; r <= 201; r++) {
      ws.getCell(`C${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"learner,facilitator,admin"'],
        showErrorMessage: true,
        errorTitle: 'Invalid Role',
        error: 'Role must be: learner, facilitator, or admin',
        errorStyle: 'stop',
      };
    }

    // Freeze the header row
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // Generate and download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oxygy_enrollment_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const parseQuotedCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const parseCsv = (text: string): ParsedRow[] => {
    // Strip BOM and comment lines (starting with #)
    const cleaned = text.replace(/^\uFEFF/, '');
    const lines = cleaned.split(/\r?\n/).filter((l) => l.trim() !== '' && !l.trim().startsWith('#'));

    if (lines.length < 2) return [];

    // Skip header row
    const dataLines = lines.slice(1);
    const seenEmails = new Set<string>();
    const parsed: ParsedRow[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const fields = parseQuotedCsvLine(dataLines[i]);
      const email = (fields[0] || '').trim().toLowerCase();
      const fullName = (fields[1] || '').trim();
      const role = (fields[2] || '').trim().toLowerCase() || 'learner';
      const rowNum = i + 2; // 1-indexed, header is row 1

      let error: string | undefined;

      if (!email) {
        error = 'Email is required';
      } else if (!EMAIL_REGEX.test(email)) {
        error = 'Invalid email format';
      } else if (seenEmails.has(email)) {
        error = 'Duplicate email in CSV';
      } else if (!VALID_ROLES.includes(role)) {
        error = `Invalid role "${role}" — must be: ${VALID_ROLES.join(', ')}`;
      }

      if (!error) seenEmails.add(email);

      parsed.push({
        rowNum,
        email,
        fullName,
        role,
        valid: !error,
        error,
      });
    }

    return parsed;
  };

  const parseXlsx = async (file: File): Promise<ParsedRow[]> => {
    const wb = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await wb.xlsx.load(buffer);
    const ws = wb.worksheets[0];
    if (!ws) return [];

    const seenEmails = new Set<string>();
    const parsed: ParsedRow[] = [];

    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // skip header
      const email = String(row.getCell(1).value || '').trim().toLowerCase();
      const fullName = String(row.getCell(2).value || '').trim();
      const role = String(row.getCell(3).value || '').trim().toLowerCase() || 'learner';

      if (!email) return; // skip empty rows

      let error: string | undefined;
      if (!EMAIL_REGEX.test(email)) {
        error = 'Invalid email format';
      } else if (seenEmails.has(email)) {
        error = 'Duplicate email';
      } else if (!VALID_ROLES.includes(role)) {
        error = `Invalid role "${role}" — must be: ${VALID_ROLES.join(', ')}`;
      }

      if (!error) seenEmails.add(email);

      parsed.push({ rowNum, email, fullName, role, valid: !error, error });
    });

    return parsed;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setParseError('');
  };

  const handleUploadValidate = async () => {
    if (!file) return;
    setLoading(true);
    setParseError('');

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const parsed = isExcel ? await parseXlsx(file) : parseCsv(await file.text());

      // Filter out example rows (italic placeholder emails)
      const filtered = parsed.filter(r => !r.email.endsWith('@example.com'));

      if (filtered.length === 0) {
        setParseError('No data rows found. Remove the example rows and add your users.');
        setLoading(false);
        return;
      }

      if (filtered.length > MAX_ROWS) {
        setParseError(`File has ${filtered.length} rows. Maximum is ${MAX_ROWS}.`);
        setLoading(false);
        return;
      }

      setRows(filtered);
      setStage('preview');
    } catch {
      setParseError('Failed to read the file. Make sure it is a valid .xlsx or .csv file.');
    }

    setLoading(false);
  };

  const handleEnroll = async () => {
    setLoading(true);
    const validRows = rows.filter((r) => r.valid);
    const users = validRows.map((r) => ({
      email: r.email,
      full_name: r.fullName,
      role: r.role,
    }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      const res = await fetch('/api/admin/bulk-enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ users, orgId, cohortId: cohortId || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResults(
          users.map((u) => ({ email: u.email, status: 'failed' as const, error: data.error || 'Request failed' }))
        );
      } else {
        setResults(data.results || []);
      }
    } catch {
      setResults(
        users.map((u) => ({ email: u.email, status: 'failed' as const, error: 'Network error' }))
      );
    }

    setStage('results');
    setLoading(false);
  };

  // ---- derived ----

  const validCount = rows.filter((r) => r.valid).length;
  const errorCount = rows.filter((r) => !r.valid).length;
  const enrolledCount = results.filter((r) => r.status === 'enrolled').length;
  const invitedCount = results.filter((r) => r.status === 'invited').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  // ---- styles ----

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26,32,44,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    ...font,
  };

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    maxWidth: 620,
    width: '95vw',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...font,
  };

  const header: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...font,
  };

  const headerTitle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: '#1A202C',
    margin: 0,
    ...font,
  };

  const body: React.CSSProperties = {
    padding: 24,
    overflowY: 'auto',
    flex: 1,
    ...font,
  };

  const footer: React.CSSProperties = {
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    ...font,
  };

  const primaryBtn: React.CSSProperties = {
    padding: '9px 18px',
    borderRadius: 24,
    background: '#38B2AC',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    ...font,
  };

  const primaryBtnDisabled: React.CSSProperties = {
    ...primaryBtn,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const secondaryBtn: React.CSSProperties = {
    padding: '9px 18px',
    borderRadius: 24,
    background: '#fff',
    color: '#2D3748',
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    ...font,
  };

  const label: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: 6,
    display: 'block',
    ...font,
  };

  const dropZone: React.CSSProperties = {
    border: '2px dashed #CBD5E0',
    borderRadius: 12,
    padding: '28px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#F7FAFC',
    transition: 'border-color 0.15s',
    ...font,
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    fontSize: 13,
    color: '#2D3748',
    background: '#fff',
    outline: 'none',
    ...font,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    ...font,
  };

  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '2px solid #E2E8F0',
    fontWeight: 600,
    color: '#2D3748',
    fontSize: 12,
    ...font,
  };

  const td: React.CSSProperties = {
    padding: '8px 10px',
    borderBottom: '1px solid #EDF2F7',
    color: '#4A5568',
    fontSize: 13,
    ...font,
  };

  // ---- render helpers ----

  const closeBtn = (
    <button
      onClick={onClose}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        color: '#718096',
        display: 'flex',
      }}
      aria-label="Close"
    >
      <X size={18} />
    </button>
  );

  // ---- stages ----

  const renderUpload = () => (
    <>
      <div style={body}>
        {/* Instructions card */}
        <div style={{
          padding: '14px 16px', borderRadius: 10, marginBottom: 20,
          background: '#F7FAFC', border: '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileSpreadsheet size={16} color="#38B2AC" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', ...font }}>File Format</span>
          </div>
          <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, ...font }}>
            Download the Excel template below, fill in your users, and upload it back. The role column has a dropdown to prevent typos. You can also upload a .csv file.
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 8, ...font }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#2D3748', borderBottom: '1px solid #E2E8F0', ...font }}>Column</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#2D3748', borderBottom: '1px solid #E2E8F0', ...font }}>Required</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#2D3748', borderBottom: '1px solid #E2E8F0', ...font }}>Rules</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 8px', fontSize: 12, color: '#2D3748', fontWeight: 600, borderBottom: '1px solid #F7FAFC', ...font }}>email</td>
                <td style={{ padding: '6px 8px', fontSize: 12, color: '#E53E3E', fontWeight: 600, borderBottom: '1px solid #F7FAFC', ...font }}>Yes</td>
                <td style={{ padding: '6px 8px', fontSize: 11, color: '#718096', borderBottom: '1px solid #F7FAFC', ...font }}>Valid email address, one per row</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontSize: 12, color: '#2D3748', fontWeight: 600, borderBottom: '1px solid #F7FAFC', ...font }}>full_name</td>
                <td style={{ padding: '6px 8px', fontSize: 12, color: '#718096', borderBottom: '1px solid #F7FAFC', ...font }}>No</td>
                <td style={{ padding: '6px 8px', fontSize: 11, color: '#718096', borderBottom: '1px solid #F7FAFC', ...font }}>Display name (email used if blank)</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontSize: 12, color: '#2D3748', fontWeight: 600, ...font }}>role</td>
                <td style={{ padding: '6px 8px', fontSize: 12, color: '#718096', ...font }}>No</td>
                <td style={{ padding: '6px 8px', fontSize: 11, color: '#718096', ...font }}>
                  Must be one of:{' '}
                  {VALID_ROLES.map((r, i) => (
                    <span key={r}>
                      <span style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: 8,
                        background: r === 'admin' ? '#FED7D7' : r === 'facilitator' ? '#FEFCBF' : '#C6F6D5',
                        color: r === 'admin' ? '#9B2C2C' : r === 'facilitator' ? '#975A16' : '#22543D',
                        fontSize: 10, fontWeight: 600, ...font,
                      }}>{r}</span>
                      {i < VALID_ROLES.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                  <span style={{ display: 'block', marginTop: 2, fontSize: 10, color: '#A0AEC0', ...font }}>Defaults to learner if left blank</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: '#A0AEC0', lineHeight: 1.5, ...font }}>
            Max 200 users per upload. New users will receive an invite email automatically.
          </div>
        </div>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={downloadTemplate} style={{ ...secondaryBtn, background: '#E6FFFA', borderColor: '#38B2AC', color: '#2C9A94' }}>
            <Download size={14} /> Download Excel Template
          </button>
          <span style={{ fontSize: 11, color: '#A0AEC0', ...font }}>(.xlsx with role dropdown validation)</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <span style={label}>Upload File</span>
          <div
            style={dropZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={24} color="#A0AEC0" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: '#718096', ...font }}>
              {file ? file.name : 'Click to select an .xlsx or .csv file'}
            </div>
            <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4, ...font }}>
              Accepts Excel (.xlsx) or CSV (.csv)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {cohorts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Cohort (optional)</span>
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              style={selectStyle}
            >
              <option value="">No cohort</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {parseError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#E53E3E',
              fontSize: 13,
              marginTop: 8,
              ...font,
            }}
          >
            <AlertCircle size={14} /> {parseError}
          </div>
        )}
      </div>

      <div style={footer}>
        <button onClick={onClose} style={secondaryBtn}>
          Cancel
        </button>
        <button
          onClick={handleUploadValidate}
          disabled={!file || loading}
          style={!file || loading ? primaryBtnDisabled : primaryBtn}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
          Upload &amp; Validate
        </button>
      </div>
    </>
  );

  const renderPreview = () => (
    <>
      <div style={body}>
        <div
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: '#4A5568',
            display: 'flex',
            gap: 12,
            ...font,
          }}
        >
          <span style={{ color: '#38A169', fontWeight: 600 }}>{validCount} valid</span>
          <span style={{ color: '#E53E3E', fontWeight: 600 }}>{errorCount} errors</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Email</th>
                <th style={th}>Name</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNum}>
                  <td style={td}>{row.rowNum}</td>
                  <td style={td}>{row.email}</td>
                  <td style={td}>{row.fullName}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: row.role === 'admin' ? '#FED7D7' : row.role === 'facilitator' ? '#FEFCBF' : '#C6F6D5',
                      color: row.role === 'admin' ? '#9B2C2C' : row.role === 'facilitator' ? '#975A16' : '#22543D',
                      ...font,
                    }}>{row.role}</span>
                  </td>
                  <td style={td}>
                    {row.valid ? (
                      <span
                        style={{
                          color: '#38A169',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          ...font,
                        }}
                      >
                        <Check size={13} /> Valid
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#E53E3E',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          ...font,
                        }}
                      >
                        <AlertCircle size={13} /> {row.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={footer}>
        <button onClick={() => setStage('upload')} style={secondaryBtn}>
          Back
        </button>
        <button
          onClick={handleEnroll}
          disabled={validCount === 0 || loading}
          style={validCount === 0 || loading ? primaryBtnDisabled : primaryBtn}
        >
          {loading ? <Loader2 size={14} /> : null}
          Enroll {validCount} Users
        </button>
      </div>
    </>
  );

  const renderResults = () => (
    <>
      <div style={body}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 0',
              gap: 12,
            }}
          >
            <Loader2 size={28} color="#38B2AC" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#718096', ...font }}>Enrolling users...</span>
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: 16,
                fontSize: 13,
                color: '#4A5568',
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                ...font,
              }}
            >
              {enrolledCount > 0 && (
                <span style={{ color: '#38A169', fontWeight: 600 }}>{enrolledCount} enrolled</span>
              )}
              {invitedCount > 0 && (
                <span style={{ color: '#38B2AC', fontWeight: 600 }}>{invitedCount} invited</span>
              )}
              {failedCount > 0 && (
                <span style={{ color: '#E53E3E', fontWeight: 600 }}>{failedCount} failed</span>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={th}>Email</th>
                    <th style={th}>Status</th>
                    <th style={th}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td style={td}>{r.email}</td>
                      <td style={td}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 12,
                            color:
                              r.status === 'enrolled'
                                ? '#38A169'
                                : r.status === 'invited'
                                ? '#38B2AC'
                                : '#E53E3E',
                            ...font,
                          }}
                        >
                          {r.status === 'enrolled'
                            ? 'Enrolled'
                            : r.status === 'invited'
                            ? 'Invited'
                            : 'Failed'}
                        </span>
                      </td>
                      <td style={{ ...td, color: '#E53E3E', fontSize: 12 }}>{r.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!loading && (
        <div style={footer}>
          <button
            onClick={() => {
              onComplete();
              onClose();
            }}
            style={primaryBtn}
          >
            Done
          </button>
        </div>
      )}
    </>
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <h3 style={headerTitle}>Bulk Enroll via CSV</h3>
          {closeBtn}
        </div>

        {stage === 'upload' && renderUpload()}
        {stage === 'preview' && renderPreview()}
        {stage === 'results' && renderResults()}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
