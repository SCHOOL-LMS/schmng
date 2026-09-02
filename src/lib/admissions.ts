/** Shared constants for the Admissions module (ported from the source system). */

export const ADMISSION_CLASSES = [
  "Creche",
  "Nursery",
  "KG1",
  "KG2",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "JHS1",
  "JHS2",
  "JHS3",
] as const;

export const ADMISSION_GENDERS = ["Male", "Female", "Other"] as const;
export const DISABILITY_STATUS = ["No", "Yes", "Prefer not to say"] as const;
export const TERMS = ["Term 1", "Term 2", "Term 3"] as const;

export interface FieldDef {
  label: string;
  name: string;
  type?: "text" | "date" | "email" | "tel" | "select";
  required?: boolean;
  options?: readonly string[];
  hint?: string;
  conditional?: { field: string; value: string };
}

export interface TabDef {
  title: string;
  fields: FieldDef[];
}

/** The four-step admission form, mirroring the source schema. */
export const ADMISSION_TABS: TabDef[] = [
  {
    title: "Student Info",
    fields: [
      { label: "Student Name", name: "studentName", required: true, hint: "Full legal name." },
      { label: "Date of Birth", name: "dob", type: "date", required: true },
      { label: "Place of Birth", name: "placeOfBirth", required: true },
      {
        label: "Class Admitted To",
        name: "classAdmitted",
        type: "select",
        options: ADMISSION_CLASSES,
        required: true,
      },
      { label: "Name of Previous School (if any)", name: "previousSchool" },
      { label: "Class in Previous School", name: "previousClass" },
      { label: "Last Date of Attendance", name: "lastAttendance", type: "date" },
      { label: "Reason for Leaving (optional)", name: "reasonForLeaving" },
      {
        label: "Disability Status",
        name: "disabilityStatus",
        type: "select",
        options: DISABILITY_STATUS,
        required: true,
      },
      {
        label: "Type of Disability",
        name: "disabilityType",
        required: true,
        conditional: { field: "disabilityStatus", value: "Yes" },
      },
      {
        label: "Assistance Needed",
        name: "assistanceNeeded",
        required: true,
        conditional: { field: "disabilityStatus", value: "Yes" },
      },
      {
        label: "Gender",
        name: "gender",
        type: "select",
        options: ADMISSION_GENDERS,
        required: true,
      },
    ],
  },
  {
    title: "Parent/Guardian Info",
    fields: [
      { label: "Parent/Guardian Name", name: "parentName", required: true },
      { label: "Relationship to Student", name: "relationship", required: true },
      { label: "Phone", name: "parentPhone", type: "tel", required: true, hint: "e.g. 0241234567" },
      { label: "Alternative Contact", name: "altContact" },
      { label: "Hometown", name: "hometown" },
      { label: "District of Hometown", name: "hometownDistrict" },
      { label: "Place of Residence", name: "residence" },
      { label: "District of Residence", name: "residenceDistrict" },
      {
        label: "Parent Email",
        name: "parentEmail",
        type: "email",
        required: true,
        hint: "Used for the parent login and for this child's student login.",
      },
    ],
  },
  {
    title: "Emergency Contact Info",
    fields: [
      { label: "Emergency Contact Name", name: "emergencyName", required: true },
      { label: "Emergency Phone", name: "emergencyPhone", required: true },
      { label: "Emergency Relationship", name: "emergencyRelationship", required: true },
      { label: "Place of Residence", name: "emergencyResidence" },
      { label: "District of Residence", name: "emergencyResidenceDistrict" },
    ],
  },
  {
    title: "Student Residence Info",
    fields: [
      { label: "Address", name: "address", required: true },
      { label: "City", name: "city", required: true },
      { label: "Community/Area", name: "community", required: true },
      { label: "Digital Address", name: "digitalAddress", required: true },
    ],
  },
];

export const ADMISSION_FIELDS = ADMISSION_TABS.flatMap((t) => t.fields);

/** camelCase form key -> snake_case database column. */
export function toColumn(name: string) {
  return name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function money(value: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(value || 0);
}

export function csvEscape(value: unknown) {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
