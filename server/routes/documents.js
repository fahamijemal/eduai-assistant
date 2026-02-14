const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const Interaction = require('../models/Interaction');

const router = express.Router();

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and add timestamp for uniqueness
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${sanitized}`;
    cb(null, uniqueName);
  },
});

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/**
 * POST /api/documents/upload
 * Upload a PDF document
 */
router.post('/upload', auth, (req, res) => {
  upload.single('document')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 10MB limit' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    try {
      const document = new Document({
        userId: req.userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
      });

      await document.save();

      res.status(201).json({
        message: 'Document uploaded successfully',
        document,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      console.error('Upload error:', error.message);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });
});

/**
 * GET /api/documents
 * Get all documents for the authenticated user
 */
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId })
      .sort({ uploadedAt: -1 });

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error.message);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document (only owner can delete)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete related interactions
    await Interaction.deleteMany({ documentId: document._id });

    // Delete document record
    await Document.deleteOne({ _id: document._id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error.message);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
