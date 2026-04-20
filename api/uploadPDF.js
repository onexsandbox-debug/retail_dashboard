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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  try {

    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024
    });

    form.parse(req, async (err, fields, files) => {

      if (err) {
        return res.status(400).json({ success: false, message: "File error" });
      }

      const file = files.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No file" });
      }

      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, message: "Only PDF allowed" });
      }

      // ✅ Prepare form-data for your API
      const formData = new FormData();
      formData.append("phone_number", process.env.ONEX_PHONE);
      formData.append("file", fs.createReadStream(file.filepath));

      // ✅ Call your API
      const response = await fetch('https://api.onexaura.com/wa/mediaupload', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': process.env.ONEX_API_KEY
        },
        body: formData
      });

      const result = await response.json();

      // ⚠️ Adjust based on actual API response
      const fileUrl = result?.url || result?.data?.url;

      if (!fileUrl) {
        return res.status(500).json({
          success: false,
          message: "URL not returned from API",
          raw: result
        });
      }

      // ✅ Insert into DB
      const { error: dbError } = await supabase
        .from('pdf_uploads')
        .insert([
          {
            file_url: fileUrl
          }
        ]);

      if (dbError) {
        return res.status(500).json({
          success: false,
          message: "DB insert failed",
          error: dbError.message
        });
      }

      return res.status(200).json({
        success: true,
        url: fileUrl
      });

    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
}
