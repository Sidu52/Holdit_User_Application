import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import React from 'react';

export default function Index() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
