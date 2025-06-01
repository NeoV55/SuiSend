
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, Platform } from 'react-native';
import { QrCode, Scan, Send, DollarSign } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import QrCodeGenerator from '../../components/common/QrCodeGenerator';
import QrCodeScanner from '../../components/common/QrCodeScanner';
import LinearGradientButton from '../../components/common/LinearGradientButton';

export default function QrTransactionsScreen() {
  const { theme } = useTheme();
  const { 
    wallet, 
    cardMode, 
    generateTransactionQr, 
    generatePaymentRequestQr, 
    processQrTransaction,
    isOnline,
    appMode 
  } = useWallet();

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [generatedQr, setGeneratedQr] = useState('');
  const [qrTitle, setQrTitle] = useState('');

  const handleGenerateTransactionQr = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (cardMode === 'sender' && !recipient) {
      Alert.alert('Error', 'Please enter recipient address for sending');
      return;
    }

    try {
      let qrData: string;
      let title: string;

      if (cardMode === 'sender') {
        qrData = generateTransactionQr(parseFloat(amount), recipient);
        title = `Send ${amount} SUI`;
      } else {
        qrData = generatePaymentRequestQr(parseFloat(amount), message);
        title = `Request ${amount} SUI`;
      }

      setGeneratedQr(qrData);
      setQrTitle(title);
      setShowQrGenerator(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const handleScanQr = (data: string) => {
    setShowQrScanner(false);
    
    processQrTransaction(data)
      .then(() => {
        Alert.alert(
          'Success', 
          `Transaction ${appMode === 'online' && isOnline ? 'processed' : 'queued for when online'}`
        );
      })
      .catch((error) => {
        Alert.alert('Error', `Failed to process QR transaction: ${error.message}`);
      });
  };

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 20,
      paddingTop: 60,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    section: {
      margin: 16,
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.background,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    button: {
      flex: 1,
    },
    infoBox: {
      backgroundColor: theme.primaryLight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    infoText: {
      color: theme.text,
      fontSize: 14,
      textAlign: 'center',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 8,
      borderRadius: 6,
      marginBottom: 16,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '500',
    },
  });

  if (!wallet) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Please create or import a wallet first
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QR Transactions</Text>
        <Text style={styles.subtitle}>
          Offline transactions for devices without NFC
        </Text>
      </View>

      <ScrollView>
        {/* Status Indicator */}
        <View style={styles.section}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isOnline ? theme.success : theme.warning }
          ]}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isOnline ? '#10B981' : '#F59E0B'
            }} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {isOnline ? 'Online' : 'Offline'} - {appMode} mode
            </Text>
          </View>
          
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {cardMode === 'sender' 
              ? 'Generate QR codes to send payments or scan to receive'
              : 'Generate payment requests or scan to process payments'
            }
          </Text>
        </View>

        {/* Generate Transaction QR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {cardMode === 'sender' ? 'Send Payment' : 'Request Payment'}
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount (SUI)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {cardMode === 'sender' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Recipient Address</Text>
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor={theme.textSecondary}
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
              />
            </View>
          )}

          {cardMode === 'receiver' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Message (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Payment for..."
                placeholderTextColor={theme.textSecondary}
                value={message}
                onChangeText={setMessage}
              />
            </View>
          )}

          <LinearGradientButton
            title={cardMode === 'sender' ? 'Generate Send QR' : 'Generate Request QR'}
            onPress={handleGenerateTransactionQr}
            icon={<QrCode size={20} color="white" />}
            colors={[theme.primary, theme.primaryDark]}
          />
        </View>

        {/* Scan QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan Transaction QR</Text>
          <Text style={[styles.infoText, { marginBottom: 16, color: theme.textSecondary }]}>
            Scan QR codes from other devices to process transactions
          </Text>
          
          <LinearGradientButton
            title="Scan QR Code"
            onPress={() => setShowQrScanner(true)}
            icon={<Scan size={20} color="white" />}
            colors={[theme.secondary, '#8B5CF6']}
          />
        </View>

        {/* Wallet QR (for sharing) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Wallet</Text>
          <Text style={[styles.infoText, { marginBottom: 16, color: theme.textSecondary }]}>
            Share your wallet address for receiving payments
          </Text>
          
          <QrCodeGenerator
            data={wallet.address}
            title="Wallet Address"
            subtitle={`${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}`}
            size={150}
          />
        </View>
      </ScrollView>

      {/* QR Generator Modal */}
      {showQrGenerator && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={[{ backgroundColor: theme.surface, borderRadius: 12, padding: 20 }]}>
            <QrCodeGenerator
              data={generatedQr}
              title={qrTitle}
              subtitle="Share this QR code to complete the transaction"
              size={200}
            />
            <TouchableOpacity
              style={[{
                backgroundColor: theme.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 16,
              }]}
              onPress={() => setShowQrGenerator(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* QR Scanner Modal */}
      <QrCodeScanner
        isVisible={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScan={handleScanQr}
        title="Scan Transaction QR"
      />
    </View>
  );
}
