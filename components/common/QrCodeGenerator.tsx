
import React from 'react';
import { View, Text, StyleSheet, Share, Alert, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Share as ShareIcon, Download, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/context/ThemeContext';

interface QrCodeGeneratorProps {
  data: string;
  title?: string;
  subtitle?: string;
  size?: number;
  showShareButton?: boolean;
  showCopyButton?: boolean;
}

export default function QrCodeGenerator({
  data,
  title = "QR Code",
  subtitle,
  size = 200,
  showShareButton = true,
  showCopyButton = true,
}: QrCodeGeneratorProps) {
  const { theme } = useTheme();

  const handleShare = async () => {
    try {
      await Share.share({
        message: data,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(data);
      Alert.alert('Copied', 'QR code data copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      )}
      
      <View style={[styles.qrContainer, { backgroundColor: 'white' }]}>
        <QRCode
          value={data}
          size={size}
          color="black"
          backgroundColor="white"
        />
      </View>
      
      <View style={styles.actions}>
        {showCopyButton && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleCopy}
          >
            <Copy size={20} color="white" />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>
        )}
        
        {showShareButton && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleShare}
          >
            <ShareIcon size={20} color="white" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
