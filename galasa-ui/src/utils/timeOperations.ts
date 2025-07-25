/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { AmPm } from "./types/common";


export function parseIsoDateTime(isoString: string) {
  // Construct a Date object
  const dt = new Date(isoString);
  let formattedDateTime = "";

  if (isNaN(dt.getTime())) {
    formattedDateTime = "Invalid date";
  } else {

    // Pad helper
    const pad = (n: number) => n.toString().padStart(2, '0');

    // Extract components
    const year = dt.getUTCFullYear();
    const month = pad(dt.getUTCMonth() + 1);
    const day = pad(dt.getUTCDate());
    const hours = pad(dt.getUTCHours());
    const mins = pad(dt.getUTCMinutes());
    const secs = pad(dt.getUTCSeconds());

    const date = `${day}/${month}/${year}`;
    const time = `${hours}:${mins}:${secs}`;

    formattedDateTime = `${date} ${time}`;
  }

  return formattedDateTime;

}


/**
 * Calculates the absolute time difference between two ISO timestamps
 * and formats it as a human-readable string.
 *
 * Examples:
 *   getIsoTimeDifference("2025-05-28T09:07:19Z", "2025-05-28T09:09:43Z")
 *     → "2 mins 24 secs"
 *   getIsoTimeDifference("2025-05-28T06:00:00Z", "2025-05-28T09:52:02Z")
 *     → "3 hrs 52 mins 2 secs"
 *
 * @param startTime - the start time
 * @param endTime - the end time
 * @returns formatted duration string
 */
export function getIsoTimeDifference(startTime: string, endTime: string): string {

  
  let result: string;
  const dt1 = new Date(startTime);
  const dt2 = new Date(endTime);

  // If either parse failed, produce an error message
  if (isNaN(dt1.getTime()) || isNaN(dt2.getTime())) {
    result = "N/A";
  } else {

    const startedAt = Date.parse(startTime);
    const endedAt   = Date.parse(endTime);
    // Compute absolute delta in seconds
    let delta = Math.abs(endedAt - startedAt) / 1000;

    // Break into components
    const hours   = Math.floor(delta / 3600);
    delta         -= hours * 3600;
    const minutes = Math.floor(delta / 60);
    const seconds = Math.round((delta - minutes * 60) * 10) / 10;

    const parts = buildTimeDifference(hours, minutes, seconds);
    result = parts.join(" ");
  }

  return result;
}

const buildTimeDifference = (hours : number, minutes : number, seconds: number) => {

  const parts: string[] = [];

  if (hours   > 0) {
    parts.push(`${hours} hr${hours   !== 1 ? "s" : ""}`);
  } 
  
  if (minutes > 0) {
    parts.push(`${minutes} min${minutes !== 1 ? "s" : ""}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);
  }

  return parts;
};

/**
 *  Combines date, time, AM/PM  parts into a single, accurate Date object.
 * 
 * @param date - The date part as a Date object.
 * @param time - The time part as a string in 'HH:MM' format.
 * @param amPm - The AM/PM part as a string ('AM' or 'PM').
 * 
 * @return A Date object representing the combined date and time.
 */

export const combineDateTime = (date: Date, time: string, amPm: AmPm): Date => {
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (amPm === 'PM' && hours < 12) {
    hours += 12;
  }
  if (amPm === 'AM' && hours === 12) { // Handle midnight case
    hours = 0;
  }
  
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0); // Sets time in the local timezone
  return newDate;
};

/**
 * Extracts the time, AM/PM from a Date object for populating UI fields.
 * 
 * @param date - A Date object to extract date and time from.
 * @returns An object with `time` and `amPm` properties.
 */
export const extractDateTimeForUI = (date: Date) => {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();

  const amPm: AmPm = hours24 >= 12 ? 'PM' : 'AM';

  // Convert 24-hour format to 12-hour format for display
  let hours12 = hours24 % 12;
  if (hours12 === 0) {
    hours12 = 12;
  }

  // Pad hours and minutes with leading zeros to ensure they are always two digits
  const minutesStr = minutes.toString().padStart(2, '0');
  const hoursStr = hours12.toString().padStart(2, '0');

  // Construct the final time string
  const timeValue = `${hoursStr}:${minutesStr}`;

  return {
    time: timeValue,
    amPm: amPm,
  };
};

/**
 * Gets the date and time for "yesterday" at midnight.
 * 
 * @returns A Date object representing yesterday at midnight.
 */
export function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1); 

  // Reset time to midnight
  yesterday.setHours(0, 0, 0, 0); 
  return yesterday;
};

/**
 * Gets the date and time for "two days ago" at midnight.
 * 
 * @returns A Date object representing two days ago at midnight.
 */
export function getAWeekBeforeSubmittedTime(submittedAt: string): string | null {

  let result: string | null;
  const submittedDate = new Date(submittedAt);

  if(isNaN(submittedDate.getTime())) {
    result = null;
  } else {

    const weekBefore = new Date();
    weekBefore.setDate(weekBefore.getDate() - 7); 

    // Reset time to midnight
    weekBefore.setHours(0, 0, 0, 0); 
    result = weekBefore.toISOString();
  
  }

  return result;
};

/**
 * Gets the date and time for "one month ago" at midnight.
 * 
 * @returns A Date object representing one month ago at midnight.
 */
export function getOneMonthAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setHours(0, 0, 0, 0); // Reset time to midnight
  return date.toISOString();
}

/**
 * Accurately adds a number of months to a date, handling end-of-month edge cases.
 * If the original day doesn't exist in the target month, it will use the last valid day.
 * 
 * @param date The starting date.
 * @param months The number of months to add.
 * @returns A new Date object.
 */
export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  const originalDay = newDate.getDate();
  newDate.setMonth(newDate.getMonth() + months);

  if (newDate.getDate() !== originalDay) {
    newDate.setDate(0);
  }

  return newDate;
}


/**
 * Parses a time string and validates it.
 * If the string is a valid time (e.g., "9:5", "14:30"), it returns an object with the hour and minute.
 * Otherwise, it returns null.
 *
 * @param {string} timeString - The string to parse.
 * @returns {{hour: number, minute: number} | null} The parsed time parts or null if invalid.
 */
export const parseAndValidateTime = (timeString: string) => {
  if(!timeString) return null;

  let parsedTime = null;

  // Expecting time in 'HH:MM' format, so splitting into [hours, minutes]
  const TIME_PARTS_EXPECTED = 2;
  // parseInt radix for base-10 numbers
  const DECIMAL_RADIX = 10;
  const parts = timeString.trim().split(':');

  if (parts.length === TIME_PARTS_EXPECTED) {
    
    // Parse hours and minutes as base-10 integers
    const hour = parseInt(parts[0], DECIMAL_RADIX);
    const minute = parseInt(parts[1], DECIMAL_RADIX);

    // Validate hour and minute ranges for 12-hour time
    const isValid = !isNaN(hour) && !isNaN(minute) &&
                    hour >= 0 && hour <= 12 &&
                    minute >= 0 && minute <= 59;

    // If valid, format the time as "HH:MM"
    if (isValid) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      parsedTime = `${formattedHour}:${formattedMinute}`;
    }
  }

  return parsedTime;
};

