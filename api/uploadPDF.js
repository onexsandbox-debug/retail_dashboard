import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false
  }
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  console.log("🚀 API HIT: uploadPDF");

  if (req.method !== 'POST') {
    console.log("❌ Invalid method:", req.method);
    return res.status(405).json({ success: false });
  }

  try {

    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024
    });

    form.parse(req, async (err, fields, files) => {

      if (err) {
        console.log("❌ Form parse error:", err);
        return res.status(400).json({ success: false });
      }

      const uploadedFile = Array.isArray(files.file)
        ? files.file[0]
        : files.file;

      if (!uploadedFile) {
        console.log("❌ No file received");
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      console.log("📄 File received:", uploadedFile.originalFilename);

      const isPDF =
        uploadedFile.mimetype === 'application/pdf' ||
        uploadedFile.originalFilename?.toLowerCase().endsWith('.pdf');

      if (!isPDF) {
        console.log("❌ Not a PDF");
        return res.status(400).json({ success: false, message: "Only PDF allowed" });
      }

      // ✅ Prepare external API request
      const formData = new FormData();
      formData.append("phone_number", process.env.ONEX_PHONE);
      formData.append("file", fs.createReadStream(uploadedFile.filepath));

      console.log("📡 Calling external API...");

      const response = await fetch('https://api.onexaura.com/wa/mediaupload', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': process.env.ONEX_API_KEY
        },
        body: formData
      });

      const result = await response.json();

      console.log("📥 API RESPONSE:", JSON.stringify(result, null, 2));

      // ✅ FIXED FIELD
      const fileUrl = result?.onextel_media_url;

      if (!fileUrl) {
        console.log("❌ URL not found in response");
        return res.status(500).json({
          success: false,
          message: "URL not returned from API",
          raw: result
        });
      }

      console.log("✅ URL RECEIVED:", fileUrl);

      // ✅ Insert into DB
      const { error: dbError } = await supabase
        .from('pdf_uploads')
        .insert([{ file_url: fileUrl }]);

      if (dbError) {
        console.log("❌ DB ERROR:", dbError);
        return res.status(500).json({
          success: false,
          message: "DB insert failed"
        });
      }

      console.log("✅ DB INSERT SUCCESS");

      return res.status(200).json({
        success: true,
        url: fileUrl
      });

    });

  } catch (err) {
    console.log("🔥 SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}
