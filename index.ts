import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import ConverterScreen from './app/ConverterScreen';

function App() {
  return (
    <NavigationContainer>
      <ConverterScreen />
    </NavigationContainer>
  );
}

registerRootComponent(App);
