import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrsbckwyfkulmbjnrsiq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyc2Jja3d5Zmt1bG1iam5yc2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzg5OTIsImV4cCI6MjA5OTc1NDk5Mn0.dkqzDHdkYzvSYwzP7Sq41ag4sO_3yhbkQxaICYv-Y5A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
