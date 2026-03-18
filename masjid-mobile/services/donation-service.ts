import apiService from './api-service';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

export interface DonationResult {
  success: boolean;
  donationId?: string;
  error?: string;
}

class DonationService {
  private stripePublishableKey = STRIPE_PUBLISHABLE_KEY;

  getPublishableKey(): string {
    return this.stripePublishableKey;
  }

  async createPaymentIntent(amount: number, category: string): Promise<{ clientSecret: string } | null> {
    try {
      const result = await apiService.donations.createPaymentIntent(amount, category);
      return result;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  }

  async processDonation(
    clientSecret: string,
    paymentMethodId: string,
    amount: number,
    category: string,
    donorName?: string
  ): Promise<DonationResult> {
    try {
      const response = await fetch('https://api.stripe.com/v1/payment_intents/' + clientSecret.split('_secret_')[0], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method': paymentMethodId,
          'confirm': 'true',
        }).toString(),
      });

      if (!response.ok) {
        return { success: false, error: 'Payment failed. Please try again.' };
      }

      const donation = await apiService.donations.recordDonation({
        amount,
        category,
        stripePaymentId: clientSecret,
      });

      return { success: true, donationId: donation.id };
    } catch (error) {
      console.error('Error processing donation:', error);
      return { success: false, error: 'An error occurred. Please try again.' };
    }
  }

  async getDonationHistory() {
    try {
      return await apiService.donations.getHistory();
    } catch {
      return [];
    }
  }

  async getCampaigns() {
    try {
      return await apiService.donations.getCampaigns();
    } catch {
      return [];
    }
  }
}

export const donationService = new DonationService();
export default donationService;
