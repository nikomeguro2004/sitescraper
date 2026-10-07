import { createClient } from "@supabase/supabase-js";

// Make sure to set these in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveLeadAndReport(data: {
  name: string;
  phone: string;
  website: string;
  reportData?: Record<string, unknown>;
}) {
  try {
    const { error } = await supabase.from("website_audits").insert([
      {
        name: data.name,
        phone: data.phone,
        website: data.website,
        report_data: data.reportData,
        created_at: new Date().toISOString(),
      },
    ]);
    
    if (error) {
      console.error("Error saving lead to Supabase:", error);
    }
  } catch (err) {
    console.error("Failed to save to Supabase:", err);
  }
}
