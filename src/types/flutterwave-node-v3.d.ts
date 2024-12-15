// src/types/flutterwave-node-v3.d.ts
declare module 'flutterwave-node-v3' {
    // TypeScript interfaces for the Flutterwave response and request types
    export interface PaymentInitiateResponse {
      status: string;
      message: string;
      data: {
        link: string;
      };
    }
  
    export interface TransactionVerifyResponse {
      status: string;
      message: string;
      data: {
        tx_ref: string;
        flw_ref: string;
        currency: string;
        status: string;
      };
    }
  
    export interface Flutterwave {
      initializePayment(
        payload: {
          tx_ref: string;
          amount: number;
          currency: string;
          redirect_url: string;
          customer: {
            email: string;
          };
        }
      ): Promise<PaymentInitiateResponse>;
  
      TransactionVerify(
        payload: { id: string }
      ): Promise<TransactionVerifyResponse>;
    }
  
    const Flutterwave: new (publicKey: string, secretKey: string) => Flutterwave;
    export = Flutterwave;
  }
  