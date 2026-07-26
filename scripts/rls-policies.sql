-- ============================================================
-- AttendIQ — Row Level Security Policies
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. Enable RLS on all business tables ─────────────────────
ALTER TABLE "Semester"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimetableSlot"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LectureInstance" ENABLE ROW LEVEL SECURITY;


-- ── 2. Semester policies ──────────────────────────────────────
CREATE POLICY "Users can view their own semesters"
  ON "Semester" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own semesters"
  ON "Semester" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own semesters"
  ON "Semester" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own semesters"
  ON "Semester" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ── 3. Subject policies ───────────────────────────────────────
CREATE POLICY "Users can view their own subjects"
  ON "Subject" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own subjects"
  ON "Subject" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own subjects"
  ON "Subject" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own subjects"
  ON "Subject" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ── 4. TimetableSlot policies ─────────────────────────────────
CREATE POLICY "Users can view their own timetable slots"
  ON "TimetableSlot" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own timetable slots"
  ON "TimetableSlot" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own timetable slots"
  ON "TimetableSlot" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own timetable slots"
  ON "TimetableSlot" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ── 5. LectureInstance policies ───────────────────────────────
CREATE POLICY "Users can view their own lecture instances"
  ON "LectureInstance" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own lecture instances"
  ON "LectureInstance" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own lecture instances"
  ON "LectureInstance" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own lecture instances"
  ON "LectureInstance" FOR DELETE
  USING (auth.uid()::text = "userId");
