import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const verifyQRCode = async (req: Request, res: Response) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        error: 'QR Code is required',
      });
    }

    // Search for item by item_no (QR Code)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('item_no', qr_code)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      // QR Code ไม่ถูกต้อง - ตรงตาม spec ในเอกสาร
      return res.status(200).json({
        success: true,
        data: {
          valid: false,
          item: null,
          message: 'QR Code ไม่ถูกต้อง หรือสินค้าไม่มีในระบบ',
        },
      });
    }

    // QR Code ถูกต้อง - ตรงตาม spec ในเอกสาร
    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        item: {
          item_id: data.id,
          item_no: data.item_no,
          product_name: data.product_name,
          description: data.description,
          category: data.category,
        },
        message: 'QR Code ถูกต้อง พบสินค้าในระบบ',
      },
    });
  } catch (error) {
    console.error('Error in verifyQRCode:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const { status, category, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('items')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch items',
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
    console.error('Error in getItems:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { item_no, product_name, description, category } = req.body;

    // Validate required fields
    if (!item_no || !product_name) {
      return res.status(400).json({
        success: false,
        error: 'item_no and product_name are required',
      });
    }

    // Check if item_no already exists
    const { data: existingItem } = await supabase
      .from('items')
      .select('item_no')
      .eq('item_no', item_no)
      .single();

    if (existingItem) {
      return res.status(409).json({
        success: false,
        error: 'Item with this item_no already exists',
      });
    }

    // Insert new item
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          item_no,
          product_name,
          description: description || null,
          category: category || null,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create item',
        details: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Item created successfully',
    });
  } catch (error) {
    console.error('Error in createItem:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { item_no, product_name, description, category, status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (item_no !== undefined) updateData.item_no = item_no;
    if (product_name !== undefined) updateData.product_name = product_name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    // If updating item_no, check for duplicates
    if (item_no) {
      const { data: existingItem } = await supabase
        .from('items')
        .select('id')
        .eq('item_no', item_no)
        .neq('id', id)
        .single();

      if (existingItem) {
        return res.status(409).json({
          success: false,
          error: 'Another item with this item_no already exists',
        });
      }
    }

    // Update item
    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update item',
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Item updated successfully',
    });
  } catch (error) {
    console.error('Error in updateItem:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    // Delete item (soft delete by setting status to 'inactive' is recommended)
    // For hard delete, use the following:
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete item',
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data,
    });
  } catch (error) {
    console.error('Error in deleteItem:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
