import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { Receipt } from '../types';

export const createReceipt = async (req: Request, res: Response) => {
  try {
    const {
      item_id,
      user_id,
      quantity,
      defect_quantity = 0,
      location,
      notes,
      status = 'completed',
    } = req.body;

    // Validate required fields
    if (!item_id || !user_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: item_id, user_id, quantity',
      });
    }

    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0',
      });
    }

    // Validate defect_quantity
    if (defect_quantity < 0 || defect_quantity > quantity) {
      return res.status(400).json({
        success: false,
        error: 'Defect quantity must be between 0 and total quantity',
      });
    }

    // Generate receipt number using database function
    const { data: receiptNoData, error: receiptNoError } = await supabase.rpc(
      'generate_receipt_no'
    );

    if (receiptNoError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate receipt number',
        details: receiptNoError.message,
      });
    }

    const receipt_no = receiptNoData;

    // Create receipt
    const { data, error } = await supabase
      .from('receipts')
      .insert([
        {
          receipt_no,
          item_id,
          user_id,
          quantity,
          defect_quantity,
          status,
          location,
          notes,
          received_at: new Date().toISOString(),
        },
      ])
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
        )
      `
      )
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create receipt',
        details: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Receipt created successfully',
    });
  } catch (error) {
    console.error('Error in createReceipt:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
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
          quantity,
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
