/*
  # Add LinkedIn URL to Profiles

  1. Changes
    - Add linkedin_url column to profiles table
    - Add Spanish translation comment
*/

-- Add linkedin_url column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Add Spanish translation
COMMENT ON COLUMN profiles.linkedin_url IS 'URL del perfil de LinkedIn';