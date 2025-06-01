
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/context/WalletContext';
import { CreditCard, Smartphone, Plus, Radio, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react-native';
import LinearGradientButton from '@/components/common/LinearGradientButton';
import NfcService, { WalletCardData } from '@/services/NfcService';

export default function NfcCardsScreen() {
  const { theme } = useTheme();
  const { wallet } = useWallet();
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [createdCards, setCreatedCards] = useState<WalletCardData[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [selectedCardMode, setSelectedCardMode] = useState<'sender' | 'receiver' | null>(null);
  const [showCardData, setShowCardData] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    initializeNfc();
    return () => {
      NfcService.stop();
    };
  }, []);

  const initializeNfc = async () => {
    setIsInitializing(true);
    try {
      // Wait a bit for the service to fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isSupported = NfcService.isNfcSupported();
      console.log('NFC Support check result:', isSupported);
      
      if (!isSupported) {
        if (Platform.OS === 'ios') {
          Alert.alert(
            'NFC Not Supported',
            'Your iPhone may not support NFC, or NFC capabilities are not enabled in the app configuration. Please ensure:\n\n' +
            '1. You are using iPhone 7 or newer\n' +
            '2. NFC is enabled in phone settings\n' +
            '3. App has proper permissions'
          );
        } else if (Platform.OS === 'android') {
          Alert.alert(
            'NFC Not Supported',
            'NFC appears to be unavailable. Please ensure:\n\n' +
            '1. Your device has NFC hardware\n' +
            '2. NFC is enabled in Settings > Connected Devices\n' +
            '3. App has NFC permissions'
          );
        } else {
          Alert.alert('NFC Not Supported', 'Your device does not support NFC functionality.');
        }
        return;
      }

      const started = await NfcService.start();
      if (started) {
        setIsNfcActive(true);
        console.log('NFC initialized successfully');
        
        // Request permissions explicitly
        const hasPermissions = await NfcService.requestPermissions();
        if (!hasPermissions) {
          Alert.alert(
            'NFC Permissions Required',
            'Please grant NFC permissions to use this feature. You can enable them in your device settings.'
          );
        }
      } else {
        Alert.alert(
          'NFC Initialization Failed',
          Platform.OS === 'ios' 
            ? 'Could not start NFC service. Please check if NFC is enabled in your iPhone settings and the app has proper permissions.'
            : 'Could not start NFC service. Please ensure NFC is enabled in your device settings > Connected Devices.'
        );
      }
    } catch (error) {
      console.error('Failed to initialize NFC:', error);
      Alert.alert('NFC Error', `Failed to initialize NFC: ${error.message || 'Unknown error'}\n\nPlease ensure NFC is enabled in your device settings and the app has proper permissions.`);
    } finally {
      setIsInitializing(false);
    }
  };

  const createNfcCard = async (cardMode: 'sender' | 'receiver') => {
    if (!wallet?.address) {
      Alert.alert('Wallet Required', 'Please create or import a wallet first.');
      return;
    }

    try {
      const cardData = await NfcService.createWalletCard(
        wallet.address,
        cardMode,
        wallet.balance || 0
      );

      setCreatedCards(prev => [...prev, cardData]);

      Alert.alert(
        '🎴 NFC Card Created!',
        `Successfully created ${cardMode} card with ID: ${cardData.id.substring(0, 8)}...\n\nCard Mode: ${cardMode}\nWallet: ${wallet.address.substring(0, 8)}...\n\nYou can now write this card to an NFC tag.`,
        [
          { text: 'Write to NFC Tag', onPress: () => writeCardToNfc(cardData) },
          { text: 'Later', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to create NFC card: ${error.message}`);
    }
  };

  const writeCardToNfc = async (cardData: WalletCardData) => {
    if (!isNfcActive) {
      Alert.alert('NFC Not Active', 'Please ensure NFC is enabled and active.');
      return;
    }

    setIsWriting(true);
    try {
      Alert.alert(
        'Ready to Write',
        'Place an NFC tag near your device to write the wallet card data.',
        [
          { 
            text: 'Start Writing', 
            onPress: async () => {
              try {
                const success = await NfcService.writeWalletToCard(cardData);
                if (success) {
                  Alert.alert('Success!', 'NFC card has been written successfully. You can now use this tag for transactions.');
                } else {
                  Alert.alert('Write Failed', 'Failed to write to NFC tag. Please try again.');
                }
              } catch (error) {
                Alert.alert('Error', `Write failed: ${error.message}`);
              } finally {
                setIsWriting(false);
              }
            }
          },
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsWriting(false)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to initiate write: ${error.message}`);
      setIsWriting(false);
    }
  };

  const readNfcCard = async () => {
    if (!isNfcActive) {
      Alert.alert('NFC Not Active', 'Please ensure NFC is enabled and active.');
      return;
    }

    setIsReading(true);
    try {
      Alert.alert(
        'Ready to Read',
        'Place an NFC tag near your device to read wallet card data.',
        [
          { 
            text: 'Start Reading', 
            onPress: async () => {
              try {
                const cardData = await NfcService.readWalletFromCard();
                if (cardData) {
                  Alert.alert(
                    'Card Read Successfully!',
                    `Card ID: ${cardData.id.substring(0, 8)}...\nMode: ${cardData.cardMode}\nWallet: ${cardData.walletAddress.substring(0, 8)}...\nBalance: ${cardData.balance}\nCreated: ${new Date(cardData.timestamp).toLocaleDateString()}`
                  );
                } else {
                  Alert.alert('No Card Data', 'No valid wallet card data found on this NFC tag.');
                }
              } catch (error) {
                Alert.alert('Error', `Read failed: ${error.message}`);
              } finally {
                setIsReading(false);
              }
            }
          },
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsReading(false)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to initiate read: ${error.message}`);
      setIsReading(false);
    }
  };

  const toggleCardDataVisibility = (cardId: string) => {
    setShowCardData(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
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
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIcon: {
      marginRight: 8,
    },
    cardTypeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      borderWidth: 2,
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
    createdCard: {
      backgroundColor: theme.colors.surface || theme.colors.backgroundLight,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardId: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    cardMode: {
      fontSize: 14,
      color: theme.colors.primary,
      textTransform: 'capitalize',
    },
    cardDetails: {
      marginTop: 8,
    },
    cardDetail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginVertical: 2,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    loadingText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 4,
    },
  });

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Initializing NFC...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>NFC Card Manager</Text>
          <Text style={styles.subtitle}>
            Create, write, and manage NFC wallet cards
          </Text>
        </View>

        {/* NFC Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NFC Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>NFC Support</Text>
            <View style={styles.statusIndicator}>
              {NfcService.isNfcSupported() ? (
                <CheckCircle size={20} color={theme.colors.success} style={styles.statusIcon} />
              ) : (
                <XCircle size={20} color={theme.colors.error} style={styles.statusIcon} />
              )}
              <Text style={[styles.statusText, { 
                color: NfcService.isNfcSupported() ? theme.colors.success : theme.colors.error 
              }]}>
                {NfcService.isNfcSupported() ? 'Supported' : 'Not Supported'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>NFC Active</Text>
            <View style={styles.statusIndicator}>
              {isNfcActive ? (
                <CheckCircle size={20} color={theme.colors.success} style={styles.statusIcon} />
              ) : (
                <XCircle size={20} color={theme.colors.error} style={styles.statusIcon} />
              )}
              <Text style={[styles.statusText, { 
                color: isNfcActive ? theme.colors.success : theme.colors.error 
              }]}>
                {isNfcActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Creation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create New NFC Card</Text>
          
          <TouchableOpacity
            style={styles.cardTypeButton}
            onPress={() => createNfcCard('sender')}
          >
            <CreditCard 
              size={24} 
              color={theme.colors.primary}
              style={styles.cardIcon}
            />
            <View>
              <Text style={styles.cardTypeText}>Create Sender Card</Text>
              <Text style={styles.cardTypeDesc}>
                Acts like a payment card - sends money when tapped
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardTypeButton}
            onPress={() => createNfcCard('receiver')}
          >
            <Smartphone 
              size={24} 
              color={theme.colors.primary}
              style={styles.cardIcon}
            />
            <View>
              <Text style={styles.cardTypeText}>Create Receiver Card</Text>
              <Text style={styles.cardTypeDesc}>
                Acts like a POS terminal - receives money when tapped
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* NFC Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NFC Operations</Text>
          
          <View style={styles.actionButtons}>
            <LinearGradientButton
              onPress={readNfcCard}
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              label={isReading ? 'Reading...' : 'Read NFC Card'}
              disabled={!isNfcActive || isReading}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Created Cards */}
        {createdCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Created Cards ({createdCards.length})</Text>
            
            {createdCards.map((card) => (
              <View key={card.id} style={styles.createdCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardId}>
                      {card.id.substring(0, 8)}...
                    </Text>
                    <Text style={styles.cardMode}>
                      {card.cardMode} card
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleCardDataVisibility(card.id)}>
                    {showCardData[card.id] ? (
                      <EyeOff size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                {showCardData[card.id] && (
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardDetail}>
                      Wallet: {card.walletAddress.substring(0, 20)}...
                    </Text>
                    <Text style={styles.cardDetail}>
                      Balance: {card.balance}
                    </Text>
                    <Text style={styles.cardDetail}>
                      Created: {new Date(card.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <LinearGradientButton
                    onPress={() => writeCardToNfc(card)}
                    colors={[theme.colors.success, '#059669']}
                    label={isWriting ? 'Writing...' : 'Write to NFC'}
                    disabled={!isNfcActive || isWriting}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
