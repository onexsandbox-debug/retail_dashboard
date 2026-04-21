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
    return res.status(405).json({
      success: false,
      message: "Use POST method"
    });
  }

  try {

    // ✅ Increased file size + stable parsing
    const form = formidable({
      multiples: false,
      maxFileSize: 15 * 1024 * 1024, // 15MB
      keepExtensions: true
    });

    form.parse(req, async (err, fields, files) => {

      if (err) {
        console.log("❌ Form parse error:", err);
        return res.status(400).json({
          success: false,
          message: "File parsing failed"
        });
      }

      const uploadedFile = Array.isArray(files.file)
        ? files.file[0]
        : files.file;

      if (!uploadedFile) {
        console.log("❌ No file received");
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      console.log("📄 File:", uploadedFile.originalFilename);
      console.log("📦 Size:", uploadedFile.size);

      // ✅ Robust PDF validation
      const isPDF =
        uploadedFile.mimetype === 'application/pdf' ||
        uploadedFile.originalFilename?.toLowerCase().endsWith('.pdf');

      if (!isPDF) {
        return res.status(400).json({
          success: false,
          message: "Only PDF allowed"
        });
      }

      // ✅ Prepare external API request
      const formData = new FormData();
      formData.append("phone_number", process.env.ONEX_PHONE);

      formData.append("file", fs.createReadStream(uploadedFile.filepath), {
        filename: uploadedFile.originalFilename,
        contentType: 'application/pdf'
      });

      console.log("📡 Calling external API...");

      // ✅ Timeout protection (CRITICAL FIX)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 sec

      const response = await fetch('https://api.onexaura.com/wa/mediaupload', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': process.env.ONEX_API_KEY
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeout);

      const result = await response.json();

      console.log("📥 API RESPONSE:", JSON.stringify(result, null, 2));

      const fileUrl = result?.onextel_media_url;

      if (!fileUrl) {
        console.log("❌ No URL returned");
        return res.status(500).json({
          success: false,
          message: "Upload API failed",
          raw: result
        });
      }

      console.log("✅ URL:", fileUrl);

      // ✅ Insert into DB
      const { error: dbError } = await supabase
        .from('pdf_uploads')
        .insert([
          { file_url: fileUrl }
        ]);

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

    // ✅ Handle timeout specifically
    if (err.name === 'AbortError') {
      return res.status(500).json({
        success: false,
        message: "Upload timeout. Try smaller file or retry."
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
}
