import { Capacitor } from '@capacitor/core';

/**
 * Retorna true quando rodando dentro do app iOS/Android nativo.
 * Retorna false no navegador web normal.
 */
export function useNativePlatform() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
  const isIOS = platform === 'ios';

  return { isNative, platform, isIOS };
}
