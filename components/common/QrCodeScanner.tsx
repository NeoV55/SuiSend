import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface QrCodeScannerProps {
  isVisible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

export default function QrCodeScanner({
  isVisible,
  onClose,
  onScan,
  title = "Scan QR Code"
}: QrCodeScannerProps) {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    if (isVisible) {
      getBarCodeScannerPermissions();
    }
  }, [isVisible]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      onScan(data);
      setTimeout(() => {
        setScanned(false);
        onClose();
      }, 100);
    }
  };

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.text, { color: theme.text }]}>
            No access to camera
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.overlay}>
            <View style={styles.scanArea} />
            <Text style={[styles.instructionText, { color: 'white' }]}>
              Position QR code within the frame
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.primary }]}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeIcon: {
    padding: 4,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instructionText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  closeButton: {
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});