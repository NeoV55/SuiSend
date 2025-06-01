
import { Platform } from 'react-native';

export interface QrTransactionData {
  walletAddress: string;
  amount: number;
  recipient?: string;
  sender?: string;
  timestamp: number;
  transactionId: string;
  signature?: string;
  type: 'send' | 'receive';
  isOffline: boolean;
}

export interface QrWalletData {
  address: string;
  publicKey: string;
  balance: number;
  coinObjects: string[];
  lastSync: number;
  cardMode: 'sender' | 'receiver';
}

class QrCodeService {
  private static instance: QrCodeService;

  private constructor() {}

  static getInstance(): QrCodeService {
    if (!QrCodeService.instance) {
      QrCodeService.instance = new QrCodeService();
    }
    return QrCodeService.instance;
  }

  // Generate QR code data for wallet sharing
  generateWalletQrData(walletData: QrWalletData): string {
    const qrData = {
      type: 'SuiSend_Wallet',
      version: '1.0',
      data: walletData,
      timestamp: Date.now()
    };
    
    return JSON.stringify(qrData);
  }

  // Generate QR code data for offline transactions
  generateTransactionQrData(transactionData: QrTransactionData): string {
    const qrData = {
      type: 'SuiSend_Transaction',
      version: '1.0',
      data: transactionData,
      timestamp: Date.now()
    };
    
    return JSON.stringify(qrData);
  }

  // Parse QR code data
  parseQrData(qrString: string): { type: string; data: any } | null {
    try {
      const parsed = JSON.parse(qrString);
      
      if (parsed.type && parsed.type.startsWith('SuiSend_') && parsed.data) {
        return {
          type: parsed.type,
          data: parsed.data
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  }

  // Create payment request QR for receiver cards
  generatePaymentRequestQr(amount: number, walletAddress: string, message?: string): string {
    const paymentRequest = {
      type: 'SuiSend_PaymentRequest',
      version: '1.0',
      data: {
        amount,
        recipient: walletAddress,
        message,
        timestamp: Date.now(),
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
    
    return JSON.stringify(paymentRequest);
  }

  // Create offline transaction bundle for complex transactions
  generateOfflineTransactionBundle(transactions: QrTransactionData[]): string {
    const bundle = {
      type: 'SuiSend_TransactionBundle',
      version: '1.0',
      data: {
        transactions,
        bundleId: `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        totalTransactions: transactions.length
      }
    };
    
    return JSON.stringify(bundle);
  }

  // Validate QR transaction data
  validateTransactionData(data: QrTransactionData): boolean {
    return !!(
      data.walletAddress &&
      typeof data.amount === 'number' &&
      data.amount > 0 &&
      data.timestamp &&
      data.transactionId &&
      (data.type === 'send' || data.type === 'receive')
    );
  }

  // Validate QR wallet data
  validateWalletData(data: QrWalletData): boolean {
    return !!(
      data.address &&
      typeof data.balance === 'number' &&
      Array.isArray(data.coinObjects) &&
      data.lastSync &&
      (data.cardMode === 'sender' || data.cardMode === 'receiver')
    );
  }
}

export default QrCodeService.getInstance();
