
import { Platform } from 'react-native';
import NfcManager, { NfcTech, Ndef, TagEvent } from 'react-native-nfc-manager';

export interface NfcTag {
  id: string;
  type: string;
  data?: any;
}

export interface NfcWriteOptions {
  type: string;
  data: string;
}

export interface WalletCardData {
  id: string;
  walletAddress: string;
  cardMode: 'sender' | 'receiver';
  balance: number;
  timestamp: number;
}

class NfcService {
  private isSupported = false;
  private isInitialized = false;
  private tagListener: ((tag: TagEvent) => void) | null = null;

  constructor() {
    // Initialize asynchronously without blocking constructor
    this.init().catch(error => {
      console.warn('NFC initialization failed in constructor:', error);
      this.isSupported = false;
    });
  }

  private async init(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        this.isSupported = false;
        console.log('Web platform - NFC not supported');
        return;
      }

      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        // Add timeout and better error handling
        const checkSupport = async (): Promise<boolean> => {
          try {
            const supportResult = await Promise.race([
              NfcManager.isSupported(),
              new Promise<boolean>((_, reject) => 
                setTimeout(() => reject(new Error('NFC check timeout')), 5000)
              )
            ]);
            return Boolean(supportResult);
          } catch (error) {
            console.warn('NFC support check failed:', error);
            return false;
          }
        };

        this.isSupported = await checkSupport();
        console.log(`NFC support: ${this.isSupported}`);
      } else {
        this.isSupported = false;
        console.log('Platform does not support NFC');
      }
    } catch (error) {
      console.error('Error during NFC initialization:', error);
      this.isSupported = false;
    }
  }

  async start(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('Web platform detected, NFC not available');
        return false;
      }

      // Ensure initialization is complete
      if (!this.isSupported) {
        console.log('NFC not supported on this device');
        return false;
      }

      // Add timeout for start operation
      await Promise.race([
        NfcManager.start(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('NFC start timeout')), 10000)
        )
      ]);

      this.isInitialized = true;
      console.log('NFC Manager started successfully');
      return true;
    } catch (error) {
      console.error('Error starting NFC Manager:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.isInitialized) {
        await this.unregisterTagEvent();
        await NfcManager.stop();
        this.isInitialized = false;
        console.log('NFC Manager stopped');
      }
    } catch (error) {
      console.error('Error stopping NFC Manager:', error);
    }
  }

  async registerTagEvent(callback: (tag: TagEvent) => void): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('NFC Manager not initialized');
      }

      this.tagListener = callback;
      await NfcManager.setEventListener('onTag', callback);
      console.log('NFC tag event listener registered');
    } catch (error) {
      console.error('Error registering tag event:', error);
      throw error;
    }
  }

  async unregisterTagEvent(): Promise<void> {
    try {
      if (this.tagListener) {
        await NfcManager.setEventListener('onTag', null);
        this.tagListener = null;
        console.log('NFC tag event listener unregistered');
      }
    } catch (error) {
      console.error('Error unregistering tag event:', error);
    }
  }

  async startTagSession(): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('NFC Manager not initialized');
      }

      await NfcManager.requestTechnology(NfcTech.Ndef);
      console.log('NFC tag session started');
    } catch (error) {
      console.error('Error starting tag session:', error);
      throw error;
    }
  }

  async stopTagSession(): Promise<void> {
    try {
      await NfcManager.cancelTechnologyRequest();
      console.log('NFC tag session stopped');
    } catch (error) {
      console.error('Error stopping tag session:', error);
    }
  }

  async readTag(): Promise<NfcTag | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('NFC Manager not initialized');
      }

      await this.startTagSession();
      
      const tag = await NfcManager.getTag();
      if (!tag) {
        await this.stopTagSession();
        return null;
      }

      // Try to read NDEF data
      let data = null;
      try {
        const ndefRecords = await NfcManager.getNdefMessage();
        if (ndefRecords && ndefRecords.length > 0) {
          // Parse the first NDEF record
          const record = ndefRecords[0];
          data = Ndef.text.decodePayload(record.payload);
        }
      } catch (ndefError) {
        console.log('No NDEF data found or error reading:', ndefError);
      }

      await this.stopTagSession();

      return {
        id: tag.id || 'unknown',
        type: tag.techTypes?.[0] || 'unknown',
        data: data
      };
    } catch (error) {
      console.error('Error reading NFC tag:', error);
      await this.stopTagSession();
      return null;
    }
  }

  async writeTag(options: NfcWriteOptions): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('NFC Manager not initialized');
      }

      await this.startTagSession();

      // Create NDEF record
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(options.data)
      ]);

      if (!bytes) {
        throw new Error('Failed to encode NDEF message');
      }

      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      await this.stopTagSession();
      
      console.log('NFC tag written successfully');
      return true;
    } catch (error) {
      console.error('Error writing NFC tag:', error);
      await this.stopTagSession();
      return false;
    }
  }

  async createWalletCard(walletAddress: string, cardMode: 'sender' | 'receiver', balance: number): Promise<WalletCardData> {
    const cardData: WalletCardData = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletAddress,
      cardMode,
      balance,
      timestamp: Date.now()
    };

    console.log('Created wallet card data:', cardData);
    return cardData;
  }

  async writeWalletToCard(cardData: WalletCardData): Promise<boolean> {
    try {
      const jsonData = JSON.stringify(cardData);
      return await this.writeTag({
        type: 'text/plain',
        data: jsonData
      });
    } catch (error) {
      console.error('Error writing wallet to card:', error);
      return false;
    }
  }

  async readWalletFromCard(): Promise<WalletCardData | null> {
    try {
      const tag = await this.readTag();
      if (!tag || !tag.data) {
        return null;
      }

      const cardData = JSON.parse(tag.data);
      
      // Validate the card data structure
      if (cardData.walletAddress && cardData.cardMode && typeof cardData.balance === 'number') {
        return cardData as WalletCardData;
      }
      
      return null;
    } catch (error) {
      console.error('Error reading wallet from card:', error);
      return null;
    }
  }

  isNfcSupported(): boolean {
    return Boolean(this.isSupported);
  }

  isNfcEnabled(): boolean {
    return this.isInitialized;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android handles NFC permissions automatically
        return true;
      } else if (Platform.OS === 'ios') {
        // iOS NFC permissions are handled through Info.plist
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting NFC permissions:', error);
      return false;
    }
  }
}

export default new NfcService();
