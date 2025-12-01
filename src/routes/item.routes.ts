import { Router } from 'express';
import {
  verifyQRCode,
  getItems,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/itemController';

const router = Router();

/**
 * POST /item/verify-qr
 * Verify if QR code exists in the system
 * Body: { qr_code: string }
 */
router.post('/verify-qr', verifyQRCode);

/**
 * GET /item
 * Get all items with optional filters
 * Query params: status, category, limit, offset
 */
router.get('/', getItems);

/**
 * POST /item
 * Create a new item
 * Body: { item_no: string, product_name: string, description?: string, category?: string }
 */
router.post('/', createItem);

/**
 * PUT /item/:id
 * Update an existing item
 * Params: id (item UUID)
 * Body: { item_no?: string, product_name?: string, description?: string, category?: string, status?: string }
 */
router.put('/:id', updateItem);

/**
 * DELETE /item/:id
 * Delete an item
 * Params: id (item UUID)
 */
router.delete('/:id', deleteItem);

export default router;
