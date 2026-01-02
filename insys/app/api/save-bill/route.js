import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const { billNumber, pdfBase64 } = await req.json();
    if (!billNumber || !pdfBase64) {
      return new Response(JSON.stringify({ success: false, error: 'missing params' }), { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'bills');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, `${billNumber}.pdf`);
    const buffer = Buffer.from(pdfBase64, 'base64');
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/bills/${billNumber}.pdf`;
    return new Response(JSON.stringify({ success: true, url }), { status: 200 });
  } catch (err) {
    console.error('save-bill error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
