export interface QuoteLeadPayload {
  name: string;
  email: string;
  phone: string;
  city: string;
  product: string;
  quoteType: string;
  amount: number;
  downPayment: number;
  financedAmount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  rateShown: string;
  contactPreference: string;
  acceptedTerms: boolean;
  resultStatus?: string;
}

export const sendQuoteWithLead = async (payload: QuoteLeadPayload) => {
  const apiUrl =
    import.meta.env.HONO_API_URL || process.env.HONO_API_URL || "quotes/with-lead";
  const apiKey =
    import.meta.env.VALID_API_KEY || process.env.VALID_API_KEY || "falseKey";
  try {
    const response = await fetch(`${apiUrl}quotes/with-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key" : apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending quote:", error);
    return null;
  }
};