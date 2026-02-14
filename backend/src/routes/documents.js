import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentText,
  deleteDocument,
} from '../controllers/documentController.js';

const router = Router();

// All document routes require authentication
router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', listDocuments);
router.get('/:id', getDocument);
router.get('/:id/text', getDocumentText);
router.delete('/:id', deleteDocument);

export default router;
