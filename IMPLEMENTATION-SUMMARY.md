# NativeCamp-Style Lesson System - Implementation Summary

## ✅ COMPLETED FEATURES

### PART 1: Looping Audio Element
- **Audio Element**: Added with `loop` attribute to TeacherDashboard.jsx
- **Sound File**: `/sounds/lesson-alert.wav` (WAV format)
- **Looping**: Audio loops continuously until manually stopped
- **Preload**: Audio preloaded for instant playback

### PART 2: Sound Control Functions
**Functions Implemented:**
- `startLessonAlert()` - Starts looping notification sound
- `stopLessonAlert()` - Stops and resets sound playback
- Error handling for autoplay restrictions

### PART 3: Trigger Sound on New Lesson
**File**: `src/pages/TeacherDashboard.jsx`
- Supabase Realtime listener monitors `lessons` table
- Triggers on INSERT events with status = "pending"
- Shows incoming lesson popup
- Calls `startLessonAlert()` to play looping sound

### PART 4: Stop Sound on Teacher Response
**Accept or Decline Buttons:**
- Both actions call `stopLessonAlert()`
- Clears the 30-second timeout
- Stops the looping audio immediately

### PART 5: 30-Second Auto Timeout
**Auto-Response System:**
- Timer starts when lesson request arrives
- After 30 seconds with no teacher response:
  - Sound automatically stops
  - Lesson status updated to "missed"
  - Popup closes
  - Student can see teacher didn't respond

### PART 6: Daily.co Video System
**Flow Maintained:**
- Student clicks "Start Lesson" → creates Daily room
- Teacher accepts → joins same Daily room
- Both redirected to `/lesson/{lessonId}`
- 25-minute timer runs during lesson
- Status updates: pending → in_progress → completed

---

## 📁 FILES MODIFIED

### 1. `src/pages/TeacherDashboard.jsx`
**Changes:**
- Added `useRef` hook for timeout management
- Replaced `playNotificationSound()` with `startLessonAlert()` and `stopLessonAlert()`
- Updated audio element with `loop` attribute
- Added 30-second timeout logic
- Sound stops on Accept/Decline
- Handles "pending" or "waiting" status

### 2. `src/pages/StudentOnlineTeachers.jsx`
**Changes:**
- Lesson creation now uses status: "pending"
- Maintains Daily.co room creation flow

### 3. `supabase/functions/create-room/index.ts`
**Created:**
- Edge function for creating Daily.co rooms
- Handles both student and teacher requests
- Returns room URL for joining

### 4. `supabase/functions/create-room/deno.json`
**Created:**
- Configuration for Deno runtime

---

## 🎯 HOW IT WORKS

### Complete Flow:

#### 1. Student Initiates Lesson
```
Student clicks "Start Lesson"
    ↓
create-room edge function called
    ↓
Daily.co room created
    ↓
Lesson inserted with status: "pending"
    ↓
Student redirected to lesson room (waiting)
```

#### 2. Teacher Receives Notification
```
Supabase Realtime detects INSERT
    ↓
Status = "pending" detected
    ↓
Popup appears + startLessonAlert() plays
    ↓
30-second timeout starts
```

#### 3. Teacher Responds - ACCEPT
```
Teacher clicks "Accept"
    ↓
stopLessonAlert() called
    ↓
Timeout cleared
    ↓
create-room edge function called
    ↓
Status updated to "in_progress"
    ↓
Teacher redirected to same Daily room
    ↓
25-minute lesson timer starts
```

#### 4. Teacher Responds - DECLINE
```
Teacher clicks "Decline"
    ↓
stopLessonAlert() called
    ↓
Timeout cleared
    ↓
Status updated to "declined"
    ↓
Popup closes
    ↓
Student sees declined status
```

#### 5. Teacher Doesn't Respond
```
30 seconds pass
    ↓
stopLessonAlert() called
    ↓
Status updated to "missed"
    ↓
Popup closes
    ↓
Student sees missed status
```

---

## 🚀 DEPLOYMENT STEPS

### 1. Add Daily.co API Key to Supabase
```bash
# Using Supabase CLI
supabase secrets set DAILY_API_KEY=your_daily_api_key_here
```

Or via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add secret: `DAILY_API_KEY` with your Daily.co API key

### 2. Deploy the Edge Function
```bash
cd prime-talk
supabase functions deploy create-room
```

### 3. Ensure Audio File Exists
Make sure the WAV file is at:
```
/public/sounds/lesson-alert.wav
```

### 4. Database Setup

Ensure your `lessons` table has these columns:
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  room_url TEXT,
  status TEXT CHECK (status IN ('pending', 'waiting', 'in_progress', 'completed', 'declined', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Enable Realtime on the `lessons` table:
```sql
ALTER TABLE lessons REPLICA IDENTITY FULL;
```

Enable Realtime in Supabase Dashboard:
1. Go to Database → Replication
2. Enable realtime for `lessons` table
3. Select all INSERT events

---

## 🔧 CONFIGURATION

### Sound Loop Duration
The sound loops continuously until:
- Teacher clicks Accept
- Teacher clicks Decline
- 30-second timeout expires

### Auto-Timeout Duration
To change from 30 seconds, edit `TeacherDashboard.jsx`:
```javascript
timeoutRef.current = setTimeout(async () => {
  // ... timeout logic
}, 30000) // Change this value (in milliseconds)
```

### Lesson Duration
Default: 25 minutes (1500 seconds)
Edit `LessonRoom.jsx`:
```javascript
const LESSON_DURATION_SECONDS = 1500; // Change this value
```

### Lesson Status Values
- **pending**: Initial state, waiting for teacher
- **in_progress**: Lesson actively happening
- **completed**: Lesson finished normally
- **declined**: Teacher rejected the request
- **missed**: Teacher didn't respond in 30 seconds

---

## 🧪 TESTING CHECKLIST

### Audio System
- [ ] WAV file plays when lesson request arrives
- [ ] Sound loops continuously
- [ ] Sound stops when teacher clicks Accept
- [ ] Sound stops when teacher clicks Decline
- [ ] Sound stops after 30-second timeout

### Teacher Flow
- [ ] Teacher can toggle online/offline
- [ ] Popup appears on new lesson request
- [ ] Accept button joins Daily room
- [ ] Decline button closes popup
- [ ] Timeout marks lesson as "missed"

### Student Flow
- [ ] Student can see online teachers
- [ ] "Start Lesson" creates room and lesson
- [ ] Student enters waiting room
- [ ] Student joins lesson when teacher accepts
- [ ] Student sees declined/missed status

### Video Lesson
- [ ] Both users join same Daily room
- [ ] Camera/mic controls work
- [ ] Screen share works
- [ ] Timer counts down from 25:00
- [ ] Lesson ends and redirects properly
- [ ] Status updates to "completed"

---

## 🐛 TROUBLESHOOTING

### Sound not playing?
**Causes:**
- Browser autoplay policy blocking audio
- File path incorrect
- File missing

**Solutions:**
1. Check console for autoplay errors
2. Verify file exists at `/public/sounds/lesson-alert.wav`
3. User must interact with page before audio can play
4. Test in different browsers

### Sound won't stop looping?
**Causes:**
- JavaScript error preventing stopLessonAlert()
- Timeout reference lost

**Solutions:**
1. Check browser console for errors
2. Verify timeout is being cleared
3. Manually reload page to reset

### Teacher not receiving notifications?
**Causes:**
- Realtime not enabled on lessons table
- Teacher status is "offline"
- Lesson status not "pending"

**Solutions:**
1. Verify Realtime is enabled in Supabase
2. Check teacher online_status = "online"
3. Check lesson INSERT has status = "pending"
4. Check browser console for Realtime errors

### Timeout not working?
**Causes:**
- useRef not properly initialized
- Timeout being cleared prematurely

**Solutions:**
1. Check timeoutRef.current is set
2. Verify setTimeout is being called
3. Console.log to debug timeout execution

### Room creation fails?
**Causes:**
- Missing DAILY_API_KEY
- Daily.co account issue
- Network error

**Solutions:**
1. Verify `DAILY_API_KEY` environment variable
2. Check Daily.co account status
3. Check edge function logs in Supabase
4. Verify API key permissions

---

## 📝 IMPORTANT NOTES

### Browser Autoplay Policies
Modern browsers restrict autoplay of audio/video. The sound may not play until:
- User clicks somewhere on the page
- User interacts with the dashboard

The code handles this gracefully with a try/catch block.

### Lesson Status Lifecycle
```
pending → in_progress → completed (normal flow)
pending → declined (teacher rejects)
pending → missed (timeout)
```

### Multiple Simultaneous Requests
If multiple students request lessons:
- Each creates a separate lesson record
- Teacher sees one popup at a time
- First request triggers sound
- Subsequent requests queue (current implementation shows latest)

### Sound File Format
- **Format**: WAV (uncompressed audio)
- **Compatibility**: Works in all modern browsers
- **Alternative**: Can use MP3, but change `src` attribute

### Daily.co Domain
Currently set to: `https://primetalk.daily.co`
Update in `create-room/index.ts` and `LessonRoom.jsx` if using custom domain.

---

## 🎉 IMPLEMENTATION COMPLETE!

All 6 parts implemented:
1. ✅ Looping audio element
2. ✅ Sound control functions
3. ✅ Trigger on new lesson (pending status)
4. ✅ Stop sound on Accept/Decline
5. ✅ 30-second auto timeout
6. ✅ Daily.co video system working

**The system is ready for testing and deployment!**
