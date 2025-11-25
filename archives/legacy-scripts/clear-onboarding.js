// Run this in your browser console or add to App.js temporarily
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.removeItem('onboarding_completed').then(() => {
  console.log('Onboarding flag cleared - refresh to see onboarding');
});
