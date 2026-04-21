import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: { bodyParser: false }
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  console.log("🚀 API HIT: uploadPDF");
  console.log("👉 METHOD:", req.method);

  if (req.method !== 'POST') {
    console.log("❌ Invalid method");
    return res.status(405).json({ success: false, message: "Use POST" });
  }

  try {

    const form = formidable({
      maxFileSize: 15 * 1024 * 1024,
      keepExtensions: true
    });

    form.parse(req, async (err, fields, files) => {

      if (err) {
        console.log("❌ FORM PARSE ERROR:", err);
        return res.status(400).json({
          success: false,
          message: "File parsing failed"
        });
      }

      console.log("📦 FILES RECEIVED:", files);

      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        console.log("❌ No file found in request");
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      console.log("📄 File name:", file.originalFilename);
      console.log("📄 MIME:", file.mimetype);
      console.log("📄 Size:", file.size);

      const isPDF =
        file.mimetype === 'application/pdf' ||
        file.originalFilename?.toLowerCase().endsWith('.pdf');

      if (!isPDF) {
        console.log("❌ File validation failed (not PDF)");
        return res.status(400).json({
          success: false,
          message: "Only PDF allowed"
        });
      }

      // 🔥 Prepare external API request
      const formData = new FormData();
      formData.append("phone_number", process.env.ONEX_PHONE);

      formData.append("file", fs.createReadStream(file.filepath), {
        filename: file.originalFilename,
        contentType: 'application/pdf'
      });

      console.log("📡 Calling external API...");

      const response = await fetch('https://api.onexaura.com/wa/mediaupload', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': process.env.ONEX_API_KEY
        },
        body: formData
      });

      console.log("📡 External API status:", response.status);

      const result = await response.json();

      console.log("📥 External API response:", JSON.stringify(result, null, 2));

      const fileUrl = result?.onextel_media_url;

      if (!fileUrl) {
        console.log("❌ URL not returned from API");
        return res.status(500).json({
          success: false,
          message: "Upload API failed"
        });
      }

      console.log("✅ URL received:", fileUrl);

      // 🔥 Insert into DB
      console.log("📡 Inserting into DB...");

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
      message: err.message || "Server error"
    });
  }
}
