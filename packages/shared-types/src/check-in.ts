export type CheckInStatusDto = {
  checkedInToday: boolean;
  lastCheckInAt: string | null;
  checkInTimeZone: string | null;
  pointsPerCheckIn: number;
  walletBalance: number | null;
};

export type CheckInResultDto = CheckInStatusDto & {
  pointsAwarded: number;
  alreadyCheckedIn: boolean;
};

export {
  calendarDateKey,
  effectiveCheckInTimeZone,
  hasCheckedInToday,
} from './check-in-calendar';
