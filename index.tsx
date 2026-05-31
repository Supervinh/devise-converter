import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import ConverterScreen from './app/ConverterScreen';
import { ThemeProvider } from './constants/theme';

function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <ConverterScreen />
      </NavigationContainer>
    </ThemeProvider>
  );
}

registerRootComponent(App);
