import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getProductSubmissions = async (req: Request, res: Response) => {
  try {
    const {
      employee_id,
      start_date,
      end_date,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = supabase
      .from('product_submissions')
      .select('*', { count: 'exact' });

    // Apply filters
    if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch product submissions',
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
    console.error('Error in getProductSubmissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getProductSubmissionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('product_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Product submission not found',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in getProductSubmissionById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
