import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  console.log("🚀 API HIT: insertStore");
  console.log("👉 METHOD:", req.method);
  console.log("👉 BODY:", req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Use POST" });
  }

  try {
    const { mobile_number, waba_number } = req.body;

    if (!mobile_number || !waba_number) {
      return res.status(400).json({ success: false });
    }

    const { error } = await supabase
      .from('retail_store_location')
      .insert([{
        mobile_number,
        waba_number,
        module_name: 'store'
      }]);

    if (error) {
      console.log("❌ DB ERROR:", error);
      return res.status(500).json({ success: false });
    }

    console.log("✅ Store inserted");

    return res.status(200).json({
      success: true
    });

  } catch (err) {
    console.log("🔥 ERROR:", err);
    return res.status(500).json({ success: false });
  }
}
