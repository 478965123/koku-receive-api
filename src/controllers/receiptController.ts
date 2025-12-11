import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { Receipt, CreateReceiptRequest, Defect, Photo, Item, User } from '../types';
import { sendReceiptEmail } from '../services/emailService';

export const createReceipt = async (req: Request, res: Response) => {
  try {
    const {
      item_id,
      user_id,
      qr_code,
      quantity,
      location,
      notes,
      defects = [],
      photo_urls = [],
    } = req.body as unknown as CreateReceiptRequest;

    // Validate required fields
    if (!item_id || !user_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: item_id, user_id, quantity',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Quantity must be greater than 0' });
    }

    // Generate Receipt No
    const { data: receiptNoData, error: receiptNoError } = await supabase.rpc('generate_receipt_no');
    if (receiptNoError) throw new Error(receiptNoError.message);
    const receipt_no = receiptNoData;

    // --- Start Transaction Logic (Approximated via Sequential Writes) ---
    // Note: Supabase REST API doesn't support complex multi-table transactions easily without RPC.
    // For reliability in this environment, we will insert Receive -> Then Defects -> Then Photos.
    // In a production setup, an RPC function `create_full_receipt` would be better.

    // 1. Create Receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        receipt_no,
        item_id,
        user_id,
        qr_code,
        quantity,
        location,
        notes,
        status: 'completed'
      })
      .select('*, items(*), users(*)')
      .single();

    if (receiptError) throw receiptError;
    const receiptId = receipt.id;

    // 2. Insert Defects
    let insertedDefects: Defect[] = [];
    if (defects.length > 0) {
      const defectsPayload = defects.map(d => ({
        receipt_id: receiptId,
        defect_type: d.type,
        defect_description: d.description,
        severity: d.severity || 'medium',
        checklist_data: d.checklist
      }));

      const { data: defectData, error: defectError } = await supabase
        .from('defects')
        .insert(defectsPayload)
        .select();

      if (defectError) {
        console.error("Error creating defects, rolling back receipt (manual delete)");
        await supabase.from('receipts').delete().eq('id', receiptId);
        throw defectError;
      }
      insertedDefects = defectData as Defect[];
    }

    // 3. Insert Photos
    let insertedPhotos: Photo[] = [];
    if (photo_urls.length > 0) {
      const photosPayload = photo_urls.map(p => ({
        receipt_id: receiptId,
        photo_url: p.url,
        photo_type: p.type || 'general',
        uploaded_at: new Date().toISOString()
        // If we want to link photos to specific defects, we need index mapping from FE
      }));

      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert(photosPayload)
        .select();

      if (photoError) {
        console.warn("Error creating photos:", photoError);
        // Don't fail the whole transaction for photos, just log it. 
      } else {
        insertedPhotos = photoData as Photo[];
      }
    }

    // 4. Send Email Notification
    // We run this asynchronously so it doesn't block the response time significantly, 
    // OR await it if we want to confirm sending. Let's await to be sure.
    // We already have joined data from step 1 (items, users)

    await sendReceiptEmail({
      receipt: receipt as Receipt,
      item: receipt.items as unknown as Item,
      user: receipt.users as unknown as User,
      defects: insertedDefects,
      photos: insertedPhotos
    });

    return res.status(201).json({
      success: true,
      data: {
        receipt,
        defects: insertedDefects,
        photos: insertedPhotos
      },
      message: 'Receipt created successfully',
    });

  } catch (error: any) {
    console.error('Error in createReceipt:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

export const getReceipts = async (req: Request, res: Response) => {
  try {
    const {
      status,
      item_id,
      user_id,
      start_date,
      end_date,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = supabase
      .from('receipts')
      .select(
        `
        *,
        items:item_id (
          id,
          item_no,
          product_name,
          category
        ),
        users:user_id (
          id,
          employee_code,
          name
        ),
        photos (
          id,
          photo_url,
          photo_type
        ),
        defects (
          id,
          defect_type,
          severity
        )
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (item_id) {
      query = query.eq('item_id', item_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (start_date) {
      query = query.gte('received_at', start_date);
    }

    if (end_date) {
      query = query.lte('received_at', end_date);
    }

    // Apply pagination
    query = query
      .order('received_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch receipts',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total: count,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: count ? Number(offset) + Number(limit) < count : false,
      },
    });
  } catch (error) {
    console.error('Error in getReceipts:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
