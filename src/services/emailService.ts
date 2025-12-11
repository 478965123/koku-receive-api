import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Receipt, Item, User, Defect, Photo } from '../types';

dotenv.config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail or configure for other SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password if using Gmail
  },
});

interface EmailPayload {
  receipt: Receipt;
  item: Item;
  user: User;
  defects: Defect[];
  photos: Photo[];
}

export const sendReceiptEmail = async (payload: EmailPayload) => {
  try {
    const { receipt, item, user, defects, photos } = payload;

    const defectHtml = defects.length > 0
      ? `
        <h3>รายการสินค้าชำรุด (Defects)</h3>
        <ul>
          ${defects.map(d => `<li><strong>${d.defect_type}:</strong> ${d.defect_description} (${d.severity})</li>`).join('')}
        </ul>
      `
      : '<p><strong>สภาพสินค้า:</strong> ปกติ (No Defects)</p>';

    const photosHtml = photos.length > 0
      ? `
        <h3>รูปภาพประกอบ</h3>
        <p>มีรูปภาพแนบมาทั้งหมด ${photos.length} รูป (ดูได้ในระบบ Backoffice)</p>
      `
      : '';

    const mailOptions = {
      from: `"Receiving System" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || 'admin@example.com', // Get from env or DB
      subject: `[Receiving Alert] Receipt #${receipt.receipt_no} - ${item.product_name}`,
      html: `
        <h2>แจ้งเตือนการรับสินค้า (Receiving Notification)</h2>
        <p>มีการรับสินค้าเข้าสู่ระบบ โดยมีรายละเอียดดังนี้:</p>
        
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>เลขที่เอกสาร:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${receipt.receipt_no}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>พนักงานผู้รับ:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${user.name} (${user.employee_code})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>สินค้า:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.product_name} (${item.item_no})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>จำนวน:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${receipt.quantity} ชิ้น</td>
          </tr>
           <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>สถานที่จัดเก็บ:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${receipt.location || '-'}</td>
          </tr>
        </table>

        ${defectHtml}
        ${photosHtml}

        <p><small>This is an automated message from the Receiving System.</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
