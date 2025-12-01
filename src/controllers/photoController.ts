import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    const { receipt_id, photo_type = 'general' } = req.body;
    const file = req.file;

    // Validate required fields
    if (!receipt_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: receipt_id',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Validate photo_type
    const validPhotoTypes = ['general', 'defect', 'label', 'package'];
    if (!validPhotoTypes.includes(photo_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid photo_type. Must be one of: ${validPhotoTypes.join(', ')}`,
      });
    }

    // Verify receipt exists
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('id')
      .eq('id', receipt_id)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `receipts/${receipt_id}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipt-photos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload file to storage',
        details: uploadError.message,
      });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('receipt-photos').getPublicUrl(filePath);

    // Save photo record to database
    const { data: photoData, error: photoError } = await supabase
      .from('photos')
      .insert([
        {
          receipt_id,
          photo_url: publicUrl,
          photo_type,
          file_size: file.size,
          mime_type: file.mimetype,
        },
      ])
      .select()
      .single();

    if (photoError) {
      // Try to delete uploaded file if database insert fails
      await supabase.storage.from('receipt-photos').remove([filePath]);

      return res.status(500).json({
        success: false,
        error: 'Failed to save photo record',
        details: photoError.message,
      });
    }

    return res.status(201).json({
      success: true,
      data: photoData,
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error in uploadPhoto:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
