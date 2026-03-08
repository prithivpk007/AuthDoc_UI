const db = require("../config/policies.json");

const ARREAR_GRADES = ["U", "RA", "AB", "WD", "FAIL"];

exports.verify = (data) => {
  const { umis_no, subject_grades } = data;

  if (!umis_no) {
    return {
      overall_status: "MISSING",
      reason: "UMIS number not detected from document"
    };
  }

  const record = db[umis_no];

  if (!record) {
    return {
      overall_status: "FLAGGED",
      reason: "UMIS number not found in institutional database"
    };
  }

  const mismatches = [];
  const arrears = [];

  for (const sub of subject_grades) {
    const expected = record.subjects[sub.code];

    if (!expected) {
      mismatches.push({
        subject: sub.code,
        issue: "Subject not present in DB"
      });
      continue;
    }

    if (expected !== sub.grade) {
      mismatches.push({
        subject: sub.code,
        expected,
        found: sub.grade
      });
    }

    if (ARREAR_GRADES.includes(sub.grade)) {
      arrears.push(sub.code);
    }
  }

  if (arrears.length > 0) {
    return {
      overall_status: "FLAGGED",
      reason: "Arrear subjects detected",
      arrears
    };
  }

  if (mismatches.length > 0) {
    return {
      overall_status: "FLAGGED",
      reason: "Subject mismatches found",
      mismatches
    };
  }

  return {
    overall_status: "VERIFIED",
    reason: "All subjects match institutional records and are cleared"
  };
};
