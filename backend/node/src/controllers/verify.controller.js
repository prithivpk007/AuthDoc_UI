const { randomUUID } = require("crypto");
const store = require("../store/documentStore");
const { sendToOCR } = require("../services/pythonClient");
const { verify } = require("../services/verifier.service");

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function safeVerification(data) {
  if (!data || typeof data !== "object") {
    return {
      overall_status: "MISSING",
      reason: "Document data not available"
    };
  }

  try {
    return verify(data);
  } catch (err) {
    console.error("Verification failed:", err.message);
    return {
      overall_status: "FLAGGED",
      reason: "Verification engine error"
    };
  }
}

/* ------------------------------------------------------------------ */
/* Single document ingest                                             */
/* ------------------------------------------------------------------ */

exports.ingest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const document_id = randomUUID();

    let extracted = {};

    try {
      extracted = await sendToOCR(req.file);
    } catch (err) {
      console.error("OCR failed:", err.message);
    }

    store.save(document_id, extracted);

    return res.status(201).json({
      document_id
    });

  } catch (err) {
    console.error("Ingest error:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

/* ------------------------------------------------------------------ */
/* Batch document ingest                                              */
/* ------------------------------------------------------------------ */

exports.ingestBatch = async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const documents = [];

    for (const file of req.files) {
      const document_id = randomUUID();
      let extracted = {};

      try {
        extracted = await sendToOCR(file);
      } catch (err) {
        console.error("OCR failed:", err.message);
      }

      store.save(document_id, extracted);

      documents.push({ document_id });
    }

    return res.status(201).json({
      count: documents.length,
      documents
    });

  } catch (err) {
    console.error("Batch ingest error:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

/* ------------------------------------------------------------------ */
/* Verify single document                                             */
/* ------------------------------------------------------------------ */

exports.verifySingle = (req, res) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({
        error: "document_id is required"
      });
    }

    const data = store.get(document_id);

    if (!data) {
      return res.status(404).json({
        error: "Document not found"
      });
    }

    const verification = safeVerification(data);

    return res.json({
      document_id,
      student_name: data.student_name || null,
      umis_no: data.umis_no || null,
      subject_grades: data.subject_grades || [],
      verification
    });

  } catch (err) {
    console.error("Verify single error:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

/* ------------------------------------------------------------------ */
/* Verify batch documents (SUMMARY view)                              */
/* ------------------------------------------------------------------ */

exports.verifyBatch = (req, res) => {
  try {
    const { document_ids } = req.body;

    if (!document_ids || !Array.isArray(document_ids)) {
      return res.status(400).json({
        error: "document_ids must be an array"
      });
    }

    const candidates = document_ids.map(id => {
      const data = store.get(id);

      if (!data) {
        return {
          document_id: id,
          student_name: null,
          umis_no: null,
          overall_status: "MISSING"
        };
      }

      const verification = safeVerification(data);

      return {
        document_id: id,
        student_name: data.student_name || null,
        umis_no: data.umis_no || null,
        overall_status: verification.overall_status
      };
    });

    return res.json({ candidates });

  } catch (err) {
    console.error("Verify batch error:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};
