import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';

/**
 * Restock a defect item by removing it from defects table
 * and reducing defect_quantity on the related receipt.
 */
export const restockDefect = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Defect id is required',
    });
  }

  try {
    // 1) Fetch defect detail
    const { data: defect, error: defectError } = await supabase
      .from('defects')
      .select('id, receipt_id, quantity')
      .eq('id', id)
      .single();

    if (defectError || !defect) {
      return res.status(404).json({
        success: false,
        error: 'Defect not found',
        details: defectError?.message,
      });
    }

    // 2) Fetch related receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('id, defect_quantity, quantity')
      .eq('id', defect.receipt_id)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({
        success: false,
        error: 'Related receipt not found',
        details: receiptError?.message,
      });
    }

    const newDefectQuantity = Math.max((receipt.defect_quantity || 0) - (defect.quantity || 0), 0);

    // 3) Update receipt defect_quantity
    const { error: updateReceiptError } = await supabase
      .from('receipts')
      .update({
        defect_quantity: newDefectQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', receipt.id);

    if (updateReceiptError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update receipt defect quantity',
        details: updateReceiptError.message,
      });
    }

    // 4) Remove defect record
    const { error: deleteDefectError } = await supabase
      .from('defects')
      .delete()
      .eq('id', defect.id);

    if (deleteDefectError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to remove defect record',
        details: deleteDefectError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Restocked successfully',
      data: {
        defectId: defect.id,
        receiptId: receipt.id,
        defectReducedBy: defect.quantity,
        defectQuantity: newDefectQuantity,
      },
    });
  } catch (error) {
    console.error('Error in restockDefect:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
