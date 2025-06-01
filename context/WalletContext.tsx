import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createWalletFromMnemonic, createWalletFromPrivateKey } from '@/utils/cryptoUtils';
import NfcService from '@/services/NfcService';
import QrCodeService, { QrTransactionData, QrWalletData } from '@/services/QrCodeService';

export type CardMode = 'sender' | 'receiver' | null;
export type AppMode = 'online' | 'offline';

interface WalletInfo {
  address: string;
  name: string;
  cardMode: CardMode;
  appMode: AppMode;
  balance: number;
}

interface PendingTransaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  to?: string;
  from?: string;
  timestamp: number;
  cardId?: string;
  isOffline: boolean;
  status: 'pending' | 'completed' | 'failed';
}

interface NFCTransaction {
  amount: number;
  fromCard: string;
  toCard: string;
  timestamp: number;
  signature?: string;
}

interface WalletContextType {
  wallet: WalletInfo | null;
  isLoading: boolean;

  // Card mode management
  cardMode: CardMode;
  setCardMode: (mode: CardMode) => void;

  // App mode management
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // Pending transactions (offline queue)
  pendingTransactions: PendingTransaction[];

  // NFC operations
  startNfcListening: () => Promise<void>;
  stopNfcListening: () => void;
  performNfcTransaction: (amount: number, recipientCard?: string) => Promise<void>;

  // QR Code operations
  generateWalletQr: () => string;
  generateTransactionQr: (amount: number, recipient?: string) => string;
  processQrTransaction: (qrData: string) => Promise<void>;
  generatePaymentRequestQr: (amount: number, message?: string) => string;

  // Transaction management
  processPendingTransactions: () => Promise<void>;
  createOfflineTransaction: (transaction: NFCTransaction) => void;

  // Wallet operations
  createWallet: (mnemonic?: string) => Promise<void>;
  importWallet: (privateKey: string) => Promise<void>;
  clearWallet: () => Promise<void>;

  // Connection status
  isOnline: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

import { setItemAsync, getItemAsync, deleteItemAsync } from '@/utils/storage';

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cardMode, setCardModeState] = useState<CardMode>(null);
  const [appMode, setAppModeState] = useState<AppMode>('online');
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isNfcListening, setIsNfcListening] = useState(false);

  // Load saved settings on app start
  useEffect(() => {
    loadWalletData();
    checkNetworkStatus();
  }, []);

  // Monitor network status
  useEffect(() => {
    const interval = setInterval(checkNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkNetworkStatus = async () => {
    let timeoutId: NodeJS.Timeout;

    try {
      // Simple network check with proper timeout handling
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000);

      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setIsOnline(true);
        if (appMode === 'offline') {
          setAppMode('online');
        }
      } else {
        setIsOnline(false);
      }
    } catch (error: any) {
      // Clear timeout in case of error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Only log non-abort errors to avoid noise
      if (error.name !== 'AbortError') {
        console.log('Network check failed:', error.message);
      }

      setIsOnline(false);
      if (appMode === 'online') {
        setAppMode('offline');
      }
    }
  };

  const loadWalletData = async () => {
    try {
      const walletData = await getItemAsync('wallet_data');
      if (walletData) {
        const parsedWallet = JSON.parse(walletData);
        // Ensure balance is always a number
        if (typeof parsedWallet.balance !== 'number') {
          parsedWallet.balance = 0;
        }
        setWallet(parsedWallet);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      // Don't set wallet to null on error, just log it
    }
  };

  const loadAppSettings = async () => {
    try {
      const mode = await AsyncStorage.getItem('card_mode');
      const appModeStored = await AsyncStorage.getItem('app_mode');
      if (mode) setCardModeState(mode as CardMode);
      if (appModeStored) setAppModeState(appModeStored as AppMode);
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  };

  const loadPendingTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem('pending_transactions');
      if (stored) {
        setPendingTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  };

  const savePendingTransactions = async (transactions: PendingTransaction[]) => {
    try {
      await AsyncStorage.setItem('pending_transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving pending transactions:', error);
    }
  };

  const setCardMode = async (mode: CardMode) => {
    setCardModeState(mode);
    try {
      if (mode) {
        await AsyncStorage.setItem('card_mode', mode);
      } else {
        await AsyncStorage.removeItem('card_mode');
      }
    } catch (error) {
      console.error('Error saving card mode:', error);
    }
  };

  const setAppMode = async (mode: AppMode) => {
    setAppModeState(mode);
    try {
      await AsyncStorage.setItem('app_mode', mode);
    } catch (error) {
      console.error('Error saving app mode:', error);
    }
  };

  const createWallet = async (mnemonic?: string) => {
    setIsLoading(true);
    try {
      const walletData = await createWalletFromMnemonic(mnemonic);
      const newWallet: WalletInfo = {
        address: walletData.address,
        name: 'My NFC Wallet',
        cardMode: null,
        appMode: 'online',
        balance: 0,
      };

      setWallet(newWallet);
      await setItemAsync('wallet_data', JSON.stringify(newWallet));
      await setItemAsync('private_key', String(walletData.privateKey || ''));
      await setItemAsync('mnemonic', String(walletData.mnemonic || ''));
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const importWallet = async (privateKey: string) => {
    setIsLoading(true);
    try {
      const walletData = await createWalletFromPrivateKey(privateKey);
      const newWallet: WalletInfo = {
        address: walletData.address,
        name: 'Imported NFC Wallet',
        cardMode: null,
        appMode: 'online',
        balance: 0,
      };

      setWallet(newWallet);
      await setItemAsync('wallet_data', JSON.stringify(newWallet));
      await setItemAsync('private_key', String(privateKey || ''));
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearWallet = async () => {
    try {
      await deleteItemAsync('wallet_data');
      await deleteItemAsync('private_key');
      await deleteItemAsync('mnemonic');
      await AsyncStorage.removeItem('card_mode');
      await AsyncStorage.removeItem('pending_transactions');
      setWallet(null);
      setCardModeState(null);
      setPendingTransactions([]);
    } catch (error) {
      console.error('Error clearing wallet:', error);
    }
  };

  useEffect(() => {
    startNfcListening();
  }, []);

  const startNfcListening = async () => {
    try {
      const isSupported = NfcService.isNfcSupported();
      if (!isSupported) {
        console.log('NFC not supported on this device/platform');
        return;
      }

      const started = await NfcService.start();
      if (started) {
        // Register for tag events
        await NfcService.registerTagEvent(handleNfcTagDetected);
        setIsNfcListening(true);
        console.log('NFC service started successfully');
      }
    } catch (error) {
      console.error('Error starting NFC:', error);
      // Don't throw the error, just log it to prevent app crashes
    }
  };

  const stopNfcListening = async () => {
    try {
      await NfcService.unregisterTagEvent();
      setIsNfcListening(false);
      console.log('NFC listening stopped');
    } catch (error) {
      console.error('Error stopping NFC listening:', error);
    }
  };

  const handleNfcTagDetected = async (tag: any) => {
    if (!wallet || !cardMode) return;

    try {
      // Parse NFC data (you'll need to implement this based on your NFC data format)
      const nfcData = parseNfcData(tag);

      if (cardMode === 'sender') {
        // Sender card: Push money (like Mastercard/Visa)
        await handleSenderTransaction(nfcData);
      } else if (cardMode === 'receiver') {
        // Receiver card: Pull money from the app
        await handleReceiverTransaction(nfcData);
      }
    } catch (error) {
      console.error('Error handling NFC transaction:', error);
    }
  };

  const parseNfcData = (tag: any) => {
    // Implement NFC data parsing logic here
    // This should extract transaction data from the NFC tag
    return {
      cardId: tag.id || 'unknown',
      amount: 0, // Extract from tag data
      type: 'payment',
    };
  };

  const handleSenderTransaction = async (nfcData: any) => {
    const transaction: NFCTransaction = {
      amount: nfcData.amount,
      fromCard: wallet!.address,
      toCard: nfcData.cardId,
      timestamp: Date.now(),
    };

    if (appMode === 'online' && isOnline) {
      // Process immediately
      await processOnlineTransaction(transaction);
    } else {
      // Queue for offline processing
      createOfflineTransaction(transaction);
    }
  };

  const handleReceiverTransaction = async (nfcData: any) => {
    const transaction: NFCTransaction = {
      amount: nfcData.amount,
      fromCard: nfcData.cardId,
      toCard: wallet!.address,
      timestamp: Date.now(),
    };

    if (appMode === 'online' && isOnline) {
      // Process immediately
      await processOnlineTransaction(transaction);
    } else {
      // Queue for offline processing
      createOfflineTransaction(transaction);
    }
  };

  const processOnlineTransaction = async (transaction: NFCTransaction) => {
    try {
      // Get private key for signing
      const privateKey = await getItemAsync('private_key');
      if (!privateKey) throw new Error('No private key found');

      // Sign transaction offline using Sui client
      const signedTransaction = await signTransactionOffline(transaction, privateKey);

      // Submit to network
      const result = await submitTransaction(signedTransaction);

      console.log('Transaction completed:', result);
    } catch (error) {
      console.error('Error processing online transaction:', error);
      // Fallback to offline queue
      createOfflineTransaction(transaction);
    }
  };

  const signTransactionOffline = async (transaction: NFCTransaction, privateKey: string) => {
    // Implement Sui offline transaction signing here
    // This is where you'd use Sui SDK to create and sign transactions
    return {
      ...transaction,
      signature: 'signed_transaction_data',
    };
  };

  const submitTransaction = async (signedTransaction: any) => {
    // Submit signed transaction to Sui network
    // Implement actual network submission here
    return { success: true, txHash: 'mock_hash' };
  };

  const createOfflineTransaction = (transaction: NFCTransaction) => {
    const pendingTx: PendingTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: transaction.fromCard === wallet?.address ? 'send' : 'receive',
      amount: transaction.amount,
      from: transaction.fromCard,
      to: transaction.toCard,
      timestamp: transaction.timestamp,
      isOffline: true,
      status: 'pending',
    };

    const updatedPending = [...pendingTransactions, pendingTx];
    setPendingTransactions(updatedPending);
    savePendingTransactions(updatedPending);
  };

  const performNfcTransaction = async (amount: number, recipientCard?: string) => {
    if (!wallet || !cardMode) {
      throw new Error('Wallet or card mode not set');
    }

    // This would typically write transaction data to an NFC tag
    // For now, we'll simulate the transaction
    const transaction: NFCTransaction = {
      amount,
      fromCard: cardMode === 'sender' ? wallet.address : recipientCard || 'unknown',
      toCard: cardMode === 'sender' ? recipientCard || 'unknown' : wallet.address,
      timestamp: Date.now(),
    };

    if (appMode === 'online' && isOnline) {
      await processOnlineTransaction(transaction);
    } else {
      createOfflineTransaction(transaction);
    }
  };

  const processPendingTransactions = async () => {
    if (!isOnline || pendingTransactions.length === 0) return;

    setIsLoading(true);
    try {
      const processedTransactions: PendingTransaction[] = [];

      for (const pendingTx of pendingTransactions) {
        try {
          const transaction: NFCTransaction = {
            amount: pendingTx.amount,
            fromCard: pendingTx.from || '',
            toCard: pendingTx.to || '',
            timestamp: pendingTx.timestamp,
          };

          await processOnlineTransaction(transaction);
          processedTransactions.push({ ...pendingTx, status: 'completed' });
        } catch (error) {
          console.error('Failed to process pending transaction:', error);
          processedTransactions.push({ ...pendingTx, status: 'failed' });
        }
      }

      // Remove completed transactions, keep failed ones for retry
      const remainingTransactions = processedTransactions.filter(tx => tx.status === 'failed');
      setPendingTransactions(remainingTransactions);
      savePendingTransactions(remainingTransactions);
    } catch (error) {
      console.error('Error processing pending transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // QR Code Methods
  const generateWalletQr = (): string => {
    if (!wallet) throw new Error('No wallet available');

    const walletData: QrWalletData = {
      address: wallet.address,
      publicKey: '', // You'll need to get this from wallet
      balance: wallet.balance,
      coinObjects: [], // You'll need to populate this
      lastSync: Date.now(),
      cardMode: cardMode || 'sender',
    };

    return QrCodeService.generateWalletQrData(walletData);
  };

  const generateTransactionQr = (amount: number, recipient?: string): string => {
    if (!wallet) throw new Error('No wallet available');

    const transactionData: QrTransactionData = {
      walletAddress: wallet.address,
      amount,
      recipient,
      timestamp: Date.now(),
      transactionId: `qr_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: cardMode === 'sender' ? 'send' : 'receive',
      isOffline: appMode === 'offline',
    };

    return QrCodeService.generateTransactionQrData(transactionData);
  };

  const generatePaymentRequestQr = (amount: number, message?: string): string => {
    if (!wallet) throw new Error('No wallet available');
    return QrCodeService.generatePaymentRequestQr(amount, wallet.address, message);
  };

  const processQrTransaction = async (qrData: string): Promise<void> => {
    try {
      const parsed = QrCodeService.parseQrData(qrData);
      if (!parsed) throw new Error('Invalid QR code data');

      switch (parsed.type) {
        case 'SuiSend_Transaction':
          if (QrCodeService.validateTransactionData(parsed.data)) {
            const transaction: NFCTransaction = {
              amount: parsed.data.amount,
              fromCard: parsed.data.sender || parsed.data.walletAddress,
              toCard: parsed.data.recipient || wallet?.address || '',
              timestamp: parsed.data.timestamp,
            };

            if (appMode === 'online' && isOnline) {
              await processOnlineTransaction(transaction);
            } else {
              createOfflineTransaction(transaction);
            }
          }
          break;

        case 'SuiSend_PaymentRequest':
          // Handle payment request
          const paymentTx: NFCTransaction = {
            amount: parsed.data.amount,
            fromCard: wallet?.address || '',
            toCard: parsed.data.recipient,
            timestamp: Date.now(),
          };

          if (appMode === 'online' && isOnline) {
            await processOnlineTransaction(paymentTx);
          } else {
            createOfflineTransaction(paymentTx);
          }
          break;

        case 'SuiSend_Wallet':
          if (QrCodeService.validateWalletData(parsed.data)) {
            console.log('Wallet data received via QR:', parsed.data);
            // Handle wallet data sharing if needed
          }
          break;

        default:
          throw new Error('Unsupported QR code type');
      }
    } catch (error) {
      console.error('Error processing QR transaction:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      isLoading,
      cardMode,
      setCardMode,
      appMode,
      setAppMode,
      pendingTransactions,
      startNfcListening,
      stopNfcListening,
      performNfcTransaction,
      generateWalletQr,
      generateTransactionQr,
      processQrTransaction,
      generatePaymentRequestQr,
      processPendingTransactions,
      createOfflineTransaction,
      createWallet,
      importWallet,
      clearWallet,
      isOnline,
    }}>
      {children}
    </WalletContext.Provider>
  );
};