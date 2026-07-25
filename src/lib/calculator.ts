export interface AttendanceStats {
  totalLectures: number;      // Attended + Missed + Scheduled + Holiday
  countedLectures: number;    // Attended + Missed
  attendedCount: number;      // Attended
  missedCount: number;        // Missed
  holidayCount: number;       // Holiday
  scheduledCount: number;     // Scheduled
  percentage: number;         // 0 - 100
  targetPercentage: number;   // e.g. 75
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  bunkableClasses: number;    // > 0 if can skip
  mustAttendClasses: number;  // > 0 if must attend
  statusMessage: string;
}

export function calculateAttendance(
  lectures: Array<{ status: string }>,
  targetPercentage: number = 75
): AttendanceStats {
  let attendedCount = 0;
  let missedCount = 0;
  let holidayCount = 0;
  let scheduledCount = 0;

  for (const lec of lectures) {
    switch (lec.status) {
      case 'ATTENDED':
        attendedCount++;
        break;
      case 'MISSED':
      case 'NOT_ATTENDED':
        missedCount++;
        break;
      case 'HOLIDAY':
        holidayCount++;
        break;
      case 'SCHEDULED':
      default:
        scheduledCount++;
        break;
    }
  }

  const totalLectures = lectures.length;
  const countedLectures = attendedCount + missedCount;
  const percentage = countedLectures > 0 
    ? (attendedCount / countedLectures) * 100 
    : 100.0;

  const targetRatio = targetPercentage / 100.0;
  let bunkableClasses = 0;
  let mustAttendClasses = 0;
  let statusMessage = '';
  let status: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';

  if (countedLectures === 0) {
    status = 'SAFE';
    statusMessage = 'No attendance recorded yet. You are on track!';
  } else if (percentage >= targetPercentage) {
    // Can bunk calculation
    bunkableClasses = Math.floor((attendedCount - targetRatio * countedLectures) / targetRatio);
    if (bunkableClasses < 0) bunkableClasses = 0;
    
    if (bunkableClasses === 0) {
      status = 'WARNING';
      statusMessage = `You are on target (${percentage.toFixed(1)}%). You cannot skip the next class.`;
    } else {
      status = 'SAFE';
      statusMessage = `Great job! You can safely skip ${bunkableClasses} class${bunkableClasses > 1 ? 'es' : ''}.`;
    }
  } else {
    // Must attend calculation
    mustAttendClasses = Math.ceil((targetRatio * countedLectures - attendedCount) / (1 - targetRatio));
    if (mustAttendClasses < 0) mustAttendClasses = 0;
    
    status = 'CRITICAL';
    statusMessage = `Attendance alert (${percentage.toFixed(1)}%). You must attend the next ${mustAttendClasses} class${mustAttendClasses > 1 ? 'es' : ''} consecutively.`;
  }

  return {
    totalLectures,
    countedLectures,
    attendedCount,
    missedCount,
    holidayCount,
    scheduledCount,
    percentage: Math.round(percentage * 10) / 10,
    targetPercentage,
    status,
    bunkableClasses,
    mustAttendClasses,
    statusMessage
  };
}
