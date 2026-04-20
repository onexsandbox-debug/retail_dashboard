import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  console.log("🚀 API HIT: getLatestPDF");

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {

    // ✅ Fetch latest uploaded file
    const { data, error } = await supabase
      .from('pdf_uploads')
      .select('file_url, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.log("❌ DB ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "DB fetch failed"
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No uploads found"
      });
    }

    console.log("✅ Latest File:", data.file_url);

    return res.status(200).json({
      success: true,
      file_url: data.file_url,
      created_at: data.created_at
    });

  } catch (err) {
    console.log("🔥 SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}
