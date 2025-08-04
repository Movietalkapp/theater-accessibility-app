// src/hooks/useBleCueListener.ts
import { useEffect, useRef } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';


export function useBleCueListener(
  cueCallback: (cueId: string) => void,
  enabled: boolean,
  targetUuid?: string
) {
  const managerRef = useRef<BleManager | null>(null);

  useEffect(() => {
    if (!enabled || !targetUuid) return;

    const manager = new BleManager();
    managerRef.current = manager;

    const requestPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      }
    };

    requestPermissions().then(() => {
      console.log(`🔍 Börjar scanna efter BLE-enheter med UUID=${targetUuid}`);

      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('BLE-scan error:', error);
          return;
        }

        const mfgData = device.manufacturerData;
        if (mfgData) {
          try {
            const hexString = Buffer.from(mfgData, 'base64').toString('hex');

            // UUID = 16 bytes, hoppa över första 8 hex-tecknen (4C00 0215)
            const uuid = hexString.slice(8, 40).match(/.{1,4}/g)?.join('-') ?? '';

            if (uuid.toLowerCase() === targetUuid.toLowerCase()) {
              // Major = 2 bytes direkt efter UUID
              const major = parseInt(hexString.slice(40, 44), 16);
              // Minor = 2 bytes direkt efter Major
              const minor = parseInt(hexString.slice(44, 48), 16);

              const cueId = `${major}.${minor}`;
              console.log(`📡 Beacon match! UUID=${uuid} Major=${major} Minor=${minor}`);
              cueCallback(cueId);
            }
          } catch (err) {
            console.error('Parse error:', err);
          }
        }
      }); // ← Här stänger vi startDeviceScan-callbacken
    });

    return () => {
      console.log('🛑 Stoppar BLE-scan');
      manager.stopDeviceScan();
      manager.destroy();
    };
  }, [enabled, cueCallback, targetUuid]);
}
