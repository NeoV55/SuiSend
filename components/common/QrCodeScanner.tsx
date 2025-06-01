
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { X, QrCode } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

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
      setScanned(false);
    }
  }, [isVisible]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    onScan(data);
  };

  if (hasPermission === null) {
    return (
      <Modal visible={isVisible} transparent animationType="slide">
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.text, { color: theme.text }]}>
            Requesting camera permission...
          </Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={isVisible} transparent animationType="slide">
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.text, { color: theme.text }]}>
            Camera permission is required to scan QR codes
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View style={styles.overlay}>
            <View style={styles.scanArea} />
          </View>
          
          <View style={[styles.instructions, { backgroundColor: theme.surface }]}>
            <QrCode size={24} color={theme.primary} />
            <Text style={[styles.instructionText, { color: theme.text }]}>
              Position the QR code within the frame
            </Text>
          </View>
        </View>
        
        {scanned && (
          <View style={[styles.footer, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
  },
  footer: {
    padding: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
