import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { email, password } = req.body;

    // ✅ Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // ✅ Fetch user
    const { data, error } = await supabase
      .from('login_users')
      .select('id, email, password, name, role')
      .eq('email', email.trim())
      .single();

    if (error || !data) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // ✅ Password check (plain text for now)
    if (data.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password"
      });
    }

    // ✅ Success response
    return res.status(200).json({
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
}
