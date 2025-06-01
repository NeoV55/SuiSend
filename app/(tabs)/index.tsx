
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useWallet } from '@/context/WalletContext';
import { useTheme } from '@/context/ThemeContext';
import LinearGradientButton from '@/components/common/LinearGradientButton';
import { CreditCard, Wifi, WifiOff, Radio, Send, Download } from 'lucide-react-native';

export default function HomeScreen() {
  const { wallet, cardMode, setCardMode, appMode, setAppMode, isOnline, pendingTransactions, startNfcListening, stopNfcListening, processPendingTransactions } = useWallet();
  const { theme } = useTheme();
  const [isNfcActive, setIsNfcActive] = useState(false);

  const handleCardModeSelect = async (mode: 'sender' | 'receiver') => {
    await setCardMode(mode);
    Alert.alert(
      'Card Mode Set',
      `Your device is now configured as a ${mode} card. ${
        mode === 'sender' 
          ? 'It works like a Mastercard/Visa - tap to send money.' 
          : 'Tap to receive/pull money from payments.'
      }`
    );
  };

  const handleModeToggle = async () => {
    const newMode = appMode === 'online' ? 'offline' : 'online';
    await setAppMode(newMode);
    
    if (newMode === 'online' && isOnline && pendingTransactions.length > 0) {
      Alert.alert(
        'Pending Transactions',
        `You have ${pendingTransactions.length} pending transactions. Process them now?`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Process', onPress: processPendingTransactions },
        ]
      );
    }
  };

  const handleNfcToggle = async () => {
    try {
      if (isNfcActive) {
        stopNfcListening();
        setIsNfcActive(false);
      } else {
        await startNfcListening();
        setIsNfcActive(true);
        Alert.alert('NFC Active', 'Your device is now ready for NFC transactions.');
      }
    } catch (error) {
      Alert.alert('NFC Error', 'Failed to start NFC. Please check your device settings.');
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#ef4444';
    if (appMode === 'offline') return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = () => {
    if (!isOnline) return 'No Internet Connection';
    if (appMode === 'offline') return 'Offline Mode';
    return 'Online Mode';
  };

  if (!wallet) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Welcome to NFC Payment Wallet
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Create or import a wallet to get started
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Status Header */}
      <View style={[styles.statusHeader, { backgroundColor: theme.surface }]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: theme.text }]}>
            {getStatusText()}
          </Text>
          {isOnline ? <Wifi size={20} color={theme.text} /> : <WifiOff size={20} color={theme.text} />}
        </View>
        
        {pendingTransactions.length > 0 && (
          <Text style={[styles.pendingText, { color: theme.accent }]}>
            {pendingTransactions.length} pending transactions
          </Text>
        )}
      </View>

      {/* Wallet Info */}
      <View style={[styles.walletCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.walletAddress, { color: theme.textSecondary }]}>
          {wallet.address.slice(0, 16)}...{wallet.address.slice(-8)}
        </Text>
        <Text style={[styles.balance, { color: theme.text }]}>
          {(wallet.balance || 0).toFixed(4)} SUI
        </Text>
      </View>

      {/* Card Mode Selection */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          NFC Card Mode
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Choose how your device behaves during NFC transactions
        </Text>

        <View style={styles.cardModeContainer}>
          <TouchableOpacity
            style={[
              styles.modeCard,
              { backgroundColor: theme.background },
              cardMode === 'sender' && { borderColor: theme.accent, borderWidth: 2 }
            ]}
            onPress={() => handleCardModeSelect('sender')}
          >
            <Send size={32} color={cardMode === 'sender' ? theme.accent : theme.textSecondary} />
            <Text style={[styles.modeTitle, { color: theme.text }]}>Sender Card</Text>
            <Text style={[styles.modeDescription, { color: theme.textSecondary }]}>
              Works like Mastercard/Visa. Tap to send payments.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeCard,
              { backgroundColor: theme.background },
              cardMode === 'receiver' && { borderColor: theme.accent, borderWidth: 2 }
            ]}
            onPress={() => handleCardModeSelect('receiver')}
          >
            <Download size={32} color={cardMode === 'receiver' ? theme.accent : theme.textSecondary} />
            <Text style={[styles.modeTitle, { color: theme.text }]}>Receiver Card</Text>
            <Text style={[styles.modeDescription, { color: theme.textSecondary }]}>
              Tap to receive/pull money from payments.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Controls */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Transaction Mode
        </Text>
        
        <View style={styles.controlsContainer}>
          <LinearGradientButton
            title={`Switch to ${appMode === 'online' ? 'Offline' : 'Online'} Mode`}
            onPress={handleModeToggle}
            icon={appMode === 'online' ? <WifiOff size={20} color="white" /> : <Wifi size={20} color="white" />}
            colors={appMode === 'online' ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
          />

          {cardMode && (
            <LinearGradientButton
              title={isNfcActive ? 'Stop NFC Listening' : 'Start NFC Listening'}
              onPress={handleNfcToggle}
              icon={<Radio size={20} color="white" />}
              colors={isNfcActive ? ['#ef4444', '#dc2626'] : ['#6366f1', '#4f46e5']}
            />
          )}
        </View>
      </View>

      {/* Transaction Explanation */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          How It Works
        </Text>
        <Text style={[styles.explanation, { color: theme.textSecondary }]}>
          • <Text style={{ fontWeight: 'bold' }}>Online Mode:</Text> Transactions process immediately when you tap
        </Text>
        <Text style={[styles.explanation, { color: theme.textSecondary }]}>
          • <Text style={{ fontWeight: 'bold' }}>Offline Mode:</Text> Transactions are queued until internet connection is restored
        </Text>
        <Text style={[styles.explanation, { color: theme.textSecondary }]}>
          • <Text style={{ fontWeight: 'bold' }}>QR Fallback:</Text> Use QR codes when NFC is not available
        </Text>
        <Text style={[styles.explanation, { color: theme.textSecondary }]}>
          • Uses Sui blockchain offline signing for secure transactions
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  statusHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  walletCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: 14,
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  cardModeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  controlsContainer: {
    gap: 12,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
