import React from 'react';
import { Redirect } from 'expo-router';

// Preserve existing links without simulating an unverified attendance write.
export default function AttendanceCheckInScreen() {
  return <Redirect href="/school/attendance" />;
}
