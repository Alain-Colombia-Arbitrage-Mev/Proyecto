-- Migration 017: Public storage bucket for lofi audio files
-- Self-hosted audio eliminates dependency on unreliable external streams

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lofi-audio',
  'lofi-audio',
  true,           -- public bucket: audio files served directly via URL
  15728640,       -- 15MB per file (enough for ~10 min MP3 at 192kbps)
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket), only authenticated users can upload
CREATE POLICY "lofi_audio_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'lofi-audio');

CREATE POLICY "lofi_audio_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lofi-audio'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "lofi_audio_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lofi-audio'
    AND auth.role() = 'authenticated'
  );
