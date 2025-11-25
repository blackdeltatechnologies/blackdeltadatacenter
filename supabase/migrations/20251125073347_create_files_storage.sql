/*
  # BLACK DELTA DATA CENTER - File Storage System

  1. New Tables
    - `user_files`
      - `id` (uuid, primary key) - Unique identifier for each file record
      - `user_id` (uuid, foreign key to auth.users) - Owner of the file
      - `file_name` (text) - Original name of the uploaded file
      - `file_size` (bigint) - Size of the file in bytes
      - `file_type` (text) - MIME type of the file
      - `storage_path` (text) - Path to the file in storage
      - `uploaded_at` (timestamptz) - When the file was uploaded
      - `updated_at` (timestamptz) - Last modification timestamp

  2. Storage
    - Create a storage bucket called `user-files` for storing uploaded files

  3. Security
    - Enable RLS on `user_files` table
    - Add policy for users to read their own files
    - Add policy for users to insert their own files
    - Add policy for users to update their own files
    - Add policy for users to delete their own files
    - Configure storage policies for user file access
*/

CREATE TABLE IF NOT EXISTS user_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON user_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON user_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON user_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON user_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_uploaded_at ON user_files(uploaded_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );