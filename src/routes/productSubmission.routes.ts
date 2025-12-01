import { Router } from 'express';
import {
  getProductSubmissions,
  getProductSubmissionById,
} from '../controllers/productSubmissionController';

const router = Router();

/**
 * GET /product-submission
 * Get all product submissions with optional filters
 * Query params: employee_id, start_date, end_date, limit, offset
 */
router.get('/', getProductSubmissions);

/**
 * GET /product-submission/:id
 * Get a single product submission by ID
 */
router.get('/:id', getProductSubmissionById);

export default router;
