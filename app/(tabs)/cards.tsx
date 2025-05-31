
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/context/WalletContext';
import { CreditCard, Smartphone, Wifi, WifiOff, Radio, Plus } from 'lucide-react-native';
import LinearGradientButton from '@/components/common/LinearGradientButton';
import NfcService from '@/services/NfcService';

export default function CardsScreen() {
  const { theme } = useTheme();
  const { walletInfo, setCardMode, isOnline, toggleOnlineMode } = useWallet();
  const [isNfcActive, setIsNfcActive] = useState(false);

  const handleSetCardType = (type: 'sender' | 'receiver') => {
    setCardMode(type);
    const explanation = type === 'sender' 
      ? 'This device now acts like a Mastercard/Visa card. When someone taps it, money will be sent FROM your wallet TO theirs. Perfect for making payments.'
      : 'This device now acts like a POS terminal. When someone taps it, money will be pulled FROM their wallet TO yours. Perfect for receiving payments.';
    
    Alert.alert(
      `${type.charAt(0).toUpperCase() + type.slice(1)} Card Mode Active`,
      explanation
    );
  };

  const toggleNfcListening = () => {
    setIsNfcActive(!isNfcActive);
    Alert.alert(
      isNfcActive ? 'NFC Disabled' : 'NFC Enabled',
      isNfcActive ? 'Your device is no longer listening for NFC taps' : 'Your device is now listening for NFC taps'
    );
  };

  const createNfcCard = async () => {
    Alert.alert(
      'Create NFC Card',
      'Use the NFC Cards tab to create and manage your NFC wallet cards with full functionality.',
      [
        { text: 'Go to NFC Cards', onPress: () => {/* Navigation would go here */} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      margin: 20,
      padding: 20,
      backgroundColor: theme.colors.surface || theme.colors.backgroundLight,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    cardTypeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      borderWidth: 2,
    },
    selectedCard: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    unselectedCard: {
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
    cardIcon: {
      marginRight: 12,
    },
    cardTypeText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    cardTypeDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 8,
    },
    statusText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    onlineIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    onlineText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '500',
    },
    nfcSection: {
      margin: 20,
      padding: 20,
      backgroundColor: theme.colors.surface || theme.colors.backgroundLight,
      borderRadius: 12,
    },
    nfcButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginVertical: 8,
    },
    nfcActiveButton: {
      backgroundColor: theme.colors.success,
    },
    nfcInactiveButton: {
      backgroundColor: theme.colors.error,
    },
    nfcButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>NFC Card Configuration</Text>
          <Text style={styles.subtitle}>
            Configure how this device behaves when used as an NFC card
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Type</Text>
          
          <TouchableOpacity
            style={[
              styles.cardTypeButton,
              walletInfo?.cardMode === 'sender' ? styles.selectedCard : styles.unselectedCard
            ]}
            onPress={() => handleSetCardType('sender')}
          >
            <CreditCard 
              size={24} 
              color={walletInfo?.cardMode === 'sender' ? theme.colors.primary : theme.colors.textSecondary}
              style={styles.cardIcon}
            />
            <View>
              <Text style={styles.cardTypeText}>Sender Card</Text>
              <Text style={styles.cardTypeDesc}>
                Acts like a payment card (debit/credit) - sends money when tapped
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cardTypeButton,
              walletInfo?.cardMode === 'receiver' ? styles.selectedCard : styles.unselectedCard
            ]}
            onPress={() => handleSetCardType('receiver')}
          >
            <Smartphone 
              size={24} 
              color={walletInfo?.cardMode === 'receiver' ? theme.colors.primary : theme.colors.textSecondary}
              style={styles.cardIcon}
            />
            <View>
              <Text style={styles.cardTypeText}>Receiver Card</Text>
              <Text style={styles.cardTypeDesc}>
                Acts like a POS terminal - receives money when tapped
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.nfcSection}>
          <Text style={styles.sectionTitle}>NFC Card Management</Text>
          
          <LinearGradientButton
            onPress={createNfcCard}
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            label="Create NFC Card"
            icon={<Plus size={20} color="white" />}
          />

          <Text style={styles.sectionTitle}>NFC Status</Text>
          
          <TouchableOpacity
            style={[
              styles.nfcButton,
              isNfcActive ? styles.nfcActiveButton : styles.nfcInactiveButton
            ]}
            onPress={toggleNfcListening}
          >
            <Radio size={20} color="white" />
            <Text style={styles.nfcButtonText}>
              {isNfcActive ? 'NFC Active - Listening' : 'NFC Inactive - Tap to Enable'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.cardTypeDesc, { marginTop: 12 }]}>
            {isNfcActive 
              ? 'Device is listening for NFC taps and ready to process transactions'
              : 'Enable NFC to start listening for card taps'
            }
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>Online Mode</Text>
            <View style={styles.onlineIndicator}>
              {isOnline ? (
                <Wifi size={20} color={theme.colors.success} />
              ) : (
                <WifiOff size={20} color={theme.colors.error} />
              )}
              <Text 
                style={[
                  styles.onlineText, 
                  { color: isOnline ? theme.colors.success : theme.colors.error }
                ]}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <LinearGradientButton
            onPress={toggleOnlineMode}
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            label={isOnline ? 'Switch to Offline Mode' : 'Switch to Online Mode'}
          />

          <Text style={[styles.cardTypeDesc, { marginTop: 12 }]}>
            {isOnline 
              ? 'Transactions will be processed immediately'
              : 'Transactions will be queued until device comes online'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
