import fs from 'fs';
import { Document } from '../models/Document.js';
import { extractTextFromPdf } from '../services/pdfService.js';

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const doc = await Document.create({
      userId: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
    });

    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const docs = await Document.find({ userId: req.user._id })
      .sort({ uploadedAt: -1 })
      .select('-filePath');
    res.json({ documents: docs });
  } catch (err) {
    next(err);
  }
}

export async function getDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentText(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const text = await extractTextFromPdf(doc.filePath);
    res.json({ text });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Remove file from disk
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await Document.deleteOne({ _id: doc._id });

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
}
